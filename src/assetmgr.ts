import type { Scene } from "@babylonjs/core/scene";
import type { Nullable } from "@babylonjs/core/types";
import { Observable } from "@babylonjs/core/Misc/observable";
import { Model } from "./gltf/model";
import { LoadModel, ImportModel } from "./gltf/loader";
import { assertNonNull } from "./utils/asserts";


export class MyModelManager {
    _scene: Scene;

    onLoadingObservable: Observable<number>;
    onLoadedObservable: Observable<Model>;
    onAttachingObservable: Observable<Model>;

    constructor(scene: Scene) {
        this._scene = scene;
        this.onLoadingObservable = new Observable<number>();
        this.onLoadedObservable = new Observable<Model>();
        this.onAttachingObservable = new Observable<Model>();
    }

    _loadingCount: number = 0;
    get loadingCount(): number {
        return this._loadingCount;
    }
    set loadingCount(val: number) {
        this._loadingCount = val;
        this.onLoadingObservable.notifyObservers(this._loadingCount);
    }

    async loadModel(url: string): Promise<Model> {
        try {
            this.loadingCount += 1;
            const model = await LoadModel(url, this._scene);
            this.onLoadedObservable.notifyObservers(model);
            return model;
        } finally {
            this.loadingCount -= 1;
        }
    }

    async importModel(url: string): Promise<void> {
        try {
            this.loadingCount += 1;
            const model = await ImportModel(url, this._scene);
            this.onLoadedObservable.notifyObservers(model);
        } finally {
            this.loadingCount -= 1;
        }
    }


    attachModel(model: Model, anchor: Nullable<string> = null) {
        let parent = null;
        if (anchor) {
            parent = this._scene.getTransformNodeByName(anchor);
            assertNonNull(parent, `Missing attachment anchor: ${anchor}`)
        }
        model.attach(parent);
        this.onAttachingObservable.notifyObservers(model);
    }

    detachModel(model: Model) {
        model.detach();
        this.onAttachingObservable.notifyObservers(model)
    }
}