import { Matrix4, ShaderChunk } from 'three';
import { prev_skinning_pars_vertex, velocity_vertex } from './MotionBlurShaderChunks.js';

export const GeometryShader = {

	uniforms: {

		prevProjectionMatrix: {

			value: new Matrix4()

		},

		prevModelViewMatrix: {

			value: new Matrix4()

		},

		prevBoneTexture: {

			value: null

		},

		expandGeometry: {

			value: 0

		},

		interpolateGeometry: {

			value: 1

		},

		smearIntensity: {

			value: 1

		}

	},

	vertexShader:
		`
			${ ShaderChunk.skinning_pars_vertex }
			${ prev_skinning_pars_vertex }

			uniform mat4 prevProjectionMatrix;
			uniform mat4 prevModelViewMatrix;
			uniform float expandGeometry;
			uniform float interpolateGeometry;
			varying vec4 prevPosition;
			varying vec4 newPosition;
			varying vec3 color;

			void main() {

				${ velocity_vertex }

				color = (modelViewMatrix * vec4(normal.xyz, 0)).xyz;
				color = normalize(color);

			}
		`,

	fragmentShader:
		`
			varying vec3 color;

			void main() {
				gl_FragColor = vec4(color, 1);
			}
		`
};
