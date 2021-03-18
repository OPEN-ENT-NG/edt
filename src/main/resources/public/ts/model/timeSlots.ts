import {notify} from 'entcore';
import http, {AxiosPromise, AxiosResponse} from 'axios';
import {Mix} from "entcore-toolkit";

export class TimeSlot {
    id: string;
    name: string;
    structure_id: string;
    endHour?: string;
    startHour?: string;

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

    /**
     * Fetch the structure time slots.
     */
     syncTimeSlots = async (): Promise<void> => {
        try {
            let response: AxiosResponse = await http.get(`edt/time-slots?structureId=${this.structure_id}`);
            if (response.status === 200) {
                this.all = Mix.castArrayAs(TimeSlot, response.data);
            }
            else if (response.status === 204) {
                this.all = [];
            }
        } catch (e) {
            notify.error('edt.error.time.slots');
        }
    }

    /**
     * Checks if the structure has defined time slots.
     */
    haveSlot = (): boolean => {
        return this.all && this.all.length > 0;
    }
}
