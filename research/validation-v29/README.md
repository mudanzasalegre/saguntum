# V29 · Barrio Obrero: implementación y verificación

Esta edición añade la visita `#barrio-obrero` al mismo atlas: 31 lugares, seis ámbitos territoriales y nueve lugares industriales. La portada, la marca y los recorridos anteriores se conservan. El Barrio tiene veinte paradas, cuarenta hechos con referencias, doce fuentes, cinco capas de lectura y seis hitos.

## Fuentes y alcance

El catálogo municipal de protección, páginas PDF 77–96, aporta planos, alzados, tipologías y secciones. La lámina 82 documenta las cotas de aleros, jardines y calles utilizadas para los tipos históricos. Las huellas actuales proceden de Catastro y se contrastan con PNOA y el viario OSM. La investigación de CONTRAST/APIPS y los estudios tipológicos ayudan a interpretar la vida doméstica y la relación con la ciudad factoría.

Se mantienen 95 referencias y 287 partes catastrales del barrio; no se presentan como un recuento de viviendas originales. Los dos interiores corresponden a muestras de los tipos III y IV adaptadas a las huellas representadas. Los usos de habitaciones, muebles, detalles no acotados y ajustes a las ampliaciones actuales son interpretativos. No se afirma haber levantado el interior privado actual de las casas.

Documentación específica: `research/barrio-research.md`, `research/barrio-model.md` y `research/barrio-context-research.md`.

## Geometría y propiedad de las superficies

El modelo conserva las siete manzanas, diferencia casas bajas y extremos de dos plantas y detalla cubiertas, hastiales, huecos, recercados, carpinterías, chimeneas, jardines y corrales. La sección retira cubiertas y techos superiores de las dos muestras; el forjado intermedio permanece.

El contexto desarrolla catorce tramos viarios y 370 partes catastrales vecinas, sin duplicar las arquitecturas de los otros monumentos. Las dos bolsas públicas de las cabeceras C/D son excepciones expresas a la envolvente nominal de las manzanas: se han contrastado con PNOA y recortado contra casas, jardines y corrales. La parcela ambigua situada al oeste queda fuera de la intervención.

Los jardines enlazan el acceso público con el apoyo junto a la vivienda. Suelos y caminos se teselan para seguir el terreno final. `bindGround` adapta esos elementos después de construir la superficie definitiva del Puerto; las casas y los interiores resuelven su datum en el constructor. La capa Vegetación controla por separado árboles domésticos y contextuales.

## Revisión visual y correcciones

La primera inspección detectó jardines sobre zócalos excesivos, hastiales incompletos y dos encuadres interiores poco informativos. La revisión corrigió la relación jardín–acera, el cierre de los testeros, los umbrales, el mobiliario que invadía el desembarco y las cámaras. Una prueba posterior sobre los triángulos reales detectó penetración del terreno en dos jardines; la teselación y adaptación de las superficies eliminan esa incidencia.

El plano interior utiliza los huecos de puerta y ventana registrados y los veinte segmentos reales de la escalera. Distingue casa, planta y tipo histórico; los jardines a cota de calle no se dibujan como espacios de la primera planta. La sección desde la vista general o la primera parada conduce a la casa baja, mientras que desde un interior mantiene su selección.

`initial-visual-review.json` y `initial-barrio-hileras.png` conservan la incidencia inicial. `visual-review.json` contiene el resultado de la inspección final. No se deben confundir las imágenes de revisión con fotografías históricas o capturas del navegador.

## Comprobaciones

| Ámbito | Evidencia |
|---|---|
| Modelo doméstico | `barrio-model-qa.json`: geometría finita, referencias, huecos, hastiales, umbrales, escaleras, cámaras y recursos |
| Contexto | `barrio-context-model-qa.json` y `barrio-context-geometry-validation.json`: propiedad, pavimento, edificios y arbolado |
| Jardines y accesos | `barrio-ground-edge-probe.json`: vértices, centros y lados de triángulos contra terreno final, y 53 cancelas |
| Escena de producción | `integrated-scene-qa.json`: función real `buildRegion`, 126 combinaciones de cámara y 786 comprobaciones |
| Planos Canvas | `barrio-map-qa.json`: 98 casos de tamaño, tema, lectura, casa, planta, sección y selección |
| Navegación | `visit-controller-results.json`: 23 visitas, progreso independiente, fuentes, secciones y alternativa sin WebGL |
| Documentación | `barrio-editorial-audit.json`: referencias, cronología, notas de interpretación y registro geométrico |
| Regresión | `previous-monuments-qa.json`: 223 activos anteriores conservados y orden de carga intacto |
| Distribución | `static-assets-qa.json`: sintaxis, importaciones, archivos, datos, enlaces e identificadores |
| Revisión exacta | `final-snapshot-qa.json`: informes y renders vinculados a los hashes de los archivos finales |

Los renders CPU importan las mallas de producción, normales, texturas procedurales, colores, cámaras y banderas de sombra. La iluminación y la exposición son una aproximación de inspección; no reproducen píxel a píxel el renderizador Three.js. Las vistas finales cubren conjunto, hileras, sala, cocina, primera planta, calles y sección. Los archivos `*-render-input.json` registran la geometría exacta y el programa de render utilizado.

## Reproducir

Ejecutar desde la raíz del repositorio. El adaptador de Node utiliza Three.js vendorizado y Canvas del runtime primario. Blender se utiliza para inspección CPU.

```sh
node --experimental-loader ./research/validate_loader.mjs research/validation-v29/build-barrio-plan.mjs
node --experimental-loader ./research/validate_loader.mjs research/validation-v29/validate_barrio_model.mjs
node --experimental-loader ./research/validate_loader.mjs research/validation-v29/validate_barrio_context.mjs
node --experimental-loader ./research/validate_loader.mjs research/validation-v29/probe_barrio_ground_edges.mjs
node --experimental-loader ./research/validate_loader.mjs research/validate_port_v29.mjs --export
node --experimental-loader ./research/validate_loader.mjs research/validation-v29/validate_barrio_maps.mjs
node research/validation-v29/validate_visit_controllers.mjs
python research/validation-v29/validate_barrio_documentation.py --require-registration
python research/validation-v29/validate_previous_monuments.py
python research/validation-v29/validate_static_assets.py
python research/validation-v29/render-barrio-scenes.py
```

Tras inspeccionar las imágenes y registrar la revisión, ejecutar `python research/validation-v29/validate_final_snapshot.py`. Los grandes archivos intermedios de geometría comprimida están ignorados en Git y se regeneran mediante la exportación. Los generadores iniciales de guía y de preparación se protegen contra sobrescrituras accidentales del trabajo ya registrado.

## Límites de la verificación

La infraestructura de vista previa no tiene una recuperación observada de sus fallos anteriores de autoridad de URL y WebGL; la consulta de estado de esta iteración indica que está detenida. No se ha reintentado otra vía de navegador. `browser-limitations.json` conserva el diagnóstico.

La composición final del navegador, las fuentes cargadas allí, el rendimiento GPU y los controles táctiles reales permanecen sin verificar. Las pruebas geométricas y Canvas no sustituyen esas comprobaciones. La confirmación nativa de despliegue acredita la publicación por separado.
