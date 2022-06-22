const rs41Datecode = require('../../src/features/rs41_datecode');

test('Decode a RS41 serial number', () => {
    const rsSerial = 'T2650000'; // Should be July 2nd, 2021
    const resolvedDate = rs41Datecode.resolveDate(rsSerial);

    expect(resolvedDate.getDate()).toEqual(2);
    expect(resolvedDate.getMonth()).toEqual(6);
    expect(resolvedDate.getYear()).toEqual(121);
});