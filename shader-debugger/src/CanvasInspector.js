export class CanvasInspector {

	get visible() {

		return ! ! this.root.parentElement;

	}

	set visible( value ) {

		if ( value ) {

			document.body.appendChild( this.root );

		} else {

			this.root.remove();

		}

	}

	constructor() {

		const canvas = document.createElement( 'canvas' );
		const context = canvas.getContext( '2d' );
		canvas.style.imageRendering = 'pixelated';

		const wrapperTarget = document.createElement( 'div' );
		wrapperTarget.style.border = '1px solid white';
		wrapperTarget.style.position = 'absolute';

		const canvasWrapper = document.createElement( 'div' );
		canvasWrapper.style.position = 'absolute';
		canvasWrapper.appendChild( canvas );
		canvasWrapper.appendChild( wrapperTarget );

		const overflowWrapper = document.createElement( 'div' );
		overflowWrapper.style.border = '1px solid white';
		overflowWrapper.style.position = 'absolute';
		overflowWrapper.style.overflow = 'hidden';
		overflowWrapper.appendChild( canvasWrapper );

		const target = document.createElement( 'div' );
		target.style.position = 'absolute';
		target.style.border = '1px solid white';

		const valueContainer = document.createElement( 'div' );
		valueContainer.style.position = 'absolute';
		valueContainer.style.textAlign = 'left';

		const root = document.createElement( 'div' );
		root.style.position = 'absolute';
		root.style.pointerEvents = 'none';
		root.style.width = 0;
		root.style.height = 0;
		root.appendChild( valueContainer );
		root.appendChild( overflowWrapper );
		root.appendChild( target );

		this.scale = 20;
		this.dimensions = 5;

		this.canvas = canvas;
		this.context = context;
		this.wrapperTarget = wrapperTarget;
		this.canvasWrapper = canvasWrapper;
		this.overflowWrapper = overflowWrapper;
		this.valueContainer = valueContainer;
		this.target = target;
		this.root = root;

	}

	setPixel( x, y ) {

		const ratioX = this._lastPixelRatioX;
		const ratioY = this._lastPixelRatioY;
		const targetX = Math.floor( x * this._lastPixelRatioX );
		const targetY = Math.floor( y * this._lastPixelRatioY );

		const dimensions = this.dimensions;
		const scale = this.scale;
		const overflowWrapper = this.overflowWrapper;
		const canvas = this.canvas;
		const target = this.target;
		const wrapperTarget = this.wrapperTarget;
		const canvasWrapper = this.canvasWrapper;
		const valueContainer = this.valueContainer;

		overflowWrapper.style.width = Math.floor( dimensions ) * scale + 'px';
		overflowWrapper.style.height = Math.floor( dimensions ) * scale + 'px';
		overflowWrapper.style.top = Math.floor( dimensions ) + 'px';
		overflowWrapper.style.left = Math.floor( dimensions ) + 'px';

		canvas.style.width = canvas.width * scale + 'px';
		canvas.style.height = canvas.height * scale + 'px';
		canvasWrapper.style.left = - scale * targetX + scale * Math.floor( dimensions / 2 ) + 'px';
		canvasWrapper.style.top = - scale * targetY + scale * Math.floor( dimensions / 2 ) + 'px';

		target.style.width = dimensions / ratioX + 'px';
		target.style.height = dimensions / ratioY + 'px';
		target.style.left = - ( dimensions / ratioX ) / 2 + 'px';
		target.style.top = - ( dimensions / ratioY ) / 2 + 'px';

		wrapperTarget.style.width = scale + 'px';
		wrapperTarget.style.height = scale + 'px';
		wrapperTarget.style.left = targetX * scale - 1 + 'px';
		wrapperTarget.style.top = targetY * scale - 1 + 'px';

		valueContainer.style.left = overflowWrapper.style.left;
		valueContainer.style.top = Math.floor( dimensions ) + Math.floor( dimensions ) * scale + 'px';
		valueContainer.style.width = scale * dimensions + 'px';

	}

	setValue( r, g, b, a ) {

		function round( v ) {

			if ( typeof v === 'boolean' ) return v;
			else return parseFloat( v.toFixed( 5 ) );

		}

		let text = '';
		if ( r !== undefined ) text += `r : ${ round( r ) }\n`;
		if ( g !== undefined ) text += `g : ${ round( g ) }\n`;
		if ( b !== undefined ) text += `b : ${ round( b ) }\n`;
		if ( a !== undefined ) text += `a : ${ round( a ) }\n`;

		this.valueContainer.innerText = text;

	}

	setPosition( x, y ) {

		this.root.style.left = x + 'px';
		this.root.style.top = y + 'px';

	}

	copyCanvas( source ) {

		const context = this.context;
		const canvas = this.canvas;
		canvas.width = source.width;
		canvas.height = source.height;
		context.drawImage( source, 0, 0, source.width, source.height, 0, 0, canvas.width, canvas.height );

		const pixelRatioX = source.width / source.offsetWidth;
		const pixelRatioY = source.height / source.offsetHeight;
		this._lastPixelRatioX = pixelRatioX;
		this._lastPixelRatioY = pixelRatioY;

	}

}
