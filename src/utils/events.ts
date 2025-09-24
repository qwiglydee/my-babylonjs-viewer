export function bubbleEvent<T>(that: HTMLElement, type: string, detail?: T): void {
    that.dispatchEvent(new CustomEvent<T>(type, { detail, bubbles: true, composed: true }));
}

export function queueEvent<T>(that: HTMLElement, type: string, detail?: T): void {
    setTimeout(() => bubbleEvent(that, type, detail));
}

export function origTarget(event: Event): HTMLElement {
    return event.composedPath()[0] as HTMLElement;
}

export function targetId(target: EventTarget): string {
    return (target as HTMLElement).id;
} 