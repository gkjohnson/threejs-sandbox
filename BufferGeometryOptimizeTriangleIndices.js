THREE.BufferGeometry.prototype.optimizeTriangleIndices = function ( precision = 3 ) {

	// Generate an index buffer if the geometry doesn't have one, or optimize it
	// if it's already available.
	var hashToIndex = {};
	var indices = this.getIndex();
	var positions = this.getAttribute( 'position' );
	var vertexCount = indices ? indices.count : positions.count;

	// next value for triangle indices
	var nextIndex = 0;

	// attributes and new attribute arrays
	var attributeNames = Object.keys( this.attributes );
	var attrArrays = {};
	var newIndices = [];
	var getters = [ 'getX', 'getY', 'getZ', 'getW' ];

	var precisionMultiplier = Math.pow( 10, precision + 1 );
	for ( var i = 0; i < vertexCount; i ++ ) {

		// Generate a hash for the vertex attributes at the current index 'i'
		var hash = '';
		for ( var j = 0, l = attributeNames.length; j < l; j ++ ) {

			var name = attributeNames[ j ];
			var attribute = this.getAttribute( name );
			var itemSize = attribute.itemSize;

			for ( var k = 0; k < itemSize; k ++ ) {

				// double tilde truncates the decimal value
				hash += `${ ~ ~ ( attribute[ getters[ k ] ]( i ) * precisionMultiplier ) },`;

			}

		}

		// Add another reference to the vertex if it's already
		// used by another index
		if ( hash in hashToIndex ) {

			newIndices.push( hashToIndex[ hash ] );

		} else {

			// copy data to the new index in the attribute arrays
			for ( var j = 0, l = attributeNames.length; j < l; j ++ ) {

				var name = attributeNames[ j ];
				var attribute = this.getAttribute( name );
				var itemSize = attribute.itemSize;

				attrArrays[ name ] = attrArrays[ name ] || [];
				var newarray = attrArrays[ name ];
				for ( var k = 0; k < itemSize; k ++ ) {

					newarray.push( attribute[ getters[ k ] ]( i ) );

				}

			}

			hashToIndex[ hash ] = nextIndex;
			newIndices.push( nextIndex );
			nextIndex ++;

		}

	}

	// Generate typed arrays from new attribute arrays and update
	// the attributeBuffers
	for ( var i = 0, l = attributeNames.length; i < l; i ++ ) {

		var name = attributeNames[ i ];
		var attribute = this.getAttribute( name ).clone();
		var buffer = new attribute.array.constructor( attrArrays[ name ] );

		attribute.setArray( buffer );
		this.addAttribute( name, attribute );

	}

	// Generate an index buffer typed array
	var cons = Uint8Array;
	if ( newIndices.length >= Math.pow( 2, 8 ) ) cons = Uint16Array;
	if ( newIndices.length >= Math.pow( 2, 16 ) ) cons = Uint32Array;

	var newIndexBuffer = new cons( newIndices );
	var newIndices = null;
	if ( indices === null ) {

		newIndices = new THREE.BufferAttribute( newIndexBuffer, 1 );

	} else {

		newIndices = this.getIndex().clone();
		newIndices.setArray( newIndexBuffer );

	}

	this.setIndex( newIndices );

	return this;

};

THREE.BufferGeometry.prototype.getMemoryUse = function () {

	// Return the estimated memory used by this geometry
	var mem = 0;
	for ( var name in this.attributes ) {

		mem += this.attributes[ name ].array.byteLength;

	}

	mem += this.index ? this.index.array.byteLength : 0;
	return mem;

};
