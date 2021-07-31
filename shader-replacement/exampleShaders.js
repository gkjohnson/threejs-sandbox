import { ShaderLib } from '//cdn.skypack.dev/three@0.130.1/build/three.module.js';

export const uvShader = {
	defines: {
		USE_UV: ''
	},
	uniforms: ShaderLib.standard.uniforms,
	vertexShader: ShaderLib.normal.vertexShader,
	fragmentShader:
	`
	varying vec2 vUv;
	void main() {
		gl_FragColor = vec4( vUv, 0.0, 1.0 );
	}
	`,
};

export const roughnessShader = {
	defines: {
		USE_UV: '',
		USE_ROUGHNESSMAP: ''
	},
	uniforms: ShaderLib.standard.uniforms,
	vertexShader: ShaderLib.normal.vertexShader,
	fragmentShader:
	`
	varying vec2 vUv;
	uniform float roughness;
	#include <roughnessmap_pars_fragment>
	void main() {
		#include <roughnessmap_fragment>
		gl_FragColor = vec4( roughnessFactor );
	}
	`,
};

export const metalnessShader = {
	defines: {
		USE_UV: '',
		USE_ROUGHNESSMAP: ''
	},
	uniforms: ShaderLib.standard.uniforms,
	vertexShader: ShaderLib.normal.vertexShader,
	fragmentShader:
	`
	varying vec2 vUv;
	uniform float metalness;
	#include <metalnessmap_pars_fragment>
	void main() {
		#include <metalnessmap_fragment>
		gl_FragColor = vec4( metalnessFactor );
	}
	`,
};

export const albedoShader = {
	defines: {
		USE_UV: '',
		USE_MAP: ''
	},
	uniforms: ShaderLib.standard.uniforms,
	vertexShader: ShaderLib.normal.vertexShader,
	fragmentShader:
	`
	varying vec2 vUv;
	uniform float metalness;
	uniform vec3 diffuse;
	uniform float opacity;
	#include <map_pars_fragment>
	void main() {
		vec4 diffuseColor = vec4( diffuse, opacity );
		#include <map_fragment>
		gl_FragColor = vec4( diffuseColor );
	}
	`,
};

export const opacityShader = {
	defines: {
		USE_UV: '',
		USE_MAP: ''
	},
	uniforms: ShaderLib.standard.uniforms,
	vertexShader: ShaderLib.normal.vertexShader,
	fragmentShader:
	`
	varying vec2 vUv;
	uniform vec3 diffuse;
	uniform float opacity;
	#include <map_pars_fragment>
	void main() {
		vec4 diffuseColor = vec4( diffuse, opacity );
		#include <map_fragment>
		gl_FragColor = vec4( diffuseColor.a );
	}
	`,
};

export const emissiveShader = {
	defines: {
		USE_UV: '',
		USE_EMISSIVEMAP: ''
	},
	uniforms: ShaderLib.standard.uniforms,
	vertexShader: ShaderLib.normal.vertexShader,
	fragmentShader:
	`
	varying vec2 vUv;
	uniform vec3 emissive;
	uniform float opacity;
	#include <emissivemap_pars_fragment>
	void main() {
		vec3 totalEmissiveRadiance = emissive;
		#include <emissivemap_fragment>
		gl_FragColor = vec4( totalEmissiveRadiance, 1.0 );
	}
	`,
};
