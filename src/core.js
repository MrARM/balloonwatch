// Reqs
import {Client, Collection, Events, GatewayIntentBits} from 'discord.js';
import fs from 'node:fs';
import moment from 'moment';
import pkg from 'mongodb-legacy';
const {MongoClient} = pkg;
import mqtt from 'mqtt';
import path from 'node:path';
import { createClient } from 'redis';

import config from '../config.json' assert { type: "json" };
import sondeUpdates from './features/sondeUpdates.js';
import sondeTemplate from './features/sondeTemplates.js';
import utils from './utils.js';
import pingCommand from './commands/ping.js';
import predictCommand from './commands/predict.js';

// Instances
const discord = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]});
const client = mqtt.connect('wss://ws-reader.v2.sondehub.org');
const mongo = new MongoClient(process.env.MONGO_URI || 'mongodb://localhost:27017/');
const redis = createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: 6379,
    password: process.env.REDIS_HOST_PASSWORD
});

// State
let discord_active = false;
let mongodb = false;
// This stops rapid floods of messages by only queueing a message to be sent once
let sondeQueue = [];
redis.on('error', err => console.error('Redis Client Error', err));

const queueSend = sonde => {
    let can_add = true;

    // Ignore regular sondes from nearby launch sites
    config.ignored_areas.forEach((area, idx, arr)=>{
        if(utils.inside_poly([sonde.lon, sonde.lat], area.watch_polygon)){
            can_add = false;
            return;
        }
        // Run after ignored area checks complete
        if (idx === arr.length - 1) {
            if (sondeQueue.length === 0) {
                sonde.release = parseInt(moment().format('X')) + 10;
                console.log(`[Balloon] New sonde detected! ${sonde.manufacturer} ${sonde.type} ${sonde.serial}`);
                if(can_add){
                    sondeQueue.push(sonde);
                }
                return;
            }
            sondeQueue.forEach((qsonde, idx, arr) => {
                if (qsonde.serial === sonde.serial) {
                    can_add = false;
                }

                if (idx === arr.length - 1) {
                    if (can_add) {
                        sondeQueue.push(sonde);
                        console.log(`[Balloon] New sonde detected! ${sonde.manufacturer} ${sonde.type} ${sonde.serial}`);
                    }
                }
            });
        }
    });
};

const discordSend = sonde => {
    if (utils.checkUsualTime()) {
        const generatedMessage = sondeTemplate.normal(sonde);
        discord.channels.cache.get(process.env.DISCORD_CHANNEL).send(generatedMessage).then(nmsg=>{
            setTimeout(()=>sondeUpdates.constUpdate(sonde, nmsg, generatedMessage, false), 300 * 1000);
        });
    } else {
        const generatedUnusualMessage = sondeTemplate.unusual(sonde);
        discord.channels.cache.get(process.env.DISCORD_CHANNEL).send(generatedUnusualMessage).then(nmsg=>{
            setTimeout(()=>sondeUpdates.constUpdate(sonde, nmsg, generatedUnusualMessage, true), 60 * 1000);
        });
    }
};

// Startup
// You will need to set DISCORD_TOKEN as an environment variable in order to use this bot in your own server.
if (process.env.DISCORD_TOKEN === undefined || process.env.DISCORD_CHANNEL === undefined) {
    console.warn('Either DISCORD_TOKEN or DISCORD_CHANNEL is not set, discord sending is disabled.');
} else {
    // Attempt to log into discord
    discord.login(process.env.DISCORD_TOKEN);
}

// When discord is ready, we'll allow messages to send
discord.once('ready', () => {
    console.log('[Discord] Connected.');
    discord.commands = new Collection();

    // This code is out of date, and needs to be updated to be supported as a module.
    // We will manually import commands for now...


    discord.commands.set(pingCommand.data.name, pingCommand);
    discord.commands.set(predictCommand.data.name, predictCommand);

    // // https://discordjs.guide/creating-your-bot/command-handling.html#loading-command-files
    // const commandsPath = path.join(__dirname, 'commands');
    // const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    //
    // for (const file of commandFiles) {
    //     const filePath = path.join(commandsPath, file);
    //     const command = require(filePath);
    //     // Set a new item in the Collection with the key as the command name and the value as the exported module
    //     if ('data' in command && 'execute' in command) {
    //         discord.commands.set(command.data.name, command);
    //     } else {
    //         console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    //     }
    // }

    discord_active = true;
});

discord.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'OOPS! There was an error while executing this command!', ephemeral: true });
    }
});


client.on('connect', async () => {
    //await redis.connect();
    client.subscribe('batch',  err => {
        if (!err) {
            console.log('[MQTT] Connected');
        }
    });
});

client.on('message', function (topic, message) {
    // message is Buffer
    const batch_input = JSON.parse(message.toString());
    batch_input.forEach((sonde) => {
        if (utils.inside_poly([sonde.lon, sonde.lat], config.watch_polygon)) {

            if (mongodb !== false) {

                // If a database connection was established continue
                mongodb.findOne({serial: sonde.serial}).then((result) => {
                    if (result === null) {
                        // This is a new radiosonde
                        mongodb.insertOne(sonde).then(() => {
                            queueSend(sonde);
                        });
                    }
                });
            }

        }
    });
});

// Mongo stuff
mongo.connect().then((response) => {
    mongo.db('admin').command({ping: 1}).then((response) => {
        console.log('[Mongo] Connected.');
        const mongodb_db = mongo.db('balloonWatch');
        mongodb = mongodb_db.collection('seenSondes');
        // If a collection called "myNewCollection" exists, it is used, otherwise it gets created.
    }).catch((err) => {
        console.error('[Mongo] Failed to connect!');
        console.error(err);
        process.exit(1);
    });
}).catch((err) => {
    console.error('[Mongo] Failed to connect!');
    console.error(err);
    process.exit(1);
});


// Queue check system
setInterval(() => {
    sondeQueue.forEach((queuedSonde) => {
        if (queuedSonde.release < parseInt(moment().format('X'))) {
            console.log(`Sonde ${queuedSonde.serial} is ready for release`);
            sondeQueue = sondeQueue.filter((e) => {
                return e.serial != queuedSonde.serial;
            });
            if (discord_active) {
                discordSend(queuedSonde);
            }
        }
    })
}, 1000);
