import { css, html, ReactiveElement, render } from "lit";
import type { PropertyValues } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import { provide } from "@lit/context";

import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene, type SceneOptions } from "@babylonjs/core/scene";
import { Color4 } from "@babylonjs/core/Maths/math.color";

import type { EngineOptions } from "@babylonjs/core/Engines/thinEngine";

import { debugChanges } from "./utils/debug";
import { sceneCtx, type SceneCtx } from "./context";
import { bubbleEvent } from "./utils/events";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Tags } from "@babylonjs/core/Misc/tags";

// dumb
import { PBRMetallicRoughnessMaterial } from "@babylonjs/core/Materials/PBR/pbrMetallicRoughnessMaterial";
import { CreateIcoSphere } from "@babylonjs/core/Meshes/Builders/icoSphereBuilder";


const ENGOPTIONS: EngineOptions = {
    antialias: true,
    stencil: false,
}

const SCNOPTIONS: SceneOptions = {
}


@customElement('my-viewer')
export class MyViewerElement extends ReactiveElement {
    @query("canvas")
    canvas!: HTMLCanvasElement;

    engine!: Engine;
    scene!: Scene;

    @provide({ context: sceneCtx })
    ctx!: SceneCtx;

    static override styles = css`
        :host {
            --my-background-color: #808080ff;
            display: block;
            position: relative;
            background-color: var(--my-background-color);
        }

        canvas {
            display: block;
            position: absolute;
            width: 100%;
            height: 100%;
        }
    `

    #renderHTML() {
        const innerhtml = html`
            <canvas></canvas>
        `;
        render(innerhtml, this.renderRoot);
    }

    _needresize: boolean = false;
    #resizingObs!: ResizeObserver;

    @state()
    _visible: boolean = true;
    #visibilityObs!: IntersectionObserver;


    constructor() {
        super();
        this.#resizingObs = new ResizeObserver(
            () => { this._needresize = false; }
        );
        this.#visibilityObs = new IntersectionObserver(
            (entries) => { this._visible = entries[0].isIntersecting; },
            { threshold: 0.5 }
        );
    }

    override connectedCallback(): void {
        super.connectedCallback();
        this.#renderHTML()
        this.#setup();
        this.#resizingObs.observe(this);
        this.#visibilityObs.observe(this);
    }

    override disconnectedCallback(): void {
        this.#resizingObs.disconnect();
        this.#visibilityObs.disconnect();
        this.#dispose();
        super.disconnectedCallback();
    }

    #setup() {
        this.engine = new Engine(this.canvas, undefined, ENGOPTIONS);
        this.scene = new Scene(this.engine, SCNOPTIONS);
        this.scene.clearColor = Color4.FromHexString(getComputedStyle(this).getPropertyValue('--my-background-color'));

        let dumb = CreateIcoSphere("#dumb", { subdivisions: 64 }, this.scene); // FIXME
        Tags.AddTagsTo(dumb, "model");
        let dumbmat = new PBRMetallicRoughnessMaterial("default", this.scene);
        dumbmat.metallic = 1;
        dumbmat.roughness = 0;
        dumb.material = dumbmat;

        this.updateCtx();
    }

    #dispose() {
        this.scene.dispose();
        this.engine.dispose();
    }

    #render = () => {
        if (!this._needresize) { this.engine.resize(); this._needresize = true; }
        this.scene.render();
    }

    updateCtx() {
        this.ctx = {
            scene: this.scene,
            bounds: Mesh.MinMax(this.scene.getMeshesByTags('model')),
        }
        bubbleEvent(this, 'scene-updated', this.ctx);
    }

    override update(changes: PropertyValues) {
        super.update(changes);
        debugChanges(this, 'update', changes);
        if (changes.has('_visible')) {
            if (this._visible) {
                this.engine.runRenderLoop(this.#render);
            } else {
                this.engine.stopRenderLoop(this.#render);
            }
        }
    }
}