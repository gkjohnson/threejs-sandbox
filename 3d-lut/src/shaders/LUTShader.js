import { lutShaderFunctions } from './LUTShaderFunctions.js';

export const LUTShader = {

	defines: {
		USE_3DTEXTURE: 1,
	},

	uniforms: {
		lut3d: { value: null },

		lut: { value: null },
		lutSize: { value: 0 },

		tDiffuse: { value: null },
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
		precision highp sampler3D;

		${ lutShaderFunctions }

		uniform float lutSize;
		#if USE_3DTEXTURE
		uniform sampler3D lut3d;
		#else
		uniform sampler2D lut;
		#endif

		varying vec2 vUv;
		uniform float intensity;
		uniform sampler2D tDiffuse;
		void main() {

			vec4 val = texture2D( tDiffuse, vUv );
			vec4 lutVal;

			// pull the sample in by half a pixel so the sample begins
			// at the center of the edge pixels.
			float pixelWidth = 1.0 / lutSize;
			float halfPixelWidth = 0.5 / lutSize;
			vec3 uvw = vec3( halfPixelWidth ) + val.rgb * ( 1.0 - pixelWidth );

			#if USE_3DTEXTURE

			lutVal = vec4( texture( lut3d, uvw ).rgb, val.a );

			#else

			lutVal = vec4( lutLookup( lut, lutSize, uvw ), val.a );

			#endif

			gl_FragColor = vec4( mix( val, lutVal, intensity ) );

		}

	`,

};
