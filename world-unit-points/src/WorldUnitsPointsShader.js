const { ShaderChunk, ShaderLib, UniformsUtils, Vector2 } = THREE;
const WorldUnitsPointsShader = {
	vertexShader: `
	uniform float size;
	uniform float scale;
	uniform vec2 resolution;
	#include <common>
	#include <color_pars_vertex>
	#include <fog_pars_vertex>
	#include <morphtarget_pars_vertex>
	#include <logdepthbuf_pars_vertex>
	#include <clipping_planes_pars_vertex>
	void main() {
		#include <color_vertex>
		#include <begin_vertex>
		#include <morphtarget_vertex>
		#include <project_vertex>
		#ifdef USE_SIZEATTENUATION
			{
				vec4 v1 = vec4(0, -0.5, mvPosition.z, 1.0);
				v1 = projectionMatrix * v1;
				v1 /= v1.w;

				vec4 v2 = vec4(0, 0.5, mvPosition.z, 1.0);
				v2 = projectionMatrix * v2;
				v2 /= v2.w;

				// Measure the distance between two points that are 1
				// unit apart after being projected. This works for
				// both orthographic and perspective cameras.
				float worldWidth = distance(v1.xyz, v2.xyz);

				// divide by 2.0 because NDC is [-1, 1]
				gl_PointSize = worldWidth * resolution.y * size / 2.0;
			}
		#else
			gl_PointSize = size;
		#endif
		#include <logdepthbuf_vertex>
		#include <clipping_planes_vertex>
		#include <worldpos_vertex>
		#include <fog_vertex>
	}
	`,
	fragmentShader: ShaderChunk.points_frag,
	uniforms: UniformsUtils.merge([{ resolution: { value: new Vector2() } }, UniformsUtils.clone(ShaderLib.points.uniforms)]),
	defines: { USE_SIZEATTENUATION: 1 }
};

