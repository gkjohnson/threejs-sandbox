window.blit = ( function() {

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera( -0.5, 0.5, 0.5, -0.5, -0.5, 0.5 );
    const quad = new THREE.Mesh( new THREE.PlaneBufferGeometry(), null );

    scene.add( quad );

    return function( renderer, material, renderTarget ) {

        quad.material = material;
        renderer.render( scene, camera, renderTarget );

    };

} )();

window.getBlendMaterial = function() {

    return new THREE.ShaderMaterial({

        uniforms: {
            texture1: { value: null },
            texture2: { value: null },
            iterations: { value: 1 }
        },

        vertexShader: `
            varying vec2 vUv;
            void main()	{
                vUv = uv;
                gl_Position = vec4( position * 2.0, 1.0 );
            }
        `,

        fragmentShader: `
            highp float;
            highp int;
            varying vec2 vUv;
            uniform sampler2D texture1;
            uniform sampler2D texture2;
            uniform int iterations;

            void main() {

                vec4 s1 = texture2D( texture1, vUv );
                vec4 s2 = texture2D( texture2, vUv );

                gl_FragColor = mix( s1, s2, 1.0 / float(iterations) );
                gl_FragColor.a = 1.0;
            }
        `

    });

}