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

describe('[Utils] getValues', () => {
    test(`It should returns an array containing [2, 3, 4]`, () => {
       const values = [
           { value : 2 },
           { value : 3 },
           { value : 4 }
       ];

       expect(Utils.getValues(values, 'value')).toEqual([2, 3, 4]);
    });

    test(`It should returns an array containing ['two', undefined, 'four']`, () => {
        const values = [
            {
                value : 2,
                name: 'two'
            },
            {
                value : 3,
            },
            {
                value : 4,
                name: 'four'
            }
        ];

        expect(Utils.getValues(values, 'name')).toEqual(['two', undefined, 'four']);
    });
});