
import {
	float,
	vec2,
	vec4,
	attribute,
	cameraProjectionMatrix,
	modelViewMatrix,
	dot,
	normalize,
	sign,
	negate,
	select
} from 'three/tsl';
import { Line2NodeMaterial } from 'three/webgpu';
class ConditionalLineNodeMaterial extends Line2NodeMaterial {

	static get type() {

		return 'ConditionalLineNodeMaterial';

	}

	constructor( parameters = {} ) {

		super( parameters );
		this.isConditionalLineNodeMaterial = true;

	}

	set lineColor( val ) {

		this.lineColorNode = val;

	}

	setupVertex( builder ) {

		// clip-space position computed by Line2NodeMaterial.
		const mvp = super.setupVertex( builder );

		const control0 = attribute( 'control0' );
		const control1 = attribute( 'control1' );
		const direction = attribute( 'direction' );
		const instanceStart = attribute( 'instanceStart' );

		const proj = cameraProjectionMatrix.mul( modelViewMatrix );

		const c0Clip = proj.mul( vec4( control0, 1.0 ) );
		const c1Clip = proj.mul( vec4( control1, 1.0 ) );
		const p0Clip = proj.mul( vec4( instanceStart, 1.0 ) );
		const p1Clip = proj.mul( vec4( instanceStart.add( direction ), 1.0 ) );

		const c0 = c0Clip.div( c0Clip.w );
		const c1 = c1Clip.div( c1Clip.w );
		const p0 = p0Clip.div( p0Clip.w );
		const p1 = p1Clip.div( p1Clip.w );

		const segDir = p1.xy.sub( p0.xy );
		const segNorm = vec2( negate( segDir.y ), segDir.x );

		const c0dir = c0.xy.sub( p1.xy );
		const c1dir = c1.xy.sub( p1.xy );

		const d0 = dot( normalize( segNorm ), normalize( c0dir ) );
		const d1 = dot( normalize( segNorm ), normalize( c1dir ) );
		const discardFlag = float( sign( d0 ).notEqual( sign( d1 ) ) );

		return select( discardFlag.greaterThan( 0.5 ), c0, mvp );

	}

}

export { ConditionalLineNodeMaterial };
