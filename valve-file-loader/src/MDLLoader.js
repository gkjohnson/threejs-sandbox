// MDL: https://developer.valvesoftware.com/wiki/MDL
// https://github.com/ValveSoftware/source-sdk-2013/blob/master/sp/src/public/studio.h

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

		// studiohdr_t
		function parseHeader( buffer ) {

			var dataView = new DataView( buffer );
			var i = 0;

			// int id;
			var id = dataView.getInt32( i, true );
			i += 4;

			// int version;
			var version = dataView.getInt32( i, true );
			i += 4;

			// int checksum;
			var checksum = dataView.getInt32( i, true );
			i += 4;

			// char name[64];
			var name = readString( dataView, i, 64 );
			i += 64;

			// int length;
			var length = dataView.getInt32( i, true );
			i += 4;

			// Vector eyeposition;
			var eyeposition = new THREE.Vector3();
			eyeposition.x = dataView.getFloat32( i + 0, true );
			eyeposition.y = dataView.getFloat32( i + 4, true );
			eyeposition.z = dataView.getFloat32( i + 8, true );
			i += 12;

			// Vector illumposition;
			var illumposition = new THREE.Vector3();
			illumposition.x = dataView.getFloat32( i + 0, true );
			illumposition.y = dataView.getFloat32( i + 4, true );
			illumposition.z = dataView.getFloat32( i + 8, true );
			i += 12;

			// Vector hull_min;
			var hullMin = new THREE.Vector3();
			hullMin.x = dataView.getFloat32( i + 0, true );
			hullMin.y = dataView.getFloat32( i + 4, true );
			hullMin.z = dataView.getFloat32( i + 8, true );
			i += 12;

			// Vector hull_max;
			var hullMax = new THREE.Vector3();
			hullMax.x = dataView.getFloat32( i + 0, true );
			hullMax.y = dataView.getFloat32( i + 4, true );
			hullMax.z = dataView.getFloat32( i + 8, true );
			i += 12;

			// Vector view_bbmin;
			var viewBbmin = new THREE.Vector3();
			viewBbmin.x = dataView.getFloat32( i + 0, true );
			viewBbmin.y = dataView.getFloat32( i + 4, true );
			viewBbmin.z = dataView.getFloat32( i + 8, true );
			i += 12;

			// Vector view_bbmax;
			var viewBbmax = new THREE.Vector3();
			viewBbmax.x = dataView.getFloat32( i + 0, true );
			viewBbmax.y = dataView.getFloat32( i + 4, true );
			viewBbmax.z = dataView.getFloat32( i + 8, true );
			i += 12;

			// int flags;
			var flags = dataView.getInt32( i, true );
			i += 4;

			// int numbones;
			var numbones = dataView.getInt32( i, true );
			i += 4;

			// int boneindex;
			var boneindex = dataView.getInt32( i, true );
			i += 4;

			// int numbonecontrollers;
			var numbonecontrollers = dataView.getInt32( i, true );
			i += 4;

			// int bonecontrollerindex;
			var bonecontrollerindex = dataView.getInt32( i, true );
			i += 4;

			// int numhitboxsets;
			var numhitboxsets = dataView.getInt32( i, true );
			i += 4;

			// int hitboxsetindex;
			var hitboxsetindex = dataView.getInt32( i, true );
			i += 4;

			// int numlocalanim;
			var numlocalanim = dataView.getInt32( i, true );
			i += 4;

			// int localanimindex;
			var localanimindex = dataView.getInt32( i, true );
			i += 4;

			// int numlocalseq;
			var numlocalseq = dataView.getInt32( i, true );
			i += 4;

			// int localseqindex;
			var localseqindex = dataView.getInt32( i, true );
			i += 4;

			// mutable int activitylistversion;
			var activitylistversion = dataView.getInt32( i, true );
			i += 4;

			// mutable int eventsindexed;
			var eventsindexed = dataView.getInt32( i, true );
			i += 4;

			// int numtextures;
			var numtextures = dataView.getInt32( i, true );
			i += 4;

			// int textureindex;
			var textureindex = dataView.getInt32( i, true );
			i += 4;

			// int numcdtextures;
			var numcdtextures = dataView.getInt32( i, true );
			i += 4;

			// int cdtextureindex;
			var cdtextureindex = dataView.getInt32( i, true );
			i += 4;

			// int numskinref;
			var numskinref = dataView.getInt32( i, true );
			i += 4;

			// int numskinfamilies;
			var numskinfamilies = dataView.getInt32( i, true );
			i += 4;

			// int skinindex;
			var skinindex = dataView.getInt32( i, true );
			i += 4;

			// int numbodyparts;
			var numbodyparts = dataView.getInt32( i, true );
			i += 4;

			// int bodypartindex;
			var bodypartindex = dataView.getInt32( i, true );
			i += 4;

			// int numlocalattachments;
			var numlocalattachments = dataView.getInt32( i, true );
			i += 4;

			// int localattachmentindex;
			var localattachmentindex = dataView.getInt32( i, true );
			i += 4;

			// int numlocalnodes;
			var numlocalnodes = dataView.getInt32( i, true );
			i += 4;

			// int localnodeindex;
			var localnodeindex = dataView.getInt32( i, true );
			i += 4;

			// int localnodenameindex;
			var localnodenameindex = dataView.getInt32( i, true );
			i += 4;

			// int numflexdesc;
			var numflexdesc = dataView.getInt32( i, true );
			i += 4;

			// int flexdescindex;
			var flexdescindex = dataView.getInt32( i, true );
			i += 4;

			// int numflexcontrollers;
			var numflexcontrollers = dataView.getInt32( i, true );
			i += 4;

			// int flexcontrollerindex;
			var flexcontrollerindex = dataView.getInt32( i, true );
			i += 4;

			// int numflexrules;
			var numflexrules = dataView.getInt32( i, true );
			i += 4;

			// int flexruleindex;
			var flexruleindex = dataView.getInt32( i, true );
			i += 4;

			// int numikchains;
			var numikchains = dataView.getInt32( i, true );
			i += 4;

			// int ikchainindex;
			var ikchainindex = dataView.getInt32( i, true );
			i += 4;

			// int nummouths;
			var nummouths = dataView.getInt32( i, true );
			i += 4;

			// int mouthindex;
			var mouthindex = dataView.getInt32( i, true );
			i += 4;

			// int numlocalposeparameters;
			var numlocalposeparameters = dataView.getInt32( i, true );
			i += 4;

			// int localposeparamindex;
			var localposeparamindex = dataView.getInt32( i, true );
			i += 4;

			// int surfacepropindex;
			var surfacepropindex = dataView.getInt32( i, true );
			i += 4;

			// int keyvalueindex;
			var keyvalueindex = dataView.getInt32( i, true );
			i += 4;

			// int keyvaluesize;
			var keyvaluesize = dataView.getInt32( i, true );
			i += 4;

			// int numlocalikautoplaylocks;
			var numlocalikautoplaylocks = dataView.getInt32( i, true );
			i += 4;

			// int localikautoplaylockindex;
			var localikautoplaylockindex = dataView.getInt32( i, true );
			i += 4;

			// float mass;
			var mass = dataView.getFloat32( i, true );
			i += 4;

			// int contents;
			var contents = dataView.getInt32( i, true );
			i += 4;

			// int numincludemodels;
			var numincludemodels = dataView.getInt32( i, true );
			i += 4;

			// int includemodelindex;
			var includemodelindex = dataView.getInt32( i, true );
			i += 4;

			// mutable void *virtualModel;
			i += 4;

			// int szanimblocknameindex;
			var szanimblocknameindex = dataView.getInt32( i, true );
			i += 4;

			// int numanimblocks;
			var numanimblocks = dataView.getInt32( i, true );
			i += 4;

			// int animblockindex;
			var animblockindex = dataView.getInt32( i, true );
			i += 4;

			// mutable void *animblockModel;
			i += 4;

			// int bonetablebynameindex;
			var bonetablebynameindex = dataView.getInt32( i, true );
			i += 4;

			// void *pVertexBase;
			i += 4;

			// void *pIndexBase;
			i += 4;

			// byte constdirectionallightdot;
			var constdirectionallightdot = dataView.getUint8( i, true );
			i += 1;

			// byte rootLOD;
			var rootLOD = dataView.getUint8( i, true );
			i += 1;

			// byte numAllowedRootLODs;
			var numAllowedRootLODs = dataView.getUint8( i, true );
			i += 1;

			// byte unused[1];
			i += 1;

			// int unused4;
			i += 4;

			// int numflexcontrollerui;
			var numflexcontrollerui = dataView.getInt32( i, true );
			i += 4;

			// int flexcontrolleruiindex;
			var flexcontrolleruiindex = dataView.getInt32( i, true );
			i += 4;

			// float flVertAnimFixedPointScale;
			var flVertAnimFixedPointScale = dataView.getFloat32( i, true );
			i += 4;

			// int unused3[1];
			i += 4;

			// int studiohdr2index;
			var studiohdr2index = dataView.getInt32( i, true );
			i += 4;

			// int unused2[1];
			i += 4;

			return {
				id,
				version,
				checksum,
				name,
				length,
				eyeposition,
				illumposition,
				hullMin,
				hullMax,
				viewBbmin,
				viewBbmax,
				flags,
				numbones,
				boneindex,
				numbonecontrollers,
				bonecontrollerindex,
				numhitboxsets,
				hitboxsetindex,
				numlocalanim,
				localanimindex,
				numlocalseq,
				localseqindex,
				activitylistversion,
				eventsindexed,
				numtextures,
				textureindex,
				numcdtextures,
				cdtextureindex,
				numskinref,
				numskinfamilies,
				skinindex,
				numbodyparts,
				bodypartindex,
				numlocalattachments,
				localattachmentindex,
				numlocalnodes,
				localnodeindex,
				localnodenameindex,
				numflexdesc,
				flexdescindex,
				numflexcontrollers,
				flexcontrollerindex,
				numflexrules,
				flexruleindex,
				numikchains,
				ikchainindex,
				nummouths,
				mouthindex,
				numlocalposeparameters,
				localposeparamindex,
				surfacepropindex,
				keyvalueindex,
				keyvaluesize,
				numlocalikautoplaylocks,
				localikautoplaylockindex,
				mass,
				contents,
				numincludemodels,
				includemodelindex,
				// virtualModel,
				szanimblocknameindex,
				numanimblocks,
				animblockindex,
				// animblockModel,
				bonetablebynameindex,
				// pVertexBase,
				// pIndexBase,
				constdirectionallightdot,
				rootLOD,
				numAllowedRootLODs,
				// unused,
				// unused4,
				numflexcontrollerui,
				flexcontrolleruiindex,
				flVertAnimFixedPointScale,
				// unused3,
				studiohdr2index,
				// unused2
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
			// struct mstudiotexture_t
			for ( var i = 0; i < header.numtextures; i ++ ) {

				var offset = header.textureindex + i * 16 * 4;
				var sznameindex = dataView.getInt32( offset, true );
				// var flags = dataView.getInt32( offset + 4, true );
				// var used = dataView.getInt32( offset + 8, true );

				// int unused1
				// void* material
				// void* clientmaterial
				// int unused[10]

				textures.push( readString( dataView, offset + sznameindex ) );

			}

			var textureDirectories = [];
			for ( var i = 0; i < header.numcdtextures; i ++ ) {

				var offset = header.cdtextureindex + i * 4;
				var ptr = dataView.getInt32( offset, true );
				textureDirectories.push( readString( dataView, ptr ) );

			}

			var includeModels = [];
			// struct mstudiomodelgroup_t
			for ( var i = 0; i < header.numincludemodels; i ++ ) {

				var offset = header.includemodelindex + i * 8;
				var model = {};
				model.label = readString( dataView, dataView.getInt32( offset + 0, true ) );
				model.name = readString( dataView, dataView.getInt32( offset + 4, true ) );
				includeModels.push( model );

			}

			// struct mstudiobodyparts_t
			var bodyParts = [];
			for ( var i = 0; i < header.numbodyparts; i ++ ) {

				var offset = header.bodypartindex + i * 16;
				var bodyPart = {};
				bodyPart.name = readString( dataView, dataView.getInt32( offset + 0, true ) );
				bodyPart.nummodels = dataView.getInt32( offset + 4, true );
				bodyPart.base = dataView.getInt32( offset + 8, true );
				bodyPart.modelindex = dataView.getInt32( offset + 12, true );
				bodyPart.models = [];
				bodyParts.push( bodyPart );

				// struct mstudiomodel_t
				for ( var i2 = 0; i2 < bodyPart.nummodels; i2 ++ ) {

					var offset2 = offset + bodyPart.modelindex + i2 * 148;
					var model = {};
					model.name = readString( dataView, offset2 + 0);
					model.type = dataView.getInt32( offset2 + 64, true );
					model.boundingradius = dataView.getFloat32( offset2 + 64 + 4, true );

					model.nummeshes = dataView.getInt32( offset2 + 64 + 8, true );
					model.meshindex = dataView.getInt32( offset2 + 64 + 12, true );

					model.numvertices = dataView.getInt32( offset2 + 64 + 16, true );
					model.vertexindex = dataView.getInt32( offset2 + 64 + 20, true );
					model.tangentsindex = dataView.getInt32( offset2 + 64 + 24, true );

					model.numattachments = dataView.getInt32( offset2 + 64 + 28, true );
					model.attachmentindex = dataView.getInt32( offset2 + 64 + 32, true );
					model.numeyeballs = dataView.getInt32( offset2 + 64 + 36, true );
					model.eyeballindex = dataView.getInt32( offset2 + 64 + 40, true );

					// 108 bytes so far

					// mstudio_modelvertexdata_t -- contains two void pointers

					// int unused[8]

					// 108 + 8 + 8 * 4 = 148 bytes

					model.meshes = [];
					bodyPart.models.push( model );

					// TODO: Some times the amount of meshes here is (seemingly incorrectly) huge
					// and causes an out of memory crash

					// struct mstudiomesh_t
					for ( var i3 = 0; i3 < model.nummeshes; i3 ++ ) {

						var offset3 = offset2 + model.meshindex + i3 * 116;
						var mesh = {};
						mesh.material = dataView.getInt32( offset3 + 0, true );
						mesh.modelindex = dataView.getInt32( offset3 + 4, true );

						mesh.numvertices = dataView.getInt32( offset3 + 8, true );
						mesh.vertexoffset = dataView.getInt32( offset3 + 12, true );

						mesh.numflexes = dataView.getInt32( offset3 + 16, true );
						mesh.flexindex = dataView.getInt32( offset3 + 20, true );

						mesh.materialtype = dataView.getInt32( offset3 + 24, true );
						mesh.materialparam = dataView.getInt32( offset3 + 28, true );

						mesh.meshid = dataView.getInt32( offset3 + 32, true );
						mesh.center = new THREE.Vector3(
							dataView.getFloat32( offset3 + 36, true ),
							dataView.getFloat32( offset3 + 40, true ),
							dataView.getFloat32( offset3 + 44, true ),
						);

						// 48 bytes total

						// TODO: should we parse this?
						// mstudio_modelvertexdata_t vertexdata (36 bytes)
						//     mstudio_modelvertexdata_t    *modelvertexdata; -- 4
						//     int                           numLODVertexes[MAX_NUM_LODS]; -- 4 * 8

						// 84 bytes total

						// int unused[8]

						// 116 total

						model.meshes.push( mesh );

					}

				}

			}

			// mstudiobone_t
			var bones = [];
			for ( var i = 0; i < header.numbones; i ++ ) {

				var offset = header.boneindex + i * 216;
				var bone = {};

				bone.name = readString( dataView, dataView.getInt32( offset + 0, true ) );

				console.log(bone.name)
				bone.parent = dataView.getInt32( offset + 4, true );

				var bonecontroller = new Array( 6 );
				for ( let i = 0; i < 6; i ++ ) {

					bonecontroller[ i ] = dataView.getInt32( offset + 8 + i * 4, true );

				}
				bone.bonecontroller = bonecontroller;

				// 6 * 4 = 24
				// 8 + 24 = 32

				bone.pos = new THREE.Vector3();
				bone.pos.x = dataView.getFloat32( offset + 32, true );
				bone.pos.y = dataView.getFloat32( offset + 36, true );
				bone.pos.z = dataView.getFloat32( offset + 40, true );

				bone.quaternion = new THREE.Quaternion();
				bone.quaternion.x = dataView.getFloat32( offset + 44, true );
				bone.quaternion.y = dataView.getFloat32( offset + 48, true );
				bone.quaternion.z = dataView.getFloat32( offset + 52, true );
				bone.quaternion.w = dataView.getFloat32( offset + 56, true );

				bone.radianEuler = new THREE.Euler();
				bone.radianEuler.x = dataView.getFloat32( offset + 60, true );
				bone.radianEuler.y = dataView.getFloat32( offset + 64, true );
				bone.radianEuler.z = dataView.getFloat32( offset + 68, true );

				bone.posscale = new THREE.Vector3();
				bone.posscale.x = dataView.getFloat32( offset + 72, true );
				bone.posscale.y = dataView.getFloat32( offset + 76, true );
				bone.posscale.z = dataView.getFloat32( offset + 80, true );

				bone.rotscale = new THREE.Vector3();
				bone.rotscale.x = dataView.getFloat32( offset + 84, true );
				bone.rotscale.y = dataView.getFloat32( offset + 88, true );
				bone.rotscale.z = dataView.getFloat32( offset + 92, true );

				const posToBone = new THREE.Matrix4();
				posToBone.identity();
				for ( let i = 0; i < 12; i ++ ) {

					posToBone.elements[ i ] = dataView.getFloat32( offset + 96 + i * 4, true );

				}
				bone.posToBone = posToBone;
				// console.log( posToBone.elements )

				// postobone
				// 3 * 4 * 4 bytes = 48
				// 96 + 48 = 144

				bone.qAlignment = new THREE.Quaternion();
				bone.qAlignment.x = dataView.getFloat32( offset + 144, true );
				bone.qAlignment.y = dataView.getFloat32( offset + 148, true );
				bone.qAlignment.z = dataView.getFloat32( offset + 152, true );
				bone.qAlignment.w = dataView.getFloat32( offset + 156, true );

				bone.flags = dataView.getInt32( offset + 160, true );
				bone.proctype = dataView.getInt32( offset + 164, true );
				bone.procindex = dataView.getInt32( offset + 168, true );
				bone.physicsbone = dataView.getInt32( offset + 172, true );
				bone.surfacepropidx = dataView.getInt32( offset + 176, true );
				bone.contents = dataView.getInt32( offset + 180, true );

				// unused
				// 4 * 8 bytes = 32
				// 184 + 32 = 216

				bones.push( bone );
			}



			var boneControllers = [];

			var surfaceProp = readString( dataView, header.surfacepropindex );

			return { textures, textureDirectories, includeModels, surfaceProp, bodyParts, bones, boneControllers };

		}

		var header = parseHeader( buffer );
		var header2 = parseSecondaryHeader( buffer, header.studiohdr2index );
		return Object.assign( { header, header2, buffer }, readData( header, header2, buffer ) );

	}

};
