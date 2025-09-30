import "@babylonjs/core/Culling/"; // indirectly required by interactivity
// export * from "@babylonjs/loaders/glTF/2.0"; // FIXME: discard unused extensions 

import "@babylonjs/loaders/glTF/2.0/glTFLoader.js";
import "@babylonjs/loaders/glTF/2.0/glTFLoaderExtension.js";
import "@babylonjs/loaders/glTF/2.0/glTFLoaderExtensionRegistry.js";
import "@babylonjs/loaders/glTF/2.0/glTFLoaderInterfaces.js";
import "@babylonjs/loaders/glTF/2.0/glTFLoaderAnimation.js";

import "@babylonjs/loaders/glTF/2.0/Extensions/objectModelMapping.js";
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
// import "@babylonjs/loaders/glTF/2.0/Extensions/KHR_node_visibility.js";
// import "@babylonjs/loaders/glTF/2.0/Extensions/KHR_node_selectability.js";
// import "@babylonjs/loaders/glTF/2.0/Extensions/KHR_node_hoverability.js";

// import "@babylonjs/loaders/glTF/2.0/Extensions/KHR_interactivity.js";
// import "@babylonjs/loaders/glTF/2.0/Extensions/KHR_interactivity/index.js";


import "./loader.ts";
import "./model.ts";