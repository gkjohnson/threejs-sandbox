export class ShaderReplacement {

	constructor( shaderOrMaterial ) {

		let material = shaderOrMaterial;
		if ( ! shaderOrMaterial instanceof Material ) {

			material = new ShaderMaterial( shaderOrMaterial );

		}

		this._sourceMaterial = material;
		this._currentScene = null;
		this._replacementMaterials = new WeakMap();
		this._originalMaterials = new WeakMap();

	}

	replace( scene ) {

		const currentScene = this.currentScene;
		if ( currentScene !== null && currentScene !== scene ) {

			throw new Error();

		}

		const replacementMaterials = this._replacementMaterials;
		const originalMaterials = this._originalMaterials;
		const cacheCurrentMaterial = currentScene === null;
		scene.traverse( c => {

			if ( ! c.isMesh && ! c.skinnedMesh ) {

				return;

			}

			if ( ! replacementMaterials.has( c ) ) {

				const replacementMaterial = this.createMaterial( c );
				replacementMaterials.set( c, replacementMaterial );

			}

			const replacementMaterial = replacementMaterials.get( c );
			if ( replacementMaterial === null ) {

				return;

			}

			let originalMaterial = c.material;
			if ( cacheCurrentMaterial ) {

				originalMaterials.set( c, originalMaterial );

			} else {

				originalMaterials.get( c );

			}
			this.updateUniforms( c, originalMaterial, replacementMaterial );

			c.material = replacementMaterial;

		} );

		this._currentScene = scene;

	}

	reset() {

		const currentScene = this._currentScene;
		const originalMaterials = this._originalMaterials;
		currentScene.traverse( c => {

			if ( originalMaterials.has( c ) ) {

				c.material = originalMaterials.get( c );

			}

		} );

		this._currentScene = null;

	}

	createMaterial( object ) {

		// TODO
		return this._sourceMaterial.clone();

	}

	updateUniforms( object, material, target ) {

		// TODO

	}

}
