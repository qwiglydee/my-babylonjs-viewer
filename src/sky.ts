import { ReactiveElement } from "lit";
import type { PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { consume} from "@lit/context";

import { debug, debugChanges } from "./utils/debug";

import { envCtx, sceneCtx, type EnvCtx, type SceneCtx } from "./context";
import { assert, assertNonNull } from "./utils/asserts";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { BackgroundMaterial } from "@babylonjs/core/Materials/Background/backgroundMaterial";
import { Color3, Vector3 } from "@babylonjs/core/Maths/math";
import type { Nullable } from "@babylonjs/core/types";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Tags } from "@babylonjs/core/Misc/tags";


@customElement('my-sky')
export class MyStubElem extends ReactiveElement {
    @consume({ context: sceneCtx, subscribe: false })
    ctx!: SceneCtx;

    @consume({ context: envCtx, subscribe: true })
    @state()
    env!: EnvCtx;

    @property({ type: Number })
    size: number = 1000;

    @property({ type: Number })
    intensity: number = 1.0;

    @property({ type: Number })
    blurring: number = 0.5; 

    override connectedCallback(): void {
        super.connectedCallback();
        assert(this.ctx, `The ${this.tagName} requires scene context under viewer`);
        this.#init();
    }

    override disconnectedCallback(): void {
        this.#dispose();
        super.disconnectedCallback()
    }


    _texture: Nullable<CubeTexture> = null;
    _material!: BackgroundMaterial;
    _mesh!: Mesh;

    #init() {
        this._mesh = CreateBox("#sky", { sideOrientation: Mesh.BACKSIDE }, this.ctx.scene);
        Tags.AddTagsTo(this._mesh, 'env');
        this._mesh.scaling = Vector3.One().scale(this.size);
        this._mesh.isPickable = false;
        this._mesh.infiniteDistance = true;
        this._mesh.applyFog = false;
        this._mesh.setEnabled(false);

        this._material = new BackgroundMaterial("#sky", this.ctx.scene);
        this._material.primaryColor = Color3.Gray();
        this._mesh.material = this._material;
    }

    #initTexture() {
        this._texture?.dispose(); 
        this._texture = this.env.texture.clone();
        this._texture.coordinatesMode = Texture.SKYBOX_MODE;
        this._texture.level = this.intensity; 

        this._material.reflectionTexture = this._texture;
        this._material.reflectionBlur = this.blurring;
        this._mesh.setEnabled(true);
    }

    #dispose() {
        this._mesh.dispose(true, true);
    }

    
    override update(changes: PropertyValues) {
        super.update(changes);
        debugChanges(this, 'update', changes);

        if (changes.has('env')) this.#initTexture();
        if (changes.has('size')) this._mesh.scaling = Vector3.One().scale(this.size);
        if (changes.has('blurring')) this._material.reflectionBlur = this.blurring;
        if (changes.has('intensity') && this._texture) this._texture.level = this.intensity;
    }
}