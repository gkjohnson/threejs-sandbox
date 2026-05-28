import { Color } from 'three';
import { MeshPhongNodeMaterial } from 'three/webgpu';
import { vec4, diffuseColor, min, uniform, mix } from 'three/tsl';

export class ColoredShadowNodeMaterial extends MeshPhongNodeMaterial {

	static get type() {

		return 'ColoredShadowNodeMaterial';

	}
	constructor( parameters = {} ) {

		super( parameters );
		this._shadowColor = uniform( new Color( parameters.shadowColor ?? 0xff0000 ) );

	}
	get shadowColor() {

		return this._shadowColor.value;

	}
	set shadowColor( val ) {

		this._shadowColor.value.set( val );

	}

	setupOutput( builder, outputNode ) {

		const brightness = min( outputNode.r, 1.0 );
		const mixedColor = mix( this._shadowColor, diffuseColor.rgb, brightness );
		return super.setupOutput( builder, vec4( mixedColor, outputNode.a ) );

	}

}
