export const PackedNormalDisplayShader = {

	uniforms: {

		tex: { value: null },
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
		uniform sampler2D tex;
		uniform float displayRoughness;
		void main() {

			vec4 texVal = texture2D( tex, vUv );
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

		tex: { value: null },

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
		uniform sampler2D tex;
		uniform float divide;
		void main() {

			vec4 texVal = texture2D( tex, vUv );
			float depthVal = mod( - texVal.r, 1.0 );
			gl_FragColor = vec4( depthVal );

		}
	`

};

export const DepthDeltaShader = {

	uniforms: {

		frontSidetex: { value: null },
		backSidetex: { value: null },
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
		uniform sampler2D frontSideTexture;
		uniform sampler2D backSideTexture;
		uniform float divide;
		void main() {

			vec4 frontTex = texture2D( frontSideTexture, vUv );
			vec4 backTex = texture2D( backSideTexture, vUv );

			float frontDepth = frontTex.r;
			float backDepth = backTex.r;
			float depthDelta = frontDepth - backDepth;

			if ( frontDepth < backDepth ) {

				gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );

			} else if ( ( frontDepth == 0.0 ) != ( backDepth == 0.0 ) ) {

				gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );

			} else {

				gl_FragColor = vec4( 10.0 * depthDelta / divide );

			}

		}
	`

};

export const IntersectUvShader = {

	uniforms: {

		tex: { value: null }

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
		uniform sampler2D tex;
		void main() {

			vec4 texVal = texture2D( tex, vUv );
			gl_FragColor = vec4( texVal.xy, 0.0, 1.0 );

		}
	`

};

export const IntersectDistanceShader = {

	uniforms: {

		tex: { value: null }

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
		uniform sampler2D tex;
		void main() {

			vec4 texVal = texture2D( tex, vUv );
			gl_FragColor = vec4( texVal.z, texVal.z, texVal.z, 1.0 );

		}
	`

};
