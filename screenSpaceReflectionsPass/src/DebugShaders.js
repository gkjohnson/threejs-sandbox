export const PackedNormalDisplayShader = {

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

			vec3 packedNormal = texture2D( texture, vUv ).xyz;
			vec3 unpackedNormal = ( packedNormal - 0.5 ) * 2.0;
			gl_FragColor = vec4( unpackedNormal, 1.0 );

		}
	`

};
