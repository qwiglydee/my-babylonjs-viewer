import { ReactiveElement, type PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";
import { consume, provide } from "@lit/context";

import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import { Tools } from "@babylonjs/core/Misc/tools";
import type { Nullable } from "@babylonjs/core/types";

import { assert } from "./utils/asserts";

import { envCtx, sceneCtx, type EnvCtx, type SceneCtx } from "./context";

const DEFAULT_ENV = new URL("./assets/default.env?inline", import.meta.url);

@customElement('my-environ')
export class MyEnvElem extends ReactiveElement {
    @consume({ context: sceneCtx, subscribe: false })
    ctx!: SceneCtx;

    _src!: Nullable<string>;
    get src(): string { return this._src!; }

    @property({ type: Number })
    intensity: number = 1.0;

    @property({ type: Number })
    rotation: number = 0;

    @provide({ context: envCtx })
    env!: EnvCtx;

    override connectedCallback(): void {
        super.connectedCallback();
        assert(this.ctx, `The ${this.tagName} requires scene context under viewer`);
        this._src = this.getAttribute('src')!;
        this.#init();
    }

    override disconnectedCallback(): void {
        this.#dispose();
        super.disconnectedCallback()
    }

    _texture!: CubeTexture;

    #init() {
        const url = this.src ?? DEFAULT_ENV.href;
        this._texture = CubeTexture.CreateFromPrefilteredData(url, this.ctx.scene, ".env", false);
        this._texture.onLoadObservable.addOnce(() => {
            this._texture.level = this.intensity;
            this._texture.rotationY = Tools.ToRadians(this.rotation);
            this.ctx.scene.environmentTexture = this._texture;
            this.env = { texture: this._texture }
        });
    }

    #dispose() {
        this.ctx.scene.environmentTexture = null;
        this._texture.dispose();
    }
    
    override update(changes: PropertyValues) {
        super.update(changes);
        if (!this._texture) return;
        if (changes.has('intensity')) this._texture.level = this.intensity;
        if (changes.has('rotation')) this._texture.rotationY = Tools.ToRadians(this.rotation);
    }
}