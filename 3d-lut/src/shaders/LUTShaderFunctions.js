export const lutShaderFunctions = /* glsl */`

	// Based on implementation from
	// https://threejsfundamentals.org/threejs/lessons/threejs-post-processing-3dlut.html
    vec3 lutLookup( sampler2D tex, float size, vec3 rgb ) {

		float sliceSize = 1.0 / size;                  // space of 1 slice

		float slicePixelSize = sliceSize / size;       // space of 1 pixel
		float width = size - 1.0;
		float sliceInnerSize = slicePixelSize * width; // space of size pixels

		float zSlice0 = floor( rgb.z * width);
		float zSlice1 = min( zSlice0 + 1.0, width);

		float yOffset = slicePixelSize * 0.5 + rgb.y * sliceInnerSize;
		float xRange = ( rgb.x * width + 0.5 ) / size;
		float s0 = yOffset + (zSlice0 * sliceSize);

		float s1 = yOffset + ( zSlice1 * sliceSize );
		vec4 slice0Color = texture2D( tex, vec2( xRange, s0 ) );
		vec4 slice1Color = texture2D( tex, vec2( xRange, s1 ) );
		float zOffset = mod( rgb.z * width, 1.0 );
		return mix( slice0Color.rgb, slice1Color.rgb, zOffset );

    }

`;
