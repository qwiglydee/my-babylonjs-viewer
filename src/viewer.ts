import { provide } from "@lit/context";
import { css, html, ReactiveElement, render } from "lit";
import { customElement, query } from "lit/decorators.js";

import { Engine } from "@babylonjs/core/Engines/engine";
import type { EngineOptions } from "@babylonjs/core/Engines/thinEngine";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { Scene, type SceneOptions } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Vector3 } from "@babylonjs/core/Maths/math";

import { bubbleEvent } from "./utils/events";

import { assetsCtx, sceneCtx, type SceneCtx } from "./context";
import { MyLoadingScreen } from "./screen";
import { MyAssetManager } from "./assetmgr";
import { debug } from "./utils/debug";

const ENGOPTIONS: EngineOptions = {
    antialias: true,
    stencil: false,
}

const SCNOPTIONS: SceneOptions = {
}

const NULLBOUNDS = {
    min: Vector3.One().scale(-10),
    max: Vector3.One().scale(10),
}

@customElement('my-viewer')
export class MyViewerElement extends ReactiveElement {
    @query("canvas")
    canvas!: HTMLCanvasElement;

    @query('my-loading-screen')
    loadingScreen!: MyLoadingScreen;

    engine!: Engine;
    scene!: Scene;

    @provide({ context: sceneCtx })
    ctx!: SceneCtx;

    @provide({ context: assetsCtx })
    assetMgr!: MyAssetManager;

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
            <my-loading-screen hidden></my-loading-screen>
        `;
        render(innerhtml, this.renderRoot);
    }

    #resizingObs!: ResizeObserver;
    #visibilityObs!: IntersectionObserver;

    constructor() {
        super();
        this.#resizingObs = new ResizeObserver(
            () => { this._needresize = true; }
        );
        this.#visibilityObs = new IntersectionObserver(
            (entries) => {
                const visible = entries[0].isIntersecting; 
                if (visible) this.engine.runRenderLoop(this.#render); else this.engine.stopRenderLoop(this.#render);
            },
            { threshold: 0.5 }
        );
        this.addEventListener('model-updated', () => queueMicrotask(() => this.updateCtx()));
        this.addEventListener('part-updated', () => queueMicrotask(() => this.updateCtx()));
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
        this.engine.loadingScreen = this.loadingScreen;
        this.scene = new Scene(this.engine, SCNOPTIONS);
        this.scene.clearColor = Color4.FromHexString(getComputedStyle(this).getPropertyValue('--my-background-color'));
        this.assetMgr = new MyAssetManager(this.scene);
        this.assetMgr.onProgressObservable.add((count: number) => {
            this.loadingScreen.loadingUIText = `Loading ${count}...`;
            if (count) this.loadingScreen.displayLoadingUI(); else this.loadingScreen.hideLoadingUI();
        });
        this.updateCtx();
    }

    #dispose() {
        this.scene.dispose();
        this.engine.dispose();
    }

    _needresize: boolean = true;

    #render = () => {
        if (this._needresize) { this.engine.resize(); this._needresize = false; }
        this.scene.render();
    }

    _delayedEvent: any;
    updateCtx() {
        const meshes = this.scene.getMeshesByTags('model');
        this.ctx = {
            scene: this.scene,
            bounds: meshes.length ? Mesh.MinMax(meshes) : NULLBOUNDS,
            slots: this.scene.getTransformNodesByTags('slot').map(n => n.name),
        }
        debug(this, "CTX ====", {...this.ctx});
        // batch all cascading changes
        clearTimeout(this._delayedEvent);
        this._delayedEvent = setTimeout(() => bubbleEvent(this, "scene-updated", this.ctx), 17);
    }
}
