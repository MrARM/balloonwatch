// RS41 datecode - decode the RS41 serial and get the manufacturing date.

// Reference: https://www.vaisala.com/sites/default/files/documents/Vaisala%20Radiosonde%20RS41%20Serial%20Number.pdf

// This table exists solely due to the fact Vaisala skipped letters.
const rs41_datecode_table = {
    'J': 2013,
    'K': 2014,
    'L': 2015,
    'M': 2016,
    'N': 2017,
    'P': 2018,
    'R': 2019,
    'S': 2020,
    'T': 2021,
    'U': 2022,
    'V': 2023, // This, and letters past here are unconfirmed and may be subject to change if Vaisala wants to go past 2027.
    'W': 2024,
    'X': 2025,
    'Y': 2026,
    'Z': 2027
};

// https://stackoverflow.com/questions/16590500/calculate-date-from-week-number-in-javascript
const getDateOfISOWeek = (w, y) => {
    const simple = new Date(y, 0, 1 + (w - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4)
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else
        ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    return ISOweekStart;
};

const resolveDate = serial => {
    const year = rs41_datecode_table[serial.slice(0, 1)];
    const week = Number(serial.slice(1,3));
    const days = Number(serial.slice(3,4)) - 1; // 0: Monday, 6: Sunday

    const dateObj = getDateOfISOWeek(week, year);

    // Add days next
    dateObj.setDate(dateObj.getDate() + days);

    return dateObj;
};

export default resolveDate;
