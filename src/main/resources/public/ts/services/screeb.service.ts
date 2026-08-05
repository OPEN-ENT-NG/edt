import {ng, Service, model} from "entcore";
import http from 'axios';
import {
    eventTrack,
    identityProperties,
    identityReset,
    init,
    load,
    messageStart,
    PropertyRecord,
    surveyClose,
    surveyStart,
    targetingDebug,
} from '@screeb/sdk-browser';

const SESSION_POLL_MS: number = 50;
const SESSION_TIMEOUT_MS: number = 15000;

// entcore peuple `model.me` de façon asynchrone (~300ms après le chargement de la page) : à
// l'évaluation d'app.ts il vaut encore undefined. On n'utilise pas `Me.onSessionReady()` ni
// `model.one('userinfo-loaded')` pour l'attendre : `unbind` identifie les handlers en comparant
// leur `toString()`, or tous les wrappers créés par `one()` ont un source identique. Le premier
// handler déclenché désinscrit donc un autre handler du tableau en cours d'itération par
// `trigger`, ce qui en fait sauter silencieusement une partie (reproduit ici : 3 handlers
// enregistrés, 1 seul exécuté). D'où l'attente par polling, insensible à ce bus d'évènements.
function whenSessionReady(): Promise<void> {
    const start: number = Date.now();
    return new Promise<void>((resolve, reject) => {
        const check = (): void => {
            if (model.me && model.me.userId) {
                resolve();
            } else if (Date.now() - start > SESSION_TIMEOUT_MS) {
                reject(new Error('session entcore indisponible après ' + SESSION_TIMEOUT_MS + 'ms'));
            } else {
                setTimeout(check, SESSION_POLL_MS);
            }
        };
        check();
    });
}

// Confidentialité : l'userId envoyé à Screeb est hashé SHA-256 et tronqué
// à 16 caractères hexadécimaux (règle commune à toutes les intégrations Edifice).
async function hashUserId(userId: string): Promise<string> {
    const hashBuffer = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(userId),
    );
    return Array.from(new Uint8Array(hashBuffer))
        .map((b: number) => ('0' + b.toString(16)).slice(-2))
        .join('')
        .slice(0, 16);
}

export interface IScreebService {
    initFromPublicConf(): Promise<void>;
    trackEvent(name: string, properties?: PropertyRecord): void;
    triggerSurvey(surveyId: string, hooks?: any, hiddenFields?: PropertyRecord): void;
    triggerMessage(messageId: string, hooks?: any): void;
    closeSurvey(): void;
    debugTargeting(): void;
    setIdentityProperties(properties: PropertyRecord): void;
    reset(): void;
}

export const screebService: IScreebService = {
    // Screeb est opt-in par plateforme : sans screeb-app-id dans la publicConf
    // du module, rien n'est chargé (aucun appel réseau vers Screeb).
    initFromPublicConf: async (): Promise<void> => {
        await whenSessionReady();
        const res = await http.get('/edt/conf/public');
        const appId: string = res.data && res.data['screeb-app-id'];
        if (!appId) {
            return;
        }
        await load();
        const hashedId: string = await hashUserId(model.me.userId);
        await init(appId, hashedId, {profile: model.me.type});
    },

    trackEvent: (name: string, properties?: PropertyRecord): void => {
        eventTrack(name, properties);
    },

    triggerSurvey: (surveyId: string, hooks?: any, hiddenFields?: PropertyRecord): void => {
        surveyStart(surveyId, undefined, undefined, hiddenFields, hooks);
    },

    triggerMessage: (messageId: string, hooks?: any): void => {
        messageStart(messageId, undefined, undefined, hooks);
    },

    closeSurvey: (): void => {
        surveyClose();
    },

    debugTargeting: (): void => {
        targetingDebug();
    },

    setIdentityProperties: (properties: PropertyRecord): void => {
        identityProperties(properties);
    },

    reset: (): void => {
        identityReset();
    },
};

export const ScreebService: Service = ng.service('ScreebService', (): IScreebService => screebService);
