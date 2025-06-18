import {Utils} from "../model";
import http, {AxiosResponse} from "axios";
import {toasts} from 'entcore';
import {structureService} from "../services";
import {DateUtils} from "../utils/date";

declare let window: any;

interface SchoolYear {
    id: number;
    start_date: string;
    end_date: string;
    description: string;
    id_structure: string;
    code: string;
    is_opening: boolean;
}

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

            // get school year
            const schoolYearRes: AxiosResponse<SchoolYear> = await http.get(`/viescolaire/settings/periode/schoolyear?structureId=${window.model.vieScolaire.structure.id}`);
            const schoolYear: SchoolYear = schoolYearRes.data;

            this.schoolYear = {
                startDate: schoolYear.start_date,
                endDate: schoolYear.end_date,
            }

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

        isSubmitValid: (): boolean => {
            return initData.that.schoolYear 
                && initData.that.schoolYear.startDate
                && initData.that.schoolYear.endDate 
                && DateUtils.isBefore(initData.that.schoolYear.startDate, initData.that.schoolYear.endDate);
        },

        initData: async function (): Promise<void> {
            let structure_id: string = window.model.vieScolaire.structure.id;

            let response: AxiosResponse = await structureService.initStructureData(
                structure_id, 
                initData.that.initLightbox.zone,
                DateUtils.getDateFormat(initData.that.schoolYear.startDate),
                DateUtils.getDateFormat(initData.that.schoolYear.endDate)
            );
            this.toggleLightboxState(false);
            this.toastHttpCall(Utils.setToastMessage(response,'edt.data.init.success', 'edt.data.init.error'));
            this.safeApply();
        }
    }
}
