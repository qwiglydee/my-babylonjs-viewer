import { consume } from "@lit/context";
import { ReactiveElement, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Nullable } from "@babylonjs/core/types";

import { assetsCtx, sceneCtx, type SceneCtx } from "./context";
import { assert, assertNonNull } from "./utils/asserts";
import { queueEvent } from "./utils/events";
import type { MyModelManager } from "./assetmgr";
import type { Model } from "./gltf/model";
// import { debug, debugChanges } from "./utils/debug";


@customElement('my-model')
export class MyModelElem extends ReactiveElement {
    @consume({ context: assetsCtx })
    mgr!: MyModelManager;

    @consume({ context: sceneCtx, subscribe: true })
    @state()
    ctx!: SceneCtx;

    _src!: string;
    get src(): string { return this._src!; }

    @property()
    anchor: Nullable<string> = null;

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
        this._model?.dispose();
        this._loaded = false;
    }

    @state() _attached: boolean = false;
    @state() _anchor: Nullable<TransformNode> = null;

    #attach() {
        assertNonNull(this._model);
        if (!this.enabled) {
            this.mgr.detachModel(this._model);
        } else {
            this.mgr.attachModel(this._model, this.anchor);
            this._attached = true;
        }
        this._attached = this._model.attached;
        this._anchor = this._model.anchor;
    }

    #reskin() {
        assertNonNull(this._model);
        if (!this._model.materialCtrl) return;
        if (this.skin) {
            this._model.materialCtrl.selectedVariant = this.skin;
        } else {
            this._model.materialCtrl.selectedVariant = this._model.materialCtrl.variants[0];
        }
    }

    override update(changes: PropertyValues) {
        if(changes.has('ctx') && this._loaded) {
            this._attached = this._model!.attached;
        }
        if(changes.has('ctx') || changes.has('anchor')) {
            this.disabled = !(this.anchor == null || this.ctx.slots.includes(this.anchor));
            this._anchor = this.anchor ? this.ctx.scene.getTransformNodeByName(this.anchor) : null;
            // debug(this, 'validated', { disabled: this.disabled, target: this._target?.id });
        }

        // debugChanges(this, 'updating', changes);

        if (!this._loaded && this.enabled) this.#load();

        if (this._loaded) {
            if (changes.has('_loaded')) {
                this.#attach();
                this.#reskin();
            } else {
                if (changes.has('selected') || changes.has('disabled') || changes.has('_anchor')) this.#attach();
                if (changes.has('skin')) this.#reskin();
            }
        }

        super.update(changes);
    }

    protected override updated(changes: PropertyValues): void {
        super.updated(changes);
        if (changes.has('_loaded') && changes.get('_loaded') === undefined) return; // skip initial update
        if (changes.has('_attached') || (this._attached && changes.has('_anchor'))) {
            queueEvent(this, 'model-updated', { enabled: this.enabled, attached: this._attached, target: this._anchor?.name });
        }
    }
}
