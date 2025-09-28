import type { AssetContainer } from "@babylonjs/core/assetContainer";
import { LoadAssetContainerAsync, type LoadAssetContainerOptions } from "@babylonjs/core/Loading/sceneLoader.js";
import type { Scene } from "@babylonjs/core/scene";
import "@babylonjs/loaders/glTF/2.0"; // FIXME: discard unused extensions 
import { GLTFLoaderAnimationStartMode, type MaterialVariantsController } from "@babylonjs/loaders/glTF/glTFFileLoader";
import { Tools } from "@babylonjs/core/Misc/tools";

import { Model } from "./model";


export async function LoadModel(url: string, scene: Scene): Promise<Model> {
    const model = new Model(scene, Tools.GetFilename(url));

    const options: LoadAssetContainerOptions = {
        pluginOptions: {
            gltf: {
                enabled: true,
                animationStartMode: GLTFLoaderAnimationStartMode.NONE,
                loadAllMaterials: true,
                extensionOptions: {
                    KHR_materials_variants: {
                        enabled: true,
                        onLoaded: (ctrl: MaterialVariantsController) => model.materialCtrl = ctrl
                    }
                }
            }
        }
    }

    const assets: AssetContainer = await LoadAssetContainerAsync(url, scene, options);
    model.meshes = assets.meshes;
    model.animations = assets.animations;
    model.animationGroups = assets.animationGroups;
    model.geometries = assets.geometries;
    model.transformNodes = assets.transformNodes;
    model.multiMaterials = assets.multiMaterials;
    model.materials = assets.materials;
    model.textures = assets.textures;
    model.populateRootNodes();

    return model;
}
