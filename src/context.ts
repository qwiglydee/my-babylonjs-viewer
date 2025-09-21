import { createContext } from "@lit/context";

import type { Scene } from "@babylonjs/core/scene";
import type { Vector3 } from "@babylonjs/core/Maths/math";

export interface SceneCtx {
    scene: Scene,
    bounds: { min: Vector3, max: Vector3};
}

export const sceneCtx = createContext<SceneCtx>(Symbol('babylon-scene'));
