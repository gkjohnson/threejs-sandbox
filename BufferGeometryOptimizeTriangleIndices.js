THREE.BufferGeometry.prototype.optimizeTriangleIndices = function(optimizeMemory = false, precision = 8) {

	var map = {};
	var len = this.getAttribute( 'position' ).count;
	var names = Object.keys( this.attributes );
	var indices = [];
	var currindex = 0;
	var attrarrays = names.reduce( ( a, name ) => {

		a[ name ] = [];
		return a;
	
	}, {} );

	for ( var i = 0; i < len; i ++ ) {

		var hash = '';
		for ( var j = 0, l = names.length; j < l; j ++ ) {

			var name = names[ j ];
			var attribute = this.attributes[ name ];
			var array = attribute.array;
			var size = attribute.size;

			for ( var k = 0; k < size; k ++ ) {

				hash += `${ array[ i * size + k ].toFixed( precision ) }|`;

			}

		}

		if ( hash in map ) {

			indices.push( map[ hash ] );

		} else {

			// copy data to the new index in the attribute arrays
			for ( var j = 0, l = names.length; j < l; j ++ ) {

				var name = names[ j ];
				var attribute = this.attributes[ name ];
				var array = attribute.array;
				var newarray = attrarrays[ name ];
				var size = attribute.size;
				
				for ( var k = 0; k < size; k ++ ) {
					
					var index = i * size + k;
					newarray.push( array[ i * size + k ] );

				}

			}

			map[ hash ] = currindex;
			currindex ++;
		}

	}

	// TODO: Convert the attributes into proper arrays for the mesh.

}

THREE.BufferGeometry.prototype.generateTriangleIndices = function() { this.optimizeTriangleIndices(); }