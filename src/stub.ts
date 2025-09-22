import { ReactiveElement } from "lit";
import type { PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { consume} from "@lit/context";

import { debug, debugChanges } from "./utils/debug";

import { sceneCtx, type SceneCtx } from "./context";
import { assert, assertNonNull } from "./utils/asserts";


@customElement('my-stub')
export class MyStubElem extends ReactiveElement {
    @consume({ context: sceneCtx, subscribe: true })
    @state()
    ctx!: SceneCtx;

    _src!: string;
    get src(): string { return this._src!; }

    override connectedCallback(): void {
        super.connectedCallback();
        assert(this.hasAttribute('src'), `Property ${this.tagName}.src required`);
        this._src = this.getAttribute('src')!;
        assert(this.ctx, `The ${this.tagName} requires scene context under viewer`);
        this.#init();
    }

    override disconnectedCallback(): void {
        this.#dispose();
        super.disconnectedCallback()
    }

    #init() {
        debug(this, "init", this.src);
    }

    #dispose() {
    }
    
    override update(changes: PropertyValues) {
        super.update(changes);
        debugChanges(this, 'update', changes);
    }
}