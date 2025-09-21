import { ReactiveElement } from "lit";
import type { PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { consume} from "@lit/context";

import { debugChanges } from "./utils/debug";

import { sceneCtx, type SceneCtx } from "./context";


@customElement('my-stub')
export class MyStubElem extends ReactiveElement {
    @consume({ context: sceneCtx, subscribe: true })
    @state()
    ctx!: SceneCtx;

    override update(changes: PropertyValues) {
        super.update(changes);
        debugChanges(this, 'update', changes);
    }
}