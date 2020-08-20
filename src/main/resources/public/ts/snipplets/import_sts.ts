import http from "axios";
import {idiom as lang, moment, skin, toasts} from "entcore";
import {Utils} from "../model";

console.log("init importSts");

declare const model: any;

let that;

export const importSts = {
    title: 'Import Sts interface',
    description: "Interface to import sts files data",
    request_result: null,
    controller: {
        reports: [],
        result: {
            state: null,
            content: null
        },
        display: {
            lightbox: false,
            report: null,
            loading: false
        },
        init: function () {
            that = this;
            this.skin = skin;
            this.lang = lang;
            this.loadReports();
            this.$watch(() => model.vieScolaire.structure.id, () => {
                that.loadReports();
                that.result = {
                    state: null,
                    content: null
                };
            });
        },
        loadReports: async function () {
            try {
                const {data} = await http.get(`/edt/structures/${model.vieScolaire.structure.id}/sts/reports`);
                that.reports = data;
                that.safeApply();
            } catch (err) {
                toasts.warning("edt.sts.load.reports.failed");
                throw err;
            }
        },
        getFile1: function (file) {
            this.file1 = file[0];
        },
        getFile2: function (file) {
            this.file2 = file[0];
        },
        formatDate: function (date) {
            return moment(date).format("LLLL");
        },
        submitStsFiles: async function () {
            this.display.loading = true;
            this.result.state = null;
            let scope = this;
            scope.report = null;
            const formData = new FormData();
            formData.append('file1', scope.file1);
            formData.append('file2', scope.file2);

            try {
                let {data} = await http.post(`/edt/structures/${model.vieScolaire.structure.id}/sts`, formData);
                scope.report = data.report;
                scope.result.state = 'success';
                scope.result.content = data.report;
            } catch (err) {
                scope.result.state = 'alert';
                scope.result.content = err.response.data.error;
            } finally {
                scope.display.loading = false;
                this.loadReports();
                that.safeApply();
            }
        },
        redirectToAdminConsole: function (): void {
            let structureId: string = model.vieScolaire.structure.id;
            let url: string = `/admin/${structureId}/management/import-edt`;
            window.location.href = url;
        },

        safeApply: function (): Promise<any> {
            return new Promise((resolve, reject) => {
                let phase = this.$root.$$phase;
                if (phase === '$apply' || phase === '$digest') {
                    if (resolve && (typeof (resolve) === 'function')) {
                        resolve();
                    }
                } else {
                    if (resolve && (typeof (resolve) === 'function')) {
                        this.$apply(resolve);
                    } else {
                        this.safeApply();
                    }
                }
            });
        }
    }
};