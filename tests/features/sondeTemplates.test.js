const sondeTemplates = require('../../src/features/sondeTemplates');
const sonde = require('../support/sonde');


// Test a simple discord message with a blank embed
test('Generate a simple discord message body', () => {
    const message = sondeTemplates.discordEmbedWrapper("testing 123", {"test": "simple test to verify method acts correctly."});
    expect(message).toStrictEqual({
        "content": "testing 123",
        "embeds": [
            {
                "test": "simple test to verify method acts correctly."
            }
        ]
    })
});

// Test a usual sonde launch message (DFM-17)
test('Create a usual sonde launch message with a DFM-17', () => {
   const message =  sondeTemplates.normal(sonde.dfm17);
   expect(message).toEqual(sondeTemplates.discordEmbedWrapper(
       "<@&980936900204441630>", // SecKC discord usual role
       {
           "type": "rich",
           "title": "DFM17 20041652 has launched",
           "description": "",
           "color": 65535,
           "url": "https://sondehub.org/20041652"
       }
   ));
});

// Test an unusual sonde launch message (DFM-17)
test('Create an unusual sonde launch message with a DFM-17', () => {
    const message =  sondeTemplates.unusual(sonde.dfm17);
    console.log(JSON.stringify(message, null, 2));
    expect(message).toEqual(sondeTemplates.discordEmbedWrapper(
        "<@&980937123463069716>", // SecKC discord unusual role
        {
            "type": "rich",
            "title": "Unusual Sonde launch detected!",
            "description": "",
            "color": 65535,
            "fields": [
                {
                    "name": "DFM 20041652",
                    "value": '\u200B'
                },
                {
                    "name": "Frequency: 405.11 MHz",
                    "value": '\u200B'
                },
                {
                    "name": "Position: 34.9396, 32.8633",
                    "value": '\u200B'
                },
                {
                    "name": "Altitude: 12345.6 m",
                    "value": '\u200B'
                }
            ],
            "image": {
                "url": "https://i.imgur.com/T7goLBv.png",
                "height": 0,
                "width": 0
            },
            "url": "https://sondehub.org/20041652"
        }
    ));
});

