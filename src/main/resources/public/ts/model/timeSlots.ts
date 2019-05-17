import {notify} from 'entcore';
import http from 'axios';
import {Mix} from "entcore-toolkit";

export class TimeSlot {
    id: string;
    name: string;
    structure_id: string;

    constructor(id_structure?: string) {
        if (id_structure) this.structure_id = id_structure;
    }

}

export class TimeSlots {
    all: TimeSlot[];
    id: string;
    structure_id: string;

    constructor(id_structure?: string) {
        if (id_structure) this.structure_id = id_structure;
    }

    async syncTimeSlots () {
        try {
            let {data} = await http.get(`edt/time-slots?structureId=${this.structure_id}`);
            this.all = Mix.castArrayAs(TimeSlot, data);
        } catch (e) {
            notify.error('erreur time slots');
        }
    }
}
