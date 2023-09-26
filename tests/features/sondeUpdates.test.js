import pkg from '../support/sondeHubPredictions.js';
import sondeUpdates from '../../src/features/sondeUpdates.js';

const {ascending, descending, invalid} = pkg;

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
        expect(data).toEqual('Township of Sni-A-Bar, MO');
    });
});

test('Decode coordinates to a city', () => {
    expect.assertions(1);
    return sondeUpdates.decodeCityState(39.142243993, -94.577683759).then(data => {
        expect(data).toEqual('Kansas City, MO');
    });
});

test('Decode a sonde back to it\'s launch site', () => {
    expect.assertions(1);
    return sondeUpdates.pullReversePrediction({serial: 'U0370390'}).then(data => {
        expect(data).toEqual('Bucuresti / Imh (Romania)');
    });
});

test('Test decoding an invalid sonde', () => {
    expect.assertions(1);
    return sondeUpdates.pullReversePrediction({serial: 'undefined'}).catch(err => {
        expect(err).toEqual('No sonde found');
    });
});

test('Test decoding a sonde launched outside of a launch site', () => {
    expect.assertions(1);
    return sondeUpdates.pullReversePrediction({serial: '170386C3'}).catch(err => {
        expect(err).toEqual('No location found');
    });
});

