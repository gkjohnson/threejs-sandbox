export class ShaderReplacement {

	constructor( shaderOrMaterial ) {

		let material = shaderOrMaterial;
		if ( ! shaderOrMaterial instanceof Material ) {

			material = new ShaderMaterial( shaderOrMaterial );

		}

		this._sourceMaterial = material;
		this._replacementMaterials = new WeakMap();
		this._originalMaterials = new WeakMap();

	}

	replace( scene, recursive = false, cacheCurrentMaterial = false ) {

		function applyMaterial( object ) {

			if ( ! object.isMesh && ! object.skinnedMesh ) {

				return;

			}

			if ( ! replacementMaterials.has( object ) ) {

				const replacementMaterial = this.createMaterial( object );
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
			this.updateUniforms( object, originalMaterial, replacementMaterial );

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

		const currentScene = this._currentScene;
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
		return this._sourceMaterial.clone();

	}

	updateUniforms( object, material, target ) {

		// TODO

	}

}
