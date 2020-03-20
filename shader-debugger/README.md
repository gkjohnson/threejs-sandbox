# Shader Debugger

A shade debug renderer intended to help with understanding and reading data from shaders.

# Use

```js
import { ShaderDebugRenderer } from './src/ShaderDebugRenderer.js';

const debugMaterial = new DebugShaderMaterial( material );
const renderer = new ShaderDebugRenderer();
const shaderDebugger = renderer.shaderDebugger;
shaderDebugger.enable = true;
shaderDebugger.material = debugMaterial;

debugMaterial.setVariable( statment, line, column, typeOverride, condition );
debugMaterial.readValue( xPixel, yPixel );
```

# API

## Definition

### .index

### .name

### .type

## DebugShaderMaterial

### .fragmentDefinitions
### .vertexDefinitions

```js
{
	varyings: Array<Definition>,
	uniforms: Array<Definition>,
	attributes: Array<Definition>,
	localVariables: Array<Definition>,
}
```

### .updateDefinitions

```js
updateupdateDefinitions() : void
```

### .setVertexOutputVariable

```js
setVertexOutputVariable(
	name : String,
	type : String,
	index = null : Number,
	condition = null : String
) : void
```

### .setFragmentOutputVariable

```js
setFragmentOutputVariable(
	name : String,
	type : String,
	index = null : Number,
	condition = null : String
) : void
```

### .clearOutputVariable

```js
clearOutputVariable() : void
```

### .reset

```js
reset() : void
```

## ShaderDebugRenderer

_extends WebGLRenderer_

### .enableShaderDebugger

```js
enabled = false : Boolean
```

### .debugMaterial

```js
debugMaterial = null : ShaderMaterial
```
