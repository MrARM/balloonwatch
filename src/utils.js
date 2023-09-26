// This file contains utilities that are independent of the core or features
import moment from "moment";
import config from "../config.json" assert { type: "json" };

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

export default {
    inside_poly,
    checkUsualTime,
    mToft
};
