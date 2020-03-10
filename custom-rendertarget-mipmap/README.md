# Custom Render Target Mip Mapp Generation

# Use

```js
import { RenderTargetMipmapper } from './src/RenderTargetMipmapper.js';

// ...

const mipmapper = new RenderTargetMipMapper(
	`
	gl_FragColor = (
		samples[0][0] + samples[0][1] + samples[1][0] + samples[1][1]
	) / 4.0;
	`
);

mipmapper.update( texture, target, renderer );
mipmapper.dispose();
```

# API

## RenderTargetMipmapper

### constructor

```js
constructor( logic : string )
```

Takes a block of code to generate the next mip level. Must set the `gl_FragColor`. An matrix of the parent sibling values is available in the `samples` variable.

### .update
```js
update( texture : Texture, target : WebGLRenderTarget, renderer : WebGLRenderer ) : Number
```

Takes a texture to turn into a mip pyramid, a target to to render the pyramid into, and a rendeer to render with. Returns the number of mips generated.

### .dispose
```js
dispose() : void
```

Disposes of any created context objects.
