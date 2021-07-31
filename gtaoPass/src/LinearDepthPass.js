import { ShaderLib, FrontSide, BackSide } from '//cdn.skypack.dev/three@0.130.1/build/three.module.js';
import { ShaderReplacement } from '../../shader-replacement/src/ShaderReplacement.js';

export class LinearDepthPass extends ShaderReplacement {

	constructor() {

		super( {
			extensions: {
				derivatives: true
			},
			defines: {
				USE_UV: ''
			},
			uniforms: {
				...ShaderLib.normal.uniforms,
				alphaMap: { value: null },
				alphaTest: { value: 0 },
				map: { value: null },
				opacity: { value: 1.0 }
			},
			vertexShader: /* glsl */`
				varying vec3 vViewPosition;
				#include <common>
				#include <uv_pars_vertex>
				#include <displacementmap_pars_vertex>
				#include <morphtarget_pars_vertex>
				#include <skinning_pars_vertex>
				#include <logdepthbuf_pars_vertex>
				#include <clipping_planes_pars_vertex>
				void main() {
					#include <uv_vertex>
					#include <beginnormal_vertex>
					#include <morphnormal_vertex>
					#include <skinbase_vertex>
					#include <skinnormal_vertex>
					#include <defaultnormal_vertex>
					#include <begin_vertex>
					#include <morphtarget_vertex>
					#include <skinning_vertex>
					#include <displacementmap_vertex>
					#include <project_vertex>
					#include <logdepthbuf_vertex>
					#include <clipping_planes_vertex>
					vViewPosition = mvPosition.xyz;
				}
			`,
			fragmentShader: /* glsl */`
				uniform float opacity;
				varying vec3 vViewPosition;
				#include <uv_pars_fragment>
				#include <map_pars_fragment>
				#include <bumpmap_pars_fragment>
				#include <normalmap_pars_fragment>
				#include <alphamap_pars_fragment>
				#include <logdepthbuf_pars_fragment>
				#include <clipping_planes_pars_fragment>
				void main() {
					vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
					#include <clipping_planes_fragment>
					#include <logdepthbuf_fragment>
					#include <map_fragment>
					#include <alphamap_fragment>
					#include <alphatest_fragment>
					gl_FragColor = vec4( vViewPosition.z );
				}
			`
		} );

		this.invertSide = false;

	}

	updateUniforms( object, material, target ) {

		super.updateUniforms( object, material, target );

		let originalDefine;
		if ( this.invertSide ) {

			target.side = target.side === FrontSide ? BackSide : FrontSide;

		}

		// alphatest
		originalDefine = target.defines.ALPHATEST;
		if ( target.uniforms.alphaTest.value === 0 ) {

			delete target.defines.ALPHATEST;

		} else {

			target.defines.ALPHATEST = target.uniforms.alphaTest.value;

		}

		if ( originalDefine !== target.defines.ALPHATEST ) {

			target.needsUpdate = true;

		}

		// alphamap
		originalDefine = target.defines.USE_ALPHAMAP;
		if ( target.defines.ALPHATEST === 0 || ! target.uniforms.alphaMap.value ) {

			delete target.defines.USE_ALPHAMAP;

		} else {

			target.defines.USE_ALPHAMAP = '';

		}

		if ( originalDefine !== target.defines.USE_ALPHAMAP ) {

			target.needsUpdate = true;

		}

		// map
		originalDefine = target.defines.USE_MAP;
		if ( target.defines.ALPHATEST === 0 || ! target.uniforms.map.value ) {

			delete target.defines.USE_MAP;

		} else {

			target.defines.USE_MAP = '';

		}

		if ( originalDefine !== target.defines.USE_MAP ) {

			target.needsUpdate = true;

		}

		// uv
		originalDefine = target.defines.USE_UV;
		if ( 'USE_ALPHAMAP' in target.defines || 'USE_MAP' in target.defines ) {

			target.defines.USE_UV = '';

		} else {

			delete target.defines.USE_UV;

		}

		if ( originalDefine !== target.defines.USE_UV ) {

			target.needsUpdate = true;

		}

	}

}
