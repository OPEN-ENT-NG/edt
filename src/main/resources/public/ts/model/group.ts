import { Mix } from 'entcore-toolkit';
import http from 'axios';

export class Group {
    name: string;
    color: string;
    id: string;

    constructor (id: string, name: string, color:string) {
        this.id = id;
        this.name = name;
        this.color = color;
    }


    toString (): string {
        return this.name;
    }
}

export class Groups {
    all: Group[];

    constructor () {
        this.all = [];
    }

    /**
     * Synchronize groups belongs to the parameter structure
     * @param structureId structure id
     * @returns {Promise<void>}
     */
    async sync (structureId: string, isTeacher? :boolean) {
        try {
            if(isTeacher){
                let groups = await http.get(`/viescolaire/classes?idEtablissement=${structureId}&isEdt=true`  );
                this.all = Mix.castArrayAs(Group, groups.data);
                let groupsAll = await http.get(`/viescolaire/classes?idEtablissement=${structureId}&isEdt=true&&isTeacherEdt=true`  );
                let groupsAllArray = Mix.castArrayAs(Group, groupsAll.data);
                //Add all the groups and modify duplicate
                let alreadyExists ;
                groupsAllArray.map(g => {
                     alreadyExists = false;
                    let index;
                    this.all.map(gg => {
                        if (gg.id === g.id){
                            alreadyExists = true;
                            gg.name += " ( ma classe )";
                        }
                    });
                    if(alreadyExists !== true){
                        this.all.push(g);
                    }
                })
            }else{
                let groups = await http.get(`/viescolaire/classes?idEtablissement=${structureId}&isEdt=true`  );
                this.all = Mix.castArrayAs(Group, groups.data);
            }
        } catch (e) {
            throw e;
        }
    }
}

