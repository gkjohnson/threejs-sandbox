import { ShaderMaterial } from '//unpkg.com/three@0.114.0/build/three.module.js';
import { parseVariables, getMainExtents, splice } from './utils.js';

export class ShaderDebugMaterial extends ShaderMaterial {

	constructor( shaderOrMaterial ) {

		let shader, material;

		if ( shaderOrMaterial.isShaderMaterial ) {

			material = shaderOrMaterial;
			shader = {
				uniforms: material.uniforms,
				defines: material.defines,
				fragmentShader: material.fragmentShader,
				vertexShader: material.vertexShader

			};

		} else {

			shader = shaderOrMaterial;
			material = new ShaderMaterial( shader );

		}

		super( shader );
		this.targetMaterial = material;

		this.vertexDefinitions = null;
		this.fragmentDefinitions = null;
		this.updateDefinitions();

	}

	updateDefinitions() {

		this.clearOutputVariable();
		this.vertexDefinitions = parseVariables( this.vertexShader );
		this.fragmentDefinitions = parseVariables( this.fragmentShader );

	}

	setVertexOutputVariable( name, index, type = null, condition = null ) {

		this.clearOutputVariable();

		const vertexShader = this.vertexShader;
		const extents = getMainExtents( vertexShader );
		if ( index === null ) {

			index = extents.end;

		}

		if ( index < extents.after || index > extents.end ) {

			throw new Error( 'ShaderDebugMaterial: Can only insert code in main body.' );

		}

		this.fragmentShader = splice(
			this.fragmentShader,
			'\ngl_FragColor = __varying_output__; return;\n',
			getMainExtents( this.fragmentShader ).after
		);
		this.fragmentShader = splice(
			this.fragmentShader,
			'\n varying vec4 __varying_output__;\n',
			getMainExtents( this.fragmentShader ).before
		);

		let output;
		if ( /gl_FragColor\s*=/.test( name ) ) {

			output = name.replace( 'gl_FragColor', '__varying_output__' );

		} else {

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

		}

		let result;
		if ( condition ) {

			result = `

			if ( ${ condition } ) {

				__varying_output__ = ${ output };
				return;

			}

			`;

		} else {

			result = `

			__varying_output__ = ${ output };
			return;

			`;

		}

		this.vertexShader = splice( this.vertexShader, result, index );
		this.vertexShader = splice( this.vertexShader, '\nvarying vec4 __varying_output__;\n', getMainExtents( this.vertexShader ).before );
		this.needsUpdate = true;

	}

	setFragmentOutputVariable( name, index = null, type = null, condition = null ) {

		this.clearOutputVariable();

		const fragmentShader = this.fragmentShader;
		const extents = getMainExtents( fragmentShader );
		if ( index === null ) {

			index = extents.end;

		}

		if ( index < extents.after || index > extents.end ) {

			throw new Error( 'ShaderDebugMaterial: Can only insert code in main body.' );

		}

		// TODO: try to find type definition if it isn't given by extracting the current scope
		// and checking which variable declaration is correct.

		let output;
		if ( /gl_FragColor\s*=/.test( name ) ) {

			output = name;

		} else {

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

		}

		let result;
		if ( condition ) {

			result = `

			if ( ${ condition } ) {

				gl_FragColor = ${ output };
				return;

			}

			`;

		} else {

			result = `

			gl_FragColor = ${ output };
			return;

			`;

		}

		this.fragmentShader = splice( this.fragmentShader, result, index );
		this.fragmentShader = splice( this.fragmentShader, '\ngl_FragColor = vec4( 0.0 );', getMainExtents( this.fragmentShader ).end );
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
