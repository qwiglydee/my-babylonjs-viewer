import type { PropertyValues } from "lit";

export function debug(that: HTMLElement, kind: string, data?: any) {
    console.debug(`${that.tagName}${that.id ? '#' + that.id : ""} ${kind}:`, data);
}

export function debugChanges(that: HTMLElement, kind: string, changes: PropertyValues, keys?: PropertyKey[]) {
    if (!keys) keys = [...changes.keys()];
    // @ts-ignore
    debug(that, kind, Object.fromEntries(keys.map(k => [k, [changes.get(k), that[k]]])));
}