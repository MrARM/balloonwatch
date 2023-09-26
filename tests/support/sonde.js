// This file contains example radiosondes to test features that take in radiosonde packets

// Example sonde, Graw DFM-17
const sonde_dfm17 = {
    "software_name": "radiosonde_auto_rx",
    "software_version": "1.5.10",
    "uploader_callsign": "CHANGEME_AUTO_RX",
    "uploader_position": "29.9792,31.1342",
    "uploader_antenna": "Pyramid of Giza",
    "time_received": "2022-01-01T00:10:00.000000Z",
    "datetime": "2022-01-01T02:22:45.000000Z",
    "manufacturer": "Graw",
    "type": "DFM",
    "subtype": "DFM17",
    "serial": "20041652",
    "dfmcode": "0xB",
    "frame": 1338430965,
    "lat": 34.93960,
    "lon": 32.86330,
    "alt": 12345.6,
    "temp": -25,
    "vel_v": -2.01,
    "vel_h": 10.10,
    "heading": 90.00,
    "sats": 20,
    "batt": 4.5,
    "frequency": 405.11,
    "snr": 14.6,
    "user-agent": "Amazon CloudFront",
    "position": "34.93960,32.86330",
    "upload_time_delta": 0.00,
    "uploader_alt": 148
};

// Example sonde, Vaisala RS-41
const sonde_rs41 = {
    "software_name": "radiosonde_auto_rx",
    "software_version": "1.5.10",
    "uploader_callsign": "CHANGEME_AUTO_RX",
    "uploader_position": "29.9792,31.1342",
    "uploader_antenna": "Pyramid of Giza",
    "time_received": "2022-01-01T00:10:00.000000Z",
    "datetime": "2022-01-01T02:22:45.000000Z",
    "manufacturer": "Vaisala",
    "type": "RS41",
    "subtype": "RS41-SG",
    "serial": "S2430678",
    "frame": 2501,
    "lat": 34.93960,
    "lon": 32.86330,
    "alt": 12345.6,
    "temp": -25,
    "humidity": 7.7,
    "vel_v": -2.01,
    "vel_h": 10.10,
    "heading": 90.00,
    "sats": 20,
    "batt": 3.1,
    "burst_timer": 65535,
    "frequency": 405.11,
    "snr": 14.6,
    "user-agent": "Amazon CloudFront",
    "position": "34.93960,32.86330",
    "upload_time_delta": 0.00,
    "uploader_alt": 148
};

export default {
    rs41: sonde_rs41,
    dfm17: sonde_dfm17
};
