import {Utils} from "../model";
import http from "axios";
import {toast} from "../model/toast";

console.log("init data");

export const initData = {
    title: 'Init data edt',
    description: "Permet d'initialiser les données du module edt",
    that: undefined,
    controller: {
        init: async function () {
            this.notifications = [];
            initData.that = this;
            this.safeApply();
        },

        safeApply: function (): Promise<any> {
            return new Promise((resolve, reject) => {
                let phase = this.$root.$$phase;
                if (phase === '$apply' || phase === '$digest') {
                    if (resolve && (typeof(resolve) === 'function')) {
                        resolve();
                    }
                } else {
                    if (resolve && (typeof(resolve) === 'function')) {
                        this.$apply(resolve);
                    } else {
                        this.safeApply();
                    }
                }
            });
        },

        toastHttpCall: (response) => {
            if (response.succeed) {
                initData.that.notifications.push(new toast(response.toastMessage, 'confirm'));
            } else {
                initData.that.notifications.push(new toast(response.toastMessage, 'error'));
            }
            return response;
        },

        initData: async function () {
            console.log('coucou les periodes');
            let response = await http.get(`edt/init`);
            this.toastHttpCall(Utils.setToastMessage(response,'edt.data.init.success', 'edt.data.init.error'));
            this.safeApply();
        }
    }
}
