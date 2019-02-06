import {moment, notify} from 'entcore';
import http from 'axios';

export class PeriodeAnnee {
    id: number;
    start_date: string;
    end_date: string;
    structure: string;

    constructor(id_structure?: string) {
        if (id_structure) this.structure = id_structure;
    }

    get api() {
        return {
            POST: '/viescolaire/settings/periode'
        };
    }

    toJson() {
        return {
            id: this.id,
            start_date: moment(this.start_date).format('YYYY-MM-DD 00:00:00'),
            end_date: moment(this.end_date).format('YYYY-MM-DD 23:59:59'),
            id_structure: this.structure
        };
    }

    async sync (structure_id: string) {
        try {
            let {data} = await http.get(`/viescolaire/settings/periode?structure=${structure_id}`);
            if(data.id !== undefined) {
                this.id = data.id;
                this.start_date = data.start_date;
                this.end_date = data.end_date;
            }
        } catch (e) {
            notify.error('viescolaire.error.sync');
        }
    }

}
