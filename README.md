# My Babylonjs 3d viewer

My personal implementation of 3d viewer for web pages.

Only GLTF.

## Features

- Loading and combining multiple models
- Switching material variants
- Switching internal and combined parts
- Playing onToush animations

## API

Pure HTML/DOM API

```html
    <my-viewer>
        <my-camera autospin autozoomFactor="..."></my-camera>
        <my-environ src="something.env" intensity="...">
            <my-sky intensity="..." blurring="..."></my-sky>
            <my-ground size="..." autosizeFactor="..."></my-ground>
        </my-environ>
        <my-model src="basemodel.glb" skin="material_variant" selected></my-model>
        <my-model src="partmodel1.glb" anchor="somenode"></my-model>
        <my-part target="somemesh"></my-part>
        <div slot="overlay">
            some stuff
        </div>
    </my-viewer>
```

