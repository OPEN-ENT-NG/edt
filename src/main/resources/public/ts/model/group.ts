import { Mix } from 'entcore-toolkit';
import http from 'axios';

export class Group {
    name: string;
    color: string;
    id: string;

    constructor (id: string, name: string, color:string) {
        this.id = id;
        this.name = name;
        this.color = color;
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
            let groups = await http.get(`/viescolaire/classes?idEtablissement=${structureId}&isEdt=true`  );
            this.all = Mix.castArrayAs(Group, groups.data);
        } catch (e) {
            throw e;
        }
    }
}

