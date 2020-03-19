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

### .line

### .column

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

### .update

```js
update() : void
```

## ShaderDebugRenderer

_extends WebGLRenderer_

### .shaderDebugger.enable

```js
enabled = false : Boolean
```

### .shaderDebugger.material

```js
debugMaterial = null : ShaderMaterial
```

### .shaderDebugger.onlyIfPresent

```js
onlyIfPresent = true : Boolean
```

### .shaderDebugger.renderDepthPass

```js
renderDepthPass = true : Boolean
```

