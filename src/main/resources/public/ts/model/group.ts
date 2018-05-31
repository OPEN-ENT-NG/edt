import { Mix } from 'entcore-toolkit';
import http from 'axios';

export class Group {
    name: string;
    id: string;

    constructor (id: string, name: string) {
        this.id = id;
        this.name = name;
    }

    toString (): string {
        return this.name;
    }
}

export class Groups {
    all: Group[];

    constructor () {
        this.all = [];
    }

    /**
     * Synchronize groups belongs to the parameter structure
     * @param structureId structure id
     * @returns {Promise<void>}
     */
    async sync (structureId: string) {
        try {
            let groups = await http.get('/viescolaire/classes?idEtablissement=' + structureId);
            this.all = Mix.castArrayAs(Group, groups.data);
        } catch (e) {
            throw e;
        }
    }
}

