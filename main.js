// Reqs
const {Client, Intents} = require('discord.js');
const moment = require('moment');
const {MongoClient} = require('mongodb');
const mqtt = require('mqtt');
const config = require('./config.json');

// Instances
const discord = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]});
const client = mqtt.connect('wss://ws-reader.v2.sondehub.org');
const mongo = new MongoClient(process.env.MONGO_URI || 'mongodb://localhost:27017/');
// State
let discord_active = false;
let mongodb = false;
// This stops rapid floods of messages by only queueing a message to be sent once
let sondeQueue = [];

// Additional functions
const inside_poly = (point, vs) => {
    // ray-casting algorithm based on
    // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html

    const x = point[0], y = point[1];

    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        let xi = vs[i][0], yi = vs[i][1];
        let xj = vs[j][0], yj = vs[j][1];

        let intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
};

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

const checkUsualTime = () => {
    let usualTime = true;
    // Check if unusual
    const hour = moment.utc().hour();
    if(!config.usual_hours.includes(hour)){
        usualTime = false;
    }
    return usualTime;
}

const discordSend = sonde => {
    if(checkUsualTime()){
        discord.channels.cache.get(process.env.DISCORD_CHANNEL).send({
            "embeds": [
                {
                    "type": "rich",
                    "title": `${sonde.type} ${sonde.serial} has launched`,
                    "description": "",
                    "color": 0x00FFFF,
                    "url": `https://sondehub.org/${sonde.serial}`
                }
            ]
        });
    } else {
        discord.channels.cache.get(process.env.DISCORD_CHANNEL).send({
            "embeds": [
                {
                    "type": "rich",
                    "title": `Ususual Sonde launch detected!`,
                    "description": "",
                    "color": 0x00FFFF,
                    "fields": [
                        {
                            "name": `${sonde.type} ${sonde.serial}`,
                            "value": "\u200B"
                        },
                        {
                            "name": `Frequency: ${sonde.frequency} MHz`,
                            "value": `\u200B`
                        },
                        {
                            "name": `Position: ${sonde.lat}, ${sonde.lon}`,
                            "value": "\u200B"
                        },
                        {
                            "name": `Altitude: ${sonde.alt} m`,
                            "value": "\u200B"
                        }
                    ],
                    "image": {
                        "url": `https://i.imgur.com/T7goLBv.png`,
                        "height": 0,
                        "width": 0
                    },
                    "url": `https://sondehub.org/${sonde.serial}`
                }
            ]
        }
        );
    }
};

// Startup
//region discord
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

//endregion
//region mqtt
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
        if (inside_poly([sonde.lon, sonde.lat], config.watch_polygon)) {
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
//endregion
//region mongo
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
//endregion

//region queue check system
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
//endregion