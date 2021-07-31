import { ShaderMaterial } from '//cdn.skypack.dev/three@0.114.0/build/three.module.js';
import { parseVariables, getMainExtents, splice, getScopeDepth } from './utils.js';

export class ShaderDebugMaterial extends ShaderMaterial {

	get multiplier() {

		return this.uniforms._multiplier_.value;

	}

	set multiplier( value ) {

		this.uniforms._multiplier_.value = value;

	}

	get offset() {

		return this.uniforms._offset_.value;

	}

	set offset( value ) {

		this.uniforms._offset_.value = value;

	}

	constructor( shaderOrMaterial ) {

		let shader, material;

		if ( shaderOrMaterial.isShaderMaterial ) {

			material = shaderOrMaterial;
			shader = {
				extensions: material.extensions,
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
		this.uniforms._multiplier_ = { value: 1.0 };
		this.uniforms._offset_ = { value: 1.0 };
		this.targetMaterial = material;
		this._currType = null;

		this.vertexDefinitions = null;
		this.fragmentDefinitions = null;
		this.updateDefinitions();

	}

	updateDefinitions() {

		this.clearOutputVariable();
		this.vertexDefinitions = parseVariables( this.vertexShader );
		this.fragmentDefinitions = parseVariables( this.fragmentShader );

	}

	setVertexOutputVariable( name, type, index = null, condition = null ) {

		this.clearOutputVariable();

		const vertexShader = this.vertexShader;
		const extents = getMainExtents( vertexShader );
		if ( index === null ) {

			index = extents.end;

		}

		if ( index < extents.after || index > extents.end ) {

			throw new Error( 'ShaderDebugMaterial: Can only insert code in main body.' );

		}

		this.fragmentShader = this.fragmentShader.replace( /gl_FragColor[^;=]*?=[^;]*;/g, ';' );
		this.fragmentShader = splice(
			this.fragmentShader,
			'\ngl_FragColor = _varying_output_ * _multiplier_ + _offset * _multiplier_; return;\n',
			getMainExtents( this.fragmentShader ).after
		);
		this.fragmentShader = splice(
			this.fragmentShader,
			'\nvarying vec4 _varying_output_;\nuniform float _multiplier_;\nuniform float _offset\n;',
			getMainExtents( this.fragmentShader ).before
		);

		let output;
		if ( /gl_FragColor\s*=/.test( name ) ) {

			output = name.replace( 'gl_FragColor', '_varying_output_' );

		} else {

			switch ( type ) {

				case 'float':
					output = `_varying_output_ = vec4( ${ name } );`;
					break;
				case 'uint':
					output = `_varying_output_ = vec4( float( ${ name } ) );`;
					break;
				case 'int':
					output = `_varying_output_ = vec4( float( ${ name } ) );`;
					break;
				case 'int':
					output = `_varying_output_ = vec4( float( ${ name } ) );`;
					break;
				case 'bool':
					output = `_varying_output_ = vec4( float( ${ name } ) );`;
					break;
				case 'vec2':
					output = `_varying_output_ = vec4( ${ name }.xy, 0.0, 0.0 );`;
					break;
				case 'vec3':
					output = `_varying_output_ = vec4( ${ name }.xyz, 0.0 );`;
					break;
				case 'vec4':
					output = `_varying_output_ = ${ name };`;
					break;

			}

		}

		let result;
		if ( condition ) {

			result = `

			if ( ${ condition } ) {

				${ output }
				return;

			}

			`;

		} else {

			result = `

			${ output }
			return;

			`;

		}

		this.vertexShader = splice( this.vertexShader, result, index );
		this.vertexShader = splice( this.vertexShader, '\nvarying vec4 _varying_output_;\n', getMainExtents( this.vertexShader ).before );
		this.needsUpdate = true;
		this._currType = type;

	}

	setFragmentOutputVariable( name, type, index = null, condition = null ) {

		this.clearOutputVariable();

		const fragmentShader = this.fragmentShader;
		const extents = getMainExtents( fragmentShader );
		if ( index === null ) {

			index = extents.end;

		}

		if ( index < extents.after || index > extents.end ) {

			throw new Error( 'ShaderDebugMaterial: Can only insert code in main body.' );

		}

		let output;
		if ( /gl_FragColor\s*=/.test( name ) ) {

			output = name;

		} else {

			switch ( type ) {

				case 'float':
					output = `gl_FragColor = vec4( ${ name } ) * _multiplier_ + _offset_ * _multiplier_;`;
					break;
				case 'int':
					output = `gl_FragColor = vec4( float( ${ name } ) ) * _multiplier_ + _offset_ * _multiplier_;`;
					break;
				case 'uint':
					output = `gl_FragColor = vec4( float( ${ name } ) ) * _multiplier_ + _offset_ * _multiplier_;`;
					break;
				case 'bool':
					output = `gl_FragColor = vec4( float( ${ name } ) ) * _multiplier_ + _offset_ * _multiplier_;`;
					break;
				case 'vec2':
					output = `gl_FragColor = vec4( ${ name }.xy, 0.0, 0.0 ) * _multiplier_ + _offset_ * _multiplier_;`;
					break;
				case 'vec3':
					output = `gl_FragColor = vec4( ${ name }.xyz, 0.0 ) * _multiplier_ + _offset_ * _multiplier_;`;
					break;
				case 'vec4':
					output = `gl_FragColor = ${ name } * _multiplier_ + _offset_ * _multiplier_;`;
					break;

			}

		}

		let result;
		if ( condition ) {

			result = `

			if ( ${ condition } ) {

				${ output };
				return;

			}

			`;

		} else {

			result = `

			${ output };
			return;

			`;

		}

		result = result.replace( /gl_FragColor/g, 'gl$FragColor' );
		this.fragmentShader = splice( this.fragmentShader, result, index );
		this.fragmentShader = this.fragmentShader.replace( /gl_FragColor[^;=]*?=[^;]*;/g, ';' );
		this.fragmentShader = splice(
			this.fragmentShader,
			'\nuniform float _multiplier_;\nuniform float _offset_;\n',
			getMainExtents( this.fragmentShader ).before
		);
		this.fragmentShader = this.fragmentShader.replace( /gl\$FragColor/g, 'gl_FragColor' );

		this.needsUpdate = true;
		this._currType = type;

	}

	clearOutputVariable() {

		const targetMaterial = this.targetMaterial;
		this.vertexShader = targetMaterial.vertexShader;
		this.fragmentShader = targetMaterial.fragmentShader;
		this.needsUpdate = true;
		this._currType = null;

	}

	reset() {

		this.clearOutputVariable();
		this.copy( this.targetMaterial );

	}

}
