import {ng} from 'entcore'
import http, {AxiosResponse} from 'axios';


export interface IStructureService {
    initStructureData(structure_id: string, zone: string): Promise<AxiosResponse>;
}

export const structureService: IStructureService = {
    initStructureData: async (structure_id: string, zone: string): Promise<AxiosResponse> => {
        return http.get(`/edt/init/${structure_id}?zone=${zone}`);
    }
};

export const StructureService = ng.service('StructureService', (): IStructureService => structureService);