import {Utils} from "../model";
import http from "axios";

console.log("init importSts");

export const importSts = {
    title: 'Import Sts interface',
    description: "Interface to import sts files data",
    request_result: null,
    controller: {
        getFile1: function (file) {
            this.file1 = file[0];
        },
        getFile2: function (file) {
            this.file2 = file[0];
        },
        submitStsFiles: async function () {
            let scope = this;
            scope.request_result = null;
            const formData = new FormData();
            formData.append('file1', scope.file1);
            formData.append('file2', scope.file2);

            let {data} = await http.post('/edt/sts', formData);
            this.request_result = data;
            this.safeApply();
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
}