import { RGBAFormat, FloatType, WebGLRenderer, WebGLRenderTarget, Vector2 } from '//unpkg.com/three@0.114.0/build/three.module.js';
import { CanvasInspector } from './CanvasInspector.js';

const VISIBLE_SYMBOL = Symbol();
const MATERIAL_SYMBOL = Symbol();

const inspector = new CanvasInspector();

const vec2 = new Vector2();
function render( scene, camera ) {

	const debugMaterial = this.debugMaterial;
	let found = false;
	if ( this.enableDebug ) {

		scene.traverse( c => {

			if ( c.material ) {

				found = found || c.material === debugMaterial || c.material === debugMaterial.targetMaterial;

			}

		} );

	}

	if ( found && debugMaterial ) {

		scene.traverse( c => {

			if ( c.material ) {

				c[ VISIBLE_SYMBOL ] = c.visible;
				c[ MATERIAL_SYMBOL ] = c.material;

				if ( c.material === debugMaterial || c.material === debugMaterial.targetMaterial ) {

					c.material = debugMaterial;

				} else {

					c.visible = false;

				}

			}

		} );

		const originalClearColor = this.getClearColor();
		const originalClearAlpha = this.clearAlpha;
		const originalBackground = scene.background;

		this.setClearAlpha( 0 );
		this.setClearColor( 0 );
		scene.background = null;

		this._render( scene, camera );
		this._updateReadTarget( scene, camera );

		this.setClearAlpha( originalClearAlpha );
		this.setClearColor( originalClearColor );
		scene.background = originalBackground;

		scene.traverse( c => {

			if ( c.material ) {

				c.visible = c[ VISIBLE_SYMBOL ];
				c.material = c[ MATERIAL_SYMBOL ];

				delete c[ VISIBLE_SYMBOL ];
				delete c[ MATERIAL_SYMBOL ];

			}

		} );

	} else {

		this._render( scene, camera );

	}

	if ( this._hoverActive ) {

		const domElement = this.domElement;
		inspector.copyCanvas( domElement );

		if ( this.debugMaterial ) {

			const ratioX = domElement.width / domElement.offsetWidth;
			const ratioY = domElement.height / domElement.offsetHeight;

			const x = Math.floor( this._lastPixelX * ratioX );
			const y = Math.floor( this._lastPixelY * ratioY );
			const result = this.readPixel( x, y, this.debugMaterial._currType );
			inspector.setValue( ...result );

		}

	}

}

export class ShaderDebugRenderer extends WebGLRenderer {

	constructor( options ) {

		options = { preserveDrawingBuffer: true, ...options };

		super( options );

		const readTarget = new WebGLRenderTarget( 1, 1, {

			format: RGBAFormat,
			type: FloatType,

		} );

		this.enableDebug = false;
		this.debugMaterial = null;
		this.readTarget = readTarget;
		this._render = this.render;
		this.render = render;
		this.inspectorScale = 20;
		this.inspectorDimensions = 5;

		const domElement = this.domElement;
		domElement.addEventListener( 'mouseleave', () => {

			this._hoverActive = false;
			inspector.visible = false;

		} );

		domElement.addEventListener( 'mousemove', e => {

			this._hoverActive = true;
			this._lastPixelX = e.clientX;
			this._lastPixelY = e.clientY;
			inspector.scale = this.inspectorScale;
			inspector.dimensions = this.inspectorDimensions;
			inspector.copyCanvas( domElement );
			inspector.setPixel( e.clientX, e.clientY );
			inspector.setPosition( e.clientX, e.clientY );
			inspector.visible = this.enableDebug;

		} );

	}

	readPixel( x, y, type ) {

		const readTarget = this.readTarget;
		const buffer = new Float32Array( 4 );

		const height = readTarget.texture.image.height;
		this.readRenderTargetPixels( readTarget, x, height - 1 - y, 1, 1, buffer );

		let result;

		switch( type ) {

			case 'int':
			case 'uint':
				return [ Math.round( buffer[ 0 ] ) ];

			case 'bool':
				return [ buffer[ 0 ] > 0.5 ];

			case 'float':
				return [ buffer[ 0 ] ];

			case 'vec2':
				result = [ ...buffer ];
				result.length = 2;
				return result;

			case 'vec3':
				result = [ ...buffer ];
				result.length = 3;
				return result;

			case 'vec4':
				result = [ ...buffer ];
				result.length = 4;
				return result;

			default:
				return [ ...buffer ];

		}


	}

	_updateReadTarget( scene, camera ) {

		if ( ! this.enableDebug ) {

			return;

		}

		const debugMaterial = this.debugMaterial;
		const readTarget = this.readTarget;
		const originalRenderTarget = this.getRenderTarget();
		const originalClearColor = this.getClearColor();
		const originalClearAlpha = this.clearAlpha;
		const originalBackground = scene.background;
		const originalMultiplier = debugMaterial.multiplier;
		const originalOffset = debugMaterial.offset;

		this.getSize( vec2 ).multiplyScalar( this.getPixelRatio() );
		vec2.x = Math.floor( vec2.x );
		vec2.y = Math.floor( vec2.y );
		readTarget.setSize( vec2.x, vec2.y );
		this.setClearColor( 0xff0000 );
		this.setClearAlpha( 0 );
		scene.background = null;
		debugMaterial.multiplier = 1.0;
		debugMaterial.offset = 0.0;

		this.setRenderTarget( readTarget );
		this.clear();
		this._render( scene, camera );

		this.setRenderTarget( originalRenderTarget );
		this.setClearColor( originalClearColor );
		this.setClearAlpha( originalClearAlpha );
		scene.background = originalBackground;
		debugMaterial.multiplier = originalMultiplier;
		debugMaterial.offset = originalOffset;


	}

}

