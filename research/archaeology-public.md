# Public archaeology: circo and Diana

Implementation: `dist/js/archaeology-public.js`; catalogue/evidence: `dist/assets/data/archaeology-public.json`.
Research checked 2026-11-19. Coordinates are WGS84; geometry is in metres relative to the atlas origin (−0.278, 39.679), x east / z south. The procedural models are visual interpretations, not measured surveys. Source photographs were inspected as references; no external photograph or PDF is bundled with the site.

## Circo romano — no. 11

### Primary research

- José Manuel Melchor Monserrat, Josep Benedito Nuez, Juan José Ferrer Maestro, Fernando Francisco Buchón Moragues and Francisco García García, **Nuevos apuntes para el estudio del circo romano de Sagunto**, ARSE 51 (2017), pp. 25–46. [Article](https://centroarqueologicosaguntino.es/wp-content/uploads/2018/11/5.-Nuevos-apuntes-para-el-estudio-del-circo-romano-de-Sagunto.pdf). The source was read through its conclusions; the traditional dimensions quoted early in the paper are not its conclusion.
- [University publication record](https://producciocientifica.uv.es/documentos/5f0e3afe2999526b015b0a52).
- [Plan Director del Castillo, municipal copy](https://www.sagunto.es/media/b1qd4rn2/plan-director-del-castillo_-web.pdf), historical monument account and gate measurements.
- [Rutas Jaume I / Sagunto](https://www.rutasjaumei.com/es/que-ver-en-sagunto/223/sagunto-puerta-del-circo-romano.php), descriptions and gate photograph.
- [OSM archaeological enclosure, way 203085829](https://www.openstreetmap.org/way/203085829), in the project's downloaded OSM extract.

### Evidence used

The 2017 paper dates the building to the middle of the second century CE. Its photogrammetric revision proposes 270–290 m length and 68–70 m width, with about 237 m of foundations identifiable in the 1938 image; the western end is lost. The comparison table gives approximately 273 × 70 m. Figure 17 (p. 43) registers the surviving outline against modern streets. The cavea is approximately 11 m wide. Excavated parallel walls and radial partitions, a 190 m spina and 4.35 m euripus constrain the model. The tribunal beside the south gate is identified. Neither vaults nor their collapse were recorded, and timber seating is an interpretation.

### Implementation choices and limits

- The active historical footprint adopts **273 × 70 m**, rather than reproducing 354 × 73 m as an established result. Longitudinal orientation follows the preserved gate enclosure / street axis (yaw −0.307 radians in Three.js).
- Gate anchor: **−0.275518, 39.681049**. Historical centre is calculated 80 m west along that axis and 35 m inward from the gate. The close registration is approximate; it is not a digitised geodetic extraction of the article's plate.
- The present gate has a real **1.2 × 2.2 m through-opening**, a lintel and individual ashlar courses. Overall published dimensions guide a body approximately 6.2 m wide, 2.05 m deep and 4.1 m high. Surviving lateral stumps are modelled. A possible upper arch is kept exclusively in `hypotheses`.
- The currently open excavation is modelled about 1.9 m below its immediate street. Its precise section and the small modern walkway/stair arrangement are interpreted from the reference photo. `currentMask` opens this area immediately, without an invented modern building or a false animated cover.
- `reconstruction` is self-contained: ground, gate, low perimeter bases, supports, water channel, eastern entrance bases and a low judges' platform. Reconstructed continuous base lengths remain a model interpretation; their low elevation is a deliberate evidence display, not an assertion that the ancient walls stopped there.
- `hypotheses` contains timber seating, upper perimeter, west starting facade, metae, upper arches and parapet. Row count, elevations and starting-stall arrangement are typological. They must remain independently hideable.
- No temple, obelisk, undocumented triumphal sculpture or underground circus vaults are added.

## Muro del llamado Templo de Diana — no. 12

### Sources

- [Ayuntamiento de Sagunto, conservation/restoration announcement, 9 August 2022](https://aytosagunto.es/es/actualidad/el-ayuntamiento-consolida-y-restaura-el-muro-del-templo-de-diana-y-la-mikve-de-la-casa-dels-berenguer/). Identifies the ancient large-block face at approximately 15 × 4 m and records upper masonry/brick, cracks and repair work. The municipal photograph is the principal visual reference.
- [Plan Director del Castillo](https://www.sagunto.es/media/b1qd4rn2/plan-director-del-castillo_-web.pdf). Its discussion reports uncertain attribution and chronology; proposed interpretations include a fortification and dates ranging from Iberian to post-Punic or Roman. The traditional association with Diana and nearby inscriptions are not sufficient to establish a complete temple plan.
- [SKRQ, Urbanización y mejora del entorno del Templo de Diana](https://skrq.es/es/diana.html). The architects describe the public viewing space, stone paving, seating and perimeter closure.
- [OSM wall way 733325335](https://www.openstreetmap.org/way/733325335) and [adjacent ruin footprint 203140142](https://www.openstreetmap.org/way/203140142).

### Implementation choices and limits

- Main face runs from −0.2789173, 39.6786198 to −0.278743, 39.6785668, with a short return. OSM provides placement; it does not provide a measured stone-by-stone elevation.
- The ancient face uses individually fitted, slightly irregular polygonal blocks, approximately 15.65 m long and 4.18 m high. This is a dimensional interpretation of the approximately 15 × 4 m record. The short western return is included.
- `remains` also includes later rubble, brick, blocked apertures, render traces, rocky footing and a small interpretive viewing plaza. Later masonry is visually different from ancient large blocks.
- `reconstruction` displays only the identifiable ancient wall fabric and rock. Because construction date and original purpose are disputed, its label explicitly leaves the ancient phase undated.
- `hypotheses` adds a modest continuation of courses and a possible terrace volume. No cella, roof, colonnade, altar or deity sculpture is presented as known.
- The earlier generic ancient wall placed in the Berenguer courtyard should be removed. Context building way 203140142 should be excluded from the generic city extrusion so it does not cover this dedicated model.

## Verification and rendering

`research/qa-public.mjs` constructs both sites with the actual IGN terrain sampler, checks every geometry attribute for finite values, records geometry bounds/draw calls and raycasts the extant gate passage. It also exports exact meshes for independent CPU rendering. Source and tests use the same Three.js r180 distribution as the application.

Final model checks: no non-finite attributes; actual gate passage open. Circo: 10 draw calls / 7,964 triangles for present remains; 7 / 9,631 for reconstruction and 2 / 11,972 for hypotheses. Diana: 9 / 15,056 present; 3 / 2,192 historical and 1 / 264 hypotheses. Geometry construction approximately 0.21 seconds in the QA Node run.

The browser environment reports WebGL disabled. Offline CPU views are for shape/proportion inspection, not a claim of verified GPU rendering or pixel-identical browser appearance.

Four independent CPU views of the actual exported meshes were inspected (current and historical state of each site). This check prompted tighter Diana masonry joints and a shallow quarried face, and clear longitudinal passage gaps at the circus gates. The final mesh export and all finite/raycast checks were then regenerated.
