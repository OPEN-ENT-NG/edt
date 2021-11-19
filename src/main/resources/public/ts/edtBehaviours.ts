import { _ } from 'entcore';
import http from 'axios';
import { SETTINGS_SNIPPLET } from './snipplets';
import { Exclusion, Exclusions } from './model';
import {initData} from "./snipplets/init_data";
import {importSts} from "./snipplets/import_sts";
import {courseTags} from "./snipplets/course-tags";

export const edtBehaviours = {
    rights: {
        workflow: {
                access: 'fr.cgi.edt.controllers.EdtController|view',
                view: 'fr.cgi.edt.controllers.EdtController|view',
                manage: 'fr.cgi.edt.controllers.EdtController|create',
                edtSearch: 'fr.cgi.edt.controllers.SearchController|searchUsers'

        },
        resource: {
            read: {
                right: "fr-cgi-edt-controllers-EdtController|getEdt"
            },
            contrib: {
                right: "fr-cgi-edt-controllers-EdtController|updateEdt"
            },
            manager: {
                right: "fr-cgi-edt-controllers-EdtController|addRights"
            }
        }
    },
    loadResources: function(callback){
        http.get('/edt/list').then(function(edt){
            this.resources = _.map(_.where(edt, { trashed: 0 }), function(edt){
                edt.icon = edt.icon || '/img/illustrations/edt-default.png';
                return {
                    title: edt.title,
                    owner: edt.owner,
                    icon: edt.icon,
                    path: '/edt#/view-edt/' + edt._id,
                    _id: edt._id
                };
            });
            callback(this.resources);
        }.bind(this));
    },
    model: {
        Exclusion: Exclusion,
        Exclusions: Exclusions
    },
    sniplets: {
        exclusion: SETTINGS_SNIPPLET,
        init_data_edt: initData,
        import_sts: importSts,
        'course-tags': courseTags
    }
};