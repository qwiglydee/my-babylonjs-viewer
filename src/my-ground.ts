import { consume } from "@lit/context";
import { ReactiveElement, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { BackgroundMaterial } from "@babylonjs/core/Materials/Background/backgroundMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Color3 } from "@babylonjs/core/Maths";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Nullable } from "@babylonjs/core/types";

import { sceneCtx, type SceneCtx } from "./context";
import { assertNonNull } from "./utils/asserts";

const GROUND_TXT = new URL("./assets/ground.png?inline", import.meta.url);

@customElement("my-ground")
export class MyGroundElem extends ReactiveElement {
    @consume({ context: sceneCtx, subscribe: true })
    @state()
    ctx: Nullable<SceneCtx> = null;

    @property({ type: Boolean })
    autoSize = false;

    @property({ type: Number })
    radius: Nullable<number> = null;

    @property()
    color: string = "#808080";

    @property({ type: Number })
    opacity = 1.0;

    protected override shouldUpdate(_changes: PropertyValues): boolean {
        return this.ctx != null;
    }

    override update(changes: PropertyValues) {
        if (!this.hasUpdated) {
            this.#create();
            this.resize();
        }
        else {
            if ((changes.has("ctx") || changes.has("autoSize")) && this.autoSize) this.resize();
            if (changes.has("radius") && !this.autoSize) this.resize();

            if (changes.has("opacity")) {
                this._mtl.alpha = this.opacity;
            }

            if (changes.has("color")) {
                this._mtl.primaryColor = Color3.FromHexString(this.color);
            }
        }

        super.update(changes);
    }

    _mesh!: Mesh;
    _mtl!: BackgroundMaterial;

    #create() {
        assertNonNull(this.ctx);
        const scene = this.ctx.scene;

        this._mesh = CreateGround("(Ground)", { width: 1.0, height: 1.0, subdivisions: 1 }, scene);
        this._mesh.isPickable = false;
        scene.markAux(this._mesh);

        this._mtl = new BackgroundMaterial("(Ground)", scene);
        this._mtl.useRGBColor = false;
        this._mtl.primaryColor = Color3.FromHexString(this.color);
        this._mtl.backFaceCulling = false;
        this._mtl.alpha = this.opacity;
        this._mtl.diffuseTexture = new Texture(GROUND_TXT.href, scene);
        this._mtl.diffuseTexture.hasAlpha = true;
        this._mesh.material = this._mtl;
    }

    resize() {
        assertNonNull(this.ctx);
        if (this.autoSize) {
            this._resize(4 * Math.max(this.ctx!.bounds.max.length(), this.ctx!.bounds.min.length()));
        } else {
            this._resize(this.radius ? this.radius * 2 : this.ctx.worldSize)
        }
    }

    _resize(size: number) {
        this._mesh.scaling.x = size;
        this._mesh.scaling.z = size;
    }
}
