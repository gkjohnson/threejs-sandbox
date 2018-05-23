THREE.BufferGeometry.prototype.optimizeTriangleIndices = function( precision = 3 ) {

	var map = {};
	var indices = this.getIndex();
	var len = indices ? indices.count : this.getAttribute( 'position' ).count;
	var names = Object.keys( this.attributes );
	var newIndices = [];
	var currIndex = 0;
	var attrArrays = {};

	var multVal = Math.pow( 10, precision + 1 );
	for ( var i = 0; i < len; i ++ ) {

		// Generate a hash for the vertex attributes at the current index 'i'
		var index = indices ? indices.array[ i ] : i;
		var hash = '';
		for ( var j = 0, l = names.length; j < l; j ++ ) {

			var name = names[ j ];
			var attribute = this.getAttribute( name );
			var size = attribute.itemSize;
			var array = attribute.array;

			for ( var k = 0; k < size; k ++ ) {

				// double tilde truncates the decimal value
				var val = array[ i * size + k ];
				hash += `${ ~~(val * multVal) / multVal },`

			}

		}

		// Add another reference to the vertex if it's already referenced
		if ( hash in map ) {

			newIndices.push( map[ hash ] );

		} else {

			// copy data to the new index in the attribute arrays
			for ( var j = 0, l = names.length; j < l; j ++ ) {

				var name = names[ j ];				
				var attribute = this.getAttribute( name );
				var array = attribute.array;
				var size = attribute.itemSize;

				attrArrays[ name ] = attrArrays[ name ] || [];
				var newarray = attrArrays[ name ];

				for ( var k = 0; k < size; k ++ ) {
					
					var index = i * size + k;
					newarray.push( array[ i * size + k ] );

				}

			}

			map[ hash ] = currIndex;
			newIndices.push(currIndex);
			currIndex ++;
		}

	}

	for ( var i = 0, l = names.length; i < l; i ++ ) {

		var name = names[ i ];
		var attribute = this.getAttribute( name );
		var buffer = new attribute.array.constructor( attrArrays[ name ] );

		attribute.setArray( buffer );
		attribute.needsUpdate = true;

	}

	var cons = Uint8Array;
	if ( newIndices.length >= Math.pow( 2, 8 ) ) cons = Uint16Array;
	if ( newIndices.length >= Math.pow( 2, 16 ) ) cons = Uint32Array;

	var newIndexBuffer = new cons( newIndices );
	if ( indices === null ) {

		indices = new THREE.BufferAttribute( newIndexBuffer, 1 );
		this.setIndex(indices);

	} else {
		
		indices.setArray( newIndexBuffer );
		indices.needsUpdate = true;

	}

}

THREE.BufferGeometry.prototype.getMemoryUse = function() {

	var mem = 0;
	for ( var name in this.attributes ) {

		mem += this.attributes[ name ].array.byteLength;

	}

	mem += this.index ? this.index.array.byteLength : 0;
	return mem;

}

THREE.BufferGeometry.prototype.generateTriangleIndices = function() { this.optimizeTriangleIndices(); }