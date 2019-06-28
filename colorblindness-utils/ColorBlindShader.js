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
		// TODO: Verify the results here -- whay is tritanope not teal / red?
		uniform sampler2D tDiffuse;
		varying vec2 vUv;

		void main() {

			vec3 rgb = texture2D( tDiffuse, vUv ).rgb;

			mat3 rgb2lms;
			rgb2lms[0] = vec3(17.8824, 3.45565, 0.0299566);
			rgb2lms[1] = vec3(43.5161, 27.1554, 0.184309);
			rgb2lms[2] = vec3(4.11935, 3.86714, 1.46709);

			mat3 lms2rgb;
			lms2rgb[0] = vec3(0.0809444479, -0.0102485335, -0.000365296938);
			lms2rgb[1] = vec3(-0.130504409, 0.0540193266, -0.00412161469);
			lms2rgb[2] = vec3(0.116721066, -0.113614708, 0.693511405);

			mat3 dMat;
			dMat[0] = vec3(1.0, 0.494207, 0.0);
			dMat[1] = vec3(0.0, 0.0, 0.0);
			dMat[2] = vec3(0.0, 1.24827	, 1.0);

			mat3 pMat;
			pMat[0] = vec3(0.0, 0.0, 0.0);
			pMat[1] = vec3(2.02344, 1.0, 0.0);
			pMat[2] = vec3(-2.52581, 0.0, 1.0);

			mat3 tMat;
			tMat[0] = vec3(1.0, 0.0, -0.395913);
			tMat[1] = vec3(0.0, 1.0, 0.801109);
			tMat[2] = vec3(0.0, 0.0, 0.0);

			vec3 lms = rgb2lms * rgb;

			#if (MODE == 0)
			vec3 cb = lms;
			#elif (MODE == 1)
			vec3 cb = dMat * lms;
			#elif (MODE == 2)
			vec3 cb = pMat * lms;
			#elif (MODE == 3)
			vec3 cb = tMat * lms;
			#endif

			vec3 res = lms2rgb * cb;
			gl_FragColor = vec4(res, 1.0);
		}

	`

};
