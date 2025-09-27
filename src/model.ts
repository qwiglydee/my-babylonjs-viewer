import { consume } from "@lit/context";
import { ReactiveElement, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Nullable } from "@babylonjs/core/types";

import { assetsCtx, sceneCtx, type SceneCtx } from "./context";
import type { Model, MyAssetManager } from "./assetmgr";
import { assert, assertNonNull } from "./utils/asserts";
import { queueEvent } from "./utils/events";
import { debug, debugChanges } from "./utils/debug";


@customElement('my-model')
export class MyModelElem extends ReactiveElement {
    @consume({ context: assetsCtx })
    mgr!: MyAssetManager;

    @consume({ context: sceneCtx, subscribe: true })
    @state()
    ctx!: SceneCtx;

    _src!: string;
    get src(): string { return this._src!; }

    @property()
    target: Nullable<string> = null;

    @property({ type: Boolean, reflect: true })
    selected = false;

    @property({ type: Boolean, reflect: true })
    disabled = false;

    get enabled() {
        return !this.disabled && this.selected;
    }

    @property()
    skin: Nullable<string> = null;

    override connectedCallback(): void {
        super.connectedCallback();
        assert(this.hasAttribute('src'), `Property ${this.tagName}.src required`);
        this._src = this.getAttribute('src')!;
        assert(this.ctx, `The ${this.tagName} requires scene context under viewer`);
        this.#init();
    }

    override disconnectedCallback(): void {
        this.#dispose();
        super.disconnectedCallback()
    }

    @state() _loaded = false;
    _model: Nullable<Model> = null;

    #init() {
    }

    async #load() {
        this._model = await this.mgr.loadModel(this.src);
        this._loaded = true;
    }

    #dispose() {
        this._model?.assets?.dispose();
        this._loaded = false;
    }

    @state() _attached: boolean = false;
    @state() _target: Nullable<TransformNode> = null;

    #attach() {
        assertNonNull(this._model);
        if (!this.enabled) {
            this.mgr.orphanAttachments(this._model);
            this.mgr.detachModel(this._model);
            this._attached = false;
        } else {
            this.mgr.attachModel(this._model, this._target);
            this._attached = true;
        }
    }

    #reskin() {
        assertNonNull(this._model);
        if (this.skin) {
            this._model.matCtrl.selectedVariant = this.skin;
        } else {
            this._model.matCtrl.selectedVariant = this._model.matCtrl.variants[0];
        }
    }


    override update(changes: PropertyValues) {
        if(changes.has('ctx') || changes.has('target')) {
            this.disabled = !(this.target == null || this.ctx.slots.includes(this.target));
            this._target = this.target ? this.ctx.scene.getTransformNodeByName(this.target) : null;
            // debug(this, 'validated', { disabled: this.disabled, target: this._target?.id });
        }

        // debugChanges(this, 'updating', changes);

        if (!this._loaded && this.enabled) this.#load();

        if (this._loaded) {
            if (changes.has('_loaded')) {
                this.#attach();
                this.#reskin();
            } else {
                if (changes.has('selected') || changes.has('disabled') || changes.has('_target')) this.#attach();
                if (changes.has('skin')) this.#reskin();
            }
        }

        super.update(changes);
    }

    protected override updated(changes: PropertyValues): void {
        super.updated(changes);
        if (changes.has('_loaded') && changes.get('_loaded') === undefined) return; // skip initial update
        if (changes.has('_attached') || (this._attached && changes.has('_target'))) {
            queueEvent(this, 'model-updated', { enabled: this.enabled && this._attached, target: this._target?.name });
        }
    }
}
