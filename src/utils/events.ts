export function bubbleEvent<T>(that: HTMLElement, type: string, detail?: T): void {
    that.dispatchEvent(new CustomEvent<T>(type, { detail, bubbles: true, composed: true }));
}

export function origTarget(event: Event): HTMLElement {
    return event.composedPath()[0] as HTMLElement;
}
