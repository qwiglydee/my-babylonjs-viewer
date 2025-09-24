import { provide } from "@lit/context";
import type { PropertyValues } from "lit";
import { css, html, ReactiveElement, render } from "lit";
import { customElement, query, state } from "lit/decorators.js";

import { Engine } from "@babylonjs/core/Engines/engine";
import type { EngineOptions } from "@babylonjs/core/Engines/thinEngine";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { Scene, type SceneOptions } from "@babylonjs/core/scene";
import { Tags } from "@babylonjs/core/Misc/tags";

import { debugChanges } from "./utils/debug";
import { queueEvent } from "./utils/events";

import { sceneCtx, type SceneCtx } from "./context";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";

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

    #resizingObs!: ResizeObserver;
    _needresize: boolean = true;

    #visibilityObs!: IntersectionObserver;
    @state() _visible: boolean = true;

    constructor() {
        super();
        this.#resizingObs = new ResizeObserver(
            () => { this._needresize = true; }
        );
        this.#visibilityObs = new IntersectionObserver(
            (entries) => { this._visible = entries[0].isIntersecting; },
            { threshold: 0.5 }
        );
    }

    override connectedCallback(): void {
        super.connectedCallback();
        this.#renderHTML()
        this.#init();
        this.#resizingObs.observe(this);
        this.#visibilityObs.observe(this);
    }

    override disconnectedCallback(): void {
        this.#resizingObs.disconnect();
        this.#visibilityObs.disconnect();
        this.#dispose();
        super.disconnectedCallback();
    }

    #init() {
        this.engine = new Engine(this.canvas, undefined, ENGOPTIONS);
        this.scene = new Scene(this.engine, SCNOPTIONS);
        this.scene.clearColor = Color4.FromHexString(getComputedStyle(this).getPropertyValue('--my-background-color'));

        this.updateCtx();
    }

    #dispose() {
        this.scene.dispose();
        this.engine.dispose();
    }

    #render = () => {
        if (this._needresize) { this.engine.resize(); this._needresize = false; }
        this.scene.render();
    }

    @state() _ctx_dirty = false;

    updateCtx() {
        this.ctx = {
            scene: this.scene,
            bounds: this.scene.getWorldExtends((m: AbstractMesh) => Tags.MatchesQuery(m, "model")),
        }
    }

    override update(changes: PropertyValues) {
        debugChanges(this, 'update', changes);
        if (changes.has('_visible')) {
            if (this._visible) {
                this.engine.runRenderLoop(this.#render);
            } else {
                this.engine.stopRenderLoop(this.#render);
            }
        }
        if (changes.has('_ctx_dirty') && this._ctx_dirty) {
            this._ctx_dirty = false;
            this.updateCtx();
        }
        super.update(changes);
    }

    override updated(changes: PropertyValues) {
        super.updated(changes);
        if (changes.has('_ctx_dirty')) queueEvent(this, 'scene-updated', this.ctx);
    }
}
