import { ShaderMaterial } from '';
import { parseVariables } from './utils.js';

export class ShaderDebugMaterial {

	constructor( shaderOrMaterial ) {

		super( shaderOrMaterial );

		if ( shaderOrMaterial.isShaderMaterial ) {

			this.targetMaterial = shaderOrMaterial;

		} else {

			this.targetMaterial = new ShaderMaterial( shaderOrMaterial );

		}

		this.vertexDefinitions = null;
		this.fragmentDefinitions = null;
		this.updateDefinitions();

	}

	updateDefinitions() {

		this.clearOutputVariable();
		this.vertexDefinitions = parseVariables( this.vertexShader );
		this.fragmentDefinitions = parseVariables( this.fragmentShader );

	}

	setFragmentOutputVariable( name, line, column, type = null, condition = null ) {

		this.clearOutputVariable();

		// TODO: verify that the position is within the main block and throw otherwise

		// TODO: try to find type definition if it isn't given by extracting the current scope
		// and checking which variable declaration is correct.

		let output;

		switch( type ) {

			case 'float':
				output = `vec4( ${ name } )`;
				break;
			case 'int':
				output = `vec4( float( ${ name } ) )`;
				break;
			case 'bool':
				output = `vec4( float( ${ name } ) )`;
				break;
			case 'vec2':
				output = `vec4( ${ name }.xy, 0.0, 0.0 )`;
				break;
			case 'vec3':
				output = `vec4( ${ name }.xyz, 0.0 )`;
				break;
			case 'vec4':
				output = `${ name }`;
				break;
		}

		const fragmentShader = this.fragmentShader;
		const lines = fragmentShader.split( /\n/g );
		let result = '';
		for ( let i = 0; i < line; i ++ ) {

			const line = lines.shift();
			result += line + '\n';

		}

		result += lines[ 0 ].substr( 0, column );
		lines[ 0 ] = lines[ 0 ].substr( column );

		if ( condition ) {

			result += `

			if ( ${ condition } ) {

				gl_FragColor = ${ output };
				return;

			}

			`;

		} else {

			result += `

			gl_FragColor = ${ output };
			return;

			`;

		}

		result += lines.join( '\n' );

		// TODO: insert black output at the end of main

		this.fragmentShader = result;
		this.needsUpdate = true;

	}

	clearOutputVariable() {

		const targetMaterial = this.targetMaterial;
		this.vertexShader = targetMaterial.vertexShader;
		this.fragmentShader = targetMaterial.fragmentShader;
		this.needsUpdate = true;

	}

	reset() {

		this.copy( this.targetMaterial );
		this.needsUpdate = true;

	}


}
