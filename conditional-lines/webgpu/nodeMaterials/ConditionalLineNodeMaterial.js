
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

	setupVertex( builder ) {

		// Fat-line clip-space position computed by Line2NodeMaterial.
		const mvp = super.setupVertex( builder );

		const control0 = attribute( 'control0' );
		const control1 = attribute( 'control1' );
		const direction = attribute( 'direction' );
		const instanceStart = attribute( 'instanceStart' );

		// Project edge endpoints and control points into clip space then NDC.
		// Using .div(clip.w) instead of toVar/divAssign keeps this as a pure
		// node expression consistent with the PointsNodeMaterial pattern.
		const proj = cameraProjectionMatrix.mul( modelViewMatrix );

		const c0Clip = proj.mul( vec4( control0, 1.0 ) );
		const c1Clip = proj.mul( vec4( control1, 1.0 ) );
		const p0Clip = proj.mul( vec4( instanceStart, 1.0 ) );
		const p1Clip = proj.mul( vec4( instanceStart.add( direction ), 1.0 ) );

		const c0 = c0Clip.div( c0Clip.w );
		const c1 = c1Clip.div( c1Clip.w );
		const p0 = p0Clip.div( p0Clip.w );
		const p1 = p1Clip.div( p1Clip.w );

		// Screen-space edge direction and its orthogonal (normal).
		const segDir = p1.xy.sub( p0.xy );
		const segNorm = vec2( negate( segDir.y ), segDir.x );

		// Vectors from the reference point (p1) to each control point.
		const c0dir = c0.xy.sub( p1.xy );
		const c1dir = c1.xy.sub( p1.xy );

		// Project each control-point direction onto the edge normal.
		// Same sign  → both on the same side → interior crease → discard.
		// Diff signs → opposite sides → silhouette edge → keep.
		const d0 = dot( normalize( segNorm ), normalize( c0dir ) );
		const d1 = dot( normalize( segNorm ), normalize( c1dir ) );
		const discardFlag = float( sign( d0 ).notEqual( sign( d1 ) ) );

		// Interior edge: collapse all vertices to c0 (degenerate zero-area
		// triangle, effectively invisible).  Silhouette: pass through mvp.
		return select( discardFlag.greaterThan( 0.5 ), c0, mvp );

	}

}

export { ConditionalLineNodeMaterial };
