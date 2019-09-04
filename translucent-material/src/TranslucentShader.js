const { ShaderLib, UniformsUtils } = THREE;

// need to unpack depth backt to world space to get thickness
// https://stackoverflow.com/questions/44121266/compute-3d-point-from-mouse-position-and-depth-map
const TranslucentShader = {
	vertexShader: ``,
	fragmentShader: ``,
	defines: {},
	uniforms: UniformsUtils.merge([
		{},
		UniformsUtils.clone(ShaderLib.physical.uniforms)
	]),
};

