
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
	MeshBasicMaterial,
	ShaderMaterial,
	UnsignedIntType,
} from '//unpkg.com/three@0.116.1/build/three.module.js';
import { OrbitControls } from '//unpkg.com/three@0.116.1/examples/jsm/controls/OrbitControls.js';
import { Pass } from '//unpkg.com/three@0.116.1/examples/jsm/postprocessing/Pass.js';
import Stats from '//unpkg.com/three@0.116.1/examples/jsm/libs/stats.module.js';
import dat from '//unpkg.com/dat.gui/build/dat.gui.module.js';

import { RendererState } from './src/RendererState.js';
import { VelocityPass } from '../shader-replacement/src/passes/VelocityPass.js';

let renderer, scene, camera, controls, prevCamMatrixWorld;
let reprojectQuad, copyQuad;
let prevColorBuffer, blendTarget, currColorBuffer, velocityBuffer;
let currDepth, prevDepth;
let velocityPass;
let stats;
let rendererState;

const params = {

	blendOpacity: 0.05,
	autoRender: true,
	rerender() {

		updateColor();

	}

};

const reprojectShader = {

	uniforms: {

		opacity: { value: 1 },
		velocityBuffer: { value: null },

		prevColorBuffer: { value: null },
		currColorBuffer: { value: null },

		prevDepthBuffer: { value: null },
		currDepthBuffer: { value: null },

		prevInvProjectionMatrix: { value: new Matrix4() },
		prevInvCameraMatrix: { value: new Matrix4() },

		currProjectionMatrix: { value: new Matrix4() },
		currCameraMatrix: { value: new Matrix4() },

	},
	vertexShader: /* glsl */`
		varying vec2 vUv;
		void main() {

			#include <begin_vertex>
			#include <project_vertex>
			vUv = uv;

		}
	`,
	fragmentShader: /* glsl */`
		varying vec2 vUv;
		uniform sampler2D velocityBuffer;

		uniform sampler2D currColorBuffer;
		uniform sampler2D prevColorBuffer;

		uniform sampler2D prevDepthBuffer;
		uniform sampler2D currDepthBuffer;

		uniform mat4 prevInvProjectionMatrix;
		uniform mat4 prevInvCameraMatrix;

		uniform mat4 currProjectionMatrix;
		uniform mat4 currCameraMatrix;

		uniform float opacity;

		void main() {

			vec2 velocity = texture2D( velocityBuffer, vUv ).xy;
			vec2 prevUv = vUv - velocity;

			vec4 currSample = texture2D( currColorBuffer, vUv );
			vec4 prevSample = texture2D( prevColorBuffer, prevUv );

			float currDepth = texture2D( currDepthBuffer, vUv ).r;
			float prevDepth = texture2D( prevDepthBuffer, prevUv ).r;

			float alpha = 1.0;
			if (
				prevDepth >= 1.0 ||
				prevDepth <= 0.0 ||
				prevUv.x > 1.0 || prevUv.x < 0.0 ||
				prevUv.y > 1.0 || prevUv.y < 0.0
			) {

				// gl_FragColor = vec4( 0.0, 1.0, 0.0, 1.0 );
				// return;
				alpha = 0.0;

			}

			vec4 prevNdc = vec4(
				( prevUv.x - 0.5 ) * 2.0,
				( prevUv.y - 0.5 ) * 2.0,
				( prevDepth - 0.5 ) * 2.0,
				1.0
			);
			prevNdc = prevInvProjectionMatrix * prevNdc;
			prevNdc /= prevNdc.w;

			prevNdc = prevInvCameraMatrix * prevNdc;
			prevNdc = currCameraMatrix * prevNdc;

			prevNdc = currProjectionMatrix * prevNdc;
			prevNdc /= prevNdc.w;

			float reprojectedPrevDepth = ( prevNdc.z / 2.0 ) + 0.5;

			float t = abs( reprojectedPrevDepth - currDepth ) < 1e-4 ? 1.0 : 0.0;

			gl_FragColor = mix( currSample * opacity, prevSample , t * alpha );

			// gl_FragColor = vec4(
			// 	reprojectedPrevDepth < 0.99 ? 1.0 : 0.0,
			// 	0.0,
			// 	currDepth < 0.99 ? 1.0 : 0.0,
			// 	1.0 );

		}
	`,

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

	currColorBuffer = new WebGLRenderTarget( 1, 1, {
		minFilter: NearestFilter,
		magFilter: NearestFilter,
		format: RGBFormat,
	} );

	prevColorBuffer = new WebGLRenderTarget( 1, 1, {
		minFilter: NearestFilter,
		magFilter: NearestFilter,
		format: RGBFormat,
	} );

	blendTarget = new WebGLRenderTarget( 1, 1, {
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

	currDepth = new DepthTexture( 1, 1, UnsignedIntType );

	prevDepth = new DepthTexture( 1, 1, UnsignedIntType );

	scene = new Scene();

	camera = new PerspectiveCamera( 40, 1, 0.1, 200 );
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

	const repreojectMaterial = new ShaderMaterial( reprojectShader );
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

		velocityPass.updateCameraMatrix();

		[ prevColorBuffer, currColorBuffer ] = [ currColorBuffer, prevColorBuffer ];
		[ currDepth, prevDepth ] = [ prevDepth, currDepth ];

	} );
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

	// render color frame to colorBuffer with front depth
	currColorBuffer.depthTexture = currDepth;
	renderer.setRenderTarget( currColorBuffer );
	renderer.render( scene, camera );

	// render velocity frame
	renderer.setRenderTarget( velocityBuffer );

	rendererState.copy( renderer, scene );
	velocityPass.autoUpdateCameraMatrix = params.autoRender;
	velocityPass.replace( scene, true );
	renderer.render( scene, camera );
	velocityPass.reset( scene, true );
	rendererState.apply( renderer, scene );

	// blend to front buffer using color, velocity, back buffer, and both depth info
	renderer.setRenderTarget( blendTarget );

	reprojectQuad.material.uniforms.prevInvProjectionMatrix.value.getInverse( velocityPass.prevProjectionMatrix );
	reprojectQuad.material.uniforms.prevInvCameraMatrix.value.getInverse( velocityPass.prevViewMatrix );

	reprojectQuad.material.uniforms.currProjectionMatrix.value.copy( camera.projectionMatrix );
	reprojectQuad.material.uniforms.currCameraMatrix.value.copy( camera.matrixWorldInverse );

	reprojectQuad.material.uniforms.opacity.value = params.blendOpacity;
	reprojectQuad.material.uniforms.velocityBuffer.value = velocityBuffer.texture;

	reprojectQuad.material.uniforms.currColorBuffer.value = currColorBuffer.texture;
	reprojectQuad.material.uniforms.prevColorBuffer.value = prevColorBuffer.texture;

	reprojectQuad.material.uniforms.currDepthBuffer.value = currDepth;
	reprojectQuad.material.uniforms.prevDepthBuffer.value = prevDepth;

	reprojectQuad.render( renderer );

	// copy to screen
	renderer.setRenderTarget( null );
	copyQuad.material.map = blendTarget.texture;
	copyQuad.render( renderer );

	if ( params.autoRender ) {

		// swap front and back buffer
		[ prevColorBuffer, currColorBuffer ] = [ currColorBuffer, prevColorBuffer ];

		// swap front and back depth
		[ currDepth, prevDepth ] = [ prevDepth, currDepth ];

	}

}

function updateColor() {

	// render color frame to colorBuffer with front depth
	prevColorBuffer.depthTexture = prevDepth;
	renderer.setRenderTarget( prevColorBuffer );
	renderer.render( scene, camera );

	velocityPass.updateCameraMatrix();

}

function onWindowResize() {

	let w = window.innerWidth;
	let h = window.innerHeight;

	renderer.setSize( w, h );

	w *= renderer.getPixelRatio();
	h *= renderer.getPixelRatio();

	camera.aspect = w / h;
	camera.updateProjectionMatrix();

	currColorBuffer.setSize( w, h );
	prevColorBuffer.setSize( w, h );
	blendTarget.setSize( w, h );
	velocityBuffer.setSize( w, h );

}
