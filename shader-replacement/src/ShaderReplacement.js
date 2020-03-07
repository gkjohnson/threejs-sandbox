import { ShaderMaterial } from '//unpkg.com/three@0.114.0/build/three.module.js';

export class ShaderReplacement {

	constructor( shader ) {

		this._replacementMaterial = new ShaderMaterial( shader );
		this._replacementMaterials = new WeakMap();
		this._originalMaterials = new WeakMap();

	}

	replace( scene, recursive = false, cacheCurrentMaterial = true ) {

		const scope = this;
		function applyMaterial( object ) {

			if ( ! object.isMesh && ! object.skinnedMesh ) {

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

			scope.updateUniforms( object, originalMaterial, replacementMaterial );

			object.material = replacementMaterial;

		}

		const replacementMaterials = this._replacementMaterials;
		const originalMaterials = this._originalMaterials;
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

			}

		}

		const originalMaterials = this._originalMaterials;
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

		// TODO
		return this._replacementMaterial.clone();

	}

	updateUniforms( object, material, target ) {

		const replacementMaterial = this._replacementMaterial;
		const originalDefines = replacementMaterial.defines;
		const materialDefines = material.defines;
		const targetDefines = target.defines;

		if ( materialDefines ) {

			for ( const key in materialDefines ) {

				if ( key in materialDefines && materialDefines[ key ] !== targetDefines[ key ] ) {

					targetDefines[ key ] = materialDefines[ key ];
					target.needsUpdate = true;

				}

			}

			for ( const key in targetDefines ) {

				if ( ! ( key in materialDefines ) ) {

					if ( key in originalDefines ) {

						if ( originalDefines[ key ] !== targetDefines[ key ] ) {

							targetDefines[ key ] = originalDefines[ key ];
							target.needsUpdate = true;

						}

					} else {

						delete targetDefines[ key ];
						target.needsUpdate = true;

					}

				} else if ( materialDefines[ key ] !== targetDefines[ key ] ) {

					targetDefines[ key ] = materialDefines[ key ];
					target.needsUpdate = true;

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

					targetUniform.value = materialUniform.value;
					if ( targetUniform.value.isTexture ) {

						target.needsUpdate = true;

					}

				}

			}

		} else {

			for ( const key in targetUniforms ) {

				const targetUniform = targetUniforms[ key ];
				if ( key in material && material[ key ] !== targetUniform.value ) {

					targetUniform.value = material[ key ];
					if ( targetUniform.value.isTexture ) {

						target.needsUpdate = true;

					}

				}

			}

		}

	}

}
