# Sagunto monument modelling notes

## Implemented geometry and scope

`dist/js/monuments.js` creates original procedural Three.js geometry. The model is a visually interpreted contemporary monument model, not a photogrammetric survey or a reconstruction of the whole ancient Roman city. No research photographs or protected drawings were copied into the runtime asset bundle.

The castle follows the 272-point perimeter in the OpenStreetMap extract and incorporates mapped internal walls. Its elongated, irregular, roofless form is intentional: Sagunto is a long succession of fortified enclosures, not a fantasy castle with a large central keep. Masonry heights, thicknesses, missing stones, the small archaeological fragments, and forum presentation remain approximate. The scene adds no purported measured wall elevations.

The theatre is located at an inferred orchestra centre of longitude −0.27800, latitude 39.67689. Its stage runs approximately northwest to southeast. The cavea lies on the southwest hillside, with the open direction toward the northeast. These directions follow the mapped theatre footprint. The contemporary scene building and its thin sloping canopy distinguish it from an invented intact classical theatre. The semicircular seating tiers, aisle steps, vaults and stone finishes are simplified original models; row counts and details are not a conservation record.

## Primary and authoritative reference sources

- Turismo de España: [Castillo de Sagunto](https://www.spain.info/es/lugares-interes/castillo-sagunto/). Documents the long fortified complex, seven enclosures, archaeological remains in Plaza de Armas and the cistern in the Conejera enclosure.
- Turismo de España: [Sagunto-Sagunt](https://www.spain.info/es/destino/sagunto-sagunt/). Describes the hillside theatre and gives approximately 54 × 6.5 m for the scene and approximately 90 m for the building frontage. These dimensions guide the model rather than claiming a measured survey.
- Manuel Portaceli Arquitecturas: [Rehabilitación del Teatro Romano de Sagunto](https://manuelportaceli.com/rehabilitacion-del-teatro-romano-de-sagunto/). Primary architectural project reference, 1984–1993, with Giorgio Grassi; establishes the design relationship between the cavea and reconstructed stage body. The project plan was inspected to guide architectural interpretation.
- Real Academia de Bellas Artes de San Fernando: [Antonio Almagro Gorbea, planta general del castillo y teatro, AA-013_01](https://www.academiacolecciones.com/arquitectura/inventario.php?id=AA-013_01). 1977 photogrammetric plan, inspected as a research reference to understand the terrain relationship and irregular fortress structure. The image is not included in the published site and no tracing from it supplies the runtime data; the outline comes from OSM instead.
- Ayuntamiento de Sagunto: [Intervenciones en el Castillo, siglo XIX](https://aytosagunto.es/es/ayuntamiento/areas-y-servicios/archivo-municipal/documentos-digitalizados/intervenciones-en-el-castillo-s-xix/). The visible fortress includes extensive early nineteenth-century rebuilding; the visual model therefore does not label all standing walls as Roman.

## Module interface

```js
import { createMonuments } from './monuments.js';
const monuments = createMonuments({ heightAt, project, data });
scene.add(monuments.group);
```

- `project(lon, lat)` returns `{x,z}` in local metres, east and south positive.
- `heightAt(x,z)` returns the sampled ground elevation in metres.
- `data` is the `cartography.json` object with `castlePolygon` and `castleWalls`.
- Returned `theatre` and `castle` groups may be shown or hidden independently.
- `points.theatre`, `points.castle` and `points.forum` are camera/label targets in world coordinates.
- `surfaceHeight(x,z,raw)` caps interpolated terrain under the theatre floor and cavea so a coarse DEM does not fill the stage or orchestra.
- `theatreBase` and `theatreCenter` allow the main scene to coordinate terrain and architectural details.

## Verification

A construction check using the bundled Three.js module and the actual OSM data produced 11 mesh draw batches and 217,902 position vertices, with no non-finite coordinate values. Actual rendering, scene composition and browser interactions are checked in the main site workflow.
