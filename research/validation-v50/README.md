# Castillo de Sagunto · revisión del modelo y su entorno

Revisión del 26 de noviembre de 2026 para SAGUNTUM · Atlas vivo. Se conservan la portada territorial, las 32 visitas, la visita 15 del Castillo, sus 18 paradas y los siete grupos de recintos. El Atlas, el contexto regional y el Simulador comparten el constructor del castillo.

## Cambios visibles

Las murallas distinguen paños de mampostería y tapial, remates deteriorados y tramos con parapeto, adarve y merlones documentados en las fotografías. Las aspilleras son huecos reales. La Ciudadela incorpora la torre telegráfica conservada: planta documentada de 5,7 × 5,7 m, mampostería y ladrillo, huecos al norte/sur y cubierta perdida. Tres edificios reciben cubiertas inclinadas ajustadas a sus huellas cartográficas, incluido el Antiquarium.

El foro conserva los restos bajos del templo y la curia. Su superficie central es ahora una terraza de tierra y grava, con fragmentos pétreos, sin la retícula regular de losas. `castle-ground.js` acomoda sólo el polígono central existente y una transición de cuatro metros: estima el nivel a partir del borde sur/oriental del MDT y conserva las excavaciones del templo y de la basílica. No representa una nueva medición arqueológica ni modifica el archivo original de elevaciones.

El Simulador usa esa misma acomodación del terreno y una máscara de las superficies reales de los caminos y escalones. Así evita superponerles carreteras genéricas y utiliza sus alturas para caminar. La entrada al castillo comparte el encuadre del primer punto «Una fortaleza, muchas épocas»; los demás destinos mantienen sus propios encuadres.

## Documentación

La guía contiene 18 paradas, 72 hechos, 15 hitos, 29 fuentes y 169 referencias resueltas. Enlaza las fotografías de Laurent de 1870, Gómez Durán de 1908 y el recorrido fotográfico publicado por Ricardo en 2022, distinguiendo la fecha de publicación de las distintas fechas de toma. El Plan Director de 2000, los documentos militares de 1810–1813, el inventario IPCE de 2012 y los estudios arqueológicos tienen funciones diferentes en la interpretación del modelo.

- [Investigación histórica](../castle-history.md).
- [Memoria del modelo](../castle-model.md).
- [Contraste visual y decisiones de representación](castle-visual-sources.md).

Las fotografías de terceros se consultaron como referencia y se enlazan en las fuentes; no se redistribuyen como texturas. Los mapas de materiales son procedurales originales.

## Comprobaciones reproducibles

| Evidencia | Resultado y alcance |
| --- | --- |
| [Geometría](castle-geometry.json) | 50 comprobaciones correctas; 25.315 triángulos de suelo examinados sin centros enterrados; 27 rayos de pasos, dos óculos y 167 aspilleras abiertos; torre, cubiertas e independencia de materiales verificadas. |
| [Guía e índice](castle-guide-qa.json) | 53 comprobaciones correctas; identificadores y coordenadas estables, referencias resueltas y contenido de los otros 31 destinos conservado. |
| [Cámaras](castle-cameras-qa.json) | 40 poses mediante el `preset()` real: 18 paradas, conjunto y exterior en escritorio/retrato; encuadre y terreno; adaptación UTM y prueba de desplazamiento vertical. |
| [Simulador y terreno](castle-simulator-qa.json) | Constructor real, 107 lotes coincidentes con los del Atlas al suministrar el mismo suelo final, registro geográfico, máscara de caminos/escalones y colisiones. Se comprueba también la corrección de un MDT sin acomodar: terraza central, excavaciones conservadas y respeto al suelo ya preparado. |

```sh
node research/validation-v50/validate-castle.mjs
python research/prepare-territory-visits.py
node research/validation-v50/validate-castle-guide.mjs
node research/validation-v50/export-castle-cameras.mjs
node research/validation-v50/export-castle-cameras.mjs --check
node research/validation-v50/validate-castle-simulator.mjs
node research/build-territory-heritage.mjs
```

El worker requiere `esbuild@0.25.12`. Los validadores usan la copia de Three.js incluida en la app; no necesitan un navegador. El modelo contiene 83.047 triángulos y 107 mallas. Estos recuentos no son una medición de FPS.

## Inspección visual

Estas imágenes son **renders CPU de las mallas de la aplicación**, no fotografías ni capturas WebGL. Se conservan posiciones, normales, instancias, UV, colores y las texturas Canvas/DataTexture originales. Blender utiliza su propia iluminación y sombreado. Las cámaras de inspección complementan las comprobaciones de los encuadres de la visita.

| Vista | Imagen |
| --- | --- |
| Conjunto, ladera y ciudad | [castillo-conjunto.jpg](castillo-conjunto.jpg) |
| Terraza central y restos del foro | [castillo-foro.jpg](castillo-foro.jpg) |
| Puerta de Almenara | [castillo-almenara.jpg](castillo-almenara.jpg) |
| Murallas de Estudiantes | [castillo-estudiantes.jpg](castillo-estudiantes.jpg) |
| Ciudadela y torre del telégrafo | [castillo-ciudadela.jpg](castillo-ciudadela.jpg) |
| Antiquarium | [castillo-antiquarium.jpg](castillo-antiquarium.jpg) |

[render-inspection.json](render-inspection.json) identifica los archivos de origen, las cámaras y las imágenes mediante SHA-256. La primera inspección detectó la rampa y las losetas del foro; ambas se corrigieron antes de exportar la geometría final.

```sh
node research/validation-v50/export-castle-geometry.mjs --out /tmp/saguntum-castle.json.gz
blender -b -t 8 --python research/validation-v50/render_castle.py -- --input /tmp/saguntum-castle.json.gz
```

La exportación necesita `@napi-rs/canvas`; las texturas temporales y la exportación pesada se guardan fuera de la aplicación. El renderizador acepta `--only` con nombres de imágenes separados por comas y `--output` para otra carpeta.

## Interfaz, publicación y límites

La vista previa permitió comprobar la entrada desde la portada, ocultación y reapertura del panel, las fuentes, el inicio del recorrido, el plano con las 18 paradas y la selección de Ciudadela. La comprobación pública posterior y el paso al Simulador se registran en [production-qa.json](production-qa.json); versión y origen en [SITES_SYNC.md](../../docs/SITES_SYNC.md).

El navegador de comprobación utiliza la alternativa 2D porque WebGL está desactivado. Las pruebas de interfaz y los renders CPU son evidencias distintas: no se certifican FPS, estabilidad GPU ni igualdad de sombreado con el navegador del usuario.

La planta de los recintos procede de la cartografía existente. Las alturas menores, pérdidas de fábrica, remates y pendientes de cubierta siguen siendo estimaciones visuales. El nivel del foro es una acomodación local del relieve de visualización, no una cota de excavación. La revisión representa elementos conservados respaldados por documentación y no reconstruye una supuesta fortaleza de una sola época.
