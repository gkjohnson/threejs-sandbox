import { lutShaderFunctions } from './LUTShaderFunctions.js';

export const LUTShader = {

	uniforms: {
		tDiffuse: { value: null },
		lut: { value: null },
		lutSize: { value: 0 },
	},

	vertexShader: /* glsl */`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}

	`,


	fragmentShader: /* glsl */`

		${ lutShaderFunctions }

		varying vec2 vUv;
		uniform sampler2D lut;
		uniform float lutSize;
		uniform sampler2D tDiffuse;
		void main() {

			vec4 val = texture2D( tDiffuse, vUv );
			gl_FragColor = vec4( lutLookup( lut, lutSize, val.rgb ), val.a );

		}

	`,

};
