
# Shader Replacement

![](./docs/image.png)

Utility for rendering a scene with a replacement shader. Similar to `Scene.overrideMaterial` but the uniforms of the original material uniforms are maintained.

[Demo Here](https://gkjohnson.github.io/threejs-sandbox/shader-replacement/)

**TODO**
- When running two replacements back to back it's nice to be able to cache the materials so you don't have to reset and iterate over every object every time.

# Use

```js
import { ShaderReplacement } from './src/ShaderReplacement.js';

// ...

const shader = ShaderLib.normal;
shader.defines.USE_NORMALMAP = '';
shader.defines.TANGENTSPACE_NORMALMAP = '';
shader.defines.USE_UV = '';

const shaderReplacement = new ShaderReplacement( ShaderLib.normal );
shaderReplacement.reploace( scene, true );
renderer.render( scene, camera );
shaderReplacement.reset( scene, true );
```

# API

## ShaderReplacement

### constructor

```js
constructor( shader : Shader )
```

### replace

```js
replace(
	scene : Scene | Array< Object3D >,
	recursive = false : Boolean,
	cacheMaterial = true : Boolean
) : void
```

### reset

```js
reset(
	scene : Scene | Array< Object3D >,
	recursive = false : Boolean,
	cacheMaterial = true : Boolean
) : void
```

### createMaterial

_overrideable_

```js
createMaterial( object : Object3D ) : Material | null
```

### updateUniforms

_overrideable_

```js
updateUniforms( object : Object3D, material : Material, target : ShaderMaterial ) : void
```
