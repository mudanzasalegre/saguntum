# Santa María, V9 — model registration, fabric and verification

## Scope and evidence

The V9 model replaces the former solid footprint extrusion in `heritage-sacred.js` with a separate, sectionable architectural model in `santa-maria.js`. Its subject is the conserved church and the adjacent streets and squares. It distinguishes the medieval fabric, alterations of the sixteenth to eighteenth centuries, the contemporary tower, mixed surviving fabric and explicitly interpretive geometry.

The documentary visit and complete bibliography are in `dist/assets/data/santa-maria-visit.json` and the historical research note. The geometric reading primarily uses the plan published by Valentín Cabrera Fombuena in *ARSE* 22 (1987), printed page 646 / PDF page 10, and the architectural discussion and Gomis drawings reproduced by Arturo Zaragozá Catalán in *Arquitectura gótica valenciana* (Generalitat Valenciana, 2000), pages 72–75. Current official Turisme Comunitat Valenciana photographs were inspected for the north portal, tower and apse silhouette. These reference images are not redistributed in the application.

Sources consulted directly:

- [Cabrera, 1987, original article and plan](https://www.centroarqueologicosaguntino.es/uploads/descargas/295_23_La_Iglesia_parroquial_de_Santa_Maria_de_Sagunto_22.pdf).
- [Parish transcription of Cabrera](https://santamariasagunto.wordpress.com/historia/).
- [Zaragozá, 2000, author-hosted publication](https://www.academia.edu/6925675/2000_Arquitectura_G%C3%B3tica_Valenciana).
- [Turisme Comunitat Valenciana, conserved church and official photographs](https://www.comunitatvalenciana.com/es/valencia/sagunt-sagunto/monumentos/iglesia-parroquial-de-la-natividad-de-nuestra-senora-2).
- [Perales, ARSE 57, 2023, observed window tracery](https://centroarqueologicosaguntino.es/wp-content/uploads/2024/05/arse_57-107-150.pdf).
- [Mapped church perimeter, OSM way 203070952](https://www.openstreetmap.org/way/203070952).

## Coordinate registration

The shared registration is WGS84 anchor `[-0.27910948, 39.67903398]`, local yaw `1.173` radians. World projection remains the application's x-east / z-south projection. In the church frame, positive z points towards the east-southeast apse; positive x points towards the north-northeast portal and Plaça Major. The west facade lies near local z −27.7 m, the outer chapel walls near x −21.55 and +19.42 m. The church and tower footprints are read from `landmarks.json`; their actual irregularity remains in the floor and foundation perimeter.

The published internal plan is registered schematically inside that perimeter. This is not a new as-built survey, photogrammetric reconstruction or claim that every plan vertex has been measured. The serialized `santa-maria-plan.json` contains the same authored nave, apse, side-compartment, portal and tower geometry used by the mesh, plus source-derived context plan components. The canvas fallback therefore shares the model's plan rather than substituting an unrelated illustration.

### Vertical registration and uncertainty

The source terrain at the southern threshold is approximately 59.18 m, while the old model's footprint-median floor would be approximately 56.85 m. That old choice would place the southern doorway more than two metres below ground. V9 uses a church floor of approximately 59.323 m, taking the higher southern threshold plus a small clearance. This is a visual accommodation to the supplied IGN MDT, not a measured church pavement elevation.

That decision creates approximately four to five metres of rise in the paired northern stair flights. The context model derives the displayed tread count from this terrain difference and identifies the count as interpretive. The plan location, paired parallel flights, solid outer parapet and two inscription panels are source-backed; the exact elevations are not. The west portal has a separate small flight connecting its floor to the lower square. Thin foundation caps keep terrain triangles below the floor and door reveals.

The tower uses its own lower street datum at the mapped tower coordinate. Its overall summit is 58 m above that datum, rather than 58 m added to the higher nave floor. The narrow iron crown explains why a normalized LiDAR surface near 40 m does not measure the documented overall summit. The main nave vault reaches the published 24 m above its floor. Other roof levels, wall thicknesses, mouldings and subsidiary heights are visual estimates.

## Authored architecture

The church has three naves with four longitudinal divisions, including the shorter head and later western division. The two principal Gothic central vault bays are distinct from the western work. Octagonal supports and genuinely open longitudinal arches replace the former filled volume. Side compartments follow the published two-per-large-bay arrangement; they are an architectural reading of chapels and ancillary rooms, not an inventory of their altars.

The central, aisle and chapel roofs have separate heights. Ribbed vault webs are geometric shells; diagonal ribs and perimeter arches follow those shells. Their stereotomy, deformation and decorative details remain simplified. A didactic section removes roofs, vault webs, the north and west enclosure and the dome cap, while retaining the supports, arches, rib framework and apse envelope. No crypt is modelled: the cited description records it as blocked and does not provide reliable interior geometry.

The polygonal apse contains three pierced high windows, four external buttresses and simplified tracery. The central window uses a five-point pattern and the flanking windows eight-point patterns following Perales' specific observations. The aisle heads and southern sacristy have their own enclosing walls and openings. Current reduced clerestory apertures remain small within the outline of earlier Gothic windows; the model does not silently reopen all the later infill.

The north and south Gothic portals are separate architectural compositions with different archivolt counts. Actual wall apertures contain recessed timber leaves; stone tympana and surviving architectural profiles surround them. Lost sculptural figures are not reinstated. The west portal is Baroque, with a rectangular opening, two pilaster orders, an empty niche and broken segmental pediment. It replaces the old incorrect pointed west portal.

The elevated transverse bridges have round undersides and sloping water-carrying upper profiles. Their interpretation follows Zaragozá's discussion of water evacuation, rather than claiming that generic ramping flying buttresses explain their precise structural action. The northern western dome is represented as an approximate octagonal blue-tiled external envelope, without inventing painted decoration.

The contemporary tower has a conserved masonry base, brick upper stages with pale corners and cornices, separate clock faces, pierced pointed belfry windows, individual abstract bells and an open iron crown. The 58 m total is documentary; detailed intermediate dimensions and the exact ironwork are simplified. The model does not claim to reproduce the restored clock mechanism currently displayed inside the church, whose exact placement is not supplied by the cited news source.

## Immediate context and shared interface

`santa-maria-context.js` owns the paired northern staircase, inscription parapet, local paving and ordinary neighboring buildings. Its source selection preserves 44 building parts from 16 parent parcels. Heights use supplied IGN estimates or recorded storeys, with no arbitrary fallback height in the current selected set. Existing civic models of Plaça Major, Casa dels Berenguer and the ancient Sagrario remains are retained. Replaced building and road IDs are returned to the regional builder to prevent duplicates.

The context's meshes and targets are authored in projected world coordinates. `Object3D.attach` preserves their world transformation beneath the rotated church group. The wrapper merges the five context targets, fit bounds, plan components and QA data into the same visit API. `bindGround` rebuilds only terrain-following context surfaces, refreshes their targets and then checks all camera offsets against the final interpolated terrain.

The visit exposes `focuses`, `bounds`, `stats`, `plan`, `selectFocus`, `setReadingMode`, `setSection`, `bindGround`, `getState` and `qa`. All sixteen documentary IDs resolve. Interior nave, vault and chapel targets explicitly require the section. Both full and close offsets are world-space vectors; focus bounds follow the same phone, short-landscape and desktop usable frames as V8.

Each model instance owns its materials and procedural textures through `userData.ownedResources`. The legacy sacred-heritage palette is reset for each assembly, preventing regional reconstruction from reusing resources already disposed with an earlier scene. The context retains its own stable resource arrays as its ground-following geometry is rebuilt.

## Verification and renders

Run the model and context checks with:

```sh
node --experimental-loader ./research/validate_loader.mjs research/validate_santa_maria_v9.mjs --export
node --experimental-loader ./research/validate_loader.mjs research/validate_sagunto_v9.mjs
blender -b --threads 8 --python research/render_santa_maria_v9.py
```

The model validator checks finite geometry, bibliography resolution, documented counts and heights, actual masonry apertures, floor clearance above final terrain, section behavior, complete material/visibility restoration, independent resources across rebuilds and camera framing in three viewport shapes. Aperture checks distinguish the intentionally closed timber door leaves and transparent glazing from accidental solid masonry blockage. The final model run passes 392 checks, including 130 rays at 25 opening locations and 96 full/close camera variants. The minimum sampled nave-floor clearance above the interpolated terrain is approximately 0.28 m.

The occlusion audit includes the immediate context and retained civic buildings. The staircase's own focused parapet and the focused Berenguer building are treated as their intended subjects, rather than unrelated blockers; neighboring buildings assigned to the same street component are still tested. Close mesh renders identified and resolved blocked normal-facing portal cameras, western interior piers protruding through the facade, unclosed sloping roof ends and an artificial terrain bank outside the north wall. A narrow street-level terrain band removes that bank without changing the source terrain dataset. Earlier opening rays also caught closed apse-return walls across the short head-bay arcades; those walls were corrected with real pointed openings.

The Blender inspection imports the exported Three.js triangles, object transforms, vertex colors and actual orthophoto terrain. It includes the context and nearby civic models. The renders are CPU geometry inspection images, not browser screenshots, photogrammetry or AI-generated pictures. Material texture and lighting are approximated for this independent renderer. The full regional regression separately checks the actual application builder, camera presets, context duplication, load-failure retry and resource disposal. Final machine-readable results and render PNGs are in `research/validation-v9/`.
