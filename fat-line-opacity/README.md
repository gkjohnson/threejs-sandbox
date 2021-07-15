# Fat Lines with Clean Transparency

An approach rendering the three.js fat lines with transparency using two passes, depth writing, and the stencil buffer. Options are provided to toggle both stencil and depth writing.

If depth is disabled and stencil enable the line overlaps in incorrect ways. If this look is acceptable then it can be achieved in a single pass but the stencil buffer must be cleared afterward.

If stencil is disabled and depth enabled then overlap artifacts are present.

Demo [here](https://gkjohnson.github.io/threejs-sandbox/fat-line-opacity/webgl_lines_fat.html)!

**TODO**

- Try cutting out an inverted circle on the negative side of the lines to make "room" for the positive side endcap circle and they won't overlap.
- Demo use of alpha to coverage to support binned transparency if AA is enabled.
