
import { FullScreenQuad } from './FullScreenQuad.js';
import { Color, ShaderMaterial, MathUtils, Vector2, WebGLRenderTarget } from '//unpkg.com/three@0.114.0/build/three.module.js';
import { CopyShader } from '//unpkg.com/three@0.114.0/examples/jsm/shaders/CopyShader.js';
import { sampleFunctions } from './mipSampleFunctions.js';

const _originalClearColor = new Color();
export class RenderTargetMipmapper {

	constructor( mipmapLogic ) {

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

			fragmentShader: /* glsl */`
				varying vec2 vUv;
				uniform sampler2D map;
				uniform vec2 mapSize;
				uniform float parentLevel;

				${ sampleFunctions }

				void main() {

					vec2 pixelSize = 1.0 / mapSize;
					vec2 halfPixelSize = pixelSize / 2.0;

					vec2 uv00 = vUv;
					uv00.x -= halfPixelSize.x;
					uv00.y -= halfPixelSize.y;

					vec2 uv01 = vUv;
					uv01.x -= halfPixelSize.x;
					uv01.y += halfPixelSize.y;

					vec2 uv10 = vUv;
					uv10.x += halfPixelSize.x;
					uv10.y -= halfPixelSize.y;

					vec2 uv11 = vUv;
					uv10.x += halfPixelSize.x;
					uv10.y += halfPixelSize.y;

					vec4 sample00 = packedTexture2DLOD( map, uv00, parentLevel );
					vec4 sample01 = packedTexture2DLOD( map, uv01, parentLevel );
					vec4 sample10 = packedTexture2DLOD( map, uv10, parentLevel );
					vec4 sample11 = packedTexture2DLOD( map, uv11, parentLevel );

					${ mipmapLogic }

				}
			`

		};

		this._fullScreenQuad = new FullScreenQuad( new ShaderMaterial( CopyShader ) );
		this._swapTarget = new WebGLRenderTarget();

	}

	update( texture, target, renderer ) {

		const originalAutoClear = renderer.autoClear;
		const originalClearAlpha = renderer.getClearAlpha();
		const originalRenderTarget = renderer.getRenderTarget();
		renderer.getClearColor( _originalClearColor );

		const fullScreenQuad = this._fullScreenQuad;
		const swapTarget = this._swapTarget;

		const width = MathUtils.floorPowerOfTwo( texture.image.width );
		const height = MathUtils.floorPowerOfTwo( texture.image.height );

		const targetWidth = width * 1.5;
		const targetHeight = height;

		target.setSize( targetWidth, targetHeight );
		swapTarget.copy( target );

		renderer.autoClear = false;
		renderer.setClearColor( 0 );
		renderer.setClearAlpha();
		renderer.setRenderTarget( target );
		renderer.clear();

		fullScreenQuad.material.uniforms.tDiffuse.value = texture;
		fullScreenQuad.camera.setViewOffset( width, height, 0, 0, targetWidth, targetHeight );
		fullScreenQuad.render( renderer );

		let currWidth = width;
		let currHeight = height;
		let mip = 0;
		let heightOffset = 0;
		while ( currWidth > 1 && currHeight > 1 ) {

			currWidth /= 2;
			currHeight /= 2;

			renderer.setRenderTarget( swapTarget );
			fullScreenQuad.material.uniforms.tDiffuse.value = target.texture;
			fullScreenQuad.camera.setViewOffset( 1, 1, 0, 0, 1, 1 );
			fullScreenQuad.render( renderer );

			// TODO: replace this with sampling of the parent mip of the swap buffer
			renderer.setRenderTarget( target );
			fullScreenQuad.material.uniforms.tDiffuse.value = texture;
			fullScreenQuad.camera.setViewOffset( currWidth, currHeight, - width, - heightOffset, targetWidth, targetHeight );
			fullScreenQuad.render( renderer );

			mip ++;
			heightOffset += currHeight;

		}

		// Fill in the last pixel so the final color is used at all final mip maps
		fullScreenQuad.camera.setViewOffset( currWidth, currHeight, - width, - heightOffset, targetWidth, targetHeight );
		fullScreenQuad.render( renderer );

		renderer.setRenderTarget( originalRenderTarget );
		renderer.setClearAlpha( originalClearAlpha );
		renderer.setClearColor( _originalClearColor );
		renderer.autoClear = originalAutoClear;

		return mip + 1;

	}

	dispose() {

		this._swapTarget.dispose();
		this._fullScreenQuad.dispose();

	}

}
