import { ReactiveElement } from "lit";
import type { PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { consume} from "@lit/context";

import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";

import { debugChanges } from "./utils/debug";

import { sceneCtx, type SceneCtx } from "./context";
import { Tools } from "@babylonjs/core/Misc/tools";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { Mesh } from "@babylonjs/core/Meshes/mesh";


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
    zoom = 2;

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
        return this.camera._calculateLowerRadiusFromModelBoundingSphere(this.ctx.bounds.min, this.ctx.bounds.max);
    }

    reframe() {
        this.camera.autoRotationBehavior?.resetLastInteractionTime();
        const distance = this.#calcDistance();

        this.camera.alpha = Tools.ToRadians(this.alpha);
        this.camera.beta = Tools.ToRadians(this.beta);
        this.camera.lowerRadiusLimit = distance;
        this.camera.upperRadiusLimit = distance * this.zoom;
        this.camera.radius = this.camera.upperRadiusLimit;
        this.camera.target = Mesh.Center(this.ctx.bounds);
    }

    override update(changes: PropertyValues) {
        super.update(changes);
        debugChanges(this, 'update', changes);

        if (changes.has('ctx')) {
            this.reframe();
            return;
        } else if (changes.has('alpha') || changes.has('beta') || changes.has('zoom')) {
            let { alpha, beta, radius } = this.camera;
            if (changes.has('alpha')) alpha = Tools.ToRadians(this.alpha);
            if (changes.has('beta')) beta = Tools.ToRadians(this.beta);
            if (changes.has('zoom')) {
                radius = this.#calcDistance() * this.zoom;
                this.camera.upperRadiusLimit = Math.max(this.camera.upperRadiusLimit!, radius);
            }
            this.camera.interpolateTo(alpha, beta, radius, this.camera.target);
        }

        if (changes.has('autospin')) this.camera.useAutoRotationBehavior = this.autospin;
    }
}