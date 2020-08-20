import {ng} from 'entcore'
import http, {AxiosResponse} from 'axios';


export interface IStructureService {
    initStructureData(structure_id: string): Promise<AxiosResponse>;
}

export const structureService: IStructureService = {
    initStructureData: async (structure_id: string): Promise<AxiosResponse> => {
        return http.get(`/edt/init/${structure_id}`);
    }
};

export const StructureService = ng.service('StructureService', (): IStructureService => structureService);