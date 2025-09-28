import { createContext } from "@lit/context";

import type { Scene } from "@babylonjs/core/scene";
import type { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import type { Vector3 } from "@babylonjs/core/Maths/math";

import type { MyModelManager } from "./assetmgr";


export interface Bounds {
    min: Vector3;
    max: Vector3;
}

export interface SceneCtx {
    scene: Scene;
    bounds: Bounds;
    slots: string[];
}

export const sceneCtx = createContext<SceneCtx>(Symbol('babylon-scene'));

export const assetsCtx = createContext<MyModelManager>(Symbol('babylon-loader'));

export interface EnvCtx {
    texture: CubeTexture;
}

export const envCtx = createContext<EnvCtx>(Symbol('babylon-env'));

export interface ModelDetail {
    enabled: boolean,
}

export type ModelEvent = CustomEvent<ModelDetail>;