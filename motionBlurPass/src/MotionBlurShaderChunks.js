import { ShaderChunk } from 'three';

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
		newPosition = modelViewMatrix * vec4(transformed, 1.0);

		// Get the previous vertex position
		transformed = vec3( position );
		${ ShaderChunk.skinbase_vertex.replace( /mat4 /g, '' ).replace( /getBoneMatrix/g, 'getPrevBoneMatrix' ) }
		${ ShaderChunk.skinning_vertex.replace( /vec4 /g, '' ) }
		prevPosition = prevModelViewMatrix * vec4(transformed, 1.0);

		// The delta between frames
		vec3 delta = newPosition.xyz - prevPosition.xyz;
		vec3 direction = normalize(delta);

		// Stretch along the velocity axes
		// TODO: Can we combine the stretch and expand
		float stretchDot = dot(direction, transformedNormal);
		vec4 expandDir = vec4(direction, 0.0) * stretchDot * expandGeometry * length(delta);
		vec4 newPosition2 =  projectionMatrix * (newPosition + expandDir);
		vec4 prevPosition2 = prevProjectionMatrix * (prevPosition + expandDir);

		newPosition =  projectionMatrix * newPosition;
		prevPosition = prevProjectionMatrix * prevPosition;

		gl_Position = mix(newPosition2, prevPosition2, interpolateGeometry * (1.0 - step(0.0, stretchDot) ) );

	`;
