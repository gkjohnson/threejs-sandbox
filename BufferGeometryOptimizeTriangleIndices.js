THREE.BufferGeometryUtils.interleaveAttributes = function ( attributes ) {

	// Interleaves the provided attributes into an InterleavedBuffer and returns
	// a set of InterleavedBufferAttributes for each attribute
	var TypedArray;
	var arrayLength = 0;
	var stride = 0;

	// calculate the the length and type of the interleavedBuffer
	for ( var i = 0, l = attributes.length; i < l; ++ i ) {

		var attribute = attributes[ i ];

		if ( TypedArray === undefined ) TypedArray = attribute.array.constructor;
		if ( TypedArray !== attribute.array.constructor ) {

			console.warn( 'AttributeBuffers of different types cannot be interleaved' );
			return null;

		}

		arrayLength += attribute.array.length;
		stride += attribute.itemSize;

	}

	// Create the set of buffer attributes
	var interleavedBuffer = new THREE.InterleavedBuffer( new TypedArray( arrayLength ), stride );
	var offset = 0;
	var res = [];
	var getters = [ 'getX', 'getY', 'getZ', 'getW' ];
	var setters = [ 'setX', 'setY', 'setZ', 'setW' ];

	for ( var j = 0, l = attributes.length; j < l; j ++ ) {

		var attribute = attributes[ j ];
		var itemSize = attribute.itemSize;
		var count = attribute.count;
		var iba = new THREE.InterleavedBufferAttribute( interleavedBuffer, itemSize, offset, attribute.normalized );
		res.push( iba );

		offset += itemSize;

		// Move the data for each attribute into the new interleavedBuffer
		// at the appropriate offset
		for ( var c = 0; c < count; c ++ ) {

			for ( var k = 0; k < itemSize; k ++ ) {

				iba[ setters[ k ] ]( c, attribute[ getters[ k ] ]( c ) );

			}

		}

	}

	return res;

};

THREE.InterleavedBufferAttribute.prototype.copy = function ( source ) {

	this.data = source.data;
	this.itemSize = source.itemSize;
	this.offset = source.offset;
	this.normalized = source.normalized;

	return this;

};

THREE.InterleavedBufferAttribute.prototype.clone = function () {

	return new this.constructor( this.data, this.itemSize, this.offset, this.normalized ).copy( this );

};

THREE.BufferGeometry.prototype.mergeVertices = function ( precision = 3 ) {

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
		var oldAttribute = this.getAttribute( name );
		var attribute;

		var buffer = new attribute.array.constructor( attrArrays[ name ] );
		if ( oldAttribute.isInterleavedBufferAttribute ) {

			attribute = new THREE.BufferAttribute( buffer, oldAttribute.itemSize, oldAttribute.itemSize );

		} else {

			attribute = this.getAttribute( name ).clone();
			attribute.setArray( buffer );

		}

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

THREE.BufferGeometry.prototype.getMemoryUse = function ( geometry ) {

	// Return the estimated memory used by this geometry
	var mem = 0;
	for ( var name in geometry.attributes ) {

		mem += geometry.getAttribute( name ).array.byteLength;

	}

	mem += geometry.getIndex() ? geometry.getIndex().array.byteLength : 0;
	return mem;

};
