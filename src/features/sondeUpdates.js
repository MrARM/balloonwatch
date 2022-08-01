// Sonde updates - periodically update the sonde position, altitude, landing time and location while the last recieved packet is still below 1 hour.

/*
 * Dev notes
 * ORIGINAL IDEA:
 * When a new sonde is detected, we will provide a hook to the new sonde message post
 *   - Decode the sonde ID, grab the discord message ID, grab a timestamp
 * Whenever a known sonde is detected, we'll also hook there
 *   - Update the sonde and add the last known position, last known altitude and the time received
 * In the init hook, we'll grab and store the mongo db and set a 15-second interval which checks each sonde in the DB and does the following:
 *   - If the sonde is older than 1 hour, delete the record
 *   - Run a prediction on every sonde in the database (Pools all numbers to run a batch check)
 *     - After this is done, update the known sondes on discord with a new formatted message.
 *
 * Thinking again:
 *  - I don't think we need to update the sonde in mongo, a simple setInternal should suffice and if the sonde does not have a change of altitude by 20m within a minute discard the hook.
 *  - Predictions could be ran every other run, sure, chasers might like a faster update, but I expect them to be using the map.
 *  - Predictions will include only the city name as it would be more to serve as an indicator to people nearby.
 *
 * Here's what I'm thinking the embed should look like:
 *  - It should just add fields to an existing embed, and the original embed needs to be kept.
 *  - Unusual sonde launches will need to have elements changed.
 *
 *  POSITION: Over Manhattan, KS
 *  ~~~~ALTITUDE: 71,076 ft~~~~ - Scrapped because we will not be updating live.
 *  PREDICTED TO LAND AT: Olathe, KS
 *  PREDICTED LANDING TIME: 9:21 PM
 */
const bdcApi = require('@bigdatacloudapi/client')('bdc_3d481cc4c2634116a59c23f2d47383a6');
const fetch = require('node-fetch');
const moment = require('moment-timezone');
const sondeTemplates = require('./sondeTemplates');
const utils = require("../utils");

const TIMEZONE = 'America/Chicago';
const REFRESH_TIME = 2 * 60000; // Refresh every X minutes
const RESET_TIME = 10 * 60; // Stop tracking if predictions says it landed after X minutes.

const constUpdate = (sonde, message, original, unusual) => {
    console.log(`[SondeUpdates] Starting update for sonde ${sonde.serial}`);
    // Grab sonde info
    fetch(`https://api.v2.sondehub.org/predictions?vehicles=${sonde.serial}`).then(response => response.json().then(sondePredRaw => {
        const sondeData = decodeSHPrediction(sondePredRaw);
        if(sondeData.error){
            console.error(`ERR! URL: https://api.v2.sondehub.org/predictions?vehicles=${sonde.serial}`);
            console.error(sondePredRaw);
        }
        // Get location for current position
        decodeCityState(sondeData.latitude, sondeData.longitude).then(currentLocation => {
            // Next, predicted
            console.debug(`[SondeUpdates:D] Currloc: ${currentLocation}`);
            decodeCityState(sondeData.predictedLatitude, sondeData.predictedLongitude).then(predictedLocation => {
                console.debug(`[SondeUpdates:D] Predloc: ${currentLocation}`);
                /* We have everything we want for a message.
                 * sondeData - Location of the radiosonde + prediction
                 * currentLocation
                 * predictedLocation
                 * message - d.js message object
                 */
                const time = moment(sondeData.predictionTime*1000).tz(TIMEZONE).format('hh:mm A');
                // Handle templating for unusual/usual(shows picture)
                let newEmbed;
                if(unusual) {
                    newEmbed = sondeTemplates.embeds.unusualLaunch(sonde);
                    newEmbed.title = `Unusual Sonde ${sonde.subtype} ${sonde.serial} detected!`
                } else {
                    newEmbed = sondeTemplates.embeds.normalLaunch(sonde);
                }

                newEmbed.fields = [
                    {
                        "name": `Frequency: ${sonde.frequency} MHz`,
                        "value": `\u200B`
                    },
                    {
                        "name": `Altitude: ${utils.mToft(sonde.alt).toLocaleString("en-US")} ft`,
                        "value": "\u200B"
                    },
                    {
                        "name": `Over ${currentLocation}`,
                        "value": `\u200B`
                    },
                    {
                        "name": `Predicted to land at ${predictedLocation} around ${time}`,
                        "value": `\u200B`
                    },
                ];
                // If RS41
                if(sonde.type === 'RS41'){
                    newEmbed = sondeTemplates.appendRS41Datecode(sonde, embed);
                }
                // Update msg
                message.edit({
                    embeds:[newEmbed]
                }).then(nmsg=>{
                    // Check if sonde is supposed to be landed.
                    const utime = Math.floor(+new Date() / 1000);
                    if(utime < (sondeData.predictionTime + RESET_TIME)){
                        setTimeout(()=>constUpdate(sonde, nmsg, original),REFRESH_TIME);
                    }
                });
            }).catch(err=>console.error(`[SondeUpdates:E] ${err}`));
        }).catch(err=>console.error(`[SondeUpdates:E] ${err}`));
    })).catch(err=>console.error(`[SondeUpdates:E] ${err}`));
};

const decodeCityState = (latitude, longitude) => {
    return new Promise((resolve, reject) => {
        bdcApi.getReverseGeocode({
            latitude,
            longitude
        }).then(data => {
            let outStr = '';
            if (data.city === '') {
                outStr += data.locality + ', ';
            } else {
                outStr += data.city + ', ';
            }
            outStr += data.principalSubdivisionCode.split('-')[1]; // US-KS --> KS.
            resolve(outStr);
        }).catch(reason => reject(reason));
    });
};

// Decodes GET https://api.v2.sondehub.org/predictions?vehicles=XXX, Only decodes the first response.
const decodeSHPrediction = (predictionResponse) => {
    let output = {
        error: false, // If no sondes are present. This is also the call to shut off the interval.
        serial: 'N0CALL', // radiosonde serial, used for reference and debugging.
        latitude: 0.0, // Current latitude of time of prediction, this will not necessarily line up with the current location.
        longitude: 0.0, // Current longitude of time of prediction, same as above
        predictedLatitude: 0.0, // Predicted landing latitude
        predictedLongitude: 0.0, // Predicted landing longitude
        predictionTime: 0, // Epoch of predicted landing time
        burst: false // Burst indication, used to show pre-burst disclaimer.
    };

    // Check for no data(e.g. wrong serial, errors, or very old data!)
    if (predictionResponse.length === 0) {
        // Stop here, there is no data we can extract.
        console.warn('[sondeUpdates] prediction response returned no data');
        output.error = true;
        return output;
    }

    // Update the information that doesn't require additional parsing.
    output.serial = predictionResponse[0].vehicle;
    output.latitude = predictionResponse[0].latitude;
    output.longitude = predictionResponse[0].longitude;
    if (predictionResponse[0].descending) output.burst = true;

    // Process the prediction object(JSON-in-JSON)
    const predictionData = JSON.parse(predictionResponse[0].data);
    const landingPrediction = predictionData[predictionData.length - 1];

    // Store the newly parsed data
    output.predictedLatitude = landingPrediction.lat;
    output.predictedLongitude = landingPrediction.lon;
    output.predictionTime = landingPrediction.time;

    return output;
};

// Decodes GET https://api.v2.sondehub.org/sondes/telemetry?duration=15s&serial=XXX, currently set aside as predictions API might be the only call we need.
//const decode_sh_response = (telemetryResponse) => {
// Yes, this is probably a fine way to do this.
//    let latestPacket = telemetryResponse[Object.keys(telemetryResponse)[0]][Object.keys(telemetryResponse[Object.keys(telemetryResponse)[0]])[0]];

//}

module.exports = {
    decodePrediction: decodeSHPrediction,
    decodeCityState,
    constUpdate
};
