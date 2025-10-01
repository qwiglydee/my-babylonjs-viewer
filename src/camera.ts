import { ReactiveElement } from "lit";
import type { PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { consume } from "@lit/context";

import { ArcRotateCamera, ComputeAlpha, ComputeBeta } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Tools } from "@babylonjs/core/Misc/tools";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Nullable } from "@babylonjs/core/types";
import type { PickingInfo } from "@babylonjs/core/Collisions/pickingInfo";

import { pickingCtx, sceneCtx, type SceneCtx } from "./context";
import { assertNonNull } from "./utils/asserts";


@customElement('my-camera')
export class MyCameraElem extends ReactiveElement {
    @consume({ context: sceneCtx, subscribe: true })
    @state()
    ctx!: SceneCtx;

    @consume({ context: pickingCtx, subscribe: true })
    @state()
    pick!: Nullable<PickingInfo>;

    camera!: ArcRotateCamera;

    @property({ type: Number })
    alpha = 45;

    @property({ type: Number })
    beta = 45;

    @property({ type: Number })
    zoomFactor = 1;

    @property({ type: Boolean })
    autospin = false;

    @property({ type: Number })
    autospinDelay = 3000;

    @property({ type: Boolean })
    autozoom = false;

    override connectedCallback(): void {
        super.connectedCallback();
        this.#init();
    }

    override disconnectedCallback(): void {
        this.#dispose();
        super.disconnectedCallback()
    }

    #init() {
        this.camera = new ArcRotateCamera("#camera", Tools.ToRadians(this.alpha), Tools.ToRadians(this.alpha), 1, Vector3.Zero(), this.ctx.scene);
        this.camera.minZ = 0.001;
        this.camera.maxZ = 1000;
        this.camera.lowerRadiusLimit = 0;
        this.camera.upperRadiusLimit = Number.MAX_VALUE;
        this.camera.wheelDeltaPercentage = 0.01; // ??
        this.camera.useNaturalPinchZoom = true;
        this.camera.attachControl();
        this.reset();
    }

    #dispose() {
        this.camera.dispose();
    }

    reset() {
        this.camera.autoRotationBehavior?.resetLastInteractionTime();
        const { min, max } = this.ctx.bounds;
        const target = Vector3.Center(min, max);
        let distance = this.camera._calculateLowerRadiusFromModelBoundingSphere(min, max, this.zoomFactor);
        this.#adjLimits(distance);
        this.camera.interpolateTo(Tools.ToRadians(this.alpha), Tools.ToRadians(this.beta), distance, target);
    }

    reframe() {
        this.camera.autoRotationBehavior?.resetLastInteractionTime();
        const { min, max } = this.ctx.bounds;
        const target = Vector3.Center(min, max);
        let distance = this.camera._calculateLowerRadiusFromModelBoundingSphere(min, max, this.zoomFactor);
        this.#adjLimits(distance);
        this.camera.interpolateTo(this.camera.alpha, this.camera.beta, distance, target);
    }

    refocus() {
        this.camera.autoRotationBehavior?.resetLastInteractionTime();
        assertNonNull(this.pick?.pickedMesh);
        const { min, max } = Mesh.MinMax([this.pick.pickedMesh]);
        const target = Vector3.Center(min, max);
        let distance = this.camera._calculateLowerRadiusFromModelBoundingSphere(min, max);
        let vector = this.camera.position.subtract(target);
        let radius = vector.length();
        if (radius === 0) radius = 0.0001;
        let alpha = ComputeAlpha(vector);
        let beta = ComputeBeta(vector.y, radius);
        distance = (distance * 0.5 + radius * 0.5); 
        this.#adjLimits(distance);
        this.camera.interpolateTo(alpha, beta, distance, target);
    }

    #adjLimits(radius: number) {
        this.camera.lowerRadiusLimit = radius * 0.5;
        this.camera.upperRadiusLimit = radius * 1.5;
    }

    override update(changes: PropertyValues) {
        if (changes.has('ctx')) {
            this.camera.autoRotationBehavior?.resetLastInteractionTime();
            if (this.autozoom) this.reframe();
        } else if (changes.has('alpha') || changes.has('beta') || changes.has('zoomFactor')) {
            this.reset();
        }

        if (changes.has('autospin')) {
            this.camera.useAutoRotationBehavior = this.autospin;
        }
        if (changes.has('autospinDelay') && this.camera.autoRotationBehavior) {
            this.camera.autoRotationBehavior.idleRotationWaitTime = this.autospinDelay;
        }

        if (changes.has('pick')) {
            if (this.pick && this.pick.pickedMesh) this.refocus(); else this.reset();
        }
        super.update(changes);
    }
}