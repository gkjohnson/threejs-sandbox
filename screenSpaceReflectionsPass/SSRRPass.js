/**
 * @author Garrett Johnson / http://gkjohnson.github.io/
 *
 *  Approach from http://jcgt.org/published/0003/04/04/paper.pdf
 */
THREE.SSRRPass = function ( scene, camera, options = {} ) {

	THREE.Pass.call( this );

	this.enabled = true;
	this.needsSwap = true;

	// thickness
	// jitter
	// fade
	// scale

	this.scene = scene;
	this.camera = camera;

	this.debug = {

		display: THREE.SSRRPass.DEFAULT,
		dontUpdateState: false

	};

	// render targets
	this._depthBuffer =
		new THREE.WebGLRenderTarget( 256, 256, {
			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter,
			format: THREE.RGBFormat,
			type: THREE.FloatType
		} );
	this._depthBuffer.texture.name = "SSRRPass.Depth";
	this._depthBuffer.texture.generateMipmaps = false;
	this._depthMaterial = this.createLinearDepthMaterial();

	this._packedBuffer =
		new THREE.WebGLRenderTarget( 256, 256, {
			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter,
			type: THREE.HalfFloatType,
			format: THREE.RGBAFormat
		} );
	this._packedBuffer.texture.name = "SSRRPass.Packed";
	this._packedBuffer.texture.generateMipmaps = false;
	this._packedMaterialPool = [];
	this._nextMaterialIndex = 0;

	this._compositeCamera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
	this._compositeScene = new THREE.Scene();
	this._compositeMaterial = this.getCompositeMaterial();

	this._quad = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), this._compositeMaterial );
	this._quad.frustumCulled = false;
	this._compositeScene.add( this._quad );

};

THREE.SSRRPass.prototype = Object.assign( Object.create( THREE.Pass.prototype ), {

	constructor: THREE.SSRRPass,

	dispose: function () {

		this._depthBuffer.dispose();
		this._packedBuffer.dispose();

	},

	setSize: function ( width, height ) {

		this._depthBuffer.setSize( width, height );
		this._packedBuffer.setSize( width, height );

	},

	getNormalMaterial: function ( m ) {

		if ( this._nextMaterialIndex >= this._packedMaterialPool.length ) {

			this._packedMaterialPool.push( this.createPackedMaterial() );

		}
		var nmat = this._packedMaterialPool[ this._nextMaterialIndex ];

		// setup
		nmat.uniforms.roughnessMap.value = m.roughnessMap || null;
		nmat.uniforms.roughness.value = m.roughness || 0;

		nmat.uniforms.metalnessMap.value = m.metalnessMap || null;
		nmat.uniforms.metalness.value = m.metalness || 0;

		nmat.uniforms.normalMap.value = m.normalMap || null;

		nmat.uniforms.skinning = m.skinning || false;

		this._nextMaterialIndex ++;
		return nmat;

	},

	resetMaterialPool: function () {

		while ( this._packedMaterialPool.length > this._nextMaterialIndex ) {

			this._packedMaterialPool.pop().dispose();

		}

		this._nextMaterialIndex = 0;

	},

	render: function ( renderer, writeBuffer, readBuffer, delta, maskActive ) {

		// Set the clear state
		var prevClearColor = renderer.getClearColor().clone();
		var prevClearAlpha = renderer.getClearAlpha();
		var prevAutoClear = renderer.autoClear;
		renderer.autoClear = true;
		renderer.setClearColor( new THREE.Color( 0, 0, 0 ), 0 );

		// Render normals
		var self = this;
		function recurse( obj ) {

			if ( obj.visible === false ) return;

			if ( obj.type === 'Mesh' || obj.type === 'SkinnedMesh' ) {

				var material = self.getNormalMaterial( obj.material );
				renderer.renderBufferDirect( self.camera, null, obj.geometry, material, obj, null );

			}

			for ( var i = 0, l = obj.children.length; i < l; i ++ ) {

				recurse( obj.children[ i ] );

			}

		}

		renderer.compile( this.scene, this.camera );
		renderer.setRenderTarget( this._packedBuffer );
		renderer.clear( true, true, true );
		recurse( this.scene );
		renderer.setRenderTarget( null );


		// Render depth
		var prevOverride = this.scene.overrideMaterial;
		this.scene.overrideMaterial = this._depthMaterial;
		renderer.render( this.scene, this.camera, this._depthBuffer, true );
		this.scene.overrideMaterial = prevOverride;

		// Composite
		this._compositeMaterial.uniforms.depthBuffer.value = this._depthBuffer.texture;
		this._compositeMaterial.uniforms.packedBuffer.value = this._packedBuffer.texture;
		this._compositeMaterial.uniforms.sourceBuffer.value = readBuffer.texture;
		this._compositeMaterial.uniforms.invProjectionMatrix.value.getInverse( this.camera.projectionMatrix );
		this._compositeMaterial.uniforms.projMatrix.value.copy( this.camera.projectionMatrix );

		this._compositeMaterial.uniforms.resolution.value.set( this._packedBuffer.width, this._packedBuffer.height );

		this._quad.material = this._compositeMaterial;

		renderer.render( this._compositeScene, this._compositeCamera, this.renderToScreen ? null : writeBuffer, true );

		this.resetMaterialPool();

	},

	createLinearDepthMaterial() {


		return new THREE.ShaderMaterial( {

			vertexShader: `
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
				#include <lights_pars_maps>
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

					gl_FragColor = vec4(vViewPosition.z);
				}
			`

		} );


	},

	createPackedMaterial() {

		return new THREE.ShaderMaterial( {

			uniforms: {

				roughnessMap: { value: null },
				roughness: { value: 0 },

				metalnessMap: { value: null },
				metalness: { value: 0 },

				normalMap: { value: null }

			},

			vertexShader: `
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
				#include <lights_pars_maps>
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

					gl_FragColor = vec4( (normal.xy + vec2(1.0, 1.0)) * 0.5, roughnessFactor, metalnessFactor);
				}
			`

		} );

	},

	getCompositeMaterial: function () {

		return new THREE.ShaderMaterial( {

			defines: {

				MAX_STEPS: 100

			},

			uniforms: {
				sourceBuffer: { value: null },
				packedBuffer: { value: null },
				depthBuffer: { value: null },
				invProjectionMatrix: { value: new THREE.Matrix4() },
				projMatrix: { value: new THREE.Matrix4() },

				stride: { value: 20 },
				resolution: { value: new THREE.Vector2() },
				thickness: { value: 1.5 },
				jitter: { value: 1 },
				maxDistance: { value: 100 }
			},

			vertexShader:
				`
				varying vec2 vUv;
				uniform mat4 invProjectionMatrix;
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
				uniform mat4 invProjectionMatrix;
				uniform mat4 projMatrix;
				uniform vec2 resolution;

				uniform float thickness;
				uniform float stride;
				uniform float jitter;
				uniform float maxDistance;

				vec3 Deproject(vec3 p) {
					vec4 res = invProjectionMatrix * vec4(p, 1);
					return res.xyz / res.w;
				}

				vec3 Project(vec3 p) {
					vec4 res = projMatrix * vec4(p, 1);
					return res.xyz / res.w;
				}

				vec3 UnpackNormal(vec4 d) {
					vec3 res = vec3(d.xy, 0.0);
					res.xy *= 2.0;
					res.xy -= vec2(1.0, 1.0);
					res.z = sqrt(1.0 - res.x * res.x - res.y * res.y);
					return res;
				}

				float distanceSquared(vec2 a, vec2 b) { a -= b; return dot(a, a); }
				void swapIfBigger(inout float a, inout float b) {
					if (a > b) {
						float t = a;
						a = b;
						b = a;
					}
				}
				bool isOutsideUvBounds(float x) { return x < 0.0 || x > 1.0; }
				bool isOutsideUvBounds(vec2 uv) { return isOutsideUvBounds(uv.x) || isOutsideUvBounds(uv.y); }

				void main() {

					// [-1, -2000]
					vec2 screenCoord = vUv * 2.0 - vec2(1, 1);
					vec3 ray = Deproject(vec3(screenCoord, -1));
					float nearClip = Deproject(vec3(0, 0, -1)).z;
					ray /= ray.z;

					vec4 result = texture2D(sourceBuffer, vUv);
					vec4 dataSample = texture2D(packedBuffer, vUv);
					float depthSample = texture2D(depthBuffer, vUv).r;

					// view space information
					float vdepth = depthSample;
					vec3 vpos =  vdepth * ray;
					vec3 vnorm = UnpackNormal(dataSample);

					vec3 dir = normalize(reflect(normalize(vpos), normalize(vnorm)));

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

					bool permute = false;
					if (abs(delta.x) < abs(delta.y)) {
						permute = true; delta = delta.yx; P0 = P0.yx; P1 = P1.yx;
					}

					float stepDir = sign(delta.x);
					float invdx = stepDir / delta.x;

					// derivatives
					vec3 dQ = (Q1 - Q0) * invdx;
					float dk = (k1 - k0) * invdx;
					vec2 dP = vec2(stepDir, delta.y * invdx);

					float c = (gl_FragCoord.x + gl_FragCoord.y) * 0.25;
					float j = mod(c, 1.0);

					// float j = 1.0;//rand(gl_FragCoord.xy) - 0.5;
					dP *= stride; dQ *= stride; dk *= stride;
					P0 += dP * j; Q0 += dQ * j; k0 += dk * j;

					vec3 Q = Q0;

					float end = P1.x * stepDir;

					float k = k0, prevZMaxEstimate = csOrig.z;
					float rayZMin = prevZMaxEstimate, rayZMax = prevZMaxEstimate;
					float sceneZMax = rayZMax + 100.0;
					vec2 hitUV;

					float maxSteps = float(MAX_STEPS);
					vec2 P = P0;
					float zThickness = thickness;
					float stepped = 0.0;

					vec4 PQK = vec4(P, Q.z, k);
					vec4 dPQK = vec4(dP, dQ.z, dk);
					bool intersected = false;
					for (float stepCount = 1.0; stepCount <= float(MAX_STEPS); stepCount ++) {

						PQK += dPQK;

						rayZMin = prevZMaxEstimate;
						rayZMax = (dPQK.z * 0.5 + PQK.z) / (dPQK.w * 0.5 + PQK.w);
						prevZMaxEstimate = rayZMax;
						swapIfBigger(rayZMin, rayZMax);

						stepped = stepCount;
						hitUV = (permute ? PQK.yx: PQK.xy) / resolution;
						if (isOutsideUvBounds(hitUV)) break;

						sceneZMax = texture2D(depthBuffer, hitUV).r;
						intersected = !(
							((P.x * stepDir) <= end)
							&& ((rayZMax < sceneZMax - zThickness) || (rayZMin > sceneZMax))
							// && (sceneZMax != 0.0)
						);

						if (intersected) break;
					}

					// TODO: binary search
					if (intersected && stride > 1.0) {

						PQK -= dPQK;
						dPQK /= stride;
						float ogStride = stride * 0.5;
						float currStride = stride;

						for(float j = 0.0; j < 5.0; j ++) {
							PQK += dPQK * currStride;

							rayZMin = prevZMaxEstimate;
							rayZMax = (dPQK.z * 0.5 + PQK.z) / (dPQK.w * 0.5 + PQK.w);
							prevZMaxEstimate = rayZMax;
							swapIfBigger(rayZMin, rayZMax);

							vec2 newUV = (permute ? PQK.yx: PQK.xy) / resolution;
							sceneZMax = texture2D(depthBuffer, newUV).r;
							bool didIntersect = !(
								((P.x * stepDir) <= end)
								&& ((rayZMax < sceneZMax - zThickness) || (rayZMin > sceneZMax))
								// && (sceneZMax != 0.0)
							);

							ogStride *= 0.5;
							if (didIntersect) {
								hitUV = newUV;
								currStride = -ogStride;
							} else {
								currStride = ogStride;
							}
							// currStride = didIntersect ? -ogStride : ogStride;

						}
					}

					// Found, blending
					if (intersected) {
						vec4 col = texture2D(sourceBuffer, hitUV, 10.);

						vec2 ndc = abs(hitUV * 2.0 - 1.0);
						float maxndc = max(ndc.x, ndc.y);
						float fadeVal =
							(1.0 - (max( 0.0, maxndc - 0.4) / (1.0 - 0.4)  )) *
							(1.0 - (stepped / float(MAX_STEPS)));

						// TODO: Add z fade towards camera

						col.a = 0.5 * fadeVal;
						result = mix(result, col, col.a);
					}

					gl_FragColor = result;

				}
				`

		} );

	}

} );

THREE.SSRRPass.DEFAULT = 0;
THREE.SSRRPass.NORMAL = 1;
THREE.SSRRPass.DEPTH = 2;
THREE.SSRRPass.ROUGHNESS = 3;
THREE.SSRRPass.METALNESS = 4;
THREE.SSRRPass.REFLECTION = 5;
