
import { FullScreenQuad } from './FullScreenQuad.js';
import { Color, ShaderMaterial, MathUtils, Vector2, WebGLRenderTarget, NearestFilter } from '//unpkg.com/three@0.114.0/build/three.module.js';
import { CopyShader } from '//unpkg.com/three@0.114.0/examples/jsm/shaders/CopyShader.js';
import { sampleFunctions } from './mipSampleFunctions.js';

const _originalClearColor = new Color();
export class PackedMipmapGenerator {

	constructor( mipmapLogic ) {

		if ( ! mipmapLogic ) {

			mipmapLogic = /* glsl */`
				gl_FragColor =
					(
						sample00 +
						sample01 +
						sample10 +
						sample11
					) / 4.0;
				`;

		}

		const shader = {

			uniforms: {

				map: { value: null },
				parentLevel: { value: 0 },
				mapSize: { value: new Vector2() }

			},

			vertexShader: /* glsl */`
				varying vec2 vUv;
				void main() {

					#include <begin_vertex>
					#include <project_vertex>
					vUv = uv;

				}
			`,

			// TODO: validate the math here. Where does the center of the pixel sit relative
			// to the parent? What offset do we need to apply to point sample the parent pixel correctly?
			// TODO: Make the example texture also Power of Two before rendering it so it generates its own
			// mip maps automatically the same way we should be.
			fragmentShader: /* glsl */`
				varying vec2 vUv;
				uniform sampler2D map;
				uniform vec2 mapSize;
				uniform float parentLevel;

				${ sampleFunctions }

				void main() {

					vec2 pixelSize = 1.0 / mapSize;
					vec2 halfPixelSize = pixelSize / 2.0;

					vec2 baseUv = vUv;

					vec2 uv00 = baseUv;
					uv00.x -= halfPixelSize.x;
					uv00.y -= halfPixelSize.y;

					vec2 uv01 = baseUv;
					uv01.x -= halfPixelSize.x;
					uv01.y += halfPixelSize.y;

					vec2 uv10 = baseUv;
					uv10.x += halfPixelSize.x;
					uv10.y -= halfPixelSize.y;

					vec2 uv11 = baseUv;
					uv10.x += halfPixelSize.x;
					uv10.y += halfPixelSize.y;

					int level = int( parentLevel );
					vec4 sample00 = packedTexture2DLOD( map, uv00, level );
					vec4 sample01 = packedTexture2DLOD( map, uv01, level );
					vec4 sample10 = packedTexture2DLOD( map, uv10, level );
					vec4 sample11 = packedTexture2DLOD( map, uv11, level );

					${ mipmapLogic }

				}
			`

		};

		const swapTarget = new WebGLRenderTarget();
		swapTarget.texture.minFilter = NearestFilter;
		swapTarget.texture.magFilter = NearestFilter;

		this._swapTarget = swapTarget;
		this._copyQuad = new FullScreenQuad( new ShaderMaterial( CopyShader ) );
		this._mipQuad = new FullScreenQuad( new ShaderMaterial( shader ) );

	}

	update( texture, target, renderer ) {

		const originalAutoClear = renderer.autoClear;
		const originalClearAlpha = renderer.getClearAlpha();
		const originalRenderTarget = renderer.getRenderTarget();
		renderer.getClearColor( _originalClearColor );

		const copyQuad = this._copyQuad;
		const mipQuad = this._mipQuad;
		const swapTarget = this._swapTarget;

		// TODO: add option for ceil power of two and option to not power of two at all? This
		// causes the mip texels to not align, though...
		const width = MathUtils.floorPowerOfTwo( texture.image.width );
		const height = MathUtils.floorPowerOfTwo( texture.image.height );

		const targetWidth = width * 1.5;
		const targetHeight = height;

		// init the targets
		target.setSize( targetWidth, targetHeight );
		swapTarget.setSize( targetWidth, targetHeight );
		// NOTE: can't use copy here because it clones a texture and likely doesn't reinitialize
		// it if it has already been rendered with.



		// init the renderer
		renderer.autoClear = false;
		renderer.setClearColor( 0 );
		renderer.setClearAlpha();

		// write the first texture to the texture
		copyQuad.material.uniforms.tDiffuse.value = texture;
		copyQuad.camera.setViewOffset( width, height, 0, 0, targetWidth, targetHeight );

		renderer.setRenderTarget( target );
		renderer.clear();
		copyQuad.render( renderer );

		// TODO: can we avoid clearing?
		renderer.setRenderTarget( swapTarget );
		renderer.clear();
		copyQuad.render( renderer );

		let currWidth = width;
		let currHeight = height;
		let mip = 0;
		let heightOffset = 0;
		while ( currWidth > 1 && currHeight > 1 ) {

			renderer.setRenderTarget( target );
			mipQuad.material.uniforms.map.value = swapTarget.texture;
			mipQuad.material.uniforms.parentLevel.value = mip;
			mipQuad.material.uniforms.mapSize.value.set( currWidth, currHeight );

			currWidth /= 2;
			currHeight /= 2;

			mipQuad.camera.setViewOffset( currWidth, currHeight, - width, - heightOffset, targetWidth, targetHeight );
			mipQuad.render( renderer );

			// Copy the subframe to the scratch target
			renderer.setRenderTarget( swapTarget );
			copyQuad.material.uniforms.tDiffuse.value = target.texture;
			copyQuad.camera.setViewOffset( 1, 1, 0, 0, 1, 1 );
			copyQuad.render( renderer );

			mip ++;
			heightOffset += currHeight;

		}

		// Fill in the last pixel so the final color is used at all final mip maps
		renderer.setRenderTarget( target );
		mipQuad.camera.setViewOffset( currWidth, currHeight, - width, - heightOffset, targetWidth, targetHeight );
		mipQuad.render( renderer );

		renderer.setRenderTarget( originalRenderTarget );
		renderer.setClearAlpha( originalClearAlpha );
		renderer.setClearColor( _originalClearColor );
		renderer.autoClear = originalAutoClear;

		return mip + 1;

	}

	dispose() {

		this._swapTarget.dispose();
		this._mipQuad.dispose();
		this._copyQuad.dispose();

	}

}
