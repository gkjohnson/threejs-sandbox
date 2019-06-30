
function cloneShader(shader, uniforms, defines) {

	const newShader = Object.assign({}, shader);
	newShader.uniforms = THREE.UniformsUtils.merge([
		newShader.uniforms,
		uniforms
	]);
	newShader.defines = Object.assign({}, defines);

	return newShader;

}

function addInstancePosition(shader) {

	const newShader = cloneShader(
		shader,
		{
			scale: { value: 1 },
			offset: { value: new THREE.Vector3() },
		},
	);

	newShader.vertexShader = `
		uniform float scale;
		uniform vec3 offset;
		attribute vec3 instancePosition;
		${newShader.vertexShader}
	`.replace('#include <project_vertex>', match => `
		vec3 offsetPos = instancePosition + offset;
		offsetPos /= scale;
		offsetPos = floor(offsetPos);
		offsetPos *= scale;
		offsetPos += vec3(scale, scale, scale) * 0.5;
		offsetPos -= offset;

		transformed *= scale;
		transformed += offsetPos;
		${match}
	`);

	return newShader;

}
