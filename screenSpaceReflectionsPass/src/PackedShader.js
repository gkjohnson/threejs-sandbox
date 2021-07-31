import { Matrix3, Vector2 } from '//cdn.skypack.dev/three@0.130.1/build/three.module.js';

export const PackedShader = {

	extensions: {

		derivatives: true,

	},

	uniforms: {

		opacity: { value: 1.0 },
		roughnessMap: { value: null },
		roughness: { value: 0 },

		metalnessMap: { value: null },
		metalness: { value: 0 },

		normalMap: { value: null },
		normalScale: { value: new Vector2() },

		map: { value: null },
		alphaMap: { value: null },
		alphaTest: { value: 0 },

		uvTransform: { value: new Matrix3() }

	},

	vertexShader: /* glsl */`
		#define STANDARD
		varying vec3 vViewPosition;
		#ifndef FLAT_SHADED
			varying vec3 vNormal;
			#ifdef USE_TANGENT
				varying vec3 vTangent;
				varying vec3 vBitangent;
			#endif
		#endif
		#include <common>
		#include <uv_pars_vertex>
		#include <uv2_pars_vertex>
		#include <displacementmap_pars_vertex>
		#include <color_pars_vertex>
		#include <fog_pars_vertex>
		#include <morphtarget_pars_vertex>
		#include <skinning_pars_vertex>
		#include <shadowmap_pars_vertex>
		#include <logdepthbuf_pars_vertex>
		#include <clipping_planes_pars_vertex>
		void main() {
			#include <uv_vertex>
			#include <uv2_vertex>
			#include <color_vertex>
			#include <beginnormal_vertex>
			#include <morphnormal_vertex>
			#include <skinbase_vertex>
			#include <skinnormal_vertex>
			#include <defaultnormal_vertex>
		#ifndef FLAT_SHADED
			vNormal = normalize( transformedNormal );
			#ifdef USE_TANGENT
				vTangent = normalize( transformedTangent );
				vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
			#endif
		#endif
			#include <begin_vertex>
			#include <morphtarget_vertex>
			#include <skinning_vertex>
			#include <displacementmap_vertex>
			#include <project_vertex>
			#include <logdepthbuf_vertex>
			#include <clipping_planes_vertex>
			vViewPosition = - mvPosition.xyz;
			#include <worldpos_vertex>
			#include <shadowmap_vertex>
			#include <fog_vertex>
		}
	`,

	fragmentShader: /* glsl */`
		#define STANDARD
		#ifdef PHYSICAL
			#define REFLECTIVITY
			#define CLEARCOAT
			#define TRANSPARENCY
		#endif
		uniform vec3 diffuse;
		uniform vec3 emissive;
		uniform float roughness;
		uniform float metalness;
		uniform float opacity;
		#ifdef TRANSPARENCY
			uniform float transparency;
		#endif
		#ifdef REFLECTIVITY
			uniform float reflectivity;
		#endif
		#ifdef CLEARCOAT
			uniform float clearcoat;
			uniform float clearcoatRoughness;
		#endif
		#ifdef USE_SHEEN
			uniform vec3 sheen;
		#endif
		varying vec3 vViewPosition;
		#ifndef FLAT_SHADED
			varying vec3 vNormal;
			#ifdef USE_TANGENT
				varying vec3 vTangent;
				varying vec3 vBitangent;
			#endif
		#endif
		#include <common>
		#include <packing>
		#include <dithering_pars_fragment>
		#include <color_pars_fragment>
		#include <uv_pars_fragment>
		#include <uv2_pars_fragment>
		#include <map_pars_fragment>
		#include <alphamap_pars_fragment>
		#include <aomap_pars_fragment>
		#include <lightmap_pars_fragment>
		#include <emissivemap_pars_fragment>
		#include <bsdfs>
		#include <cube_uv_reflection_fragment>
		#include <envmap_common_pars_fragment>
		#include <envmap_physical_pars_fragment>
		#include <fog_pars_fragment>
		#include <lights_pars_begin>
		#include <lights_physical_pars_fragment>
		#include <shadowmap_pars_fragment>
		#include <bumpmap_pars_fragment>
		#include <normalmap_pars_fragment>
		#include <roughnessmap_pars_fragment>
		#include <metalnessmap_pars_fragment>
		#include <logdepthbuf_pars_fragment>
		#include <clipping_planes_pars_fragment>
		void main() {
			#include <clipping_planes_fragment>
			vec4 diffuseColor = vec4( diffuse, opacity );
			ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
			vec3 totalEmissiveRadiance = emissive;
			#include <logdepthbuf_fragment>
			#include <map_fragment>
			#include <color_fragment>
			#include <alphamap_fragment>
			#include <alphatest_fragment>
			#include <roughnessmap_fragment>
			#include <metalnessmap_fragment>
			#include <normal_fragment_begin>
			#include <normal_fragment_maps>
			#include <clearcoat_normal_fragment_begin>
			#include <clearcoat_normal_fragment_maps>
			#include <emissivemap_fragment>
			#include <lights_physical_fragment>
			#include <lights_fragment_begin>
			#include <lights_fragment_maps>
			#include <lights_fragment_end>
			#include <aomap_fragment>
			vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
			#ifdef TRANSPARENCY
				diffuseColor.a *= saturate( 1. - transparency + linearToRelativeLuminance( reflectedLight.directSpecular + reflectedLight.indirectSpecular ) );
			#endif
			gl_FragColor = vec4( outgoingLight, diffuseColor.a );
			#include <tonemapping_fragment>
			#include <encodings_fragment>
			#include <fog_fragment>
			#include <premultiplied_alpha_fragment>
			#include <dithering_fragment>

			// TODO: Pack this the way the normal shader does?
			gl_FragColor = vec4(normal.xyz * 0.5 + 0.5, roughnessFactor);
		}
	`

};
