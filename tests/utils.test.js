import utils from '../src/utils.js';
import polygon from './support/testPoly.js';

// Test if poly system is working
test('Test if inside a polygon fence', ()=>{
    const test_coordinates = [32.6083338, -1.4699575];
    expect(utils.inside_poly(test_coordinates, polygon)).toBe(true);
});

// Test if poly system is working
test('Test if outside a polygon fence', ()=>{
    const test_coordinates = [17.3144531, 5.9220446];
    expect(utils.inside_poly(test_coordinates, polygon)).toBe(false);
});
