import { Matrix4, ShaderChunk } from 'three';
import { prev_skinning_pars_vertex, velocity_vertex } from './MotionBlurShaderChunks.js';

export const VelocityShader = {

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

			void main() {

				${ velocity_vertex }

			}
		`,

	fragmentShader:
		`
			uniform float smearIntensity;
			varying vec4 prevPosition;
			varying vec4 newPosition;

			void main() {

				// NOTE: It seems the velociyt is incorrectly calculated here -- see the velocity pass
				// in shader replacement to see how to compute velocities in screen uv space.
				vec3 vel;
				vel = (newPosition.xyz / newPosition.w) - (prevPosition.xyz / prevPosition.w);

				gl_FragColor = vec4(vel * smearIntensity, 1.0);
			}
		`
};
