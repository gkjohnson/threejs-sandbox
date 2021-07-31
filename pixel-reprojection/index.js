
import {
	Scene,
	WebGLRenderer,
	WebGLRenderTarget,
	DepthTexture,
	PerspectiveCamera,
	sRGBEncoding,
	DirectionalLight,
	AmbientLight,
	BoxBufferGeometry,
	PlaneBufferGeometry,
	MeshStandardMaterial,
	Mesh,
	PCFSoftShadowMap,
	NearestFilter,
	RGBFormat,
	FloatType,
	MeshBasicMaterial,
	ShaderMaterial,
	UnsignedIntType,
} from '//cdn.skypack.dev/three@0.114.0/build/three.module.js';
import { OrbitControls } from '//cdn.skypack.dev/three@0.114.0/examples/jsm/controls/OrbitControls.js';
import { Pass } from '//cdn.skypack.dev/three@0.114.0/examples/jsm/postprocessing/Pass.js';
import { RoughnessMipmapper } from '//cdn.skypack.dev/three@0.114.0/examples/jsm/utils/RoughnessMipmapper.js';
import { GLTFLoader } from '//cdn.skypack.dev/three@0.114.0/examples/jsm/loaders/GLTFLoader.js';
import Stats from '//cdn.skypack.dev/three@0.114.0/examples/jsm/libs/stats.module.js';
import dat from '//unpkg.com/dat.gui/build/dat.gui.module.js';

import { VelocityPass } from '../shader-replacement/src/passes/VelocityPass.js';
import { ReprojectShader } from './src/ReprojectShader.js';

let renderer, scene, camera, controls;
let reprojectQuad, copyQuad;
let prevColorBuffer, blendTarget, currColorBuffer, velocityBuffer;
let velocityPass;
let stats;

const params = {

	baseOpacity: 0.05,
	blendOpacity: 1.0,
	autoRender: true,
	accumulate: false,
	display: 'cube',
	rerender() {

		updateColor();

	}

};

const models = {
	helmet: null,
	cube: null,
};



init();
animate();

function init() {

	renderer = new WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = PCFSoftShadowMap;
	renderer.outputEncoding = sRGBEncoding;
	document.body.appendChild( renderer.domElement );

	currColorBuffer = new WebGLRenderTarget( 1, 1, {
		format: RGBFormat,
	} );

	prevColorBuffer = new WebGLRenderTarget( 1, 1, {
		format: RGBFormat,
	} );

	blendTarget = new WebGLRenderTarget( 1, 1, {
		format: RGBFormat,
	} );

	velocityBuffer = new WebGLRenderTarget( 1, 1, {
		minFilter: NearestFilter,
		magFilter: NearestFilter,
		format: RGBFormat,
		type: FloatType,
	} );

	currColorBuffer.depthTexture = new DepthTexture( 1, 1, UnsignedIntType );
	prevColorBuffer.depthTexture = new DepthTexture( 1, 1, UnsignedIntType );
	blendTarget.depthTexture = new DepthTexture( 1, 1, UnsignedIntType );

	scene = new Scene();

	camera = new PerspectiveCamera( 40, 1, 0.1, 200 );
	camera.position.set( 4, 4, - 10 );

	controls = new OrbitControls( camera, renderer.domElement );

	const directionalLight = new DirectionalLight( 0xffffff, 1.0 );
	directionalLight.position.set( 25, 30, - 35 );
	directionalLight.castShadow = true;
	directionalLight.shadow.mapSize.set( 1024, 1024 );
	scene.add( directionalLight );

	const ambientLight = new AmbientLight( 0xffffff, 0.3 );
	scene.add( ambientLight );

	const ground = new Mesh(
		new PlaneBufferGeometry(),
		new MeshStandardMaterial(),
	);
	ground.scale.setScalar( 10 );
	ground.rotation.x = - Math.PI / 2;
	ground.receiveShadow = true;
	scene.add( ground );

	const box = new Mesh(
		new BoxBufferGeometry(),
		new MeshStandardMaterial( { color: 0xff0000 } ),
	);
	box.position.y = 0.5;
	box.receiveShadow = true;
	box.castShadow = true;
	scene.add( box );

	models.cube = box;

	new GLTFLoader().load(
		'https://rawgit.com/mrdoob/three.js/master/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf',
		gltf => {

			const roughnessMipmapper = new RoughnessMipmapper( renderer );

			gltf.scene.traverse( function ( child ) {

				if ( child.isMesh ) {

					roughnessMipmapper.generateMipmaps( child.material );
					child.castShadow = true;
					child.receiveShadow = true;

				}

			} );

			scene.add( gltf.scene );

			roughnessMipmapper.dispose();

			models.helmet = gltf.scene;
			gltf.scene.position.y = 1;

		}
	);

	const repreojectMaterial = new ShaderMaterial( ReprojectShader );
	reprojectQuad = new Pass.FullScreenQuad( repreojectMaterial );

	const copyMaterial = new MeshBasicMaterial();
	copyQuad = new Pass.FullScreenQuad( copyMaterial );

	velocityPass = new VelocityPass();
	velocityPass.camera = camera;

	stats = new Stats();
	document.body.appendChild( stats.dom );

	const gui = new dat.GUI();
	gui.width = 300;

	gui.add( params, 'autoRender' ).onChange( () => {

		velocityPass.updateTransforms();

		[ prevColorBuffer, currColorBuffer ] = [ currColorBuffer, prevColorBuffer ];

	} );
	gui.add( params, 'baseOpacity' ).min( 0.0 ).max( 1.0 ).step( 0.01 );
	gui.add( params, 'blendOpacity' ).min( 0.0 ).max( 1.0 ).step( 0.01 );
	gui.add( params, 'accumulate' );
	gui.add( params, 'display', Object.keys( models ) );
	gui.add( params, 'rerender' );

	gui.open();

	window.addEventListener( 'resize', onWindowResize, false );
	onWindowResize();

	window.scene = scene;

}

function animate() {

	requestAnimationFrame( animate );
	render();

}

function render() {

	// For some reason not having the cube render causes display webgl issues?
	// specifically the velocity shader.
	for ( const key in models ) {

		const model = models[ key ];
		if ( model ) {

			model.visible = key === params.display;

		}

	}

	stats.update();

	// render color frame to colorBuffer with front depth
	renderer.setRenderTarget( currColorBuffer );
	renderer.render( scene, camera );

	// render velocity frame
	renderer.setRenderTarget( velocityBuffer );

	velocityPass.autoUpdate = false;
	velocityPass.replace( scene, true );
	renderer.render( scene, camera );
	velocityPass.reset( scene, true );
	window.velocityPass = velocityPass;

	// blend to blend target using color, prevColor, velocity, and both depth info
	renderer.setRenderTarget( blendTarget );

	// reprojectQuad.material.uniforms.prevInvProjectionMatrix.value.getInverse( velocityPass.prevProjectionMatrix );
	// reprojectQuad.material.uniforms.prevInvCameraMatrix.value.getInverse( velocityPass.prevViewMatrix );

	// reprojectQuad.material.uniforms.currProjectionMatrix.value.copy( camera.projectionMatrix );
	// reprojectQuad.material.uniforms.currCameraMatrix.value.copy( camera.matrixWorldInverse );

	reprojectQuad.material.uniforms.prevProjectionMatrix.value.copy( velocityPass.prevProjectionMatrix );
	reprojectQuad.material.uniforms.prevCameraMatrix.value.copy( velocityPass.prevViewMatrix );

	reprojectQuad.material.uniforms.currInvProjectionMatrix.value.getInverse( camera.projectionMatrix );
	reprojectQuad.material.uniforms.currInvCameraMatrix.value.getInverse( camera.matrixWorldInverse );

	reprojectQuad.material.uniforms.blendOpacity.value = params.blendOpacity;
	reprojectQuad.material.uniforms.baseOpacity.value = params.baseOpacity;
	reprojectQuad.material.uniforms.velocityBuffer.value = velocityBuffer.texture;

	reprojectQuad.material.uniforms.currColorBuffer.value = currColorBuffer.texture;
	reprojectQuad.material.uniforms.prevColorBuffer.value = prevColorBuffer.texture;

	reprojectQuad.material.uniforms.currDepthBuffer.value = currColorBuffer.depthTexture;
	reprojectQuad.material.uniforms.prevDepthBuffer.value = prevColorBuffer.depthTexture;

	renderer.getSize( reprojectQuad.material.uniforms.resolution.value );

	reprojectQuad.render( renderer );

	// copy to screen
	renderer.setRenderTarget( null );
	copyQuad.material.map = blendTarget.texture;
	copyQuad.render( renderer );

	if ( params.autoRender ) {

		// swap front and back buffer
		[ prevColorBuffer, currColorBuffer ] = [ currColorBuffer, prevColorBuffer ];

		velocityPass.updateTransforms();

	}

	// Accumulate depends on changing the depth buffer see mrdoob/three.js#19447
	if ( params.accumulate ) {

		[ prevColorBuffer, blendTarget ] = [ blendTarget, prevColorBuffer ];

	}

}

function updateColor() {

	// render color frame to colorBuffer with front depth
	renderer.setRenderTarget( prevColorBuffer );
	renderer.render( scene, camera );

	velocityPass.updateTransforms();

}

function onWindowResize() {

	let w = window.innerWidth;
	let h = window.innerHeight;

	renderer.setSize( w, h );
	renderer.setPixelRatio( window.devicePixelRatio );

	w *= renderer.getPixelRatio();
	h *= renderer.getPixelRatio();

	camera.aspect = w / h;
	camera.updateProjectionMatrix();

	currColorBuffer.setSize( w, h );
	prevColorBuffer.setSize( w, h );
	blendTarget.setSize( w, h );
	velocityBuffer.setSize( w, h );

}
