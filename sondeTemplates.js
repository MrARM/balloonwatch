// Contains all templates used on discord to send or update messages

const discordEmbedWrapper = message => {
    return {
        embeds: [
            message
        ]
    };
}

const normalLaunch = sonde => {
    return {
                type: "rich",
                title: `${sonde.type} ${sonde.serial} has launched`,
                description: "Pinging: <@&980936900204441630>",
                color: 0x00FFFF,
                url: `https://sondehub.org/${sonde.serial}`
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
            },
            {
                "name": "Pinging: <@&980937123463069716>",
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
    normal: sonde => discordEmbedWrapper(normalLaunch(sonde)),
    unusual: sonde => discordEmbedWrapper(unusualLaunch(sonde)),
}

