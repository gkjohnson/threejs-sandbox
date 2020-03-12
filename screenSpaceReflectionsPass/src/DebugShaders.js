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

export const DepthDeltaShader = {

	uniforms: {

		frontSideTexture: { value: null },
		backSideTexture: { value: null },
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

		texture: { value: null }

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
		void main() {

			vec4 texVal = texture2D( texture, vUv );
			gl_FragColor = vec4( texVal.xy, 0.0, 1.0 );

		}
	`

};

export const IntersectDistanceShader = {

	uniforms: {

		texture: { value: null }

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
		void main() {

			vec4 texVal = texture2D( texture, vUv );
			gl_FragColor = vec4( texVal.z, texVal.z, texVal.z, 1.0 );

		}
	`

};

export const IntersectColorShader = {

	uniforms: {

		intersectBuffer: { value: null },
		sourceBuffer: { value: null },
		packedBuffer: { value: null },

	},

	vertexShader:
		/* glsl */`
		varying vec2 vUv;
		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}
	`,

	fragmentShader:
		/* glsl */`
		#include <common>
		#include <packing>
		varying vec2 vUv;
		uniform sampler2D intersectBuffer;
		uniform sampler2D sourceBuffer;

		uniform float intensity;
		void main() {

			// Found, blending
			vec4 result = vec4( 0.0 );
			vec4 intersect = texture2D( intersectBuffer, vUv );
			vec2 hitUV = intersect.xy;
			float stepRatio = intersect.z;
			float intersected = intersect.a;
			if ( intersected > 0.5 ) {

				vec4 col = texture2D( sourceBuffer, hitUV, 10.0 );
				result = col;

			}

			gl_FragColor = result;

		}
	`

};
