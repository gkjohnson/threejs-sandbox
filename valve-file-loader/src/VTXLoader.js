// VTX: https://developer.valvesoftware.com/wiki/VTX

THREE.VTXLoader = function ( manager ) {

	this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;

};

THREE.VTXLoader.prototype = {

	constructor: THREE.VTXLoader,

	load: function ( url, onLoad, onProgress, onError ) {

		var scope = this;

		var loader = new THREE.FileLoader( this.manager );
		loader.setPath( this.path );
		loader.setResponseType( 'arraybuffer' );
		loader.load( url, function ( text ) {

			onLoad( scope.parse( text ) );

		}, onProgress, onError );

	},

	parse: function ( buffer ) {

		function readString( dataView, offset, count = Infinity ) {

			var str = '';
			for ( var j = 0; j < count; j ++ ) {

				var c = dataView.getUint8( j + offset );
				if ( c === 0 ) break;

				str += String.fromCharCode( c );

			}

			return str;

		}

		function parseHeader( buffer ) {

			var dataView = new DataView( buffer );
			var i = 0;

			// int
			var version = dataView.getInt32( i, true );
			i += 4;

			// int
			var vertCacheSize = dataView.getInt32( i, true );
			i += 4;

			// short
			var maxBonesPerStrip = dataView.getUint16( i, true );
			i += 2;

			// short
			var maxBonesPerTri = dataView.getUint16( i, true );
			i += 2;

			// int
			var maxBonesPerVert = dataView.getInt32( i, true );
			i += 4;

			// int
			var checksum = dataView.getInt32( i, true );
			i += 4;

			// int
			var numLODs = dataView.getInt32( i, true );
			i += 4;

			// int
			var materialReplacementListOffset = dataView.getInt32( i, true );
			i += 4;

			// int
			var numBodyParts = dataView.getInt32( i, true );
			i += 4;

			// int
			var bodyPartOffset = dataView.getInt32( i, true );
			i += 4;

			return {
				version,
				vertCacheSize,
				maxBonesPerStrip,
				maxBonesPerTri,
				maxBonesPerVert,
				checksum,
				numLODs,
				materialReplacementListOffset,
				numBodyParts,
				bodyPartOffset
			};


		}

		function parseStrips( buffer, numStrips, stripOffset ) {

			var dataView = new DataView( buffer );
			var offset = stripOffset;
			var res = [];

			for ( var i = 0; i < numStrips; i ++ ) {

				var strip = {};
				strip.numIndices = dataView.getInt32( offset + 0, true );
				strip.indexOffset = dataView.getInt32( offset + 4, true );

				strip.numVerts = dataView.getInt32( offset + 8, true );
				strip.vertOffset = dataView.getInt32( offset + 12, true );

				strip.numBones = dataView.getInt16( offset + 16, true );

				strip.flags = dataView.getUint8( offset + 18, true );

				// TODO: parse these into an array
				strip.numBoneStateChanges = dataView.getInt32( offset + 19, true );
				strip.boneStateChangeOffset = dataView.getInt32( offset + 23, true );

				// TODO: This offset seems to make things work correctly for the ball and chain
				// but it's unclear why... padding?
				// offset += 27;
				offset += 35;

				res.push( strip );

			}

			return res;

		}

		function parseStripGroups( buffer, numStripGroups, stripGroupHeaderOffset ) {

			var dataView = new DataView( buffer );
			var offset = stripGroupHeaderOffset;
			var res = [];
			for ( var i = 0; i < numStripGroups; i ++ ) {

				var stripGroup = {};
				stripGroup.numVerts = dataView.getInt32( offset + 0, true );
				stripGroup.vertOffset = dataView.getInt32( offset + 4, true );

				stripGroup.numIndices = dataView.getInt32( offset + 8, true );
				stripGroup.indexOffset = dataView.getInt32( offset + 12, true );

				stripGroup.numStrips = dataView.getInt32( offset + 16, true );
				stripGroup.stripOffset = dataView.getInt32( offset + 20, true );

				stripGroup.flags = dataView.getUint8( offset + 24, true );

				stripGroup.strips = parseStrips( buffer, stripGroup.numStrips, offset + stripGroup.stripOffset );

				stripGroup.indexDataStart = offset + stripGroup.indexOffset;
				stripGroup.vertexDataStart = offset + stripGroup.vertOffset;

				// TODO: Looking at the padding offsets in the MGSBox model it looks like
				// this struct has as stride of 33 but counting up yields 25?
				// offset += 25;
				offset += 33;

				res.push( stripGroup );

			}

			return res;

		}

		function parseMeshes( buffer, numMeshes, meshOffset ) {

			var dataView = new DataView( buffer );
			var offset = meshOffset;
			var res = [];
			for ( var i = 0; i < numMeshes; i ++ ) {

				var mesh = {};
				mesh.numStripGroups = dataView.getInt32( offset + 0, true );
				mesh.stripGroupHeaderOffset = dataView.getInt32( offset + 4, true );
				mesh.flags = dataView.getUint8( offset + 8, true );
				mesh.stripGroups = parseStripGroups( buffer, mesh.numStripGroups, offset + mesh.stripGroupHeaderOffset );
				offset += 9;

				res.push( mesh );

			}

			return res;

		}

		function parseLods( buffer, numLODs, lodOffset ) {

			var dataView = new DataView( buffer );
			var offset = lodOffset;
			var res = [];
			for ( var i = 0; i < numLODs; i ++ ) {

				var lod = {};
				lod.numMeshes = dataView.getInt32( offset + 0, true );
				lod.meshOffset = dataView.getInt32( offset + 4, true );
				lod.switchPoint = dataView.getInt32( offset + 8, true );
				lod.meshes = parseMeshes( buffer, lod.numMeshes, offset + lod.meshOffset );
				offset += 12;

				res.push( lod );

			}

			return res;

		}

		function parseModels( buffer, numModels, modelOffset ) {

			var dataView = new DataView( buffer );
			var offset = modelOffset;
			var res = [];
			for ( var i = 0; i < numModels; i ++ ) {

				var model = {};
				model.numLODs = dataView.getInt32( offset + 0, true );
				model.lodOffset = dataView.getInt32( offset + 4, true );
				model.lods = parseLods( buffer, model.numLODs, offset + model.lodOffset );
				offset += 8;

				res.push( model );

			}

			return res;

		}

		function parseBodyParts( buffer, numBodyParts, bodyPartOffset ) {

			var dataView = new DataView( buffer );
			var offset = bodyPartOffset;
			var res = [];
			for ( var i = 0; i < numBodyParts; i ++ ) {

				var bodyPart = {};
				bodyPart.numModels = dataView.getInt32( offset + 0, true );
				bodyPart.modelOffset = dataView.getInt32( offset + 4, true );
				bodyPart.models = parseModels( buffer, bodyPart.numModels, offset + bodyPart.modelOffset );
				offset += 8;

				res.push( bodyPart );

			}

			return res;

		}

		function parseMaterialReplacement( buffer, matReplacementNum, matReplacementOffset ) {

			var dataView = new DataView( buffer );
			var offset = matReplacementOffset;
			var res = [];
			for ( var i = 0; i < matReplacementNum; i ++ ) {

				var replaceMaterial = {};
				replaceMaterial.numReplacements = dataView.getInt32( offset + 0, true );
				replaceMaterial.replacementOffset = dataView.getInt32( offset + 4, true );
				replaceMaterial.replacements = [];

				var offset2 = replaceMaterial.replacementOffset;
				for ( var j = 0; j < replaceMaterial.numReplacements; j ++ ) {

					var replacement = {};
					replacement.materialID = dataView.getInt16( offset2 + 0, true );
					replacement.name = readString( dataView, dataView.getInt32( offset2 + 2, true ) );
					offset2 += 6;

				}

				offset += 8;

				res.push( replaceMaterial );

			}

			return res;

		}

		var header = parseHeader( buffer );
		var bodyParts = parseBodyParts( buffer, header.numBodyParts, header.bodyPartOffset );
		var materialReplacements = parseMaterialReplacement( buffer, header.numLODs, header.materialReplacementListOffset );

		return { header, bodyParts, materialReplacements, buffer };

	}

};
