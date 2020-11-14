let addChildCb, removeChildCb;

addChildCb = function ( e ) {

	const child = e.child;
	child.traverse( c => {

		c.addEventListener( 'childadded', addChildCb );
		c.addEventListener( 'childremoved', removeChildCb );

	} );

	this.dispatchEvent( { type: 'addedtoscene', child: child } );
	child.traverse( c => {

		this.dispatchEvent( { type: 'addedtoscene', child: c } );

	} );

};

removeChildCb = function ( e ) {

	const child = e.child;
	child.traverse( c => {

		c.removeEventListener( 'childadded', addChildCb );
		c.removeEventListener( 'childremoved', removeChildCb );

	} );

	this.dispatchEvent( { type: 'removedfromscene', child: child } );
	child.traverse( c => {

		this.dispatchEvent( { type: 'removedfromscene', child: c } );

	} );

};

class TrackedScene extends THREE.Scene {

	constructor( ...args ) {

		super( ...args );
		this.addEventListener( 'childadded', addChildCb );
		this.addEventListener( 'childremoved', removeChildCb );

	}

}
