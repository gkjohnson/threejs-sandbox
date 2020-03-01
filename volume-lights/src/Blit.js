import {
	Scene,
	OrthographicCamera,
	Mesh,
	PlaneBufferGeometry,
	ShaderMaterial,
} from '//unpkg.com/three@0.112.0/build/three.module.js';

export const blit = ( function() {

    const scene = new Scene();
    const camera = new OrthographicCamera( -0.5, 0.5, 0.5, -0.5, -0.5, 0.5 );
    const quad = new Mesh( new PlaneBufferGeometry(), null );

    scene.add( quad );

    return function( renderer, material, renderTarget = null ) {

		quad.material = material;
		renderer.setRenderTarget( renderTarget );
        renderer.render( scene, camera );
		renderer.setRenderTarget( null );

    };

} )();

export const getBlendMaterial = function() {

    return new ShaderMaterial({

        uniforms: {
            texture1: { value: null },
            texture2: { value: null },
            weight: { value: 1 }
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
            uniform float weight;

            void main() {

                vec4 s1 = texture2D( texture1, vUv );
                vec4 s2 = texture2D( texture2, vUv );

                gl_FragColor = mix( s1, s2, weight );
                gl_FragColor.a = 1.0;
            }
        `

    });

}
