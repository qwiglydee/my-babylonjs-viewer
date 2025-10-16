import { provide } from "@lit/context";
import { css, html, ReactiveElement, render, type PropertyValues } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";

import type { PickingInfo } from "@babylonjs/core/Collisions/pickingInfo";
import { Engine } from "@babylonjs/core/Engines/engine";
import type { EngineOptions } from "@babylonjs/core/Engines/thinEngine";
import { PointerEventTypes, PointerInfo } from "@babylonjs/core/Events/pointerEvents";
import "@babylonjs/core/Layers/effectLayerSceneComponent";
import { Color4 } from "@babylonjs/core/Maths";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { UtilityLayerRenderer } from "@babylonjs/core/Rendering/utilityLayerRenderer";
import type { Nullable } from "@babylonjs/core/types";

import type { Scene } from "@babylonjs/core/scene";
import { pickCtx, sceneCtx, utilsCtx, type PickDetail, type SceneCtx } from "./context";
import { MyScene } from "./scene";
import { assertNonNull } from "./utils/asserts";
import { debug } from "./utils/debug";
import { bubbleEvent } from "./utils/events";

const ENGOPTIONS: EngineOptions = {
    antialias: true,
    stencil: true,
    doNotHandleContextLost: true,
};


@customElement("my-viewer")
export class MyViewerElem extends ReactiveElement {
    @provide({ context: sceneCtx })
    ctx: Nullable<SceneCtx> = null; // updated when changed and got ready 

    @provide({ context: utilsCtx })
    utils!: Scene; // utilityrender scene, available right after dom connection, const

    @provide({ context: pickCtx })
    pick: Nullable<PickingInfo> = null;

    @property({ type: Boolean })
    rightHanded = false;

    @property({ type: Number })
    worldSize = 100;

    static override styles = css`
        :host {
            display: block;
            position: relative;
            background-color: var(--my-background-color, #808080);
        }

        canvas {
            display: block;
            position: absolute;
            width: 100%;
            height: 100%;
            z-index: 0;
        }

        slot[name="overlay"] {
            position: absolute;
            display: block;
            width: 100%;
            height: 100%;
            z-index: 1;
            pointer-events: none;
        }
    `;

    /* single-shot rendering, not updating */
    #renderHTML() {
        render(
            html`
                <canvas></canvas>
                <slot name="overlay" class="overlay"></slot>
            `,
            this.renderRoot
        );
    }

    @query('canvas')
    canvas!: HTMLCanvasElement;
    engine!: Engine;

    scene!: MyScene;

    #needresize = true;
    #resizingObs!: ResizeObserver;
    #visibilityObs!: IntersectionObserver;

    constructor() {
        super();
        this.#resizingObs = new ResizeObserver(() => {
            this.#needresize = true;
        });
        this.#visibilityObs = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) this.#startRendering();
                else this.#stopRendering();
            },
            { threshold: 0.5 }
        );
    }

    #startRendering() {
        this.scene.activeCamera?.setEnabled(true);
        this.engine.runRenderLoop(this.#rendering);
    }

    #stopRendering() {
        this.engine.stopRenderLoop(this.#rendering);
        this.scene.activeCamera?.setEnabled(false);
    }

    #rendering = () => {
        if (this.#needresize) {
            this.engine.resize();
            this.#needresize = false;
        }
        if (this.scene.activeCamera) {
            this.scene.render();        
        }
    };

    @state()
    _ctx_dirty = true;

    #invalidateCtx() {
        this._ctx_dirty = true;
    }

    /** this notifies all plugged in subscribers */
    async #refreshCtx() {
        if (!this._ctx_dirty) return;
        await this.scene.whenReadyAsync(true);
        this.ctx = {
            worldSize: this.worldSize,
            scene: this.scene,
            bounds: this.scene.getModelExtends(),
        };
        this._ctx_dirty = false;
        // debug(this, `CTX ==`, this.ctx);
        bubbleEvent(this, "babylon.updated", {});
    }

    override connectedCallback(): void {
        super.connectedCallback();
        this.#renderHTML();
        this.#init();
        this.#initPicking();
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
        this.engine.resize();
        this.scene = new MyScene(this.engine);
        this.scene.useRightHandedSystem = this.rightHanded;
        this.scene.clearColor = Color4.FromHexString(getComputedStyle(this).getPropertyValue("--my-background-color"));

        this.utils = (new UtilityLayerRenderer(this.scene, false, false)).utilityLayerScene;

        this.scene.onModelUpdatedObservable.add(() => this.#invalidateCtx());
        this.#refreshCtx();
    }

    #initPicking() {
        this.scene.onPointerObservable.add((info: PointerInfo) => {
            if (info.type == PointerEventTypes.POINTERTAP) {
                if (info.pickInfo?.pickedMesh) this.onpick(info.pickInfo);
                else this.unpick();
            }
        });
    }

    #dispose() {
        this.scene.dispose();
        this.engine.dispose();
    }

    override update(changes: PropertyValues) {
        if (changes.has("_ctx_dirty")) this.#refreshCtx();
        super.update(changes);
    }

    _selected: Nullable<Mesh> = null;

    onpick(pickinfo: PickingInfo) {
        this.pick = pickinfo;
        if (this._selected === this.pick.pickedMesh) return;
        assertNonNull(this.pick.pickedMesh);
             
        this._selected = this.pick.pickedMesh as Mesh; 

        bubbleEvent<PickDetail>(this, "babylon.picked", { state: "picked", mesh: this._selected.id });
    }

    unpick() {
        this._selected = null;
        this.pick = null;
        bubbleEvent<PickDetail>(this, "babylon.picked", { mesh: null });
    }
}
