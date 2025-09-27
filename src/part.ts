import { ReactiveElement } from "lit";
import type { PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { consume} from "@lit/context";

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

    _ref!: string;
    get ref(): string { return this._ref!; }

    @property({ type: Boolean, reflect: true })
    selected = false;

    @property({ type: Boolean, reflect: true })
    disabled = false;

    get enabled() {
        return !this.disabled && this.selected;
    }

    override connectedCallback(): void {
        super.connectedCallback();
        assert(this.hasAttribute('ref'), `Property ${this.tagName}.ref required`);
        this._ref = this.getAttribute('ref')!;
        assert(this.ctx, `The ${this.tagName} requires scene context under viewer`);
    }

    override disconnectedCallback(): void {
        super.disconnectedCallback()
    }

    @state() _target: Nullable<TransformNode> = null;
    @state() _enabled?: boolean;

    #toggle() {
        assertNonNull(this._target);
        this._target?.setEnabled(this.enabled);
        this._enabled = this.enabled;
    }
    
    override update(changes: PropertyValues) {
        if(changes.has('ctx')) {
            this._target = this.ctx.scene.getMeshByName(this._ref) ?? null;
            this.disabled = (this._target === null);
        }

        if (this._target) {
            if (changes.has('selected') || changes.has('disabled') || changes.has('_target')) this.#toggle();
        }

        super.update(changes);
    }

    protected override updated(changes: PropertyValues): void {
        super.updated(changes);
        if (changes.has('disabled') && changes.get('disabled') === undefined) return; // skip initial update
        if (changes.has('_enabled') || changes.has('_target')) {
            queueEvent(this, 'part-updated', { enabled: this._enabled, target: this._target?.name });
        }
    }
}