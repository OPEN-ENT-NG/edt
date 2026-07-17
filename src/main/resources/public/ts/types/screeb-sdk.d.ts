// Minimal local typings for @screeb/sdk-browser: the package's .d.ts
// require TS >= 3.0 (the `unknown` type), incompatible with the project's TS 2.4.
// The remap is done via compilerOptions.paths in tsconfig.json (types-only:
// at runtime, webpack resolves the real node_modules package).
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
    // Absent from TS 2.4's dom lib; present in all supported browsers.
    class TextEncoder {
        encode(input?: string): Uint8Array;
    }
}
