// Typings locaux minimaux pour @screeb/sdk-browser : les .d.ts du paquet
// requièrent TS >= 3.0 (type `unknown`), incompatibles avec le TS 2.4 du projet.
// Le remap est fait via compilerOptions.paths dans tsconfig.json (types-only :
// à runtime, webpack résout le vrai paquet node_modules).
export type PropertyRecord = { [key: string]: any };
export function load(options?: any): Promise<any>;
export function init(websiteId: string, userId?: string, userProperties?: PropertyRecord, hooks?: any, language?: string): Promise<any>;
export function eventTrack(eventName: string, eventProperties?: PropertyRecord): Promise<any>;
export function surveyStart(surveyId: string, distributionId?: string, allowMultipleResponses?: boolean, hiddenFields?: PropertyRecord, hooks?: any, language?: string, selectors?: string | string[]): Promise<any>;
export function messageStart(messageId: string, allowMultipleResponses?: boolean, hiddenFields?: PropertyRecord, hooks?: any, language?: string): Promise<any>;
export function surveyClose(): Promise<any>;
export function targetingDebug(): Promise<any>;
export function identityProperties(userProperties: PropertyRecord): Promise<any>;
export function identityReset(): Promise<any>;

declare global {
    // Absent du lib dom de TS 2.4 ; présent dans tous les navigateurs supportés.
    class TextEncoder {
        encode(input?: string): Uint8Array;
    }
}
