// This file will handle testing whether discord messages send correctly.
import {Client, Intents} from 'discord.js';
const discord = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]});
const DISCORD_CHANNEL = '<ADD CHANNEL HERE>';
const DISCORD_TOKEN = '<ADD TOKEN HERE>';

discord.login(DISCORD_TOKEN);

const sondeTemplate = require('../src/features/sondeTemplates');
const sondeUpdates = require("../src/features/sondeUpdates");
const sonde = require('./support/sonde').dfm17;


// When discord is ready, we'll allow messages to send
discord.once('ready', () => {
    console.log('[Discord] Connected.');
    const generatedUnusualMessage = sondeTemplate.unusual(sonde);
    discord.channels.cache.get(DISCORD_CHANNEL).send(generatedUnusualMessage).then(nmsg=>{
        console.log('Sent.');
        setTimeout(()=>sondeUpdates.constUpdate(sonde, nmsg, generatedUnusualMessage, true), 2 * 1000);
    });
});
