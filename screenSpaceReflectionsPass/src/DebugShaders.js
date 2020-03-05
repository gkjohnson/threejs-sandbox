export const PackedNormalDisplayShader = {

	uniforms: {

		texture: { value: null },
		displayRoughness: { value: 0 },

	},

	vertexShader: /* glsl */`
		varying vec3 vViewPosition;
		varying vec2 vUv;
		void main() {

			#include <begin_vertex>
			#include <project_vertex>
			vViewPosition = mvPosition.xyz;
			vUv = uv;

		}
	`,

	fragmentShader: /* glsl */`
		varying vec2 vUv;
		uniform sampler2D texture;
		uniform float displayRoughness;
		void main() {

			vec4 texVal = texture2D( texture, vUv );
			float roughness = texVal.a;
			vec3 packedNormal = texVal.xyz;
			vec3 unpackedNormal = ( packedNormal - 0.5 ) * 2.0;
			gl_FragColor = mix(
				vec4( unpackedNormal, 1.0 ),
				vec4( roughness, roughness, roughness, 1.0 ),
				displayRoughness
			);

		}
	`

};

export const LinearDepthDisplayShader = {

	uniforms: {

		texture: { value: null },
		divide: { value: 1 }

	},

	vertexShader: /* glsl */`
		varying vec3 vViewPosition;
		varying vec2 vUv;
		void main() {

			#include <begin_vertex>
			#include <project_vertex>
			vViewPosition = mvPosition.xyz;
			vUv = uv;

		}
	`,

	fragmentShader: /* glsl */`
		varying vec2 vUv;
		uniform sampler2D texture;
		uniform float divide;
		void main() {

			vec4 texVal = texture2D( texture, vUv );
			float depthVal = - texVal.r;
			gl_FragColor = vec4( depthVal / divide );

		}
	`

};
