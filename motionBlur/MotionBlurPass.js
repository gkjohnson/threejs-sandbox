/**
 * @author Garrett Johnson / http://gkjohnson.github.io/
 *
 *  Approach from http://john-chapman-graphics.blogspot.com/2013/01/per-object-motion-blur.html
 */
THREE.MotionBlurPass = function ( scene, camera, options = {} ) {

	THREE.Pass.call( this );

	this.enabled = true;
	this.needsSwap = false;

	// settings
	this.blurSamples = 30;
	this.expand = 1;
	this.intensity = 1;
	this.scene = scene;
	this.camera = camera;

	this.debug = {

		display: THREE.MotionBlurPass.DEFAULT

	};

	// list of positions from previous frames
	this._prevPosMap = new WeakMap();

	// render targets
	this._velocityBuffer =
		new THREE.WebGLRenderTarget( 256, 256, {
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			format: THREE.RGBFormat,
			type: THREE.HalfFloatType
		} );
	this._velocityBuffer.texture.name = "MotionBlurPass";
	this._velocityBuffer.texture.generateMipmaps = false;

	this._prevCamProjection = new THREE.Matrix4();
	this._prevCamWorldInverse = new THREE.Matrix4();

	this._velocityMaterial = this.getVelocityMaterial();
	this._geomMaterial = this.getGeometryMaterial();
	this._compositeMaterial = this.getCompositeMaterial();

	this._compositeCamera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
	this._compositeScene = new THREE.Scene();

	this._quad = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), this._compositeMaterial );
	this._quad.frustumCulled = false;
	this._compositeScene.add( this._quad );

};

THREE.MotionBlurPass.prototype = Object.assign( Object.create( THREE.Pass.prototype ), {

	constructor: THREE.MotionBlurPass,

	dispose: function () {

		this._velocityBuffer.dispose();

	},

	setSize: function ( width, height ) {

		this._velocityBuffer.setSize( width, height );

	},

	render: function ( renderer, writeBuffer, readBuffer, delta, maskActive ) {

		// Set the clear state
		var prevClearColor = renderer.getClearColor().clone();
		var prevClearAlpha = renderer.getClearAlpha();
		var prevAutoClear = renderer.autoClear;
		renderer.autoClear = false;
		renderer.setClearColor( new THREE.Color( 0, 0, 0 ), 0 );

		// Traversal function for iterating down and rendering the scene
		var self = this;
		function recurse( obj ) {

			if ( obj.isVisible === false ) return;

			if ( obj.type === 'Mesh' ) {

				var prevMat = self._prevPosMap.get( obj );
				if ( prevMat === undefined ) {

					prevMat = obj.matrixWorld.clone();
					self._prevPosMap.set( obj, prevMat );

				}

				var mat = self.debug.display === THREE.MotionBlurPass.GEOMETRY ? self._geomMaterial : self._velocityMaterial;

				// TODO: if we render multiple instances of the mesh we may get a better blur that includes the background
				mat.uniforms.prevProjectionMatrix.value.copy( self._prevCamProjection );
				mat.uniforms.prevModelViewMatrix.value.multiplyMatrices( self._prevCamWorldInverse, prevMat );

				renderer.renderBufferDirect( self.camera, null, obj.geometry, mat, obj, null );
				prevMat.copy( obj.matrixWorld );

			}

			for ( var i = 0, l = obj.children.length; i < l; i ++ ) {

				recurse( obj.children[ i ] );

			}

		}

		// Update the materials and render to the target
		this._velocityMaterial.uniforms.expand.value = this.expand * 0.1;
		this._geomMaterial.uniforms.expand.value = this.expand * 0.1;

		renderer.compile( this.scene, this.camera );

		// If we're rendering the blurred view, then we need to render
		// to the velocity buffer, otherwise we can render a debug view
		if ( this.debug.display === THREE.MotionBlurPass.DEFAULT ) {

			renderer.setRenderTarget( this._velocityBuffer );

		} else {

			renderer.setRenderTarget( this.renderToScreen ? null : writeBuffer );

		}

		renderer.clear();
		recurse( this.scene );

		this._prevCamWorldInverse.copy( this.camera.matrixWorldInverse );
		this._prevCamProjection.copy( this.camera.projectionMatrix );
		// TODO: remove any un-traversed matrices

		var cmat = this._compositeMaterial;
		cmat.uniforms.sourceBuffer.value = readBuffer;
		cmat.uniforms.velocityBuffer.value = this._velocityBuffer;

		if ( cmat.defines.SAMPLES !== this.blurSamples ) {

			cmat.defines.SAMPLES = Math.max( 0, Math.floor( this.blurSamples ) );
			cmat.needsUpdate = true;

		}
		cmat.uniforms.intensity.value = this.intensity;

		// compose the final blurred frame
		if ( this.debug.display === THREE.MotionBlurPass.DEFAULT ) {

			renderer.render( this._compositeScene, this._compositeCamera, this.renderToScreen ? null : writeBuffer, true );

		}

		// Restore renderer settings
		renderer.setClearColor( prevClearColor, prevClearAlpha );
		renderer.autoClear = prevAutoClear;

	},

	getVelocityMaterial: function () {

		return new THREE.ShaderMaterial( {

			uniforms: {
				"prevProjectionMatrix": { value: new THREE.Matrix4() },
				"prevModelViewMatrix": { value: new THREE.Matrix4() },
				"expand": { value: 1 }
			},

			vertexShader:
				`
				uniform mat4 prevProjectionMatrix;
				uniform mat4 prevModelViewMatrix;
				uniform float expand;
				varying vec4 prevPosition;
				varying vec4 newPosition;
				void main() {

					vec4 p1 = prevModelViewMatrix * vec4(position, 1.0);
					vec4 p2 = modelViewMatrix * vec4(position, 1.0);

					vec3 delta = p2.xyz - p1.xyz;
					vec3 n = normalize((modelViewMatrix * vec4(normal.xyz, 0)).xyz);
					float dot = clamp(dot(delta, n), -1., 1.);

					vec4 dir = vec4(delta, 0) * dot * expand;
					prevPosition = prevProjectionMatrix * (p1 + dir);
					newPosition = projectionMatrix * (p2 + dir);

					gl_Position = newPosition;

				}`,

			fragmentShader:
				`
				varying vec4 prevPosition;
				varying vec4 newPosition;

				void main() {
					vec4 vel;
					// TODO: Account for skinned meshes
					// NOTE: 0 is in the middle of the screen.
					// The velocities here are small b/c the positions are [-1, 1], so the velocities
					// are [-2, 2], but that will be extreme (all the way from left to right of the screen)
					vel.xyz = (newPosition.xyz / newPosition.w) - (prevPosition.xyz / prevPosition.w);

					vel.w = 1.0;
					gl_FragColor = vel;
				}`
		} );

	},

	getGeometryMaterial: function () {

		return new THREE.ShaderMaterial( {

			uniforms: {
				"prevProjectionMatrix": { value: new THREE.Matrix4() },
				"prevModelViewMatrix": { value: new THREE.Matrix4() },
				"expand": { value: 1 }
			},

			vertexShader:
				`
				uniform mat4 prevProjectionMatrix;
				uniform mat4 prevModelViewMatrix;
				uniform float expand;
				varying vec4 prevPosition;
				varying vec4 newPosition;
				varying vec3 vNormal;
				void main() {

					vNormal = (modelViewMatrix * vec4(normal.xyz, 0)).xyz;

					vec4 p1 = prevModelViewMatrix * vec4(position, 1.0);
					vec4 p2 = modelViewMatrix * vec4(position, 1.0);

					vec3 delta = p2.xyz - p1.xyz;
					vec3 n = normalize((modelViewMatrix * vec4(normal.xyz, 0)).xyz);
					float dot = clamp(dot(delta, n), -1., 1.);

					vec4 dir = vec4(delta, 0) * dot * expand;
					prevPosition = prevProjectionMatrix * (p1 + dir);
					newPosition = projectionMatrix * (p2 + dir);

					gl_Position = newPosition;

				}`,

			fragmentShader:
				`
				varying vec3 vNormal;

				void main() {
					gl_FragColor = vec4(vNormal, 1);
				}`
		} );

	},

	getCompositeMaterial: function () {

		return new THREE.ShaderMaterial( {

			defines: {
				SAMPLES: 30
			},

			uniforms: {
				"sourceBuffer": { value: null },
				"velocityBuffer": { value: null },
				"intensity": { value: 1 }
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
				varying vec2 vUv;
				uniform sampler2D sourceBuffer;
				uniform sampler2D velocityBuffer;
				uniform float intensity;
				void main() {

					vec2 vel = texture2D(velocityBuffer, vUv).xy;
					vec4 result = texture2D(sourceBuffer, vUv);

					for(int i = 1; i <= SAMPLES; i ++) {

						vec2 offset = intensity * vel * (float(i - 1) / float(SAMPLES) - 0.5);
						result += texture2D(sourceBuffer, vUv + offset);

					}

					result /= float(SAMPLES + 1);

					gl_FragColor = result;

				}
				`

		} );

	}

} );

THREE.MotionBlurPass.DEFAULT = 0;
THREE.MotionBlurPass.VELOCITY = 1;
THREE.MotionBlurPass.GEOMETRY = 2;
