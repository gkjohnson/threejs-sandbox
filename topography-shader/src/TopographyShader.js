import { UniformsUtils, Color } from '//cdn.skypack.dev/three@0.130.1/build/three.module.js';


function cloneShader( shader, uniforms, defines ) {

	const newShader = Object.assign( {}, shader );
	newShader.uniforms = UniformsUtils.merge( [
		newShader.uniforms,
		uniforms
	] );
	newShader.defines = Object.assign( {}, defines );

	return newShader;

}

function addWorldPosition( shader ) {

	if ( /varying\s+vec3\s+wPosition/.test( shader.vertexShader ) ) return;

	shader.vertexShader = `
			varying vec3 wPosition;
			${shader.vertexShader}
		`.replace(
		/#include <displacementmap_vertex>/,
		v =>
			`${v}
				wPosition = (modelMatrix * vec4( transformed, 1.0 )).xyz;
				`,
	);

	shader.fragmentShader = `
		varying vec3 wPosition;
		${shader.fragmentShader}
		`;

	return shader;

}

export function TopoLineShaderMixin( shader ) {

	const defineKeyword = 'ENABLE_TOPO_LINES';
	const newShader = cloneShader(
		shader,
		{
			topoLineColor: { value: new Color() },
			topoLineThickness: { value: 0.005 },
			topoLineSpacing: { value: 0.1 },
			topoLineOffset: { value: 0 },
			topoLineEmphasisMod: { value: 10 },
			topoFadeStart: { value: 20 },
			topoFadeDist: { value: 20 },
		},
		{
			[ defineKeyword ]: 1,
		},
	);

	newShader.extensions = {
		derivatives: true,
	};

	addWorldPosition( newShader );

	newShader.fragmentShader = `
			uniform vec3 topoLineColor;
			uniform float topoLineThickness;
			uniform float topoLineSpacing;
			uniform float topoLineOffset;
			uniform int topoLineEmphasisMod;
			uniform float topoFadeStart;
			uniform float topoFadeDist;
			${newShader.fragmentShader}
		`.replace(
		/#include <normal_fragment_maps>/,
		v =>
		/* glsl */`${v}
				#if ${defineKeyword}
				{
					// If a face sits exactly on a topo line then bump the delta so we don't divide by zero
					float yPosDelta = max( fwidth( wPosition.y ), 0.0001 );

					// Calculate the fade distance
					float fadeFactor = 1.0 - clamp( ( vViewPosition.z - topoFadeStart ) * ( 1.0 / topoFadeDist ), 0.0, 1.0 );

					// Calculate if this is an emphasized line or not
					float lineIndex = mod( wPosition.y + topoLineOffset, topoLineSpacing * float( topoLineEmphasisMod ) );
					lineIndex -= topoLineSpacing;
					lineIndex = abs( lineIndex );
					lineIndex = step( lineIndex, topoLineSpacing * 0.5 );

					// Compute the emphasis thickness
					float emphasized = lineIndex == 0.0 ? 0.0 : 1.0;
					float thickness = mix( 0.0, emphasized, fadeFactor );

					// Compute the added thickness for when lines get close together so we don't get moire
					float blend = smoothstep( topoLineSpacing * 0.5, topoLineSpacing, saturate( yPosDelta ) );
					thickness += blend + topoLineThickness;

					float lineFalloff = mod( wPosition.y + topoLineOffset, topoLineSpacing ) / topoLineSpacing;
					lineFalloff = max( lineFalloff, 1.0 - lineFalloff ) * 2.0 - 1.0;

					float topo = smoothstep(
						1.0,
						1.0 - yPosDelta * 2.0 / topoLineSpacing,
						lineFalloff + yPosDelta * thickness / topoLineSpacing
					);
					topo = mix( 1.0, topo, max( fadeFactor, lineIndex )  );

					diffuseColor = mix( diffuseColor, vec4( topoLineColor, 1.0 ), 1.0 - topo );
				}
				#endif
				`,
	);

	return newShader;

}
