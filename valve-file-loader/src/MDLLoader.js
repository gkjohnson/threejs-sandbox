// MDL: https://developer.valvesoftware.com/wiki/MDL

THREE.MDLLoader = function ( manager ) {

	this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;

};

THREE.MDLLoader.prototype = {

	constructor: THREE.MDLLoader,

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
			var id = dataView.getInt32( i, true );
			i += 4;

			// int
			var version = dataView.getInt32( i, true );
			i += 4;

			// int
			var checksum = dataView.getInt32( i, true );
			i += 4;

			// char[64]
			var name = readString( dataView, i, 64 );
			i += 64;

			// int
			var dataLength = dataView.getInt32( i, true );
			i += 4;

			// Vector
			var eyeposition = new THREE.Vector3();
			eyeposition.x = dataView.getFloat32( i + 0, true );
			eyeposition.y = dataView.getFloat32( i + 4, true );
			eyeposition.z = dataView.getFloat32( i + 8, true );
			i += 12;

			// Vector
			var illumposition = new THREE.Vector3();
			illumposition.x = dataView.getFloat32( i + 0, true );
			illumposition.y = dataView.getFloat32( i + 4, true );
			illumposition.z = dataView.getFloat32( i + 8, true );
			i += 12;

			// Vector
			var hullMin = new THREE.Vector3();
			hullMin.x = dataView.getFloat32( i + 0, true );
			hullMin.y = dataView.getFloat32( i + 4, true );
			hullMin.z = dataView.getFloat32( i + 8, true );
			i += 12;

			// Vector
			var hullMax = new THREE.Vector3();
			hullMax.x = dataView.getFloat32( i + 0, true );
			hullMax.y = dataView.getFloat32( i + 4, true );
			hullMax.z = dataView.getFloat32( i + 8, true );
			i += 12;

			// Vector
			var viewBbmin = new THREE.Vector3();
			viewBbmin.x = dataView.getFloat32( i + 0, true );
			viewBbmin.y = dataView.getFloat32( i + 4, true );
			viewBbmin.z = dataView.getFloat32( i + 8, true );
			i += 12;

			// Vector
			var viewBbmax = new THREE.Vector3();
			viewBbmax.x = dataView.getFloat32( i + 0, true );
			viewBbmax.y = dataView.getFloat32( i + 4, true );
			viewBbmax.z = dataView.getFloat32( i + 8, true );
			i += 12;

			// int
			var flags = dataView.getInt32( i, true );
			i += 4;

			// int
			var boneCount = dataView.getInt32( i, true );
			i += 4;

			// int
			var boneOffset = dataView.getInt32( i, true );
			i += 4;

			// int
			var bonecontrollerCount = dataView.getInt32( i, true );
			i += 4;

			// int
			var bonecontrollerOffset = dataView.getInt32( i, true );
			i += 4;

			// int
			var hitboxCount = dataView.getInt32( i, true );
			i += 4;

			// int
			var hitboxOffset = dataView.getInt32( i, true );
			i += 4;

			// int
			var localanimCount = dataView.getInt32( i, true );
			i += 4;

			// int
			var localanimOffset = dataView.getInt32( i, true );
			i += 4;

			// int
			var localseqCount = dataView.getInt32( i, true );
			i += 4;

			// int
			var localseqOffset = dataView.getInt32( i, true );
			i += 4;

			// int
			var activitylistversion = dataView.getInt32( i, true );
			i += 4;

			// int
			var eventsindexed = dataView.getInt32( i, true );
			i += 4;

			// int
			var textureCount = dataView.getInt32( i, true );
			i += 4;

			// int
			var textureOffset = dataView.getInt32( i, true );
			i += 4;

			// int
			var texturedirCount = dataView.getInt32( i, true );
			i += 4;

			// int
			var texturedirOffset = dataView.getInt32( i, true );
			i += 4;

			// int
			var skinreferenceCount = dataView.getInt32( i, true );
			i += 4;

			// int
			var skinrfamilyCount = dataView.getInt32( i, true );
			i += 4;

			// int
			var skinreferenceIndex = dataView.getInt32( i, true );
			i += 4;

			// int
			var bodypartCount = dataView.getInt32( i, true );
			i += 4;

			// int
			var bodypartOffset = dataView.getInt32( i, true );
			i += 4;

			// int
			var attachmentCount = dataView.getInt32( i, true );
			i += 4;

			// int
			var attachmentOffset = dataView.getInt32( i, true );
			i += 4;

			// int
			var localnodeCount = dataView.getInt32( i, true );
			i += 4;

			// int
			var localnodeIndex = dataView.getInt32( i, true );
			i += 4;

			// int
			var localnodeNameIndex = dataView.getInt32( i, true );
			i += 4;

			// int
			var flexdescCount = dataView.getInt32( i, true );
			i += 4;

			// int
			var flexdescIndex = dataView.getInt32( i, true );
			i += 4;

			// int
			var flexcontrollerCount = dataView.getInt32( i, true );
			i += 4;

			// int
			var flexcontrollerIndex = dataView.getInt32( i, true );
			i += 4;

			// int
			var flexrulesCount = dataView.getInt32( i, true );
			i += 4;

			// int
			var flexrulesIndex = dataView.getInt32( i, true );
			i += 4;

			// int
			var ikchainCount = dataView.getInt32( i, true );
			i += 4;

			// int
			var ikchainIndex = dataView.getInt32( i, true );
			i += 4;

			// int
			var mouthsCount = dataView.getInt32( i, true );
			i += 4;

			// int
			var mouthsIndex = dataView.getInt32( i, true );
			i += 4;

			// int
			var localposeparamCount = dataView.getInt32( i, true );
			i += 4;

			// int
			var localposeparamIndex = dataView.getInt32( i, true );
			i += 4;

			// int
			var surfacepropIndex = dataView.getInt32( i, true );
			i += 4;

			// int
			var keyvalueIndex = dataView.getInt32( i, true );
			i += 4;

			// int
			var keyvalueCount = dataView.getInt32( i, true );
			i += 4;

			// int
			var iklockCount = dataView.getInt32( i, true );
			i += 4;

			// int
			var iklockIndex = dataView.getInt32( i, true );
			i += 4;

			// float
			var mass = dataView.getFloat32( i, true );
			i += 4;

			// int
			var contents = dataView.getInt32( i, true );
			i += 4;

			// int
			var includemodelCount = dataView.getInt32( i, true );
			i += 4;

			// int
			var includemodelIndex = dataView.getInt32( i, true );
			i += 4;

			// int
			var virtualModel = dataView.getInt32( i, true );
			i += 4;

			// int
			var animblocksNameIndex = dataView.getInt32( i, true );
			i += 4;

			// int
			var animblocksCount = dataView.getInt32( i, true );
			i += 4;

			// int
			var animblocksIndex = dataView.getInt32( i, true );
			i += 4;

			// int
			var animblockModel = dataView.getInt32( i, true );
			i += 4;

			// int
			var bonetablenameIndex = dataView.getInt32( i, true );
			i += 4;

			// int
			var vertexBase = dataView.getInt32( i, true );
			i += 4;

			// int
			var offsetBase = dataView.getInt32( i, true );
			i += 4;

			// byte
			var directionaldotproduct = dataView.getUint8( i, true );
			i += 1;

			// byte
			var rootLod = dataView.getUint8( i, true );
			i += 1;

			// byte
			var numAllowedRootLods = dataView.getUint8( i, true );
			i += 1;

			// byte
			var unused = dataView.getUint8( i, true );
			i += 1;

			// int
			var unused = dataView.getInt32( i, true );
			i += 4;

			// int
			var flexcontrolleruiCount = dataView.getInt32( i, true );
			i += 4;

			// int
			var flexcontrolleruiIndex = dataView.getInt32( i, true );
			i += 4;

			// TODO: Why do we have to do this? Why is this missing?
			// without this i === 400 and not 408 like the docs imply?
			i += 8;

			// int
			var studiohdr2index = dataView.getInt32( i, true );
			i += 4;

			// int
			var unused = dataView.getInt32( i, true );
			i += 4;


			return {
				id,
				version,
				checksum,
				name,
				dataLength,
				eyeposition,
				illumposition,
				hullMin,
				hullMax,
				viewBbmin,
				viewBbmax,
				flags,
				boneCount,
				boneOffset,
				bonecontrollerCount,
				bonecontrollerOffset,
				hitboxCount,
				hitboxOffset,
				localanimCount,
				localanimOffset,
				localseqCount,
				localseqOffset,
				activitylistversion,
				eventsindexed,
				textureCount,
				textureOffset,
				texturedirCount,
				texturedirOffset,
				skinreferenceCount,
				skinrfamilyCount,
				skinreferenceIndex,
				bodypartCount,
				bodypartOffset,
				attachmentCount,
				attachmentOffset,
				localnodeCount,
				localnodeIndex,
				localnodeNameIndex,
				flexdescCount,
				flexdescIndex,
				flexcontrollerCount,
				flexcontrollerIndex,
				flexrulesCount,
				flexrulesIndex,
				ikchainCount,
				ikchainIndex,
				mouthsCount,
				mouthsIndex,
				localposeparamCount,
				localposeparamIndex,
				surfacepropIndex,
				keyvalueIndex,
				keyvalueCount,
				iklockCount,
				iklockIndex,
				mass,
				contents,
				includemodelCount,
				includemodelIndex,
				virtualModel,
				animblocksNameIndex,
				animblocksCount,
				animblocksIndex,
				animblockModel,
				bonetablenameIndex,
				vertexBase,
				offsetBase,
				directionaldotproduct,
				rootLod,
				numAllowedRootLods,
				unused,
				unused,
				flexcontrolleruiCount,
				flexcontrolleruiIndex,
				studiohdr2index,
				unused
			};

		}

		function parseSecondaryHeader( buffer, offset ) {

			if ( offset === 0 ) return null;

			var dataView = new DataView( buffer );
			var i = offset;

			// int
			var srcbonetransformCount = dataView.getInt32( i, true );
			i += 4;

			// int
			var srcbonetransformIndex = dataView.getInt32( i, true );
			i += 4;

			// int
			var illumpositionattachmentindex = dataView.getInt32( i, true );
			i += 4;

			// float
			var flMaxEyeDeflection = dataView.getFloat32( i, true );
			i += 4;

			// int
			var linearboneIndex = dataView.getInt32( i, true );
			i += 4;

			// int[64]
			var unknown = null;
			i += 64 * 4;

			return {
				srcbonetransformCount,
				srcbonetransformIndex,
				illumpositionattachmentindex,
				flMaxEyeDeflection,
				linearboneIndex,
				unknown
			};


		}

		function readData( header, header2, buffer ) {

			var dataView = new DataView( buffer );
			var textures = [];
			for ( var i = 0; i < header.textureCount; i ++ ) {

				var offset = header.textureOffset + i * 16 * 4;
				var ptr = offset + dataView.getInt32( offset, true );
				textures.push( readString( dataView, ptr ) );

			}

			var textureDirectories = [];
			for ( var i = 0; i < header.texturedirCount; i ++ ) {

				var offset = header.texturedirOffset + i * 4;
				var ptr = dataView.getInt32( offset, true );
				textureDirectories.push( readString( dataView, ptr ) );

			}

			var includeModels = [];
			for ( var i = 0; i < header.includemodelCount; i ++ ) {

				var offset = header.includemodelIndex + i * 8;
				var model = {};
				model.label = readString( dataView, dataView.getInt32( offset + 0, true ) );
				model.name = readString( dataView, dataView.getInt32( offset + 4, true ) );

			}

			// // mstudiobone_t
			// var bones = [];
			// for ( var i = 0; i < header.boneCount; i ++ ) {

			// 	var offset = header.boneOffset + i * 208;
			// 	var bone = {};
			// 	bone.name = readString( dataView, dataView.getInt32( offset + 0, true ) );

			// 	console.log(bone.name)
			// 	bone.parent = dataView.getInt32( offset + 4, true );

			// 	var bonecontroller = new Array( 6 );
			// 	for ( let i = 0; i < 6; i ++ ) {

			// 		bonecontroller[ i ] = dataView.getInt32( offset + 8 + i * 4, true );

			// 	}
			// 	bone.bonecontroller = bonecontroller;

			// 	bone.pos = new THREE.Vector3();
			// 	bone.pos.x = dataView.getFloat32( offset + 32, true );
			// 	bone.pos.y = dataView.getFloat32( offset + 36, true );
			// 	bone.pos.z = dataView.getFloat32( offset + 40, true );

			// 	bone.quaternion = new THREE.Quaternion();
			// 	bone.quaternion.x = dataView.getFloat32( offset + 44, true );
			// 	bone.quaternion.y = dataView.getFloat32( offset + 48, true );
			// 	bone.quaternion.z = dataView.getFloat32( offset + 52, true );
			// 	bone.quaternion.w = dataView.getFloat32( offset + 56, true );

			// 	bone.radianEuler = new THREE.Euler();
			// 	bone.radianEuler.x = dataView.getFloat32( offset + 60, true );
			// 	bone.radianEuler.y = dataView.getFloat32( offset + 64, true );
			// 	bone.radianEuler.z = dataView.getFloat32( offset + 68, true );

			// 	bone.posscale = new THREE.Vector3();
			// 	bone.posscale.x = dataView.getFloat32( offset + 72, true );
			// 	bone.posscale.y = dataView.getFloat32( offset + 76, true );
			// 	bone.posscale.z = dataView.getFloat32( offset + 80, true );

			// 	bone.rotscale = new THREE.Vector3();
			// 	bone.rotscale.x = dataView.getFloat32( offset + 84, true );
			// 	bone.rotscale.y = dataView.getFloat32( offset + 88, true );
			// 	bone.rotscale.z = dataView.getFloat32( offset + 92, true );

			// 	const posToBone = new THREE.Matrix4();
			// 	posToBone.identity();
			// 	for ( let i = 0; i < 12; i ++ ) {

			// 		posToBone.elements[ i ] = dataView.getFloat32( offset + 96 + i * 4, true );

			// 	}
			// 	bone.posToBone = posToBone;
			// 	// console.log( posToBone.elements )

			// 	// postobone
			// 	// 3 * 4 * 4 bytes = 48
			// 	// 92 + 48 = 140

			// 	bone.qAlignment = new THREE.Quaternion();
			// 	bone.qAlignment.x = dataView.getFloat32( offset + 140, true );
			// 	bone.qAlignment.y = dataView.getFloat32( offset + 144, true );
			// 	bone.qAlignment.z = dataView.getFloat32( offset + 148, true );
			// 	bone.qAlignment.w = dataView.getFloat32( offset + 152, true );

			// 	bone.flags = dataView.getInt32( offset + 156, true );
			// 	bone.proctype = dataView.getInt32( offset + 160, true );
			// 	bone.procindex = dataView.getInt32( offset + 164, true );
			// 	bone.physicsbone = dataView.getInt32( offset + 168, true );
			// 	bone.surfacepropidx = dataView.getInt32( offset + 172, true );
			// 	bone.contents = dataView.getInt32( offset + 176, true );

			// 	// unused
			// 	// 4 * 8 bytes = 32
			// 	// 176 + 32 = 208

			// }



			var boneControllers = [];

			var surfaceProp = readString( dataView, header.surfacepropIndex );

			return { textures, textureDirectories, includeModels, surfaceProp };

		}

		var header = parseHeader( buffer );
		var header2 = parseSecondaryHeader( buffer, header.studiohdr2index );
		return Object.assign( { header, header2, buffer }, readData( header, header2, buffer ) );

	}

};
