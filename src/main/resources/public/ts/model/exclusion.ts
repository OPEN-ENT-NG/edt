import { notify, moment } from 'entcore';
import http from 'axios';
import { Mix } from 'entcore-toolkit';

export class Exclusion {
    id: number;
    start_date: string;
    end_date: string;
    description: string;
    id_structure: string;
    loading: boolean;

    constructor (id_structure?: string) {
        this.loading = false;
        this.description = '';
        if (id_structure) this.id_structure = id_structure;
    }

    async save (): Promise<void> {
        if (this.id) {
            await this.update();
        } else {
            await this.create();
        }
        return;
    }

    async create (): Promise<void> {
        try {
            await http.post('/edt/settings/exclusion', this.toJSON());
        } catch (e) {
            notify.error("edt.notify.exclusion.create.err")
        }
    }

    async update (): Promise<void> {
        try {
            await http.put(`/edt/settings/exclusion/${this.id}`, this.toJSON());
        } catch (e) {
            notify.error("edt.notify.exclusion.update.err")
        }
    }

    async delete (): Promise<void> {
        try {
            await http.delete(`/edt/settings/exclusion/${this.id}`);
        } catch (e) {
            notify.error("edt.notify.exclusion.delete.err")
        }
    }

    isLoading (): boolean {
        return this.loading || false;
    }

    toJSON (): any {
        return {
            description: this.description,
            start_date: moment(this.start_date).format('YYYY-MM-DD 00:00:00'),
            end_date: moment(this.end_date).format('YYYY-MM-DD 23:59:59'),
            id_structure: this.id_structure
        }
    }
}

export class Exclusions {
    all: Exclusion[];

    constructor () {
        this.all = [];
    }

    async sync (structureId: string): Promise<void> {
        let exclusions = await http.get(`/edt/settings/exclusions?structureId=${structureId}`);
        this.all = Mix.castArrayAs(Exclusion, exclusions.data);
    }
}