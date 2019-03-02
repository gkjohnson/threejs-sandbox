class CubeTerrainGeometry extends THREE.BufferGeometry {

	constructor( width = 1, height = 1, widthSegments = 1, heightSegments = 1, cellScale = 1 ) {

		super();

		this.type = 'CubeTerrainGeometry';

		this.parameters = {

			width,
			height,
			widthSegments,
			heightSegments,
			cellScale,

		};

		const w = width / widthSegments;
		const h = height / heightSegments;

		const w2 = cellScale * w / 2;
		const h2 = cellScale * h / 2;

		const posAttr = new THREE.BufferAttribute( new Float32Array( 3 * 8 * widthSegments * heightSegments ), 3, false );
		const indexAttr = new THREE.BufferAttribute( new Uint32Array( 3 * 6 * 2 * widthSegments * heightSegments ), 1, false );
		const indexArr = indexAttr.array;

		for ( let x = 0; x < widthSegments; x ++ ) {

			for ( let y = 0; y < heightSegments; y ++ ) {

				// Generate the cube positions
				const index = y * widthSegments + x;
				const cx = x * w + w / 2 - width / 2;
				const cy = y * h + h / 2 - height / 2;
				let posIndex = index * 8;

				for ( let bz = -1; bz <= 1; bz += 2 ) {

					for ( let by = -1; by <= 1; by += 2 ) {

						for ( let bx = -1; bx <= 1; bx += 2 ) {

							posAttr.setXYZ(
								posIndex,
								cx + w2 * bx,
								cy + h2 * by,
								bz
							);

							posIndex ++;

						}

					}

				}

				// z
				// |
				// |
				// o ----- x
				//  ＼
				//    y


				// 4 ---- 5
				//  ＼     ＼
				//    6 ---- 7
				//
				// 0 ---- 1
				//  ＼     ＼
				//    2 ---- 3



				posIndex = index * 8;

				// Generate the indices
				let indexIndex = index * 36;

				// bottom face
				indexArr[ indexIndex ++ ] = posIndex + 0;
				indexArr[ indexIndex ++ ] = posIndex + 2;
				indexArr[ indexIndex ++ ] = posIndex + 1;

				indexArr[ indexIndex ++ ] = posIndex + 2;
				indexArr[ indexIndex ++ ] = posIndex + 3;
				indexArr[ indexIndex ++ ] = posIndex + 1;

				// top face
				indexArr[ indexIndex ++ ] = posIndex + 4;
				indexArr[ indexIndex ++ ] = posIndex + 5;
				indexArr[ indexIndex ++ ] = posIndex + 6;

				indexArr[ indexIndex ++ ] = posIndex + 6;
				indexArr[ indexIndex ++ ] = posIndex + 5;
				indexArr[ indexIndex ++ ] = posIndex + 7;

				// left face
				indexArr[ indexIndex ++ ] = posIndex + 4;
				indexArr[ indexIndex ++ ] = posIndex + 6;
				indexArr[ indexIndex ++ ] = posIndex + 0;

				indexArr[ indexIndex ++ ] = posIndex + 6;
				indexArr[ indexIndex ++ ] = posIndex + 2;
				indexArr[ indexIndex ++ ] = posIndex + 0;

				// right face
				indexArr[ indexIndex ++ ] = posIndex + 5;
				indexArr[ indexIndex ++ ] = posIndex + 1;
				indexArr[ indexIndex ++ ] = posIndex + 7;

				indexArr[ indexIndex ++ ] = posIndex + 1;
				indexArr[ indexIndex ++ ] = posIndex + 3;
				indexArr[ indexIndex ++ ] = posIndex + 7;

				// back face
				indexArr[ indexIndex ++ ] = posIndex + 4;
				indexArr[ indexIndex ++ ] = posIndex + 0;
				indexArr[ indexIndex ++ ] = posIndex + 5;

				indexArr[ indexIndex ++ ] = posIndex + 5;
				indexArr[ indexIndex ++ ] = posIndex + 0;
				indexArr[ indexIndex ++ ] = posIndex + 1;

				// front face
				indexArr[ indexIndex ++ ] = posIndex + 6;
				indexArr[ indexIndex ++ ] = posIndex + 7;
				indexArr[ indexIndex ++ ] = posIndex + 2;

				indexArr[ indexIndex ++ ] = posIndex + 7;
				indexArr[ indexIndex ++ ] = posIndex + 3;
				indexArr[ indexIndex ++ ] = posIndex + 2;

			}

		}

		this.setIndex( indexAttr );
		this.addAttribute( 'position', posAttr );
		this.removeAttribute( 'normal' );

		this.setZ = function( x, y, z ) {

			const index = y * widthSegments + x;
			let posIndex = index * 8 + 4;
			posAttr.setZ( posIndex ++, z );
			posAttr.setZ( posIndex ++, z );
			posAttr.setZ( posIndex ++, z );
			posAttr.setZ( posIndex ++, z );

			posAttr.needsUpdate = true;

		}


	}

}
