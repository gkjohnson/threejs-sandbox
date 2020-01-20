class TrackedScene extends THREE.Scene {

  constructor( ...args ) {
  
    super( ...args );
    this.allObjects = new Set();
    
    // ...
  
  }

}
