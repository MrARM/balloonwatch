const sondeUpdates = require('../../src/features/sondeUpdates');
const {ascending, descending, invalid} = require("../support/sondeHubPredictions");

test('Decode a SondeHub prediction (ascending)', () => {
    const decoded = sondeUpdates.decodePrediction(ascending);
    expect(decoded).toEqual({
        error: false,
        serial: 'U0370390',
        altitude: 19498.2,
        latitude: 44.82490996364504,
        longitude: 26.95381997153163,
        predictedLatitude: 44.89407661394611,
        predictedLongitude: 26.819151397023443,
        predictionTime: 1659230172,
        burst: false
    });
});

test('Decode a SondeHub prediction (descending)', () => {
    const decoded = sondeUpdates.decodePrediction(descending);
    expect(decoded.error).toEqual(false);
    expect(decoded.burst).toEqual(true);
});

test('Decode a errored SondeHub prediction', () => {
    const decoded = sondeUpdates.decodePrediction(invalid);
    expect(decoded.error).toEqual(true);
});

test('Decode coordinates to a county', () => {
    expect.assertions(1);
    return sondeUpdates.decodeCityState(39, -94).then(data => {
        expect(data).toEqual('Lafayette County, MO');
    });
});

test('Decode coordinates to a city', () => {
    expect.assertions(1);
    return sondeUpdates.decodeCityState(39.142243993, -94.577683759).then(data => {
        expect(data).toEqual('North Kansas City, MO');
    });
});

