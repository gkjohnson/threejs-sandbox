
import {
	Scene,
	WebGLRenderer,
	WebGLRenderTarget,
	DepthTexture,
	PerspectiveCamera,
	sRGBEncoding,
	DirectionalLight,
	BoxBufferGeometry,
	PlaneBufferGeometry,
	MeshStandardMaterial,
	Matrix4,
	Mesh,
	PCFSoftShadowMap,
	NearestFilter,
	RGBFormat,
	FloatType,
} from '//unpkg.com/three@0.116.1/build/three.module.js';
import { OrbitControls } from '//unpkg.com/three@0.116.1/examples/jsm/controls/OrbitControls.js';
import { Pass } from '//unpkg.com/three@0.116.1/examples/jsm/postprocessing/Pass.js';
import Stats from '//unpkg.com/three@0.116.1/examples/jsm/libs/stats.module.js';
import dat from '//unpkg.com/dat.gui/build/dat.gui.module.js';

import { RendererState } from './src/RendererState.js';
import { VelocityPass } from '../shader-replacement/src/passes/VelocityPass.js';

let renderer, scene, camera, controls, prevCamMatrixWorld;
let reprojectQuad, copyQuad;
let frontBuffer, backBuffer, colorBuffer, velocityBuffer;
let frontDepth, backDepth;
let velocityPass;
let stats;
let rendererState;

const params = {

	blendOpacity: 1.0,
	autoRender: true,
	rerender() {

	}

};

init();
render();

function init() {

	renderer = new WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = PCFSoftShadowMap;
	renderer.outputEncoding = sRGBEncoding;
	document.body.appendChild(renderer.domElement);

	rendererState = new RendererState();

	colorBuffer = new WebGLRenderTarget( 1, 1, {
		minFilter: NearestFilter,
		magFilter: NearestFilter,
		format: RGBFormat,
	} );

	frontBuffer = new WebGLRenderTarget( 1, 1, {
		minFilter: NearestFilter,
		magFilter: NearestFilter,
		format: RGBFormat,
	} );

	backBuffer = new WebGLRenderTarget( 1, 1, {
		minFilter: NearestFilter,
		magFilter: NearestFilter,
		format: RGBFormat,
	} );

	velocityBuffer = new WebGLRenderTarget( 1, 1,  {
		minFilter: NearestFilter,
		magFilter: NearestFilter,
		format: RGBFormat,
		type: FloatType,
	} );

	frontDepth = new DepthTexture( 1, 1 );

	backDepth = new DepthTexture( 1, 1 );

	scene = new Scene();

	camera = new PerspectiveCamera( 40, 1, 0.1, 2000 );
	camera.position.set( 4, 4, - 10 );

	prevCamMatrixWorld = new Matrix4();

	controls = new OrbitControls( camera, renderer.domElement );

	const directionalLight = new DirectionalLight( 0xffffff, 1.0 );
	directionalLight.position.set( 25, 30, - 35 );
	directionalLight.castShadow = true;
	directionalLight.shadow.mapSize.set( 1024, 1024 );

	scene.add( directionalLight );

	const ground = new Mesh(
		new PlaneBufferGeometry(),
		new MeshStandardMaterial(),
	);
	ground.scale.setScalar( 50 );
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

	const blendMaterial = null;
	reprojectQuad = new Pass.FullScreenQuad( blendMaterial );

	const copyMaterial = null;
	copyQuad = new Pass.FullScreenQuad( copyMaterial );

	velocityPass = new VelocityPass();
	velocityPass.camera = camera;

	stats = new Stats();
	document.body.appendChild( stats.dom );

	const gui = new dat.GUI();
	gui.width = 300;

	gui.add( params, 'autoRender' );
	gui.add( params, 'blendOpacity' ).min( 0.0 ).max( 1.0 ).step( 0.01 );
	gui.add( params, 'rerender' );

	gui.open();

	window.addEventListener( 'resize', onWindowResize, false );
	onWindowResize();

	window.scene = scene;

}

function render() {

	requestAnimationFrame( render );
	stats.update();

	velocityPass.replace( scene, true );
	renderer.render( scene, camera );
	velocityPass.reset( scene, true );
	return;


	// render color frame to colorBuffer with front depth
	colorBuffer.depthTexture = frontDepth;
	renderer.setRenderTarget( colorBuffer );
	renderer.render( scene, camera );

	// render velocity frame
	rendererState.copy( renderer, scene );
	velocityPass.replace( scene, true );

	renderer.setRenderTarget( velocityBuffer );
	renderer.render( scene, camera );

	velocityPass.reset( scene, true );
	rendererState.apply( renderer, scene );

	// blend to front buffer using color, velocity, back buffer, and both depth info
	renderer.setRenderTarget( backBuffer );
	reprojectQuad.render( renderer );

	// copy to screen
	renderer.setRenderTarget( null );
	copyQuad.render( renderer );

	// swap front and back buffer
	[ frontBuffer, backBuffer ] = [ backBuffer, frontBuffer ];

	// swap front and back depth
	[ frontDepth, backDepth ] = [ backDepth, frontDepth ];

	if ( params.autoRender ) {

		prevCamMatrixWorld.copy( camera.matrixWorld );

	}

}

function onWindowResize() {

	const w = window.innerWidth;
	const h = window.innerHeight;

	renderer.setSize( w, h );

	camera.aspect = w / h;
	camera.updateProjectionMatrix();

	frontBuffer.setSize( w, h );
	backBuffer.setSize( w, h );
	velocityBuffer.setSize( w, h );
	// frontDepth.setSize( w, h );
	// backDepth.setSize( w, h );

	// TODO: force rerender

}
