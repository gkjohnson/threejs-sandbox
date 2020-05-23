# Pixel Reprojection

Example demonstrating pixel reprojection from a previous frame.

## TODO

- Fix velocity buffer in motion blur pass
- Discard projected pixels that were not rendered to (depth === 1.0);
- Try reprojecting into previous frame to do depth compare to discard.
- Fix data oddity when zooming out
- Fix depth comparison (scale delta based on curr z because depth is 1 / z) -- possibly why we get weird curvy artifacts?
- Fix velocity "pop" on rerender click
- Add jitter
- use multiple samples
