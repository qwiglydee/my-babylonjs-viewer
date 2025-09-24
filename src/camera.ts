import { ReactiveElement } from "lit";
import type { PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { consume} from "@lit/context";

import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Tools } from "@babylonjs/core/Misc/tools";
import { Epsilon, Vector3 } from "@babylonjs/core/Maths/math";

import { sceneCtx, type SceneCtx } from "./context";


@customElement('my-camera')
export class MyCameraElem extends ReactiveElement {
    @consume({ context: sceneCtx, subscribe: true })
    @state()
    ctx!: SceneCtx;

    camera!: ArcRotateCamera;

    @property({ type: Number })
    alpha = 45;

    @property({ type: Number })
    beta = 45;

    @property({ type: Number })
    zoomFactor = 1;

    @property({ type: Boolean })
    autospin = false;

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

        this.camera.useAutoRotationBehavior = this.autospin;
    }

    #dispose() {
        this.camera.dispose();
    }

    #calcDistance() {
        return this.camera._calculateLowerRadiusFromModelBoundingSphere(this.ctx.bounds.min, this.ctx.bounds.max, this.zoomFactor);
    }

    reframe() {
        this.camera.autoRotationBehavior?.resetLastInteractionTime();
        let distance = this.#calcDistance();
        this.#adjLimits(distance);
        this.camera.interpolateTo(
            Tools.ToRadians(this.alpha),
            Tools.ToRadians(this.beta), 
            distance, 
            Vector3.Center(this.ctx.bounds.min, this.ctx.bounds.max)
        );
    }

    #adjLimits(radius: number) {
        this.camera.lowerRadiusLimit = radius * 0.5;
        this.camera.upperRadiusLimit = radius * 1.5;
    }

    override update(changes: PropertyValues) {
        if (changes.has('ctx')) {
            this.reframe();
        } else if (changes.has('alpha') || changes.has('beta') || changes.has('zoomFactor')) {
            let { alpha, beta, radius } = this.camera;
            if (changes.has('alpha')) alpha = Tools.ToRadians(this.alpha);
            if (changes.has('beta')) beta = Tools.ToRadians(this.beta);
            if (changes.has('zoomFactor')) {
                radius = this.#calcDistance();
                this.#adjLimits(radius);
           }
            this.camera.interpolateTo(alpha, beta, radius, this.camera.target);
        }

        if (changes.has('autospin')) this.camera.useAutoRotationBehavior = this.autospin;

        super.update(changes);
    }
}