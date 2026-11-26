# Orbit stability: supplied video and focused depth check

## Observation

The supplied `Image001.mp4` is a 29.467 s, 30 fps, 1226 × 876 recording of the Atlas. The close sequences around 17–18 s show moving bands on the tiled roof. The facade outlines remain continuous in the sampled frames. This is the Atlas runtime: it does not stream or replace monument LODs while orbiting.

There are two contributing problems in the v47 church geometry and renderer:

- The roof generator placed a 52 mm radius cylinder every 550 mm with its centre only 55 mm above the roof in world Y. On an inclined roof its perpendicular separation becomes nearly zero, sometimes negative. Repeated subpixel cylinders create aliasing, and the very shallow intersection is sensitive to the depth buffer. The Santa María model change removes these repeated cylinders; the tile texture describes that detail. The model audit also found duplicate short-apse wall panels and overlapping roof coverage at the nave/apse junction; their ownership is corrected in the church change.
- Atlas fixed the near plane at 120 mm for views ranging from interiors to the regional map. In a conventional 24-bit depth buffer, the spatial depth interval at 350 m is approximately 61 mm. That is wider than the 45 mm offset of ordinary city window planes and much wider than parts of the roof relief. The territorial runtime previously switched abruptly between 120/700/3000 mm at range thresholds.

These observations do not establish the exact user's GPU depth format. The numerical and software raster checks below reproduce the precision problem independently of that device.

## General runtime correction

`dist/js/camera-depth.js` is shared by `app.js` and `territory.js`, including the WebGL and WebGPU territorial backends. It changes only the camera near plane, without a logarithmic-depth extension or shader changes:

- Near stays at 0.12 m for an interior focus, pedestrian mode, a focus within 32 m, or a camera up to 8 m above the ground.
- At larger distances it grows continuously at 0.008 m per metre of range, capped at 4 m. A second continuous bound based on ground clearance protects low street views with a distant pivot.
- Far plane, field of view, scene geometry, focus target, view offsets and camera position are unchanged by this policy. The existing ground-clearance clamp is preserved.
- There are no depth-band jumps at the old 450 m and 2600 m thresholds. The near plane decreases immediately when approaching geometry or entering an interior view.

This does not replace the removal of genuinely overlapping geometry. The church model changes and precision policy address separate contributors.

## Verification

`node research/test-camera-depth.mjs --json research/validation-v48/camera-depth-qa.json` passes 9 focused checks and 24 depth-separation cases. It uses the vendored Three perspective matrices with both WebGL and WebGPU depth conventions. Under normalized 24-bit quantization, the old camera produces 8,888 unresolved samples across the selected facade/roof-gap sweeps; the new camera produces zero. It also verifies close geometry, low views, interiors, unchanged screen framing and retained far horizons.

`research/probe-camera-depth.py` creates a local Mesa/EGL OpenGL context with a verified 24-bit depth attachment. It draws the actual unchanged v47 roof buffers. Textures and shadows are disabled, isolating depth precision from texture filtering. The reference uses a 10 m near plane while staying well in front of the model. The image comparison counts pixels whose colour differs by more than 5/255 from that reference:

| Camera distance | Old near | Adaptive near | Old differing pixels | Adaptive differing pixels |
| --- | --- | --- | --- | --- |
| 140 m | 0.12 m | 0.984 m | 55 | 1 |
| 200 m | 0.12 m | 1.464 m | 104 | 3 |
| 350 m | 0.12 m | 2.664 m | 243 | 0 |
| 500 m | 0.12 m | 3.864 m | 238 | 2 |

The camera distances are controlled test distances, not measurements inferred from the recording. `depth-raster-qa.json` records the exact input geometry hash and renderer. `roof-depth-comparison.png` shows the 350 m view with nearest-neighbour enlargement so the depth differences remain visible.

Reproduce the optional raster diagnostic with an exported geometry snapshot:

```sh
python research/probe-camera-depth.py --geometry /path/to/scene.json.gz --out /path/to/diagnostic
```

This is a correctness check with actual geometry in a software rasterizer. It does not measure frame rate, validate the user's hardware, or claim a full browser WebGL/WebGPU visual run. The broad moving roof pattern also requires the removal of the repetitive intersecting relief described above.
