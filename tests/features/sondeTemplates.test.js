import sondeTemplates from '../../src/features/sondeTemplates';
import sonde from '../support/sonde.js';


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
    const message = sondeTemplates.normal(sonde.dfm17);
    expect(message).toEqual(sondeTemplates.discordEmbedWrapper(
        "<@&980936900204441630>", // SecKC discord usual role
        {
            "type": "rich",
            "title": "DFM17 20041652 has launched",
            "description": "",
            "fields": [
                {
                    "name": "Frequency: 405.11 MHz",
                    "value": `\u200B`
                },
                {
                    "name": "Altitude: 40,503 ft",
                    "value": '\u200B'
                }
            ],
            "color": 65535,
            "url": "https://sondehub.org/20041652"
        }
    ));
});

// Test an unusual sonde launch message (DFM-17)
test('Create an unusual sonde launch message with a DFM-17', () => {
    const message = sondeTemplates.unusual(sonde.dfm17);
    expect(message).toEqual(sondeTemplates.discordEmbedWrapper(
        "<@&980937123463069716>", // SecKC discord unusual role
        {
            "type": "rich",
            "title": "Unusual Sonde launch detected!",
            "description": "",
            "color": 65535,
            "fields": [
                {
                    "name": "DFM17 20041652",
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
                    "name": "Altitude: 40,503 ft",
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

// Test a usual sonde launch message (RS-41)
test('Create a usual sonde launch message with a RS-41', () => {
    const message = sondeTemplates.normal(sonde.rs41);
    expect(message).toEqual(sondeTemplates.discordEmbedWrapper(
        "<@&980936900204441630>", // SecKC discord usual role
        {
            "type": "rich",
            "title": "RS41-SG S2430678 has launched",
            "description": "",
            "fields": [
                {
                    "name": "Frequency: 405.11 MHz",
                    "value": `\u200B`
                },
                {
                    "name": "Altitude: 40,503 ft",
                    "value": '\u200B'
                },
                {
                    "name": "Sonde manufactured: 6/10/2020",
                    "value": '\u200B'
                }
            ],
            "color": 65535,
            "url": "https://sondehub.org/S2430678"
        }
    ));
});

// Test an unusual sonde launch message (DFM-17)
test('Create an unusual sonde launch message with a RS41', () => {
    const message = sondeTemplates.unusual(sonde.rs41);
    expect(message).toEqual(sondeTemplates.discordEmbedWrapper(
        "<@&980937123463069716>", // SecKC discord unusual role
        {
            "type": "rich",
            "title": "Unusual Sonde launch detected!",
            "description": "",
            "color": 65535,
            "fields": [
                {
                    "name": "RS41-SG S2430678",
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
                    "name": "Altitude: 40,503 ft",
                    "value": '\u200B'
                },
                {
                    "name": "Sonde manufactured: 6/10/2020",
                    "value": '\u200B'
                }
            ],
            "image": {
                "url": "https://i.imgur.com/T7goLBv.png",
                "height": 0,
                "width": 0
            },
            "url": "https://sondehub.org/S2430678"
        }
    ));
});
 
