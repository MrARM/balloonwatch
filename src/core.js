// Reqs
const {Client, Intents} = require('discord.js');
const moment = require('moment');
const {MongoClient} = require('mongodb');
const mqtt = require('mqtt');

const config = require('../config.json');
const sondeTemplate = require('./features/sondeTemplates');
const utils = require('./utils');

// Instances
const discord = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]});
const client = mqtt.connect('wss://ws-reader.v2.sondehub.org');
const mongo = new MongoClient(process.env.MONGO_URI || 'mongodb://localhost:27017/');

// State
let discord_active = false;
let mongodb = false;
// This stops rapid floods of messages by only queueing a message to be sent once
let sondeQueue = [];

const queueSend = sonde => {
    let can_add = true;
    if (sondeQueue.length === 0) {
        sonde.release = parseInt(moment().format('X')) + 10;
        sondeQueue.push(sonde);
        console.log(`[Balloon] New sonde detected! ${sonde.manufacturer} ${sonde.type} ${sonde.serial}`);
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
};

const discordSend = sonde => {
    if (utils.checkUsualTime()) {
        discord.channels.cache.get(process.env.DISCORD_CHANNEL).send(sondeTemplate.normal(sonde));
    } else {
        discord.channels.cache.get(process.env.DISCORD_CHANNEL).send(sondeTemplate.unusual(sonde));
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
    discord_active = true;
});

client.on('connect', function () {
    client.subscribe('batch', function (err) {
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
                        mongodb.insertOne(sonde, function (err, res) {
                            if (err) throw err;
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
