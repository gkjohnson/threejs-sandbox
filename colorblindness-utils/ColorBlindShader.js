// References
// http://web.archive.org/web/20081014161121/http://www.colorjack.com/labs/colormatrix/
// http://mapeper.github.io/jsColorblindSimulator/
var ColorBlindShader = {

	uniforms: {

		"tDiffuse": { value: null },

	},

	vertexShader: `

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}
	`,

	fragmentShader: `
		varying vec2 vUv;
		uniform sampler2D tDiffuse;

		void main() {

			vec3 rgb = texture2D( tDiffuse, vUv ).rgb;

			mat3 dMat;
			dMat[0] = vec3(0.625, 0.375, 0.0);
			dMat[1] = vec3(0.7, 0.3, 0.0);
			dMat[2] = vec3(0.0, 0.3, 0.7);

			mat3 pMat;
			pMat[0] = vec3(0.56667, 0.43333, 0.0);
			pMat[1] = vec3(0.55833, 0.44167, 0.0);
			pMat[2] = vec3(0.0, 0.24167, 0.75833);

			mat3 tMat;
			tMat[0] = vec3(0.95, 0.05, 0.0);
			tMat[1] = vec3(0.0, 0.43333, 0.56667);
			tMat[2] = vec3(0.0, 0.475, 0.525);

			vec3 res = rgb;

			#if (MODE == 1)
			res = dMat * rgb;
			#elif (MODE == 2)
			res = pMat * rgb;
			#elif (MODE == 3)
			res = tMat * rgb;
			#endif

			gl_FragColor = vec4(res, 1.0);
		}

	`

};
