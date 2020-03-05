# Shader Replacement

# Use

```js
import { ShaderReplacement } from './src/ShaderReplacement.js';

```

# API

## ShaderReplacement

### constructor

```js
constructor( shader : Shader | Material )
```

### replace

```js
replace( scene : Scene || Array< Object3D > ) : void
```

### reset

```js
reset() : void
```

### createMaterial

_overrideable_

```js
createMaterial( object : Object3D ) : Material | null
```

### updateUniforms

_overrideable_

```js
updateUniforms( object, target ) : void
```
