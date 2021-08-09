import {Utils} from "../model";
import {AxiosResponse} from "axios";
import {toasts} from 'entcore';
import {structureService} from "../services";

declare let window: any;

enum ZoneType {
    A = 'A',
    B = 'B',
    C = 'C'
}

export const initData = {
    title: 'Init data edt',
    description: "Permet d'initialiser les données du module edt",
    that: undefined,
    controller: {
        init: async function () {
            this.notifications = [];
            initData.that = this;
            this.zoneTypes = Object.keys(ZoneType);
            this.initLightbox = {
                isOpen: false,
                zone: ZoneType[ZoneType.A]
            };
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
                toasts.confirm(response.toastMessage);
            } else {
                toasts.warning(response.toastMessage);
            }
            return response;
        },

        toggleLightboxState: (state: boolean): void => {
            initData.that.initLightbox.isOpen = state;
        },

        switchZoneType: (zone: string): void => {
            initData.that.initLightbox.zone = ZoneType[ZoneType[zone]];
        },

        initData: async function (): Promise<void> {
            let structure_id: string = window.model.vieScolaire.structure.id;
            let response: AxiosResponse = await structureService.initStructureData(structure_id, initData.that.initLightbox.zone);
            this.toggleLightboxState(false);
            this.toastHttpCall(Utils.setToastMessage(response,'edt.data.init.success', 'edt.data.init.error'));
            this.safeApply();
        }
    }
}
