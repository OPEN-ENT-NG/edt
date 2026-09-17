import {ng} from 'entcore'
import {http, HttpResponse} from 'entcore-toolkit';


export interface IStructureService {
    initStructureData(structure_id: string, zone: string, schoolYearStartDate: string, schoolYearEndDate: string): Promise<HttpResponse>;
}

export const structureService: IStructureService = {
    initStructureData: async (structure_id: string, zone: string, schoolYearStartDate: string, schoolYearEndDate: string): Promise<HttpResponse> => {
        return http.get(`/edt/init/${structure_id}?zone=${zone}&schoolYearStartDate=${schoolYearStartDate}&schoolYearEndDate=${schoolYearEndDate}`);
    }
};

export const StructureService = ng.service('StructureService', (): IStructureService => structureService);