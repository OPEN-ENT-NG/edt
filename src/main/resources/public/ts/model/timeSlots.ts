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
        this.all = [];
    }

    async syncTimeSlots () {
        try {
            let response = await http.get(`edt/time-slots?structureId=${this.structure_id}`);
            if (response.status === 200) {
                this.all = Mix.castArrayAs(TimeSlot, response.data);
            }
            else if (response.status === 204 || response == undefined) {
                this.all = [];
                console.log("pas de profil défini");
            }
        } catch (e) {
            notify.error('erreur time slots');
        }
    }

    haveSlot () {
        return this.all && this.all.length > 0;
    }
}
