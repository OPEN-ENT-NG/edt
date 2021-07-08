// trick to fake "mock" entcore ng class in order to use service
import {structureService} from "../StructureService";

jest.mock('entcore', () => ({
    ng: {service: jest.fn()}
}));

import axios, {AxiosResponse} from 'axios';
import MockAdapter from 'axios-mock-adapter';
import DoneCallback = jest.DoneCallback;

describe('structureService', () => {
    it('should be able to call init structure data',  (done: DoneCallback) => {
        const mock = new MockAdapter(axios);
        const data = { response: true };
        const structureId: string = 'structureId';
        mock.onGet(`/edt/init/${structureId}`).reply(200, data);
        structureService.initStructureData(structureId).then((response: AxiosResponse) => {
            expect(response.data).toEqual(data);
        });
        done();
    });
});