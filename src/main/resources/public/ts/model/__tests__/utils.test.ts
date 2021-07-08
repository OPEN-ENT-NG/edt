jest.mock('entcore', () => ({
    ng: {service: jest.fn()}
}));

import { Utils } from '../utils';
describe('[Utils] getClassGroupTypeMap', () => {
    test('Class/Group type map should have CLASS and FUNCTIONAL_GROUP key', () => {
        const map: any = Utils.getClassGroupTypeMap();
        expect(map.hasOwnProperty('CLASS')).toBeTruthy();
        expect(map.hasOwnProperty('FUNCTIONAL_GROUP')).toBeTruthy();
    });

    test('Class type returned should be 0', () => {
        const map: any = Utils.getClassGroupTypeMap();
        expect(map.CLASS).toBe(0);
    });

    test('Functional Group type returned should be 1', () => {
        const map: any = Utils.getClassGroupTypeMap();
        expect(map.FUNCTIONAL_GROUP).toBe(1);
    });
});
