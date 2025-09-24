import { LoadAssetContainerAsync, type LoadAssetContainerOptions } from "@babylonjs/core/Loading/sceneLoader";
import type { AssetContainer } from "@babylonjs/core/assetContainer";
import type { Scene } from "@babylonjs/core/scene";
import "@babylonjs/loaders/glTF/2.0";
import { GLTFLoaderAnimationStartMode } from "@babylonjs/loaders/glTF/glTFFileLoader";


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

export async function LoadAssetsAsync(scene: Scene, url: string): Promise<AssetContainer> {
    return await LoadAssetContainerAsync(url, scene, LDOPTIONS); 
}
