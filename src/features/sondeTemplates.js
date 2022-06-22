// Contains all templates used on discord to send or update messages
const rs41Datecode = require('./rs41_datecode');

const discordEmbedWrapper = (content, message) => {
    return {
        content,
        embeds: [
            message
        ]
    };
}

const appendRS41Datecode = (sonde, embed) => {
    const dateObj = rs41Datecode.resolveDate(sonde.serial);
    embed.fields.push({
        "name": `Sonde manufactured: ${dateObj.toLocaleDateString('en-US')}`,
        "value": "\u200B"
    });
    return embed;
};

const normalLaunch = sonde => {
    return {
                type: "rich",
                title: `${sonde.subtype} ${sonde.serial} has launched`,
                description: "",
                color: 0x00FFFF,
                url: `https://sondehub.org/${sonde.serial}`,
                "fields": []
            };
};

const unusualLaunch = sonde => {
    return {
        "type": "rich",
        "title": `Unusual Sonde launch detected!`,
        "description": "",
        "color": 0x00FFFF,
        "fields": [
            {
                "name": `${sonde.subtype} ${sonde.serial}`,
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
    };
};

module.exports = {
    normal: sonde => {
        let embed = normalLaunch(sonde);
        if(sonde.type == 'RS41'){
            embed = appendRS41Datecode(sonde, embed);
        }
        return discordEmbedWrapper("<@&980936900204441630>", embed);
    },
    unusual: sonde => {
        let embed = unusualLaunch(sonde);
        if(sonde.type == 'RS41'){
            embed = appendRS41Datecode(sonde, embed);
        }
        return discordEmbedWrapper("<@&980937123463069716>", embed);
    },
    discordEmbedWrapper
}

