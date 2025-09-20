import { css, html, ReactiveElement, render } from "lit";
import type { PropertyValues } from "lit";
import { customElement, property, query } from "lit/decorators.js";

import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { debug, debugChanges } from "./utils/debug";

@customElement('my-element')
export class MyElement extends ReactiveElement {
    @property()
    foo: string = "Foo";

    override connectedCallback(): void {
        super.connectedCallback();
        this.#renderHTML();
        this.#setup();
        debug(this, "connected", { foo: this.foo });
    }

    override disconnectedCallback(): void {
        this.#dispose();
        super.disconnectedCallback();
    }

    static override styles = css`
        :host {
            display: block;
            position: relative;
        }

        canvas {
            display: block;
            position: absolute;
            width: 100%;
            height: 100%;
        }
    `

    #renderHTML() {
        const innerHTML = html`
            <canvas></canvas>
        `;
        render(innerHTML, this.renderRoot);
    }

    @query("canvas")
    canvas!: HTMLCanvasElement;

    engine!: Engine;
    scene!: Scene;

    #setup() {
        this.engine = new Engine(this.canvas);
        this.scene = new Scene(this.engine);
    }

    #dispose() {
        this.scene.dispose();
    }

    override update(changes: PropertyValues) {
        super.update(changes);
        debugChanges(this, 'update', changes);
    }
}