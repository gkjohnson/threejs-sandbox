import { ShaderChunk, Matrix4 } from '//cdn.skypack.dev/three@0.130.1/build/three.module.js';

// Modified ShaderChunk.skinning_pars_vertex to handle
// a second set of bone information from the previou frame
export const prev_skinning_pars_vertex =
	`
		#ifdef USE_SKINNING
		#ifdef BONE_TEXTURE
			uniform sampler2D prevBoneTexture;
			mat4 getPrevBoneMatrix( const in float i ) {
				float j = i * 4.0;
				float x = mod( j, float( boneTextureSize ) );
				float y = floor( j / float( boneTextureSize ) );
				float dx = 1.0 / float( boneTextureSize );
				float dy = 1.0 / float( boneTextureSize );
				y = dy * ( y + 0.5 );
				vec4 v1 = texture2D( prevBoneTexture, vec2( dx * ( x + 0.5 ), y ) );
				vec4 v2 = texture2D( prevBoneTexture, vec2( dx * ( x + 1.5 ), y ) );
				vec4 v3 = texture2D( prevBoneTexture, vec2( dx * ( x + 2.5 ), y ) );
				vec4 v4 = texture2D( prevBoneTexture, vec2( dx * ( x + 3.5 ), y ) );
				mat4 bone = mat4( v1, v2, v3, v4 );
				return bone;
			}
		#else
			uniform mat4 prevBoneMatrices[ MAX_BONES ];
			mat4 getPrevBoneMatrix( const in float i ) {
				mat4 bone = prevBoneMatrices[ int(i) ];
				return bone;
			}
		#endif
		#endif
	`;

// Returns the body of the vertex shader for the velocity buffer and
// outputs the position of the current and last frame positions
export const velocity_vertex =
	`
		vec3 transformed;

		// Get the normal
		${ ShaderChunk.skinbase_vertex }
		${ ShaderChunk.beginnormal_vertex }
		${ ShaderChunk.skinnormal_vertex }
		${ ShaderChunk.defaultnormal_vertex }

		// Get the current vertex position
		transformed = vec3( position );
		${ ShaderChunk.skinning_vertex }
		newPosition = modelViewMatrix * vec4( transformed, 1.0 );

		// Get the previous vertex position
		transformed = vec3( position );
		${ ShaderChunk.skinbase_vertex.replace( /mat4 /g, '' ).replace( /getBoneMatrix/g, 'getPrevBoneMatrix' ) }
		${ ShaderChunk.skinning_vertex.replace( /vec4 /g, '' ) }
		prevPosition = prevModelViewMatrix * vec4( transformed, 1.0 );

		newPosition =  projectionMatrix * newPosition;
		prevPosition = prevProjectionMatrix * prevPosition;

		gl_Position = mix( newPosition, prevPosition, interpolateGeometry );

	`;

export const VelocityShader = {

	uniforms: {
		prevProjectionMatrix: { value: new Matrix4() },
		prevModelViewMatrix: { value: new Matrix4() },
		prevBoneTexture: { value: null },
		interpolateGeometry: { value: 0 },
		intensity: { value: 1 },

		alphaTest: { value: 0.0 },
		map: { value: null },
		alphaMap: { value: null },
		opacity: { value: 1.0 }
	},

	vertexShader:
		`
			${ ShaderChunk.skinning_pars_vertex }
			${ prev_skinning_pars_vertex }

			uniform mat4 prevProjectionMatrix;
			uniform mat4 prevModelViewMatrix;
			uniform float interpolateGeometry;
			varying vec4 prevPosition;
			varying vec4 newPosition;

			void main() {

				${ velocity_vertex }

			}
		`,

	fragmentShader:
		`
			uniform float intensity;
			varying vec4 prevPosition;
			varying vec4 newPosition;

			void main() {

				vec3 pos0 = prevPosition.xyz / prevPosition.w;
				pos0 += 1.0;
				pos0 /= 2.0;

				vec3 pos1 = newPosition.xyz / newPosition.w;
				pos1 += 1.0;
				pos1 /= 2.0;

				vec3 vel = pos1 - pos0;
				gl_FragColor = vec4( vel * intensity, 1.0 );

			}
		`
};
