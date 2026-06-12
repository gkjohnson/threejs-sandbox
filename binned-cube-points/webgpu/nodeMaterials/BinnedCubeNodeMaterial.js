import { MeshStandardNodeMaterial } from 'three/webgpu';

import {
	uniform,
	float,
	vec3,
	floor,
	positionLocal,
	modelViewMatrix,
	attribute
} from 'three/tsl';

// Only works with an InstancedMesh
class BinnedPointsNodeMaterial extends MeshStandardNodeMaterial {

	constructor( parameters ) {

		super( parameters );

		this.scaleNode = uniform( float( 1.0 ) );
		this.offsetNode = uniform( vec3( 1.0 ) );

	}

	setupPositionView( builder ) {

		const { positionNode, offsetNode, scaleNode } = this;


		const instancePosition = attribute( 'instancePosition' );


		const offsetPos = instancePosition.add( offsetNode ).toVar( 'offsetPos' );
		offsetPos.divAssign( scaleNode );
		offsetPos.assign( floor( offsetPos ) );
		offsetPos.mulAssign( scaleNode );
		offsetPos.addAssign( vec3( scaleNode.mul( 0.5 ) ) );
		offsetPos.subAssign( offsetNode );


		const transformed = vec3( positionNode || positionLocal ).toVar();

		transformed.mulAssign( scaleNode );
		transformed.addAssign( offsetNode );

		return modelViewMatrix.mul( transformed ).xyz;


	}


}


/*function cloneShader( shader, uniforms, defines ) {

	const newShader = Object.assign( {}, shader );
	newShader.uniforms = UniformsUtils.merge( [
		newShader.uniforms,
		uniforms
	] );
	newShader.defines = Object.assign( {}, defines );

	return newShader;

}

export function addInstancePosition( shader ) {

	const newShader = cloneShader(
		shader,
		{
			scale: { value: 1 },
			offset: { value: new Vector3() },
		}
	);

	newShader.vertexShader = `
		uniform float scale;
		uniform vec3 offset;
		attribute vec3 instancePosition;
		${newShader.vertexShader}
	`.replace( '#include <project_vertex>', match => `
		vec3 offsetPos = instancePosition + offset;
		offsetPos /= scale;
		offsetPos = floor(offsetPos);
		offsetPos *= scale;
		offsetPos += vec3(scale, scale, scale) * 0.5;
		offsetPos -= offset;

		transformed *= scale;
		transformed += offsetPos;
		${match}
	` );

	return newShader;

} */
