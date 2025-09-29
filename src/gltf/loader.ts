import type { Scene } from "@babylonjs/core/scene";
// import "@babylonjs/loaders/glTF/2.0"; // FIXME: discard unused extensions 
import "@babylonjs/loaders/glTF/2.0/glTFLoader.js";
import "@babylonjs/loaders/glTF/2.0/glTFLoaderExtension.js";
import "@babylonjs/loaders/glTF/2.0/glTFLoaderExtensionRegistry.js";
import "@babylonjs/loaders/glTF/2.0/glTFLoaderInterfaces.js";
import "@babylonjs/loaders/glTF/2.0/glTFLoaderAnimation.js";

// import "@babylonjs/loaders/glTF/2.0/Extensions/KHR_draco_mesh_compression.js";
// import "@babylonjs/loaders/glTF/2.0/Extensions/KHR_materials_pbrSpecularGlossiness.js";
// import "@babylonjs/loaders/glTF/2.0/Extensions/KHR_materials_unlit.js";
// import "@babylonjs/loaders/glTF/2.0/Extensions/KHR_materials_clearcoat.js";
// import "@babylonjs/loaders/glTF/2.0/Extensions/KHR_materials_iridescence.js";
// import "@babylonjs/loaders/glTF/2.0/Extensions/KHR_materials_anisotropy.js";
// import "@babylonjs/loaders/glTF/2.0/Extensions/KHR_materials_emissive_strength.js";
// import "@babylonjs/loaders/glTF/2.0/Extensions/KHR_materials_sheen.js";
// import "@babylonjs/loaders/glTF/2.0/Extensions/KHR_materials_specular.js";
// import "@babylonjs/loaders/glTF/2.0/Extensions/KHR_materials_ior.js";
import "@babylonjs/loaders/glTF/2.0/Extensions/KHR_materials_variants.js";
// import "@babylonjs/loaders/glTF/2.0/Extensions/KHR_materials_transmission.js";
// import "@babylonjs/loaders/glTF/2.0/Extensions/KHR_materials_diffuse_transmission.js";
// import "@babylonjs/loaders/glTF/2.0/Extensions/KHR_materials_volume.js";
// import "@babylonjs/loaders/glTF/2.0/Extensions/KHR_materials_dispersion.js";
// import "@babylonjs/loaders/glTF/2.0/Extensions/EXT_materials_diffuse_roughness.js";
import "@babylonjs/loaders/glTF/2.0/Extensions/KHR_animation_pointer.js";
import "@babylonjs/loaders/glTF/2.0/Extensions/KHR_interactivity.js";
import "@babylonjs/loaders/glTF/2.0/Extensions/KHR_node_visibility.js";
import "@babylonjs/loaders/glTF/2.0/Extensions/KHR_node_selectability.js";
import "@babylonjs/loaders/glTF/2.0/Extensions/KHR_node_hoverability.js";
import "@babylonjs/loaders/glTF/2.0/Extensions/KHR_interactivity/index.js";




import { GLTFFileLoader, GLTFLoaderAnimationStartMode, type IGLTFLoaderData, type MaterialVariantsController } from "@babylonjs/loaders/glTF/glTFFileLoader";
import { Tools } from "@babylonjs/core/Misc/tools";

import { Model } from "./model";
import { deepMerge } from "@babylonjs/core/Misc/deepMerger.js";


const LDOPTIONS: Partial<GLTFFileLoader> = {
    animationStartMode: GLTFLoaderAnimationStartMode.NONE,
    loadAllMaterials: true,
    compileMaterials: true,
    loggingEnabled: true
}


export async function LoadModel(url: string, scene: Scene): Promise<Model> {
    const rooturl = Tools.GetFolderPath(url);
    const filename = Tools.GetFilename(url);
    const model = new Model(scene, filename);

    const options = deepMerge(LDOPTIONS, {
        extensionOptions: {
            KHR_materials_variants: {
                enabled: true,
                onLoaded: (ctrl: MaterialVariantsController) => model.materialCtrl = ctrl
            },
            KHR_interactivity: {
                enabled: true,
            }
        },
    });
    const loader = new GLTFFileLoader(options);

    const loading = new Promise((resolve, reject) => loader.loadFile(scene, url, rooturl, resolve, undefined, true, reject));
    const data = (await loading) as IGLTFLoaderData;
    const assets = await loader.loadAssetContainerAsync(scene, data, rooturl, undefined, filename);
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

export async function ImportModel(url: string, scene: Scene): Promise<Model> {
    const rooturl = Tools.GetFolderPath(url);
    const filename = Tools.GetFilename(url);
    const fakemodel = new Model(scene, filename);

    const loader = new GLTFFileLoader(LDOPTIONS);
    const loading = new Promise((resolve, reject) => loader.loadFile(scene, url, rooturl, resolve, undefined, true, reject));
    const data = (await loading) as IGLTFLoaderData;
    await loader.loadAsync(scene, data, rooturl, undefined, filename);
    return fakemodel;
}