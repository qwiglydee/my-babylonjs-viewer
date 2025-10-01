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
    disabled = false; // auto-updated 

    @state()
    _enabled = false; // == !disabled && selected

    @property()
    skin: Nullable<string> = null;

    override connectedCallback(): void {
        super.connectedCallback();
        assert(this.hasAttribute('src'), `Property ${this.tagName}.src required`);
        this._src = this.getAttribute('src')!;
        assert(this.ctx, `The ${this.tagName} requires scene context under viewer`);
    }

    override disconnectedCallback(): void {
        this.#dispose();
        super.disconnectedCallback()
    }

    _model: Nullable<Model> = null;
    @state() _loaded = false;
    
    async #load() {
        this._model = await this.mgr.loadModel(this.src);
        this._loaded = true;
    }

    #dispose() {
        this._model?.dispose();
        this._model = null;
        this._loaded = false;
    }

    @state() _attached: boolean = false; // actually attached
    @state() _anchor: Nullable<TransformNode> = null; // actual anchor

    #retach() {
        assertNonNull(this._model);
        if (this._enabled) {
            this.mgr.attachModel(this._model, this.anchor);
        } else {
            this.mgr.detachModel(this._model);
        }
        this._attached = this._model.attached;
        this._anchor = this._model.anchor;
    }

    #reskin() {
        assertNonNull(this._model);
        if (!this._model.materialCtrl) return;
        if (!this.skin) this.skin = this._model.materialCtrl.variants[0];
        this._model.materialCtrl.selectedVariant = this.skin;
    }

    override update(changes: PropertyValues) {
        if(changes.has('ctx')) {
            this._attached = this._model?.attached ?? false;
        }
        
        if(changes.has('ctx') || changes.has('anchor')) {
            this._anchor = this.anchor ? this.ctx.scene.getTransformNodeByName(this.anchor) : null;
            this.disabled = this.anchor != null && this._anchor == null; 
        }

        if(changes.has('disabled') || changes.has('selected')) {
            this._enabled = !this.disabled && this.selected;
        }

        // debugChanges(this, 'updating', changes);

        if (this._loaded) {
            if (changes.has('_loaded')) {
                this.#retach();
                this.#reskin();
            } else {
                if (changes.has('_enabled') || changes.has('_anchor')) this.#retach();
                if (changes.has('skin')) this.#reskin();
            }
        } else {
            if (changes.has('_enabled') && this._enabled) this.#load();
        }

        if (this.hasUpdated) {
            if (changes.has('_attached') || (changes.has('_anchor') && this._attached)) {
                queueEvent(this, 'model-updated', { enabled: this._enabled, attached: this._attached, anchor: this._anchor?.id });
            }
        }

        super.update(changes);
    }
}
