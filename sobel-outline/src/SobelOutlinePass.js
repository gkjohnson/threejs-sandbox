import {
	Color,
	ShaderMaterial,
	WebGLRenderTarget,
	NearestFilter,
	RGBAFormat,
	HalfFloatType,
	RGBFormat,
	Math as MathUtils,
	DataTexture,
	RepeatWrapping,
	LinearFilter,
} from '//unpkg.com/three@0.114.0/build/three.module.js';
import { Pass } from '//unpkg.com/three@0.114.0/examples/jsm/postprocessing/Pass.js';
import { NormalPass } from '../../shader-replacement/src/passes/NormalPass.js';
import { LinearDepthPass } from './LinearDepthPass.js';

class SobelOutlinePass extends Pass {

	constructor( scene, camera ) {
		
		super();
		this.enabled = true;
		this.swap = true;
		
		this.scene = scene;
		this.camera = camera;
		
		this.normalOutlineThickness = 1;
		this.normalBias = 0;

		this.depthOutlineThickness = 1;
		this.depthOutlinePosition = 0;
		this.depthBias = 0;
		
		this._depthBuffer = null;
		this._normalBuffer = null;
		
	}

	render( renderer, writeBuffer, readBuffer ) {
	
		// render depth
		
		// render normals
		
		// composite final render
	
	}

	setSize( width, height ) {

		this._depthBuffer.setSize( width, height );
		this._normalBuffer.setSize( width, height );

	}

	dispose() {

		this._depthBuffer.dispose();
		this._normalBuffer.dispose();

	}

}

SobelOutlinePass.CENTER = 0;
SobelOutlinePass.OUTSIDE = 1;
SobelOutlinePass.INSIDE = 2;

SobelOutlinePass.DEFAULT = 0;
SobelOutlinePass.OUTLINES_ONLY = 1;
