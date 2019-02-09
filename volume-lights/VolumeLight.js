class VolumeLight extends THREE.Object3D {

    constructor() {

        super();

        const light = new THREE.PointLight();

        // const debugLight = new THREE.Mesh( new THREE.SphereBufferGeometry() );
        // light.add( debugLight );
        // debugLight.scale.set( 0.1, 0.1, 0.1 );

        this.add( light );

        this.light = light;
        this.iteration = 0;
    
    }

    setIteration( i ) {

        this.iteration = i;

    }

}

class MeshLight extends VolumeLight {

    constructor( geometry ) {

        super();
        const lightGeom = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial() );
        this.add( lightGeom );

        this.geometry = geometry;
        this.setIteration( 0 );

    }

    setIteration( i ) {
        
        super.setIteration( i );

        i *= 3;

        const tri = new THREE.Triangle();

        const geometry = this.geometry;
        const positionAttr = geometry.attributes.position;
        const indexAttr = geometry.index;
        const triCount = indexAttr ? indexAttr.count : positionAttr.count / 3;

        const loopi = ~ ~ ( i / triCount );
        const modi = i % triCount; 
        let i0 = modi + 0;
        let i1 = modi + 1;
        let i2 = modi + 2;

        if ( indexAttr ) {

            i0 = indexAttr.getX( i0 );
            i1 = indexAttr.getX( i1 );
            i2 = indexAttr.getX( i2 );

        }

        // TODO: Interpolate along the surface of the triangle
        tri.a.fromBufferAttribute( positionAttr, i0 ).multiplyScalar( 0.3333 );
        tri.b.fromBufferAttribute( positionAttr, i1 ).multiplyScalar( 0.3333 );
        tri.c.fromBufferAttribute( positionAttr, i2 ).multiplyScalar( 0.3333 );

        this.light.position
            .set( 0, 0, 0 )
            .add( tri.a )
            .add( tri.b )
            .add( tri.c );
        
    }

}