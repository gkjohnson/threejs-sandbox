# screendoor-transparency

A shader mixin to add screendoor or dithered transparency to THREE shaders to enable stable, order-independent transparent rendering as the camera moves and lighter, tinted shadows for transparent objects.

[Demo here!](https://gkjohnson.github.io/threejs-sandbox/screendoor-transparency/)

## Things To Add

- Dither based on computed surface color including blended textures instead of just the tint color.

## Limitations

- Limited transparent object overlap.
- Screen door artifacts which can be partially overcome with anti aliasing techniques.
- Transparent object shadows have dithering artifacts.
- Tinted shadows suffer from the same order issues that rendering suffers from.
