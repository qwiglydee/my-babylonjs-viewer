import { AbstractAssetContainer, type AssetContainer } from "@babylonjs/core/assetContainer";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Nullable } from "@babylonjs/core/types";

import { assert, assertNonNull } from "../utils/asserts";
import type { MaterialVariantsController } from "@babylonjs/loaders/glTF/2.0";
import type { Scene } from "@babylonjs/core/scene";
import type { InteractivityController } from "./KHR_interactivity";
import type { FlowGraphCoordinator } from "@babylonjs/core/FlowGraph/flowGraphCoordinator";


export interface ModelNode {
    name: string;
    id: string;
}

/**
 * Subset of stuff:
 * - meshes
 * - animations
 * - animationGroups
 * - geometries
 * - transformNodes
 * - multiMaterials
 * - materials
 * - textures 
 * 
 * Additionally:
 * - matrtialCtrl
 * 
 */
export class Model extends AbstractAssetContainer {
    scene: Scene;
    id: string;

    materialCtrl?: MaterialVariantsController;
    
    _attached: boolean = false;
    get attached() { return this._attached; }

    rootNode: Nullable<TransformNode> = null; // the only one
    get anchored() { return this.rootNode?.parent != null; }
    get anchor() { return this.rootNode?.parent; }

    constructor(scene: Scene, id: string) {
        super();
        this.id = id;
        this.scene = scene;

        scene.onDisposeObservable.add(() => {
            if (!this.anchored) {
                this.dispose();
            }
        });

        // TODO maybe: on context lost & not attached => unload maybe
    }

    populateRootNodes() {
        this.rootNodes = this.getNodes().filter(n => !n.parent);
        assert(this.rootNodes.length == 1 && this.rootNodes[0] instanceof TransformNode, `${this.id}: Expected single root node in container`);
        this.rootNode = this.rootNodes[0]; 
    }

    static nodeId(model: Model, node: ModelNode) {
        return `${model.id}#${node.name}`;
    }

    static modelId(node: ModelNode) {
        return node.id.slice(0, node.id.indexOf('#'));
    }

    populateIds() {
        const markid = (node: ModelNode) => node.id = Model.nodeId(this, node);
        this.meshes.forEach(markid);
        this.transformNodes.forEach(markid);
    }

    includesNode(node: ModelNode) {
        return node.id.startsWith(this.id);
    }

    async attach(anchor: Nullable<TransformNode> = null) {
        assertNonNull(this.rootNode);
        this.rootNode.parent = anchor;

        if (!this._attached) {
            this.meshes.forEach(o => this.scene.addMesh(o));
            this.animations.forEach(o => this.scene.addAnimation(o));
            this.animationGroups.forEach(o => this.scene.addAnimationGroup(o));
            this.geometries.forEach(o => this.scene.addGeometry(o));
            this.transformNodes.forEach(o => this.scene.addTransformNode(o));
            this.multiMaterials.forEach(o => this.scene.addMultiMaterial(o));
            this.materials.forEach(o => this.scene.addMaterial(o));
            this.textures.forEach(o => this.scene.addTexture(o));
        }
        this._attached = true;
    }

    detach() {
        assertNonNull(this.rootNode);
        this.rootNode.parent = null;

        if (this._attached) {
            this.meshes.forEach(o => this.scene.removeMesh(o));
            this.animations.forEach(o => this.scene.removeAnimation(o));
            this.animationGroups.forEach(o => this.scene.removeAnimationGroup(o));
            this.geometries.forEach(o => this.scene.removeGeometry(o));
            this.transformNodes.forEach(o => this.scene.removeTransformNode(o));
            this.multiMaterials.forEach(o => this.scene.removeMultiMaterial(o));
            this.materials.forEach(o => this.scene.removeMaterial(o));
            this.textures.forEach(o => this.scene.removeTexture(o));
        }
        this._attached = false;
    }

    dispose() {
        this.meshes.forEach(o => o.dispose()); this.meshes.length = 0;
        this.animations.length = 0;
        this.animationGroups.forEach(o => o.dispose()); this.animationGroups.length = 0;
        this.geometries.forEach(o => o.dispose()); this.geometries.length = 0;
        this.transformNodes.forEach(o => o.dispose()); this.transformNodes.length = 0;
        this.multiMaterials.forEach(o => o.dispose()); this.multiMaterials.length = 0;
        this.materials.forEach(o => o.dispose()); this.materials.length = 0;
        this.textures.forEach(o => o.dispose()); this.textures.length = 0;
    }
}
