import {Mix} from 'entcore-toolkit';
import {idiom as lang} from 'entcore';
import http, {AxiosResponse} from 'axios';

export class Group {
    name: string;
    color: string;
    id: string;
    type_groupe?;
    displayName: string;
    isInCurrentTeacher: boolean = false;
    externalId?: string;

    constructor(id: string, name: string, color: string) {
        this.id = id;
        this.name = name;
        this.color = color;
    }


    toString(): string {
        return this.displayName;
    }
}

export class Groups {
    all: Group[];

    constructor() {
        this.all = [];
    }

    /**
     * Synchronize groups belongs to the parameter structure
     * @param structureId structure id
     * @returns {Promise<void>}
     */
    async sync(structureId: string, isTeacher?: boolean) {
        try {
            if (isTeacher) {
                let teacherGroups: AxiosResponse = await http.get(`/viescolaire/classes?idEtablissement=${structureId}&isEdt=true`);
                teacherGroups.data.forEach((group: Group): void => {
                    group.displayName = group.name + ' ' + lang.translate("my.class");
                    group.isInCurrentTeacher = true
                });
                this.all = Mix.castArrayAs(Group, teacherGroups.data);
                let teacherGroupIds: string[] = this.all.map((group: Group) => group.id);
                let groups: AxiosResponse = await http.get(`/viescolaire/classes?idEtablissement=${structureId}&isEdt=true&&isTeacherEdt=true`);
                groups.data.forEach((group: Group): void => {
                    if (teacherGroupIds.indexOf(group.id) === -1) {
                        group.displayName = group.name;
                        this.all.push(Mix.castAs(Group, group));
                    }
                });

            } else {
                let groups: AxiosResponse = await http.get(`/viescolaire/classes?idEtablissement=${structureId}&isEdt=true`);
                this.all = Mix.castArrayAs(Group, groups.data);
                this.all.map((g: Group): void => {
                    g.displayName = g.name;
                });
                //sorting groups
                this.all.sort((g: Group, gg: Group): number => {
                    if (g.type_groupe < gg.type_groupe)
                        return -1;
                    else if (g.type_groupe > gg.type_groupe)
                        return 1;
                    else if (g.type_groupe === gg.type_groupe)
                        if (g.name < gg.name)
                            return -1;
                        else
                            return 1;

                });

            }
        } catch (e) {
            throw e;
        }
    }
}

