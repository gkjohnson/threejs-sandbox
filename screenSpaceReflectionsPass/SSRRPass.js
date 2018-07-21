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
			format: THREE.RGBAFormat
		} );
	this._depthBuffer.texture.name = "SSRRPass.Depth";
	this._depthBuffer.texture.generateMipmaps = false;
	this._depthMaterial = new THREE.MeshDepthMaterial();
	this._depthMaterial.depthPacking = THREE.RGBADepthPacking;

	this._normalBuffer =
		new THREE.WebGLRenderTarget( 256, 256, {
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			format: THREE.RGBAFormat
		} );
	this._normalBuffer.texture.name = "SSRRPass.Normal";
	this._normalBuffer.texture.generateMipmaps = false;

	this._compositeCamera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
	this._compositeScene = new THREE.Scene();

	this._quad = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), this._compositeMaterial );
	this._quad.frustumCulled = false;
	this._compositeScene.add( this._quad );

};

THREE.SSRRPass.prototype = Object.assign( Object.create( THREE.Pass.prototype ), {

	constructor: THREE.SSRRPass,

	dispose: function () {

		this._depthBuffer.dispose();
		this._normalBuffer.dispose();

	},

	setSize: function ( width, height ) {

		this._depthBuffer.setSize( width, height );
		this._normalBuffer.setSize( width, height );

	},

	getNormalMaterial: function ( material ) {

		this._normalMaterialPool = this._normalMaterialPool || [];
		this._nextMaterialIndex = this._nextMaterialIndex || 0;

		if ( this._nextMaterialIndex >= this._normalMaterial.length ) {

			this._normalMaterialPool.push( new THREE.MeshNormalMaterial() );

		}
		var material = this._normalMaterial[ this._nextMaterialIndex ];

		// setup

		this._nextMaterialIndex ++;
		return material;

	},

	resetMaterialPool: function () {

		while ( this._normalMaterialPool.length > this._nextMaterialIndex ) {

			this._normalMaterialPool.pop().dispose();

		}

		this._nextMaterialIndex = 0;

	},

	render: function ( renderer, writeBuffer, readBuffer, delta, maskActive ) {

		// Set the clear state
		var prevClearColor = renderer.getClearColor().clone();
		var prevClearAlpha = renderer.getClearAlpha();
		var prevAutoClear = renderer.autoClear;
		renderer.autoClear = false;
		renderer.setClearColor( new THREE.Color( 0, 0, 0 ), 0 );

		// Render normals

		// Render depth
		var prevOverride = this.scene.overrideMaterial;
		this.scene.overrideMaterial = this._depthMaterial;
		renderer.render( this.scene, this.camera, null );
		this.scene.overrideMaterial = prevOverride;

		// Composite

		this.resetMaterialPool();

	}

} );

THREE.SSRRPass.DEFAULT = 0;
THREE.SSRRPass.NORMAL = 1;
THREE.SSRRPass.DEPTH = 2;
THREE.SSRRPass.REFLECTION = 3;
