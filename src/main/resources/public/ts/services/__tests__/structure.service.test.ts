// trick to fake "mock" entcore ng class in order to use service
import {structureService} from "../StructureService";

jest.mock('entcore', () => ({
    ng: {service: jest.fn()}
}));

jest.mock('entcore-toolkit', () => Object.assign({}, (jest as any).requireActual('entcore-toolkit'), {
    http: {get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), postFile: jest.fn(), putFile: jest.fn()}
}));

import { http, HttpResponse } from 'entcore-toolkit';
import DoneCallback = jest.DoneCallback;

describe('structureService', () => {
    it('should be able to call init structure data',  (done: DoneCallback) => {
        const data = { response: true };
        const structureId: string = 'structureId';
        const zone: string = 'A';
        const schoolYearStartDate = "01/09/2024";
        const schoolYearEndDate = "01/08/2025";
        const url = `/edt/init/${structureId}?zone=${zone}&schoolYearStartDate=${schoolYearStartDate}&schoolYearEndDate=${schoolYearEndDate}`;
        (http.get as jest.Mock).mockResolvedValueOnce({data, status: 200, statusText: 'OK', headers: {}, config: {}});
        structureService.initStructureData(structureId, zone, schoolYearStartDate, schoolYearEndDate).then((response: HttpResponse) => {
            expect(response.data).toEqual(data);
        });
        expect(http.get).toHaveBeenCalledWith(url);
        done();
    });
});
