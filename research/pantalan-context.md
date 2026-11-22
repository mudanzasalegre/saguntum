# V31 · Entorno del paseo del Pantalán

Revisión: **21 de noviembre de 2026**. La selección se almacena en `dist/assets/data/pantalan-context.json` y reutiliza la cartografía y la ortofoto del atlas. No altera los archivos fuente `coast-cartography.json` ni `coast-elevation.json`.

## Alcance y propiedad

El contexto incorpora **11 partes de edificios existentes**, **una envolvente adicional aproximada**, **12 segmentos de caminos o viales**, **12 superficies**, **18 bordes** y **seis árboles leídos en la ortofoto**. Las 214 referencias adicionales de edificios sirven para activar detalle en el fondo urbano existente, no para duplicar sus volúmenes.

La franja del paseo, sus pérgolas, tolva, juegos, mirador y accesos pertenecen a `coast-pier.js`. El quiosco OSM `1430889843`, dentro de esa franja, también queda a cargo del modelo del paseo. El módulo de contexto debe recortar las superficies en ese límite y evitar una segunda geometría coplanar sobre los caminos existentes.

## Edificios

| Referencia | Tratamiento |
|---|---|
| `cat-8526165YJ3982N_part1-0` | Nave frente al paseo; conservar huella, cubierta y altura estimada de la cartografía. |
| `cat-8526165YJ3982N_part2-0` | Nave contigua; mismo criterio, con fachada y remates interpretativos. |
| `cat-8526165YJ3982N_part3-0` | Nave larga próxima al acceso; conservar su proporción y relación con el vial. |
| `cat-8526119YJ3982N_part1-0` | Nave del sector oriental, junto al frente portuario. |
| Resto de partes seleccionadas | Envolventes de apoyo alrededor del acceso; sin interiores atribuidos. |
| `pantalan-photo-nave-occidental` | Cubierta blanca visible en PNOA que no tiene huella en las dos capas de edificios consultadas. Contorno trazado desde la imagen, con paralaje sin corregir y altura de representación de 9,5 m. |

Los cuatro edificios principales utilizan alturas de cubierta estimadas previamente de 10–11 m. Proceden de la capa normalizada de superficie del atlas, no de medidas contemporáneas de fachada. La nueva nave occidental tiene una altura puramente interpretativa; su envolvente no se presenta como información catastral.

Las huellas y huecos interiores de las partes catastrales se copian sin modificaciones. El campo `promenadeFacingEdge` identifica el lado más próximo al eje para concentrar un detalle moderado de cerramiento. No implica que cada puerta, junta o ventana haya sido medida.

## Accesos y terreno

Se conservan como referencias las líneas OSM de la rotonda `1303784869`, los brazos de Travesía Mediterráneo `1303784870/71`, el acceso `450798105`, el vial portuario `156439640`, el paseo costero `1303784882/85/86` y tres pasarelas hacia la playa. Los trazados íntegros están en `sourceCoordinates`; los segmentos locales pueden terminar en el límite del área de representación.

Las anchuras son decisiones de representación contrastadas con la ortofoto. Los bordes y pavimentos deben seguir el muestreo de terreno existente, con un pequeño desplazamiento vertical para su lectura. No se añaden plataformas horizontales que sustituyan el relieve. La playa usa el polígono OSM ya presente, sin duplicar una losa sobre la arena ni modificar la costa.

`roadReplacements` conserva las partes originales de cada vial que quedan fuera del ámbito asumido. El vial portuario mantiene aproximadamente 1.425 m de trazado exterior y el acceso norte otros 12,84 m. Se verificó que cada longitud original coincide con la suma del tramo de contexto y sus remanentes, con una diferencia inferior a 2 mm debida al redondeo de coordenadas. Excluir una línea completa sin reintegrar esos remanentes eliminaría conexiones fuera de esta intervención.

Los seis árboles aportan escala al paseo costero anterior. Sus posiciones se leen en la imagen; altura, copa y especie no están medidas. No se añaden filas masivas de mobiliario o vehículos sin evidencia.

## Fuentes y precisión

- [Catastro INSPIRE](https://www.catastro.hacienda.gob.es/webinspire/): partes de edificios en `coast-building-footprints.json`, metadatos de agosto de 2026.
- [IGN MDS normalizado](https://datos.gob.es/es/catalogo/e00125901-spaignmds-normalizado): procedencia de las alturas estimadas en `coast-building-height-provenance.json`.
- [OpenStreetMap](https://www.openstreetmap.org/copyright): viales, caminos, quiosco y playa; se mantienen los identificadores originales.
- [PNOA](https://pnoa.ign.es/): `coast-orthophoto.jpg` y su georreferencia; consulta de noviembre de 2026, fecha de vuelo no verificada.
- [Galería municipal de apertura](https://aytosagunto.es/es/actualidad/el-nuevo-paseo-del-puerto-de-sagunto-se-ha-abierto-a-la-ciudadania/): contraste de materiales y relación del paseo con las naves próximas.

La imagen de inspección con índices se ha usado como ayuda temporal de trabajo; no se redistribuyen fotografías de terceros dentro de la escena. Los hashes de las capas utilizadas quedan registrados en el JSON para identificar la base cartográfica.
