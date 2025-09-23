import { createContext } from "@lit/context";

import type { Scene } from "@babylonjs/core/scene";
import type { Vector3 } from "@babylonjs/core/Maths/math";
import type { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";

export interface Bounds {
    min: Vector3;
    max: Vector3;
}

export interface SceneCtx {
    scene: Scene;
    bounds: Bounds;
}

export const sceneCtx = createContext<SceneCtx>(Symbol('babylon-scene'));


export interface EnvCtx {
    texture: CubeTexture;
}

export const envCtx = createContext<EnvCtx>(Symbol('babylon-env'));
