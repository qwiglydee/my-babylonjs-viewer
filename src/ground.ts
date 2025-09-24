import { consume } from "@lit/context";
import type { PropertyValues } from "lit";
import { ReactiveElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { Constants } from "@babylonjs/core/Engines/constants";
import { BackgroundMaterial } from "@babylonjs/core/Materials/Background/backgroundMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Color3, Vector2, Vector3 } from "@babylonjs/core/Maths/math";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Tags } from "@babylonjs/core/Misc/tags";
import type { Nullable } from "@babylonjs/core/types";

import { assert } from "./utils/asserts";
import { envCtx, sceneCtx, type EnvCtx, type SceneCtx } from "./context";

const GROUND_TXT = new URL("./assets/ground.png?inline", import.meta.url);


@customElement('my-ground')
export class MyStubElem extends ReactiveElement {
    @consume({ context: sceneCtx, subscribe: true })
    @state()
    ctx!: SceneCtx;

    @consume({ context: envCtx, subscribe: true })
    @state()
    env!: EnvCtx;

    @property({ type: Number })
    size: Nullable<number> = null;

    @property({ type: Number })
    sizeFactor = 2;

    @property()
    color: string = "#808080";

    @property({ type: Number })
    opacity: number = 1.0;

    override connectedCallback(): void {
        super.connectedCallback();
        assert(this.ctx, `The ${this.tagName} requires scene context under viewer`);
        this.#init();
    }

    override disconnectedCallback(): void {
        this.#dispose();
        super.disconnectedCallback()
    }

    _texture!: Texture;
    _material!: BackgroundMaterial;
    _mesh!: Mesh;

    #init() {
        this._mesh = CreatePlane("#ground", { size: 1 }, this.ctx.scene);
        this._mesh.rotation.x = Math.PI / 2;
        this._mesh.bakeCurrentTransformIntoVertices();
        this._mesh.isPickable = false;
        Tags.AddTagsTo(this._mesh, 'env');

        this._material = new BackgroundMaterial("#ground", this.ctx.scene);
        this._material.alpha = this.opacity;
        this._material.alphaMode = Constants.ALPHA_PREMULTIPLIED_PORTERDUFF;
        this._material.primaryColor = Color3.FromHexString(this.color);
        this._material.useRGBColor = false;
        this._material.enableNoise = true; // ???

        this._texture = new Texture(GROUND_TXT.href, this.ctx.scene);
        this._texture.gammaSpace = false;
        this._texture.hasAlpha = true;

        this._material.diffuseTexture = this._texture;
        this._mesh.material = this._material;
    }

    #adjust() {
        let scaling = 1;
        
        if (this.size) {
            scaling = this.size;
        } else {
            scaling = Vector2.Distance(
                new Vector2(this.ctx.bounds.min.x, this.ctx.bounds.min.z),
                new Vector2(this.ctx.bounds.max.x, this.ctx.bounds.max.z),
            );
        }
        scaling *= this.sizeFactor;

        this._mesh.position.y = this.ctx.bounds.min.y;
        this._mesh.scaling.x = scaling;
        this._mesh.scaling.z = scaling;
    }

    #dispose() {
        this._mesh.dispose(true, true);
    }

    override update(changes: PropertyValues) {
        super.update(changes);
        if (changes.has('ctx') || changes.has('size') || changes.has('sizeFactor')) this.#adjust();
        if (changes.has('color')) this._material.primaryColor = Color3.FromHexString(this.color);
        if (changes.has('opacity')) this._material.alpha = this.opacity;
    }
}