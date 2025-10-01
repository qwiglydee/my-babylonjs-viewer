import { provide } from "@lit/context";
import { css, html, ReactiveElement, render, type PropertyValues } from "lit";
import { customElement, query, state } from "lit/decorators.js";

import { Engine } from "@babylonjs/core/Engines/engine";
import type { EngineOptions } from "@babylonjs/core/Engines/thinEngine";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { Scene, type SceneOptions } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { Tags } from "@babylonjs/core/Misc/tags";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import type { PickingInfo } from "@babylonjs/core/Collisions/pickingInfo";

import { bubbleEvent } from "./utils/events";

import { assetsCtx, pickingCtx, sceneCtx, type SceneCtx } from "./context";
import { MyLoadingScreen } from "./screen";
import { MyModelManager } from "./assetmgr";
import type { Model } from "./gltf/model";
import { debug } from "./utils/debug";
import type { Nullable } from "@babylonjs/core/types";

const ENGOPTIONS: EngineOptions = {
    antialias: true,
    stencil: false,
    doNotHandleContextLost: true,
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
    modelMgr!: MyModelManager;

    @provide({ context: pickingCtx })
    pick!: Nullable<PickingInfo>;

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
        this.addEventListener('model-updated', (_ev: Event) => {
            // debug(this, "CTX ~= ", { id: ev.target!.id });
            this._updating_ctx = true;
        });
        this.addEventListener('part-updated', (_ev: Event) => {
            // debug(this, "CTX ~= ", { id: ev.target!.id });
            this._updating_ctx = true;
        });
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
        this.modelMgr = new MyModelManager(this.scene);
        this.modelMgr.onLoadingObservable.add((count: number) => {
            this.engine.loadingUIText = `Loading ${count}`;
            if (count) this.engine.displayLoadingUI(); else this.engine.hideLoadingUI();
        });
        this.modelMgr.onLoadedObservable.add((model: Model) => {
            // debug(this, 'loaded', { id: model.id });
            model.meshes.forEach(m => Tags.AddTagsTo(m, "model"));
            model.transformNodes.forEach(n => Tags.AddTagsTo(n, "slot"));            
        });
        // this.modelMgr.onAttachingObservable.add((model: Model) => {
        //     debug(this, model.attached ? 'attached' : 'detached', { id: model.id });
        // });

        this.scene.onPointerObservable.add((info) => {
            if (info.type == PointerEventTypes.POINTERTAP) this.pick = info.pickInfo;
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

    @state() _updating_ctx = false;

    override update(changes: PropertyValues) {
        if (changes.has('_updating_ctx') && this._updating_ctx) {
            // postponded update to catch all changes in a frame 
            this._updating_ctx = false;
            this.updateCtx();
        }
        super.update(changes);
    }

    _delayedEvent: any;
    updateCtx() {
        const meshes = this.scene.getMeshesByTags('model');
        this.ctx = {
            scene: this.scene,
            bounds: meshes.length ? Mesh.MinMax(meshes) : NULLBOUNDS,
            slots: this.scene.getTransformNodesByTags('slot').map(n => n.name),
        }
        debug(this, `CTX ==`, {...this.ctx});

        // batch all cascading changes
        clearTimeout(this._delayedEvent);
        this._delayedEvent = setTimeout(() => bubbleEvent(this, "scene-updated", this.ctx), 17);
    }
}
