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
// import { debug, debugChanges } from "./utils/debug";

const GROUND_TXT = new URL("./assets/ground.png?inline", import.meta.url);

@customElement("my-ground")
export class MyGroundElem extends ReactiveElement {
    @consume({ context: sceneCtx, subscribe: true })
    @state()
    ctx!: SceneCtx;

    @property({ type: Number })
    size: Nullable<number> = null;

    @property({ type: Boolean })
    autoSize = false;

    @property()
    color: string = "#20f0f0";

    @property({ type: Number })
    opacity = 0.5;

    @state()
    _size: number = 0;

    override connectedCallback(): void {
        super.connectedCallback();
        this.#init();
    }

    _mesh!: Mesh;
    _mtl!: BackgroundMaterial;

    #init() {
        // debug(this, "initilizing");
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

        this._size = this.size ?? this.#calcSize();
    }

    #calcSize() {
        assertNonNull(this.ctx);
        if (this.ctx.bounds) {
            return 3 * Math.max(
                Math.abs(this.ctx.bounds.minimum.x), 
                Math.abs(this.ctx.bounds.minimum.z), 
                Math.abs(this.ctx.bounds.maximum.x), 
                Math.abs(this.ctx.bounds.maximum.z), 
            )
        } else {
            return 2 * Math.max(this.ctx.scene.worldSize.x, this.ctx.scene.worldSize.z);
        }
    }

    #resize() {
        // debug(this, "resizing", { size: this._size });
        this._mesh.scaling.x = this._size;
        this._mesh.scaling.z = this._size;
    }

    override update(changes: PropertyValues) {
        if ((changes.has("ctx") || changes.has("autoSize")) && this.autoSize) this._size = this.#calcSize();

        if (changes.has("size") && this.size) this._size = this.size;

        if (changes.has("_size")) this.#resize();

        if (changes.has("opacity")) this._mtl.alpha = this.opacity;

        if (changes.has("color")) this._mtl.primaryColor = Color3.FromHexString(this.color);
        
        super.update(changes);
    }
}
