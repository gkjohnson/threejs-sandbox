
export function traverseVisibleMeshes( obj, callback ) {

	if ( obj.visible ) {

		if ( obj.isMesh || obj.isSkinnedMesh ) {

			callback( obj );

		}

		const children = obj.children;
		for ( let i = 0, l = children.length; i < l; i ++ ) {

			traverseVisibleMeshes( children[ i ], callback );

		}

	}

}
