
function cloneShader(shader, uniforms, defines) {

	const newShader = Object.assign({}, shader);
	newShader.uniforms = THREE.UniformsUtils.merge([
		newShader.uniforms,
		uniforms
	]);
	newShader.defines = Object.assign({}, defines);

	return newShader;

}

function addWorldPosition(shader) {

	if (/varying\s+vec3\s+wPosition/.test(shader.vertexShader)) return;

	shader.vertexShader = `
			varying vec3 wPosition;
			${shader.vertexShader}
		`.replace(
			/#include <displacementmap_vertex>/,
			v =>
				`${v}
				wPosition = (modelMatrix * vec4( transformed, 1.0 )).xyz;
				`,
			);

	shader.fragmentShader = `
		varying vec3 wPosition;
		${shader.fragmentShader}
		`;

	return shader;
}

function TopoLineShaderMixin(shader) {
	const defineKeyword = 'ENABLE_TOPO_LINES';
	const newShader = cloneShader(
		shader,
		{
			topoLineColor: { value: new THREE.Color() },
			topoLineThickness: { value: 0.005 },
			topoLineSpacing: { value: 0.1 },
			topoLineOffset: { value: 0 },
			topoLineEmphasisMod: { value: 10 },
		},
		{
			[defineKeyword]: 1,
		},
	);

	addWorldPosition(newShader);

	newShader.fragmentShader = `
			uniform vec3 topoLineColor;
			uniform float topoLineThickness;
			uniform float topoLineSpacing;
			uniform float topoLineOffset;
			uniform int topoLineEmphasisMod;
			${newShader.fragmentShader}
		`.replace(
			/#include <normal_fragment_maps>/,
			v =>
				`${v}
				#if ${defineKeyword}
				{
				vec3 vUp = normalize((viewMatrix * vec4(0, 1, 0, 0)).xyz);
				float upwardness = dot(normal, vUp);
				// https://forums.epicgames.com/udk/udk-development/level-design-and-creation/281824-contour-map-material
				float yInv = saturate(1.0 - abs(upwardness)); // use saturate to avoid webgl warning with "pow"
				float thicknessScale = pow(yInv, 0.4); // scale for consistent thickness on slopes
				thicknessScale *= 0.25 + 0.5 * (vViewPosition.z + 1.) / 2.0; // scale for more consistent screen-space thickness
				// factor for fading the thinner lines out
				// 1 is close to camera 0 is far
				float fadeStart = 20.0;
				float fadeDist = 20.0;
				float fadeFactor = 1.0 - clamp((vViewPosition.z - fadeStart) * (1.0 / fadeDist), 0.0, 1.0);
				// pull out the line index which is used to make every certain number
				// of lines thicker
				float lineIndex = mod(wPosition.y + topoLineOffset, topoLineSpacing * float(topoLineEmphasisMod));
				lineIndex -= topoLineSpacing;
				lineIndex = abs(lineIndex);
				lineIndex = step(lineIndex, topoLineSpacing / 2.0);
				// ignore the added thickness if the other lines are faded out
				float lineIndexFactor = lineIndex * fadeFactor;
				// calculate the thickness of the line
				float thickness = topoLineThickness * thicknessScale;
				thickness += thickness * lineIndexFactor * 0.5;
				thickness *= lineIndexFactor * 0.5 + 1.0;
				// calculate the line fade
				// segment off each section for a new line
				float lineFalloff = mod(wPosition.y + topoLineOffset, topoLineSpacing);
				// center the section about the topoLine position and get the
				// fragment distance to the line
				lineFalloff -= topoLineSpacing * 0.5;
				lineFalloff = abs(lineFalloff);
				// cut off the values outside of the thickness and transform the length of
				// thickness to [0, 1]
				lineFalloff -= (topoLineSpacing / 2.0);
				lineFalloff += thickness;
				lineFalloff /= thickness;
				// firm the edge
				lineFalloff *= 1.5;
				lineFalloff = clamp(lineFalloff, 0.0, 1.0);
				// if this is a thicker line then don't fade it out
				lineFalloff *= max(lineIndex, fadeFactor);
				diffuseColor = mix(diffuseColor, vec4(topoLineColor, 1.0), lineFalloff);
				}
				#endif
				`,
		);

	return newShader;
}
