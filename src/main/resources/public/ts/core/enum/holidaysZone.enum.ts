// Zone values that will be passed to the https://data.education.gouv.fr/ API.
// Values are validated by the backend in the class "InitController" in method "isValidZone",
// so values must match! :)
export enum HOLIDAYS_ZONE {
    ZONE_A = "Zone A",
    ZONE_B = "Zone B",
    ZONE_C = "Zone C",
    CORSE = "Corse",
    GUADELOUPE = "Guadeloupe",
    GUYANE = "Guyane",
    MARTINIQUE = "Martinique",
    MAYOTTE = "Mayotte",
    NOUVELLE_CALEDONIE = "Nouvelle Calédonie",
    POLYNESIE = "Polynésie",
    REUNION = "Réunion",
    SAINT_PIERRE_ET_MIQUELON = "Saint Pierre et Miquelon",
    WALLIS_ET_FUTUNA = "Wallis et Futuna",
}