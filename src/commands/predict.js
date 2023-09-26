// /predictions
// Pulls prediction data for both TOP and OAX, and displays the next 7 days of launches given the following criteria
// Sonde is in balloony range
import bdcApi from '@bigdatacloudapi/client';
import fetch from 'node-fetch';
import config from '../../config.json' assert { type: "json" };
import utils from '../utils.js';

import { EmbedBuilder } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';

// Shorthand
const bdc = bdcApi(process.env.BDC_API_KEY);
const conf = config.predictions;

const createTimestamp = (year, month, day, time) => {
    // Handle situations where the month overlaps
    const contains_31 = [1, 3, 5, 7, 8, 10, 12];
    const leap_year = !(year % 4);

    // If there's a leap year, and we're in February, advance it.
    if (day > 28 && month === 2) {
        if (leap_year) {
            day = (day - 29) + 1;
        } else {
            day = (day - 28) + 1;
        }
        month++;
    }
    // If we are in a month which contains 31 days
    if (contains_31.includes(month) && day > 31){
        day = (day - 31) + 1;
        month++;

        // *- Move year forward if it was December *-
        if (month === 13){
            year++;
            month = 1;
        }
    } // Consider for other months of the year
    else if (day > 30){
        day = (day - 30) + 1;
        month++;
    }

    // FIX: Pad month and day with 0s
    month = String(month).padStart(2, '0');
    day = String(day).padStart(2, '0');

    // After overflows have been addressed, format the timestamp to pass off.
    return `${year}-${month}-${day}T${time}Z`;
};

const getDateSeries = day_count => {
    // Time
    const date = new Date();
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1; // Why does this start at 0, nobody knows...
    const curDay = date.getUTCDate();
    const curHour = date.getUTCHours();
    //
    const predictionTimes = []; // Return data, will contain UTC timestamps for each sonde launch.

    // Calculate time ranges for launches
    // First determine whether we have launches remaining in the current day.
    if (curHour < 11) { // Morning launch hasn't happened yet.
        predictionTimes.push(createTimestamp(year, month, curDay, conf.time_offset.am));
    }
    if (curHour < 23) { // Evening launch hasn't happened yet.
        predictionTimes.push(createTimestamp(year, month, curDay, conf.time_offset.pm));
    }

    // Handle future dates
    for(let d = 1; d<day_count; d++){
        predictionTimes.push(createTimestamp(year, month, curDay+d, conf.time_offset.am));
        predictionTimes.push(createTimestamp(year, month, curDay+d, conf.time_offset.pm));
    }

    return predictionTimes;
};

// Get an url to grab a prediction
const generateUrl = (station, time) => {
    const url = `https://api.v2.sondehub.org/tawhiri?launch_latitude=${station.lat}&launch_longitude=${station.lon}&launch_datetime=${time}&ascent_rate=${conf.ascent_rate}&burst_altitude=${conf.burst_alt}&descent_rate=${conf.descent_rate}`;
    //console.log(`[PREDICTIONS] Generating URL for ${station.name} at ${time}. URL: ${url}`);
    return url;
};

const pullPrediction = async (station, time) => {
    // Grab SH data
    const response = await fetch(generateUrl(station, time));
    const data = await response.json();
    // If the error attribute exists, then the prediction failed.
    if (data.error) {
        console.log(`[PREDICTIONS] Failed to pull prediction for ${station.name} at ${time}.`);
        return null;
    }
    const last_prediction = data.prediction[1].trajectory[data.prediction[1].trajectory.length-1];
    last_prediction.longitude -= 360; // Convert a positive longitude from tawhiri to a proper negative. (This may cause side effects for regions with a positive longitude)
    return last_prediction;
};

const addPrediction = async (embed, station, time, prediction) => {
    // Get the location
    const geocode = await bdc.getReverseGeocode({latitude: prediction.latitude, longitude: prediction.longitude});
    let location = '';
    if (geocode.city === '') {
        location += geocode.locality + ', ';
    } else {
        location += geocode.city + ', ';
    }
    location += geocode.principalSubdivisionCode.split('-')[1]; // US-KS --> KS.

    // Generate the String
    // Ex: TOP, 07/07/22 AM - Johnson County, KS
    const d = new Date(time);
    let launchTime = 'PM';
    if(d.getUTCHours() === 11){
        launchTime = 'AM';
    }

    const headerStr = `${station}, ${d.toLocaleString('default', {dateStyle: 'short'}).slice(0, -3)} ${launchTime}`
    embed.addFields({name: headerStr, value: location, inline: false});
};

export default {
    data: new SlashCommandBuilder()
        .setName('predictions')
        .setDescription('Pulls prediction data for both TOP and OAX - Only if they land in balloony territory'),
    async execute(interaction) {
        // Send a pending message
        const loadingEmbed = new EmbedBuilder().setTitle('Predicting...');
        await interaction.reply({embeds: [loadingEmbed]});
        // Start building embed
        const embed = new EmbedBuilder()
            .setColor(0x00FFFF)
            .setTitle('3-Day Predictions')
            .setDescription('Note: only shows predictions in the alert area')
            .setTimestamp()
            .setFooter({text: 'Get updated predictions using /predictions'});

        // Run prediction engine
        const dates = getDateSeries(conf.daysForward);

        // Add fields while we have day slots
        while(dates.length > 0){
            const date = dates.shift();
            const predictionCoordsTop = await pullPrediction(config.stations.topeka, date);
            const predictionCoordsOax = await pullPrediction(config.stations.omaha, date);
            const predictionCoordsDodge = await pullPrediction(config.stations.dodge, date);
            try{
                if(utils.inside_poly([predictionCoordsTop.longitude, predictionCoordsTop.latitude], config.watch_polygon)){
                    await addPrediction(embed, 'TOP', date, predictionCoordsTop);
                }
                if(utils.inside_poly([predictionCoordsOax.longitude, predictionCoordsOax.latitude], config.watch_polygon)){
                    await addPrediction(embed, 'OAX', date, predictionCoordsOax);
                }
                if(utils.inside_poly([predictionCoordsDodge.longitude, predictionCoordsDodge.latitude], config.watch_polygon)){
                    await addPrediction(embed, 'DDC', date, predictionCoordsDodge);
                }
            } catch (e){
                console.log(`[PREDICTIONS] Failed.`);
                console.error(e);

                // Start building error embed, better than using the old one in the case there is existing data.
                const err_embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('Error')
                    .setDescription('Prediction data failed to load.')
                    .setTimestamp()
                    .setFooter({text: 'Get updated predictions using /predictions'});

                await interaction.editReply({embeds: [err_embed]});
                return;
            }


        }

        await interaction.editReply({embeds: [embed]});
    },
};
