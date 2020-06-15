import { lutShaderFunctions } from './LUTShaderFunctions.js';

export const LUTShader = {

	uniforms: {
		tDiffuse: { value: null },
		lut: { value: null },
		lutSize: { value: 0 },
		intensity: { value: 1.0 },
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
		uniform float intensity;
		uniform sampler2D tDiffuse;
		void main() {

			vec4 val = texture2D( tDiffuse, vUv );
			vec4 lutVal = vec4( lutLookup( lut, lutSize, val.rgb ), val.a );
			gl_FragColor = mix( val, lutVal, intensity );

		}

	`,

};
