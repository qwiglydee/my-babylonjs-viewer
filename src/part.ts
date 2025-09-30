import { ReactiveElement } from "lit";
import type { PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { consume } from "@lit/context";

import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Nullable } from "@babylonjs/core/types";

// import { debug, debugChanges } from "./utils/debug";

import { sceneCtx, type SceneCtx } from "./context";
import { assert, assertNonNull } from "./utils/asserts";
import { queueEvent } from "./utils/events";


@customElement('my-part')
export class MyPartElem extends ReactiveElement {
    @consume({ context: sceneCtx, subscribe: true })
    @state()
    ctx!: SceneCtx;

    _target!: string;
    get target(): string { return this._target!; }

    @property({ type: Boolean, reflect: true })
    selected = false;

    @property({ type: Boolean, reflect: true })
    disabled = true; // auto-updated 

    @state()
    _enabled = false; // == !disabled && selected

    override connectedCallback(): void {
        super.connectedCallback();
        assert(this.hasAttribute('target'), `Property ${this.tagName}.target required`);
        this._target = this.getAttribute('target')!;
        assert(this.ctx, `The ${this.tagName} requires scene context under viewer`);
    }

    override disconnectedCallback(): void {
        super.disconnectedCallback()
    }

    @state() _attached: boolean = true; // actually present and visible, initialy true
    @state() _anchor: Nullable<TransformNode> = null; // actual node

    #toggle() {
        assertNonNull(this._anchor);
        this._anchor.setEnabled(this._enabled);
        this._attached = this._anchor.isEnabled();
    }

    override update(changes: PropertyValues) {
        if (changes.has('ctx')) {
            this._anchor = this.ctx.scene.getMeshByName(this._target) ?? null;
            this.disabled = (this._anchor === null);
        }

        if (changes.has('_anchor')) {
            this._attached = this._anchor !== null && this._anchor.isEnabled();
        }

        if (changes.has('disabled') || changes.has('selected')) {
            this._enabled = !this.disabled && this.selected;
        }

        if (this._anchor) {
            if (changes.has('_enabled') || changes.has('_anchor')) this.#toggle();
        }

        if (this.hasUpdated) {
            if (changes.has('_attached') || (changes.has('_anchor') && this._attached)) {
                queueEvent(this, 'part-updated', { enabled: this._enabled, attached: this._attached, anchor: this._anchor?.id });
            }
        }

        super.update(changes);
    }
}