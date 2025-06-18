// This file contains utilities that are independent of the core or features
const moment = require("moment");
const fetch = require('node-fetch');
const config = require("../config.json");

const inside_poly = (point, vs) => {
    // ray-casting algorithm based on
    // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html
    // Create polygons for this at https://www.keene.edu/campus/maps/tool/

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

const checkUsualTime = () => {
    let usualTime = true;
    // Check if unusual
    const hour = moment.utc().hour();
    if(!config.usual_hours.includes(hour)){
        usualTime = false;
    }
    return usualTime;
}

const mToft = meters => {
    return Math.trunc(meters * 3.2808);
}

const reqGeocode = async coordinates => {
    // Geocoding done by Radar
    const req_url = `https://api.radar.io/v1/geocode/reverse?coordinates=${coordinates}`;
    const api_key = process.env.RADAR_API_KEY || null;

    // This defaults to having all available fields, to prevent null references
    let returnObject = {
      "addressLabel": "",
      "number": "",
      "street": "",
      "city": "API Failure",
      "state": "",
      "stateCode": "ERR",
      "postalCode": "",
      "county": "",
      "countryCode": "",
      "formattedAddress": "",
      "layer": "address",
      "latitude": 0,
      "longitude": 0,
      "geometry": {
        "type": "Point",
        "coordinates": [
          0,
          0
        ]
      },
      "distance": 0,
      "country": "",
      "countryFlag": "",
      "timeZone": {
        "id": "Etc/UTC",
        "name": "Coordinated Universal Time",
        "code": "UTC",
        "currentTime": "2025-06-18T12:17:26Z", // Shouldn't be used with Balloony.
        "utcOffset": 0,
        "dstOffset": 0
      }
    };

    // If the API key does not exist, we will return a "API Failure" response
    if (!api_key) {
        return returnObject;
    }

    // Send off the request
    const response = await fetch(req_url, {
        method: 'GET',
        headers: {
            'Authorization': api_key,
            'Content-Type': 'application/json'
        }
    });

    // Attempt to parse it
    try {
        const data = await response.json();
        if (data && data.meta.code == 200) {
            returnObject = data.addresses[0] || returnObject; // In the weird case of no address, return the default object
        }
    } catch (error) {
        console.error("Error parsing geocode response:", error);
    }

    return returnObject;
};

module.exports = {
    inside_poly,
    checkUsualTime,
    mToft,
    reqGeocode
};
