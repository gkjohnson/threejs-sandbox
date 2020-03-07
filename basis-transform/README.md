# Basis Transform Utility

Helper functions for creating a matrix to transform between arbitrary cartesian coordinate frames.

[Demo Here!](https://gkjohnson.github.io/threejs-sandbox/basis-transform/)

# Use

```js
import { Group, Vector3, Matrix4 } from '//unpkg.com/three@0.112.0/build/three.module.js';
import { getBasisTransform } from './src/index.js';

const threejsAxes = '+X+Y+Z';
const targetAxes = '+X-Y+Z';

// Transform from +X +Y +Z to +X -Y +Z
const matrix = new Matrix4();
getBasisTransform( threejsAxes, targetAxes, matrix );

// Create an object to represent the framee
const group = new Group();
matrix.decompose( group.position, group.quaternion, group.scale );

// Apply the transform to vertices
const vector = new Vector3( 1, 2, 3 );
vector.applyMatrix4( matrix );
// 1, -2, 3
```

Log the frame image:

```js
import { axesToAsciiImage } from './src/index.js';

console.log( axesToAsciiImage( '+X+Y+Z' ) );

//      Y
//      |
//      |
//      .----- X
//     /
//   Z
```

# API

## Functions

### getBasisTransform

```js
getBasisTransform( from : string, to : string, target : Matrix4 ) : void
```

Sets `target` to a matrix that transforms from the `from` frame to the `to` frame. `from` and `to` are expected to be a string specifying axes in in order positive or negative: `+X+Y+Z`, `-Z+Y-X`, etc.

Notionally the first axis should represent the "right" direction, the second should represent "up", and the third "forward".

### axesToAsciiImage

```js
axesToAsciiImage( axes : string ) : string
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

# To Do

- Provide utility for converting euler angle order from one frame into another with different orders and rotation direction.
