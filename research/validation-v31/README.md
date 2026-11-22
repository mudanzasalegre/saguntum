# V31 · Paseo del pantalán, mirador, tramo marítimo y agua

Esta iteración desarrolla los dos lugares costeros existentes dentro de **SAGUNTUM · Atlas vivo**. Conserva la portada `#atlas`, los 31 lugares y los seis ámbitos, y añade dos visitas detalladas de diez paradas cada una: el atlas dispone de 26 guías. La base comparada es `8f1f5325e46876ec4688331017e3b466412418cb`.

## Contenido publicado

El paseo incorpora siete pérgolas y 600 lamas, accesos con escalinata y rampa, pavimentos y bordillos, tolva recuperada, juegos, carril bici, alumbrado, mobiliario, escollera, escalera al mar y mirador con tarima. El terreno final se comparte con las doce envolventes del contexto: once huellas cartográficas y una aproximación fotográfica identificada. Cuatro naves reciben un tratamiento más detallado. La nueva pavimentación conserva los remanentes de las vías fuera de su ámbito, sin borrar el vial portuario completo.

El tramo marítimo distingue el estado conservado documentado de la instalación industrial hacia 1984–1987. El estado actual mantiene los huecos tras la retirada de tableros y pasarelas, los apoyos cartografiados y la plataforma conservada. La recreación histórica recupera la continuidad, cintas, cargador, tolvas y pasarela terminal. Cambiar la época sincroniza los dos tramos. La costa y el entorno son contemporáneos en ambas lecturas; no se atribuye precisión histórica a su línea de costa.

El mar conserva su máscara cartográfica. Cambian las normales, el filtrado, el gradiente junto a la orilla, la espuma tenue, la respuesta al sol y los reflejos. Se respetan el movimiento reducido, la inspección sin agua y la liberación de recursos al cambiar de ámbito. El fondo expositivo no se presenta como batimetría.

## Documentación y límites

Los detalles de investigación, atribución e interpretación están en `research/pantalan-research.md`, `research/pantalan-model.md`, `research/pantalan-context.md`, `research/pantalan-context-model.md` y `research/pantalan-water.md`. Las dos guías publicadas incluyen sus fuentes y distinguen lo documentado de las aproximaciones de forma, altura, material y maquinaria. El proyecto marítimo anunciado en 2026 no se dibuja como una obra ya terminada.

## Evidencia de validación

| Área | Informe | Alcance |
|---|---|---|
| Modelo | `pantalan-model-results.json` | 145 comprobaciones de geometría, fases, focos y recursos |
| Contexto | `pantalan-context-results.json` | 14 comprobaciones de huellas, patios, terreno y propiedad de recursos |
| Escena real integrada | `integrated-coast-qa.json` | Código de construcción de producción, 162 cámaras, terreno, capas, remanentes viales y desmontaje |
| Mapas | `pantalan-map-qa.json` | 704 casos Canvas con dos épocas, temas, selecciones y tamaños |
| Controles | `pantalan-controller-results.json` | 12 escenarios de las dos visitas y enlaces directos |
| Guías anteriores | `legacy-visit-controller-results.json` | 61 comprobaciones de las 24 visitas previas |
| Capas y perfil | `pantalan-layer-results.json`, `pantalan-profile-results.json` | Jerarquía visible real y cotas del perfil |
| Agua | `water-checks.json`, `water-shader-diagnostic.json` | Estados, máscara, reflejos, recursos y GLSL real en EGL/Mesa |
| Recursos y conservación | `static-assets-qa.json`, `previous-monuments-qa.json` | Sintaxis, imports, datos, identidad y comparación con la base V30 |
| Imágenes | `render-batch-results.json`, `visual-review.json` | Ocho encuadres de las mallas exactas, con sus hashes |
| Publicación | `final-snapshot-qa.json` | Correspondencia entre código final, pruebas, exportaciones y revisión visual |

La inspección CPU de Blender usa las mallas, normales, materiales, texturas y cámaras exportadas del modelo. Su iluminación es aproximada y el mar utiliza un material plano de inspección. El shader real del agua se compila y rasteriza por separado con un reflejo de prueba; la imagen está rotulada como diagnóstico. Ninguna de estas imágenes se presenta como captura de la aplicación.

`browser-limitations.json` registra que la vista previa gestionada continúa detenida tras fallos previos de infraestructura. No se ha validado la aplicación en un navegador, la composición responsive nativa, la carga real de fuentes ni el rendimiento en una GPU de usuario. No se reintentó la vía bloqueada sin evidencia de reparación.

## Reproducción

Desde la raíz del checkout:

```sh
node --experimental-loader ./research/validate_loader.mjs research/validation-v31/validate-pantalan-model.mjs
node --experimental-loader ./research/validate_loader.mjs research/validation-v31/validate-pantalan-context.mjs
node --experimental-loader ./research/validate_loader.mjs research/validate_coast_v31.mjs --export
node --experimental-loader ./research/validate_loader.mjs research/validation-v31/validate-pantalan-maps.mjs
node research/validation-v31/validate-pantalan-controllers.mjs
node research/validation-v31/validate-legacy-controllers.mjs
node research/validation-v31/validate-pantalan-layers.mjs
node research/validation-v31/validate-pantalan-profile.mjs
node --experimental-loader ./research/validate_loader.mjs research/validation-v31/validate-water.mjs
python research/validation-v31/render-water-shader.py
python research/validation-v31/validate_static_assets.py
python research/validation-v31/validate_previous_monuments.py
python research/validation-v31/render-pantalan-scenes.py
```

Tras revisar las imágenes y registrar `visual-review.json`, ejecutar `python research/validation-v31/validate-final-snapshot.py`. El lote de Blender puede reutilizar una imagen únicamente cuando el contenido completo de la escena exportada —geometría, cámaras, materiales y referencias de texturas— coincide, además del script de render, los parámetros y el hash de la imagen. Esa reutilización se declara expresamente en su registro; un cambio en la escena obliga a renderizarla de nuevo. Los grandes archivos de geometría y los logs son regenerables y están ignorados en Git.
