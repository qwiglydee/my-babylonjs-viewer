import type { Scene } from "@babylonjs/core/scene";


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