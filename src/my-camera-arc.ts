import { consume } from "@lit/context";
import { ReactiveElement, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3 } from "@babylonjs/core/Maths";
import { Tools } from "@babylonjs/core/Misc/tools";
import type { Nullable } from "@babylonjs/core/types";

import { sceneCtx, type SceneCtx } from "./context";
import { assertNonNull } from "./utils/asserts";
import { debug } from "./utils/debug";

@customElement("my-camera-arc")
export class MyArcCameraElem extends ReactiveElement {
    @consume({ context: sceneCtx, subscribe: true })
    @state()
    ctx: Nullable<SceneCtx> = null;

    @property({ type: Boolean })
    autoZoom = false;

    @property({ type: Boolean })
    autoSpin = false;

    @property({ type: Number })
    zoomFactor = 1.0;

    @property({ type: Number })
    initAlpha: number = 45;

    @property({ type: Number })
    initBeta: number = 45;

    protected override shouldUpdate(_changes: PropertyValues): boolean {
        return this.ctx != null;
    }

    override update(changes: PropertyValues) {
        if (!this.hasUpdated) this.#create();
        else {
            if ((changes.has("ctx") || changes.has("autoZoom")) && this.autoZoom) this.reframe();
            if (changes.has("autoSpin")) this._camera.useAutoRotationBehavior = this.autoSpin;
        }
        super.update(changes);
    }

    _camera!: ArcRotateCamera;

    #create() {
        debug(this, "creating");
        const scene = this.ctx!.scene;
        const radius = 0.5 * this.ctx!.worldSize;
        this._camera = new ArcRotateCamera("(Camera)", Tools.ToRadians(this.initAlpha), Tools.ToRadians(this.initBeta), radius, Vector3.Zero(), scene);
        this._camera.setEnabled(false);
        this._camera.minZ = 0.001;
        this._camera.maxZ = 1000;
        this._camera.lowerRadiusLimit = 1;
        this._camera.upperRadiusLimit = radius;
        this._camera.wheelDeltaPercentage = 0.01; // ??
        this._camera.useNaturalPinchZoom = true;

        this._camera.onEnabledStateChangedObservable.add(() => {
            if (this._camera.isEnabled()) {
                this._camera.useAutoRotationBehavior = this.autoSpin;
                this._camera.attachControl(); 
            } else { 
                this._camera.useAutoRotationBehavior = false;
                this._camera.detachControl();
            }
        });
        scene.activeCamera = this._camera;
        this._camera.setEnabled(true);
    }

    reframe() {
        debug(this, "reframing", this.ctx?.bounds);
        assertNonNull(this.ctx);
        this._camera.autoRotationBehavior?.resetLastInteractionTime();
        const distance = this._camera._calculateLowerRadiusFromModelBoundingSphere(this.ctx.bounds.min, this.ctx.bounds.max, this.zoomFactor);
        this._camera.radius = distance;
        this._camera.focusOn({ ...this.ctx.bounds, distance }, true);
    }
}
