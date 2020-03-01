import {
	Object3D,
	PointLight,
	SphereBufferGeometry,
	Mesh,
	MeshBasicMaterial,
	Triangle,
	Vector3
} from '//unpkg.com/three@0.112.0/build/three.module.js';
import {
	MeshSurfaceSampler
} from '//unpkg.com/three@0.112.0/examples/jsm/math/MeshSurfaceSampler.js';

const _vector = new Vector3();
const _tri = new Triangle();

export class VolumeLight extends Object3D {

    constructor() {

        super();

		this.lightCount = 1;
        this.lights = [];
		this.iteration = 0;
		this.randomSample = true;

    }

	updateLights() {

		const lights = this.lights;
		const lightCount = this.lightCount;
		while ( lights.length > lightCount ) {

			const light = lights.pop();
			light.parent.remove( light );

		}

		while ( lights.length < lightCount ) {

			const light = new PointLight();
			light.castShadow = true;
			lights.push( light );
			this.add( light );

		}

	}

    setIteration( i ) {

        this.iteration = i;

    }

}

export class MeshLight extends VolumeLight {

    constructor( geometry ) {

        super();
        const lightMesh = new Mesh( geometry, new MeshBasicMaterial() );
        this.add( lightMesh );

		this.lightMesh = lightMesh;
        this.geometry = geometry;
        this.setIteration( 0 );

    }

    setIteration( iteration ) {

        super.setIteration( iteration );

		const lights = this.lights;
		if ( this.randomSample ) {

			let sampler = this.sampler;
			if ( ! sampler || this.geometry !== sampler.originalGeometry ) {

				sampler = new MeshSurfaceSampler( this.lightMesh );
				sampler.originalGeometry = this.geometry;
				sampler.build();
				this.sampler = sampler;

			}

			for ( let i = 0, l = lights.length; i < l; i ++ ) {

				const light = lights[ i ];
				sampler.sample( light.position, _vector );

			}

		} else {

			const geometry = this.geometry;
			const positionAttr = geometry.attributes.position;
			const indexAttr = geometry.index;
			const triCount = indexAttr ? indexAttr.count / 3 : positionAttr.count / 9;
			const iteration = this.iteration * lights.length;

			for ( let i = 0, l = lights.length; i < l; i ++ ) {

				const light = lights[ i ];
				const modi = ( iteration + i ) % triCount;
				let i0 = modi + 0;
				let i1 = modi + 1;
				let i2 = modi + 2;

				if ( indexAttr ) {

					i0 = indexAttr.getX( i0 );
					i1 = indexAttr.getX( i1 );
					i2 = indexAttr.getX( i2 );

				}

				_tri.a.fromBufferAttribute( positionAttr, i0 ).multiplyScalar( 0.3333 );
				_tri.b.fromBufferAttribute( positionAttr, i1 ).multiplyScalar( 0.3333 );
				_tri.c.fromBufferAttribute( positionAttr, i2 ).multiplyScalar( 0.3333 );

				light.position
					.set( 0, 0, 0 )
					.add( _tri.a )
					.add( _tri.b )
					.add( _tri.c );

			}


		}

    }

}
