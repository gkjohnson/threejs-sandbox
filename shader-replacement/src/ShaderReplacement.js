import { WrappedShaderMaterial } from './WrappedShaderMaterial.js';

export function setMaterialDefine( material, define, value ) {

	if ( value === undefined ) {

		if ( define in material.defines ) {

			delete material.defines[ define ];
			material.needsUpdate = true;

		}

	} else {

		if ( value !== material.defines[ define ] ) {

			material.defines[ define ] = value;
			material.needsUpdate = true;

		}

	}

}

const _originalMaterials = new WeakMap();
export class ShaderReplacement {

	constructor( shader ) {

		this._replacementMaterial = new WrappedShaderMaterial( shader );
		this._replacementMaterials = new WeakMap();

		this.overrideUniforms = {};
		this.overrideDefines = {};

	}

	replace( scene, recursive = false, cacheCurrentMaterial = true ) {

		const scope = this;
		function applyMaterial( object ) {

			if ( ! object.isMesh && ! object.isSkinnedMesh ) {

				return;

			}

			if ( ! replacementMaterials.has( object ) ) {

				const replacementMaterial = scope.createMaterial( object );
				replacementMaterials.set( object, replacementMaterial );

			}

			const replacementMaterial = replacementMaterials.get( object );
			if ( replacementMaterial === null ) {

				return;

			}

			let originalMaterial = object.material;
			if ( cacheCurrentMaterial ) {

				originalMaterials.set( object, originalMaterial );

			} else {

				originalMaterial = originalMaterials.get( object );

			}

			if ( ! originalMaterial ) {

				console.error( 'ShaderReplacement : Material for object was not cached before replacing shader.', object );

			}

			scope.updateUniforms( object, originalMaterial, replacementMaterial );
			if ( replacementMaterial.finalize ) {

				replacementMaterial.finalize();

			}

			object.material = replacementMaterial;

		}

		const replacementMaterials = this._replacementMaterials;
		const originalMaterials = _originalMaterials;
		if ( Array.isArray( scene ) ) {

			if ( recursive ) {

				for ( let i = 0, l = scene.length; i < l; i ++ ) {

					scene[ i ].traverse( applyMaterial );

				}

			} else {

				for ( let i = 0, l = scene.length; i < l; i ++ ) {

					applyMaterial( scene[ i ] );

				}

			}

		} else {

			if ( recursive ) {

				scene.traverse( applyMaterial );

			} else {

				applyMaterial( scene );

			}

		}

	}

	reset( scene, recursive ) {

		function resetMaterial( object ) {

			if ( originalMaterials.has( object ) ) {

				object.material = originalMaterials.get( object );
				originalMaterials.delete( object );

			} else if ( object.isSkinnedMesh || object.isMesh ) {

				console.error( 'ShaderReplacement : Material for object was not cached before resetting.', object );

			}

		}

		const originalMaterials = _originalMaterials;
		if ( Array.isArray( scene ) ) {

			if ( recursive ) {

				for ( let i = 0, l = scene.length; i < l; i ++ ) {

					resetMaterial( scene[ i ] );

				}

			} else {

				for ( let i = 0, l = scene.length; i < l; i ++ ) {

					scene[ i ].traverse( resetMaterial );

				}

			}

		} else {

			if ( recursive ) {

				scene.traverse( resetMaterial );

			} else {

				resetMaterial( scene );

			}

		}

	}

	createMaterial( object ) {

		return this._replacementMaterial.clone();

	}

	updateUniforms( object, material, target ) {

		const replacementMaterial = this._replacementMaterial;
		const originalDefines = replacementMaterial.defines;
		const materialDefines = material.defines;
		const targetDefines = target.defines;

		target.side = material.side;
		target.flatShading = material.flatShading;
		target.skinning = material.skinning;

		if ( materialDefines ) {

			for ( const key in materialDefines ) {

				target.setDefine( key, materialDefines[ key ] );

			}

			for ( const key in targetDefines ) {

				if ( ! ( key in materialDefines ) ) {

					target.setDefine( key, originalDefines[ key ] );

				} else {

					target.setDefine( key, materialDefines[ key ] );

				}

			}

		}

		// NOTE: we shouldn't have to worry about using copy / equals on colors, vectors, or arrays here
		// because we promise not to change the values.
		const targetUniforms = target.uniforms;
		if ( material.isShaderMaterial ) {

			const materialUniforms = material.uniforms;
			for ( const key in targetUniforms ) {

				const materialUniform = materialUniforms[ key ];
				const targetUniform = targetUniforms[ key ];
				if ( materialUniform && materialUniform.value !== targetUniform.value ) {

					if (
						targetUniform.value && targetUniform.value.isTexture ||
						materialUniform.value && materialUniform.value.isTexture
					) {

						target.setTextureUniform( key, materialUniform.value );

					} else {

						targetUniform.value = materialUniform.value;

					}

				}

			}

		} else {

			for ( const key in targetUniforms ) {

				const targetUniform = targetUniforms[ key ];
				if ( key in material && material[ key ] !== targetUniform.value ) {

					if (
						targetUniform.value && targetUniform.value.isTexture ||
						material[ key ] && material[ key ].isTexture
					) {

						target.setTextureUniform( key, material[ key ] );

					} else {

						targetUniform.value = material[ key ];

					}

				}

			}

		}

		const { overrideDefines, overrideUniforms } = this;
		for ( const key in overrideDefines ) {

			if ( overrideDefines[ key ] === null || overrideDefines[ key ] === undefined ) {

				delete targetDefines[ key ];

			} else {

				if ( targetDefines[ key ] !== overrideDefines[ key ] ) {

					targetDefines[ key ] = overrideDefines[ key ];
					target.needsUpdate = true;

				}

			}

		}

		for ( const key in overrideUniforms ) {

			if ( key in targetUniforms ) {

				targetUniforms[ key ].value = overrideUniforms[ key ].value;

			}

		}

	}

	dispose() {

		// TODO: disposal needed?

	}

}
