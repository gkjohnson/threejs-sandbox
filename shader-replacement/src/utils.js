function gatherMeshes( scene, target ) {

	target.length = 0;
	scene.traverse( c => {

		if ( c.isMesh || c.isSkinnedMesh ) {

			target.push( c );

		}

	} );

}

export { gatherMeshes };
