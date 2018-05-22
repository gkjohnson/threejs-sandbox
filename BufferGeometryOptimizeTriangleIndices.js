THREE.BufferGeometry.prototype.optimizeTriangleIndices = function( precision = 6 ) {

	var map = {};
	var indices = this.getIndex();
	var len = indices ? indices.count : this.getAttribute( 'position' ).count;
	var names = Object.keys( this.attributes );
	var newIndices = [];
	var currIndex = 0;
	var attrArrays = {};
	var getDataFuncs = {};

	names.forEach( name => {

		var array = this.getAttribute( name ).array;
		var dataView = new DataView( array.buffer );
		var func = `getUint${ array.BYTES_PER_ELEMENT * 8 }`;
		getDataFuncs[ name ] = i => dataView[ func ]( i * array.BYTES_PER_ELEMENT );

		attrArrays[ name ] = [];

	} );

	for ( var i = 0; i < len; i ++ ) {

		// Generate a hash for the vertex attributes at the current index 'i'
		var index = indices ? indices.array[ i ] : i;
		var hash = '';
		for ( var j = 0, l = names.length; j < l; j ++ ) {

			var name = names[ j ];
			var attribute = this.getAttribute( name );
			var size = attribute.itemSize;
			var getData = getDataFuncs[ name ];

			for ( var k = 0; k < size; k ++ ) {

				hash += `${ getData( (i * size + k) ) }|`

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