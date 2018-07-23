/**
 * @author Garrett Johnson / http://gkjohnson.github.io/
 *
 *  Approach from http://john-chapman-graphics.blogspot.com/2013/01/per-object-motion-blur.html
 */
THREE.SSRRPass = function ( scene, camera, options = {} ) {

	THREE.Pass.call( this );

	this.enabled = true;
	this.needsSwap = false;

	this.scene = scene;
	this.camera = camera;

	this.debug = {

		display: THREE.SSRRPass.DEFAULT,
		dontUpdateState: false

	};

	// render targets
	this._depthBuffer =
		new THREE.WebGLRenderTarget( 256, 256, {
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			format: THREE.RGBAFormat,
			type: THREE.FloatType
		} );
	this._depthBuffer.texture.name = "SSRRPass.Depth";
	this._depthBuffer.texture.generateMipmaps = false;
	this._depthMaterial = new THREE.MeshDepthMaterial();
	// this._depthMaterial.depthPacking = THREE.RGBADepthPacking;

	this._packedBuffer =
		new THREE.WebGLRenderTarget( 256, 256, {
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
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

	console.log(this.camera)

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
		this._quad.material = this._compositeMaterial;

		renderer.render( this._compositeScene, this._compositeCamera, null, true );

		this.resetMaterialPool();

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
					vViewPosition = - mvPosition.xyz;
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

					// if (vViewPosition.x > 5.0) {
					// 	gl_FragColor.x = 1.;
					// 	return;
					// }

					gl_FragColor = vec4( (normal.xy + vec2(1.0, 1.0)) * 0.5, roughnessFactor, metalnessFactor );
				}
			`

		} );

	},

	getCompositeMaterial: function () {

		return new THREE.ShaderMaterial( {

			uniforms: {
				sourceBuffer: { value: null },
				packedBuffer: { value: null },
				depthBuffer: { value: null },
				invProjectionMatrix: { value: new THREE.Matrix4() },
				projMatrix: { value: new THREE.Matrix4() }
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
				uniform mat4 invProjectionMatrix;
				uniform mat4 projMatrix;

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

				void main() {

					vec4 result = texture2D(sourceBuffer, vUv);
					vec4 depthSample = texture2D(depthBuffer, vUv);
					vec4 dataSample = texture2D(packedBuffer, vUv);

					// view space information
					vec2 uv = vUv * 2.0 - vec2(1, 1);
					vec3 vpos = Deproject(vec3(gl_FragCoord.xy, depthSample.r));


					if (vpos.x < 10.0) {
						gl_FragColor.x = 1.;
						return;
					}

					gl_FragColor = dataSample;
					return;

					vec3 vnorm = normalize(UnpackNormal(dataSample));



					vec3 temp = vpos;
					// temp.z *= -1.;
					// temp.y *= -1.;
					// temp *= -1.;
					vec3 dir = reflect(normalize(temp), vnorm);
					// dir.z *= -1.;
					// vnorm.z *= -1.0;

					dir = vec3(1,0,0);


					// FORWARD IS NEGATIVE
					// vpos.z -= 10.5;
					// gl_FragColor = vec4(-vpos.b / 100., 0, 0, 1);
					// gl_FragColor = vec4(vpos, 1);
					// gl_FragColor.z -= 2.;
					// return;


					vec4 col;
					for (int i = 0; i < 100; i ++) {

						vpos += dir * 0.01;

						vec3 pro = Project(vpos);
						vec2 newUv = pro.xy * 0.5 + vec2(0.5, 0.5);
						float dep = texture2D(depthBuffer, newUv).r;

						// gl_FragColor = vec4(dir, 1.0);
						// return;

						if ( dep > 0.1 ) {
							dep = 0.;
						}

						if ( pro.b + 1e-7 < dep ) {
							col = texture2D(sourceBuffer, newUv);
							col.a = .5;
							// return;
						}

						// gl_FragColor = vec4(pro.b, 0, 0, 0);
						// gl_FragColor = vec4(vUv.xy, 0, 0);

					}


					gl_FragColor = mix(result, col, col.a);

					// if (depthSample.r > .9) gl_FragColor = vec4(depthSample.r, 0,0,0);
					// else gl_FragColor = vec4(0, 1.,0,0);

					// gl_FragColor = vec4(-vpos.b / 10., 0,0,1);






					// vpos += dir * 0.001;
					// vec4 col = vec4(0,0,0,0);
					// for (int i = 0; i < 50; i ++) {

					// 	vpos += dir * 0.01;

					// 	vec3 pro = Project(vpos);
					// 	vec2 newUv = pro.xy * 0.5 + vec2(0.5, 0.5);
					// 	float dep = texture2D(depthBuffer, newUv).r;

					// 	if (dep > pro.b) {
					// 		col = texture2D(sourceBuffer, newUv);// * 0.1 + result;
					// 		// col.b = 1.;
					// 		col.a = 1.;
					// 		// col.
					// 		break;
					// 	}

					// 	// }

					// 	// gl_FragColor()

					// }

					// gl_FragColor = col;
					// // result = vec4(ct / 20.,0,0,0);
					// result.xyz = mix(result.xyz, col.xyz, col.a);
					// gl_FragColor = result;
					// // gl_FragColor = vec4(ct / 100. ,0,0,0);

					// vec3 a = Project(vpos);

					// // gl_FragColor = vec4(a.b,0,0,1);





					// // vec3
					// // gl_FragColor = vec4(vUv * 2.0 - vec2(1.0, 1.0), 0, 0);
					// // gl_FragColor = vec4(rayDir, 0);



					// float roughness = dataSample.z;
					// float metalness = dataSample.w;
					// vec3 normal = UnpackNormal(dataSample);

					// // gl_FragColor = vec4(normal, 0.0);
					// // gl_FragColor = result;
					// // gl_FragColor = result;
					// // // gl_FragColor = vec4(depth, depth, depth, 1);
					// // gl_FragColor = depthSample;

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
