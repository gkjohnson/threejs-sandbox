import { Vector2 } from '//unpkg.com/three@0.114.0/build/three.module.js';
import { sampleFunctions } from '../../custom-mipmap-generation/src/mipSampleFunctions.js';

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

export const LinearMipDepthDisplayShader = {

	uniforms: {

		originalSize: { value: new Vector2() },
		level: { value: 0 },
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
		uniform vec2 originalSize;
		uniform int level;
		uniform sampler2D texture;
		uniform float divide;

		${ sampleFunctions }

		void main() {

			vec4 texVal = packedTexture2DLOD( texture, vUv, level, originalSize );
			float depthVal = - texVal.r;
			gl_FragColor = vec4( depthVal / divide );

		}
	`

};
