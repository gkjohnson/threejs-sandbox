# Basis Transform Utility

Helper functions for creating a matrix to transform between arbitrary cartesian coordinate frames.

# Use

```js
import { Group, Vector3, Matrix4 } from '//unpkg.com/three@0.112.0/build/three.module.js';
import { getBasisTransform, axesToString } from './src/index.js';

const threejsAxes = '+X+Y+Z';
const targetAxes = '+X-Y+Z';

// transforming an object to reflect a different coordinate frame
const threeToTargetGroup = new Group();
getBasisTransform( threejsAxes, targetAxes, threeToTargetGroup.matrix );

// transform points the target coordinate frame in the three.js frame
const threeToTargetMatrix = new Matrix4();
getBasisTransform( threejsAxes, targetAxes, threeToTargetMatrix );

const position = new Vector( 1, 2, 3 );
position.applyMatrix4( matrix );

console.log( vector.x, vector.y, vector.z );
// 1, -2, 3

// See the coordinate frame
console.log( axesToString( targetAxes ) );
```

# API

## Functions

### getBasisTransform

```js
getBasisTransform( from : string, to : string, target : Matrix4 ) : void
```

Sets `target` to a matrix that transforms from the `from` frame to the `to` frame. `from` and `to` are expected to be a string specifying axes in in order positive or negative: `+X+Y+Z`, `-Z+Y-X`, etc.

Notionally the first axis should represent the "right" direction, the second should represent "up", and the third "forward".

### axesToString

```js
axesToString( axes : string ) : string
```

Debug utility that outputs an ascii drawing of the given frame with "forward" pointing out of the screen like so:

```
      Y
      |
      |
      .----- X
     /
   Z
```
