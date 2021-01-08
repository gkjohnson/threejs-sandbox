export const lutShaderFunctions = /* glsl */`

	vec3 lutLookup( sampler2D tex, float size, vec3 rgb ) {

		float sliceHeight = 1.0 / size;
		float yPixelHeight = 1.0 / ( size * size );

		// Get the slices on either side of the sample
		float slice = rgb.b * size;
		float slice0;
		float interp = modf( slice, slice0 );
		float centeredInterp = interp - 0.5;

		float slice1 = slice0 + sign( centeredInterp );

		// Pull y sample in by half a pixel in each direction to avoid color
		// bleeding from adjacent slices.
		float greenOffset = clamp( rgb.g * sliceHeight, yPixelHeight * 0.5, sliceHeight - yPixelHeight * 0.5 );

		vec2 uv0 = vec2(
			rgb.r,
			slice0 * sliceHeight + greenOffset
		);
		vec2 uv1 = vec2(
			rgb.r,
			slice1 * sliceHeight + greenOffset
		);

		vec3 sample0 = texture2D( tex, uv0 ).rgb;
		vec3 sample1 = texture2D( tex, uv1 ).rgb;

		return mix( sample0, sample1, abs( centeredInterp ) );

	}

`;
