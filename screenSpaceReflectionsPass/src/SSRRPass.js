import {
	NearestFilter,
	FloatType,
	BackSide,
	WebGLRenderTarget,
	HalfFloatType,
	RGBAFormat,
	OrthographicCamera,
	Scene,
	Mesh,
	PlaneBufferGeometry,
	Color,
	ShaderMaterial,
	Matrix4,
	Vector2
} from '//unpkg.com/three@0.112.0/build/three.module.js';
import { Pass } from '//unpkg.com/three@0.112.0/examples/jsm/postprocessing/Pass.js';

/**
 * @author Garrett Johnson / http://gkjohnson.github.io/
 *
 * Approach from
 * http://jcgt.org/published/0003/04/04/paper.pdf
 * https://github.com/kode80/kode80SSR
 */
class SSRRPass extends Pass {
	constructor( scene, camera, options = {} ) {

		Pass.call( this );

		this.enabled = true;
		this.needsSwap = true;

		this.intensity = options.intensity || 0.5;
		this.steps = options.steps || 10;
		this.binarySearchSteps = options.binarySearchSteps || 4;
		this.stride = options.stride || 30;
		this.renderTargetScale = options.renderTargetScale || 0.5;

		this.scene = scene;
		this.camera = camera;

		this._prevClearColor = new Color();

		// render targets
		this._depthBuffer =
			new WebGLRenderTarget( 256, 256, {
				minFilter: NearestFilter,
				magFilter: NearestFilter,
				format: RGBAFormat,
				type: FloatType
			} );
		this._depthBuffer.texture.name = "SSRRPass.Depth";
		this._depthBuffer.texture.generateMipmaps = false;
		this._depthMaterial = this.createLinearDepthMaterial();

		this._backfaceDepthBuffer = this._depthBuffer.clone();
		this._backfaceDepthBuffer.texture.name = "SSRRPass.Depth";
		this._backfaceDepthMaterial = this.createLinearDepthMaterial();
		this._backfaceDepthMaterial.side = BackSide;

		this._packedBuffer =
			new WebGLRenderTarget( 256, 256, {
				minFilter: NearestFilter,
				magFilter: NearestFilter,
				type: HalfFloatType,
				format: RGBAFormat
			} );
		this._packedBuffer.texture.name = "SSRRPass.Packed";
		this._packedBuffer.texture.generateMipmaps = false;

		this._compositeCamera = new OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
		this._compositeScene = new Scene();
		this._compositeMaterial = this.getCompositeMaterial();

		this._quad = new Mesh( new PlaneBufferGeometry( 2, 2 ), this._compositeMaterial );
		this._quad.frustumCulled = false;
		this._compositeScene.add( this._quad );

	}

	dispose() {

		this._depthBuffer.dispose();
		this._packedBuffer.dispose();

	}

	setSize( width, height ) {

		width *= this.renderTargetScale;
		height *= this.renderTargetScale;

		this._depthBuffer.setSize( width, height );
		this._backfaceDepthBuffer.setSize( width, height );
		this._packedBuffer.setSize( width, height );

	}

	render( renderer, writeBuffer, readBuffer, delta, maskActive ) {

		// Set the clear state
		this._prevClearColor.copy( renderer.getClearColor() );
		var prevClearAlpha = renderer.getClearAlpha();
		var prevAutoClear = renderer.autoClear;
		renderer.autoClear = true;
		renderer.setClearColor( new Color( 0, 0, 0 ), 0 );

		var prevOverride = this.scene.overrideMaterial;

		// Normal pass
		this.scene.overrideMaterial = this.createPackedMaterial();
		renderer.setRenderTarget( this._packedBuffer );
		renderer.clear();
		renderer.render( this.scene, this.camera );

		// Render depth
		this.scene.overrideMaterial = this._depthMaterial;
		renderer.setRenderTarget( this._depthBuffer );
		renderer.clear();
		renderer.render( this.scene, this.camera );

		this.scene.overrideMaterial = this._backfaceDepthMaterial;
		renderer.setRenderTarget( this._backfaceDepthBuffer );
		renderer.clear();
		renderer.render( this.scene, this.camera );
		this.scene.overrideMaterial = prevOverride;

		// Composite
		const cm = this._compositeMaterial;
		const uni = cm.uniforms;
		uni.sourceBuffer.value = readBuffer.texture;
		uni.depthBuffer.value = this._depthBuffer.texture;
		uni.backfaceDepthBuffer.value = this._backfaceDepthBuffer.texture;

		uni.packedBuffer.value = this._packedBuffer.texture;
		uni.invProjectionMatrix.value.getInverse( this.camera.projectionMatrix );
		uni.projMatrix.value.copy( this.camera.projectionMatrix );
		uni.resolution.value.set( this._packedBuffer.width, this._packedBuffer.height );

		uni.intensity.value = this.intensity;
		uni.stride.value = this.stride;

		if ( cm.defines.MAX_STEPS !== this.steps ) {

			cm.defines.MAX_STEPS = Math.floor( this.steps );
			cm.needsUpdate = true;

		}

		if ( cm.defines.BINARY_SEARCH_ITERATIONS !== this.binarySearchSteps ) {

			cm.defines.BINARY_SEARCH_ITERATIONS = Math.floor( this.binarySearchSteps );
			cm.needsUpdate = true;

		}



		this._quad.material = this._compositeMaterial;
		renderer.setRenderTarget( this.renderToScreen ? null : writeBuffer );
		renderer.clear();
		renderer.render( this._compositeScene, this._compositeCamera );

		// Restore renderer settings
		renderer.setClearColor( this._prevClearColor, prevClearAlpha );
		renderer.autoClear = prevAutoClear;

	}

	createLinearDepthMaterial() {

		return new ShaderMaterial( {

			vertexShader: `
				varying vec3 vViewPosition;
				#ifndef FLAT_SHADED
					varying vec3 vNormal;
				#endif
				void main() {
					#include <beginnormal_vertex>
					#include <defaultnormal_vertex>
					#include <begin_vertex>
					#include <project_vertex>
					vViewPosition = mvPosition.xyz;
				}
			`,

			fragmentShader: `
				varying vec3 vViewPosition;
				void main() {
					gl_FragColor = vec4(vViewPosition.z);
				}
			`

		} );


	}

	createPackedMaterial() {

		return new ShaderMaterial( {

			uniforms: {

				roughnessMap: { value: null },
				roughness: { value: 0 },

				metalnessMap: { value: null },
				metalness: { value: 0 },

				normalMap: { value: null }

			},

			vertexShader: `
				#extension GL_OES_standard_derivatives : enable
				#define PHYSICAL
				varying vec3 vViewPosition;
				#ifndef FLAT_SHADED
					varying vec3 vNormal;
				#endif
				#include <common>
				#include <uv_pars_vertex>
				#include <uv2_pars_vertex>
				#include <displacementmap_pars_vertex>
				#include <color_pars_vertex>
				#include <fog_pars_vertex>
				#include <morphtarget_pars_vertex>
				#include <skinning_pars_vertex>
				#include <shadowmap_pars_vertex>
				#include <logdepthbuf_pars_vertex>
				#include <clipping_planes_pars_vertex>
				void main() {
					#include <uv_vertex>
					#include <uv2_vertex>
					#include <color_vertex>
					#include <beginnormal_vertex>
					#include <morphnormal_vertex>
					#include <skinbase_vertex>
					#include <skinnormal_vertex>
					#include <defaultnormal_vertex>
				#ifndef FLAT_SHADED
					vNormal = normalize( transformedNormal );
				#endif
					#include <begin_vertex>
					#include <morphtarget_vertex>
					#include <skinning_vertex>
					#include <displacementmap_vertex>
					#include <project_vertex>
					#include <logdepthbuf_vertex>
					#include <clipping_planes_vertex>
					vViewPosition = mvPosition.xyz;
					#include <worldpos_vertex>
					#include <shadowmap_vertex>
					#include <fog_vertex>
				}
			`,

			fragmentShader: `
				#extension GL_OES_standard_derivatives : enable
				#define PHYSICAL
				uniform vec3 diffuse;
				uniform vec3 emissive;
				uniform float roughness;
				uniform float metalness;
				uniform float opacity;
				#ifndef STANDARD
					uniform float clearCoat;
					uniform float clearCoatRoughness;
				#endif
				varying vec3 vViewPosition;
				#ifndef FLAT_SHADED
					varying vec3 vNormal;
				#endif
				#include <common>
				#include <packing>
				#include <dithering_pars_fragment>
				#include <color_pars_fragment>
				#include <uv_pars_fragment>
				#include <uv2_pars_fragment>
				#include <map_pars_fragment>
				#include <alphamap_pars_fragment>
				#include <aomap_pars_fragment>
				#include <lightmap_pars_fragment>
				#include <emissivemap_pars_fragment>
				#include <envmap_pars_fragment>
				#include <fog_pars_fragment>
				#include <bsdfs>
				#include <cube_uv_reflection_fragment>
				#include <lights_pars_begin>
				// #include <lights_pars_maps>
				#include <lights_physical_pars_fragment>
				#include <shadowmap_pars_fragment>
				#include <bumpmap_pars_fragment>
				#include <normalmap_pars_fragment>
				#include <roughnessmap_pars_fragment>
				#include <metalnessmap_pars_fragment>
				#include <logdepthbuf_pars_fragment>
				#include <clipping_planes_pars_fragment>
				void main() {
					#include <clipping_planes_fragment>
					vec4 diffuseColor = vec4( diffuse, opacity );
					ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
					vec3 totalEmissiveRadiance = emissive;
					#include <logdepthbuf_fragment>
					#include <map_fragment>
					#include <color_fragment>
					#include <alphamap_fragment>
					#include <alphatest_fragment>
					#include <roughnessmap_fragment>
					#include <metalnessmap_fragment>
					#include <normal_fragment_begin>
					#include <normal_fragment_maps>
					#include <emissivemap_fragment>
					#include <lights_physical_fragment>
					#include <lights_fragment_begin>
					#include <lights_fragment_maps>
					#include <lights_fragment_end>
					#include <aomap_fragment>
					vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
					gl_FragColor = vec4( outgoingLight, diffuseColor.a );
					#include <tonemapping_fragment>
					#include <encodings_fragment>
					#include <fog_fragment>
					#include <premultiplied_alpha_fragment>
					#include <dithering_fragment>

					gl_FragColor = vec4(normal.xyz * 0.5 + 0.5, roughnessFactor);
				}
			`

		} );

	}

	getCompositeMaterial() {

		return new ShaderMaterial( {

			defines: {

				MAX_STEPS: 10,
				BINARY_SEARCH_ITERATIONS: 4,
				PYRAMID_DEPTH: 1

			},

			uniforms: {
				sourceBuffer: { value: null },
				packedBuffer: { value: null },
				depthBuffer: { value: null },
				backfaceDepthBuffer: { value: null },
				invProjectionMatrix: { value: new Matrix4() },
				projMatrix: { value: new Matrix4() },

				intensity: { value: 0.5 },
				stride: { value: 20 },
				resolution: { value: new Vector2() },
				thickness: { value: 1 },
				jitter: { value: 1 },
				maxDistance: { value: 100 }
			},

			vertexShader:
				`
				varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}
				`,
			fragmentShader:
				`
				#include <common>
				#include <packing>
				varying vec2 vUv;
				uniform sampler2D sourceBuffer;
				uniform sampler2D packedBuffer;
				uniform sampler2D depthBuffer;
				uniform sampler2D backfaceDepthBuffer;
				uniform mat4 invProjectionMatrix;
				uniform mat4 projMatrix;
				uniform vec2 resolution;

				uniform float thickness;
				uniform float stride;
				uniform float jitter;
				uniform float maxDistance;
				uniform float intensity;

				vec3 Deproject(vec3 p) {
					vec4 res = invProjectionMatrix * vec4(p, 1);
					return res.xyz / res.w;
				}

				vec3 Project(vec3 p) {
					vec4 res = projMatrix * vec4(p, 1);
					return res.xyz / res.w;
				}

				vec3 UnpackNormal(vec4 d) {
					return d.xyz * 2.0 - 1.0;
				}

				bool doesIntersect(float rayzmax, float rayzmin, vec2 uv) {

					float sceneZMax = texture2D(backfaceDepthBuffer, uv).r;
					float sceneZMin = texture2D(depthBuffer, uv).r;

					return rayzmin >= sceneZMax && rayzmax <= sceneZMin;

				}

				float distanceSquared(vec2 a, vec2 b) { a -= b; return dot(a, a); }

				// NOTE: "further" is actually "more negative"
				void swapIfBigger(inout float a, inout float b) {
					if (a > b) {
						float t = a;
						a = b;
						b = t;
					}
				}

				bool isOutsideUvBounds(float x) { return x < 0.0 || x > 1.0; }
				bool isOutsideUvBounds(vec2 uv) { return isOutsideUvBounds(uv.x) || isOutsideUvBounds(uv.y); }

				void main() {

					// Screen position information
					vec2 screenCoord = vUv * 2.0 - vec2(1, 1);
					float nearClip = Deproject(vec3(0, 0, -1)).z;
					vec3 ray = Deproject(vec3(screenCoord, -1));
					ray /= ray.z;

					// Samples
					vec4 dataSample = texture2D(packedBuffer, vUv);
					float depthSample = texture2D(depthBuffer, vUv).r;

					// View space information
					vec3 vpos =  depthSample * ray;
					vec3 vnorm = UnpackNormal(dataSample);
					vec3 dir = normalize(reflect(normalize(vpos), normalize(vnorm)));

					// Define view space values
					float maxDist = maxDistance;
					float rayLength = (vpos.z + dir.z * maxDist) > nearClip ? (nearClip - vpos.z) / dir.z : maxDist;
					vec3 csOrig = vpos;
					vec3 csEndPoint = csOrig + dir * rayLength;

					vec4 H0 = projMatrix * vec4(csOrig, 1.0);
					vec4 H1 = projMatrix * vec4(csEndPoint, 1.0);

					float k0 = 1.0 / H0.w, k1 = 1.0 / H1.w;

					vec3 Q0 = csOrig.xyz * k0, Q1 = csEndPoint.xyz * k1;

					vec2 P0 = H0.xy * k0, P1 = H1.xy * k1;
					P0 = P0 * 0.5 + vec2(0.5), P1 = P1 * 0.5 + vec2(0.5);
					P0 *= resolution, P1 *= resolution;

					P1 += vec2((distanceSquared(P0, P1) < 0.0001) ? 0.01 : 0.0);
					vec2 delta = P1 - P0;

					// TODO: Try to get rid of this permute
					bool permute = false;
					if (abs(delta.x) < abs(delta.y)) {
						permute = true; delta = delta.yx; P0 = P0.yx; P1 = P1.yx;
					}

					float stepDir = sign(delta.x);
					float invdx = stepDir / delta.x;

					// Derivatives
					vec3 dQ = (Q1 - Q0) * invdx;
					float dk = (k1 - k0) * invdx;
					vec2 dP = vec2(stepDir, delta.y * invdx);

					// Track all values in a vector
					float pixelStride = stride;
					float jitterMod = (gl_FragCoord.x + gl_FragCoord.y) * 0.25;
					vec4 PQK = vec4(P0, Q0.z, k0);
					vec4 dPQK = vec4(dP, dQ.z, dk);
					dPQK *= pixelStride;
					PQK += dPQK * mod(jitterMod, 1.0) * jitter;

					// Variables for completion condition
					float end = P1.x * stepDir;
					float prevZMaxEstimate = PQK.z / PQK.w;
					float rayZMin = prevZMaxEstimate, rayZMax = prevZMaxEstimate;
					float stepped = 0.0;

					vec2 hitUV;
					bool intersected = false;
					for (float stepCount = 1.0; stepCount <= float(MAX_STEPS); stepCount ++) {

						PQK += dPQK;

						rayZMin = prevZMaxEstimate;
						rayZMax = (dPQK.z * 0.5 + PQK.z) / (dPQK.w * 0.5 + PQK.w);
						prevZMaxEstimate = rayZMax;

						// "furter" is "more negative", so max should be further away,
						// or the smaller number
						swapIfBigger(rayZMax, rayZMin);

						stepped = stepCount;
						hitUV = (permute ? PQK.yx: PQK.xy) / resolution;
						if (isOutsideUvBounds(hitUV)) break;

						intersected = doesIntersect(rayZMax, rayZMin, hitUV);

						if (intersected || (P0.x * stepDir) > end) break;
					}

					// Binary search
					if (intersected && pixelStride > 1.0) {

						PQK -= dPQK;
						dPQK /= stride;
						float ogStride = pixelStride * 0.5;
						float currStride = pixelStride;

						prevZMaxEstimate = PQK.z / PQK.w;
						rayZMin = prevZMaxEstimate, rayZMax = prevZMaxEstimate;

						for(int j = 0; j < int(BINARY_SEARCH_ITERATIONS); j ++) {
							PQK += dPQK * currStride;

							rayZMin = prevZMaxEstimate;
							rayZMax = (dPQK.z * 0.5 + PQK.z) / (dPQK.w * 0.5 + PQK.w);
							prevZMaxEstimate = rayZMax;

							swapIfBigger(rayZMax, rayZMin);

							vec2 newUV = (permute ? PQK.yx: PQK.xy) / resolution;
							ogStride *= 0.5;
							if (doesIntersect(rayZMax, rayZMin, newUV)) {
								hitUV = newUV;
								currStride = -ogStride;
							} else {
								currStride = ogStride;
							}

						}
					}

					// Found, blending
					vec4 result = texture2D(sourceBuffer, vUv);
					if (intersected) {
						vec4 col = texture2D(sourceBuffer, hitUV, 10.);

						vec2 ndc = abs(hitUV * 2.0 - 1.0);
						float maxndc = max(ndc.x, ndc.y);
						float fadeVal =
							(1.0 - (max( 0.0, maxndc - 0.4) / (1.0 - 0.4)  )) *
							(1.0 - (stepped / float(MAX_STEPS)));

						// TODO: Add z fade towards camera

						col.a = intensity * fadeVal;
						result = mix(result, col, col.a);
					}

					gl_FragColor = result;

				}
				`

		} );

	}

}
