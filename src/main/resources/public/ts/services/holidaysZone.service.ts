import { idiom } from "entcore";
import { HOLIDAYS_ZONE } from "../core/enum/holidaysZone.enum";

interface Zone {
    value: string;
    label: string;
}

export const holidaysZoneService = {
    getHolidaysZones: (): Zone[] => {
        const zones: Zone[] = [];

        zones.push({value: HOLIDAYS_ZONE.ZONE_A, label: idiom.translate("edt.zone.select.ZoneA")});
        zones.push({value: HOLIDAYS_ZONE.ZONE_B, label: idiom.translate("edt.zone.select.ZoneB")});
        zones.push({value: HOLIDAYS_ZONE.ZONE_C, label: idiom.translate("edt.zone.select.ZoneC")});

        zones.push({value: HOLIDAYS_ZONE.CORSE, label: idiom.translate("edt.zone.select.Corse")});
        zones.push({value: HOLIDAYS_ZONE.GUADELOUPE, label: idiom.translate("edt.zone.select.Guadeloupe")});
        zones.push({value: HOLIDAYS_ZONE.GUYANE, label: idiom.translate("edt.zone.select.Guyane")});
        zones.push({value: HOLIDAYS_ZONE.MARTINIQUE, label: idiom.translate("edt.zone.select.Martinique")});
        zones.push({value: HOLIDAYS_ZONE.MAYOTTE, label: idiom.translate("edt.zone.select.Mayotte")});
        zones.push({value: HOLIDAYS_ZONE.NOUVELLE_CALEDONIE, label: idiom.translate("edt.zone.select.NouvelleCaledonie")});
        zones.push({value: HOLIDAYS_ZONE.POLYNESIE, label: idiom.translate("edt.zone.select.Polynesie")});
        zones.push({value: HOLIDAYS_ZONE.REUNION, label: idiom.translate("edt.zone.select.Reunion")});
        zones.push({value: HOLIDAYS_ZONE.SAINT_PIERRE_ET_MIQUELON, label: idiom.translate("edt.zone.select.SaintPierreEtMiquelon")});
        zones.push({value: HOLIDAYS_ZONE.WALLIS_ET_FUTUNA, label: idiom.translate("edt.zone.select.WallisEtFutuna")});

        return zones;
    }
}