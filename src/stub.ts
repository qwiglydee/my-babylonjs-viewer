import { ReactiveElement } from "lit";
import type { PropertyValues } from "lit";
import { customElement, state } from "lit/decorators.js";
import { consume} from "@lit/context";

import { sceneCtx, type SceneCtx } from "./context";
import { assertNonNull } from "./utils/asserts";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { CreateIcoSphere } from "@babylonjs/core/Meshes/Builders/icoSphereBuilder";
import { queueEvent } from "./utils/events";
import { PBRMetallicRoughnessMaterial } from "@babylonjs/core/Materials/PBR/pbrMetallicRoughnessMaterial";
import { Tags } from "@babylonjs/core/Misc/tags";


@customElement('my-stub')
export class MyStubElem extends ReactiveElement {
    @consume({ context: sceneCtx, subscribe: true })
    @state()
    ctx!: SceneCtx;

    override connectedCallback(): void {
        super.connectedCallback();
        assertNonNull(this.ctx, `The ${this.tagName} requires scene context under viewer`);
        this.#init();
    }

    override disconnectedCallback(): void {
        this.#dispose();
        super.disconnectedCallback()
    }

    _mesh!: Mesh;

    #init() {
        this._mesh = CreateIcoSphere("#dumb", { radius: 0.5, subdivisions: 2}, this.ctx.scene);
        this._mesh.material = new PBRMetallicRoughnessMaterial("#dumb", this.ctx.scene);
        this._mesh.position.y = 0.5;
        Tags.AddTagsTo(this._mesh, "model");
        queueEvent(this, 'model-updated', { enabled: true })
    }

    #dispose() {
        this._mesh.dispose();
    }
    
    override update(changes: PropertyValues) {
        super.update(changes);
        // debugChanges(this, 'update', changes);
    }
}
