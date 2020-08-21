import {Me} from "entcore";

export class PreferencesUtils {

    public static readonly PREFERENCE_KEYS = {
        EDT_STRUCTURE: 'edt.structure',
    };

    /**
     * Updated default structure selected
     *
     * @param structure selected.
     */
    static async updateStructure(structure :  {id: string, name: string}): Promise<void> {
        if (!Me.preferences[this.PREFERENCE_KEYS.EDT_STRUCTURE]) {
            await Me.savePreference(this.PREFERENCE_KEYS.EDT_STRUCTURE);
            await Me.preference(this.PREFERENCE_KEYS.EDT_STRUCTURE)
        }
        Me.preferences[this.PREFERENCE_KEYS.EDT_STRUCTURE] = structure;
        await Me.savePreference(this.PREFERENCE_KEYS.EDT_STRUCTURE);
    }
}
