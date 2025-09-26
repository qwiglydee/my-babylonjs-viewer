import { LoadAssetContainerAsync, type LoadAssetContainerOptions } from "@babylonjs/core/Loading/sceneLoader";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { deepMerge } from "@babylonjs/core/Misc/deepMerger";
import { Tags } from "@babylonjs/core/Misc/tags";
import { AssetContainer } from "@babylonjs/core/assetContainer";
import type { Scene } from "@babylonjs/core/scene";
import type { Nullable } from "@babylonjs/core/types";
import "@babylonjs/loaders/glTF/2.0";
import { GLTFLoaderAnimationStartMode, type MaterialVariantsController } from "@babylonjs/loaders/glTF/glTFFileLoader";
import { assert } from "./utils/asserts";
import { Observable } from "@babylonjs/core/Misc/observable";


const LDOPTIONS: LoadAssetContainerOptions = {
    pluginOptions: {
        gltf: {
            enabled: true,
            animationStartMode: GLTFLoaderAnimationStartMode.NONE,
            loadAllMaterials: true,
            extensionOptions: {
                KHR_materials_variants: {
                    enabled: true
                }
            }
        }
    }
};

export interface Model {
    url: string;
    assets: AssetContainer;
    root: TransformNode;
    matCtrl: MaterialVariantsController;
}

export interface ModelAttached {
    model: Model;
    attached: boolean;
}

const NULLSKINS: MaterialVariantsController = {
    variants: [],
    selectedVariant: "",
}


export class MyAssetManager {
    _scene: Scene;

    onAttachingObservable: Observable<ModelAttached>;
    onLoadedObservable: Observable<Model>;
    onProgressObservable: Observable<number>;

    constructor(scene: Scene) {
        this._scene = scene;
        this.onAttachingObservable = new Observable<ModelAttached>();
        this.onLoadedObservable = new Observable<Model>();
        this.onProgressObservable = new Observable<number>();
    }

    _running: number = 0;
    get running(): number {
        return this._running;
    }
    set running(val: number) {
        this._running = val;
        this.onProgressObservable.notifyObservers(this._running);
    }

    async loadModel(url: string): Promise<Model> {
        let assets: AssetContainer;
        let root: TransformNode;
        let matCtrl = NULLSKINS;
        const auxoptions: LoadAssetContainerOptions = {
            pluginOptions: {
                gltf: {
                    extensionOptions: {
                        KHR_materials_variants: {
                            onLoaded: (ctrl) => matCtrl = ctrl,
                        }
                    }
                }
            }
        }
        const options = deepMerge(LDOPTIONS, auxoptions);
        try {
            this.running += 1;
            assets = await LoadAssetContainerAsync(url, this._scene, options);
            assert(assets.rootNodes.length == 1, "Expected single root node");
            root = assets.rootNodes[0] as TransformNode;
            assets.meshes.forEach(m => {
                m.id = `${url}#${m.name}`;
                Tags.AddTagsTo(m, "model")
            });
            assets.transformNodes.forEach(n => {
                n.id = `${url}#${n.name}`;
                Tags.AddTagsTo(n, "slot")
            });
            const model = { url, assets, root, matCtrl };
            this.onLoadedObservable.notifyObservers(model);
            return model;
        } finally {
            this.running -= 1;
        }
    }

    attachModel(model: Model, node: Nullable<TransformNode> = null) {
        console.debug("attaching", model.url, "->", node?.id);
        model.assets.addAllToScene(); // expecting no effect if already added
        model.root.parent = node;
        this.onAttachingObservable.notifyObservers({ model, attached: true });
    }

    detachModel(model: Model) {
        console.debug("detaching", model.url);
        model.root.parent = null;
        model.assets.removeAllFromScene();
        this.onAttachingObservable.notifyObservers({ model, attached: false });
    }

    orphanAttachments(parent: Model) {
        parent.assets.getTransformNodesByTags('slot').forEach(n => {
            n.getChildren().filter(n => !n.id.startsWith(parent.url)).forEach(n => {
                console.debug("orphaning", n.id, " -> ", n.parent?.id);
                n.parent = null;
            })
        });
    }
}