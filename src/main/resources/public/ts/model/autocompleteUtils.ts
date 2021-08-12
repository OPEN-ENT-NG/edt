import http from "axios";
import {Mix} from "entcore-toolkit";
import {Teacher} from "./teacher";

export class AutocompleteUtils {
    private static structure;

    public static teacher: string;
    private static teacherOptions: Teacher[];

    public static class : string;
    private static classOptions;

    public static init(structure) {
        this.structure = structure;
        this.resetSearchFields();
    }

    public static getTeacherOptions() {
        return this.teacherOptions;
    }

    public static getClassOptions() {
        return this.classOptions;
    }

    public static resetSearchFields() {
        this.teacher = "";
        this.teacherOptions = [];
        this.class = "";
        this.classOptions = [];
    }

    public static async filterTeacherOptions(value) {
        try {
            this.teacherOptions = await this.searchTeachers(value);
        } catch (err) {
            this.teacherOptions = [];
            throw err;
        }
    }

    public static async filterClassOptions(value) {
        try {
            this.classOptions = await this.searchClasses(value);
        } catch (err) {
            this.classOptions = [];
            throw err;
        }
    }

    public static async searchClasses(value) {
        try {
            const {data} = await http.get(`/edt/search?structureId=${this.structure.id}&q=${value}`);
            data.forEach((item) => item.toString = () => item.displayName.trim());
            return data;
        } catch (err) {
            throw err;
        }
    }

    public static async searchTeachers(value): Promise<Teacher[]> {
        try {
            value = value.replace('\\s', '').toLowerCase();
            const {data} = await http.get(`/edt/search/users?structureId=${this.structure.id}` +
                    `&profile=Teacher&q=${value}&field=firstName&field=lastName`);
            data.forEach((user: Teacher) => user.toString = () => user.displayName.trim());
            return Mix.castArrayAs(Teacher, data);
        } catch (err) {
            throw err;
        }
    }
}