# V30 · Antiguo Sanatorio y jardines

La ampliación integra la vigésima cuarta visita detallada en el mismo atlas. La ruta es `#sanatorio`, con 21 paradas y enlaces directos como `#sanatorio/sanatorio-fachada` y `#sanatorio/sanatorio-seccion`. Se mantienen los 31 lugares, seis ámbitos territoriales, nueve lugares industriales y la identidad general de SAGUNTUM.

## Evidencia y alcance

El modelo conserva las catorce partes catastrales del recinto. Las fotografías históricas y actuales publicadas por CONTRAST/APIPS, el archivo de la Fundació Port de Sagunt y la ortofotografía orientan la fachada, los accesos centrales, el pórtico, las cubiertas, los pabellones y los chalets. El plano histórico publicado por APIPS corresponde a un fragmento de la planta baja: no es un levantamiento completo del edificio ni describe la distribución administrativa actual.

La sección permite leer vestíbulo, escalera, capilla con ábside y sacristía en ese fragmento documentado. Las cotas no acotadas, materiales y mobiliario son aproximaciones de representación. No se reconstruye como actual el remate de la terraza desaparecido. Los usos cívicos contemporáneos y el anuncio de sede del Archivo Industrial se documentan por separado; un anuncio de destino no acredita una apertura pública.

El recinto histórico y el parque contiguo tienen propietarios de geometría distintos. El modelo arquitectónico gestiona edificios, jardines y caminos interiores; el contexto gestiona calles, aceras, parque exterior y edificios próximos. Ambas superficies se enlazan sobre el terreno final del Puerto. La capa Vegetación controla los dos conjuntos.

Documentación: `research/sanatorio-research.md`, `research/sanatorio-model.md` y `research/sanatorio-context-research.md`.

## Navegación y planos

La vista general y las paradas exteriores muestran el recinto y su contexto. Las paradas interiores y la sección acercan el plano al fragmento central histórico de la planta baja. Los huecos proceden del registro del modelo; las líneas de peldaños y la flecha de recorrido siguen la escalera representada.

Abrir sección desde el conjunto conduce a una vista aérea de la planta histórica. Desde ella se puede entrar a las paradas interiores. Cerrar una sección necesaria para una parada devuelve a la vista exterior, evitando mantener una cámara dentro de un volumen cerrado. El cuaderno, sus fuentes, la cronología y los planos siguen disponibles sin WebGL.

## Verificación

La versión final supera 89 comprobaciones del modelo, 43 del contexto, 828 de la escena de producción —132 combinaciones de cámara—, 114 casos Canvas, 61 comprobaciones de los controladores de 24 visitas y 609 de recursos estáticos. La comparación con V29 conserva 229 recursos anteriores. La guía registrada reúne 21 paradas, 42 hechos, 19 fuentes, ocho hitos y cinco capas de lectura.

Los informes de esta carpeta cubren estas comprobaciones:

| Ámbito | Evidencia |
| --- | --- |
| Arquitectura y jardines | QA del modelo: geometría, aperturas, escaleras, sección, recursos y cámaras |
| Contexto urbano | QA del contexto: huellas, propiedad de superficies, rasantes, árboles y accesos |
| Registro documental | Guía y plano serializado coinciden con los focos geométricos finales |
| Escena de producción | `integrated-scene-qa.json`, usando la función real `buildRegion` de la aplicación |
| Planos Canvas | `sanatorio-map-qa.json`, con tamaños, temas, capas, sección y selección |
| Navegación | `visit-controller-results.json`, con las 24 visitas y transiciones de sección |
| Conservación del atlas | `previous-monuments-qa.json`, comparado con el commit publicado V29 |
| Recursos | `static-assets-qa.json`: sintaxis, importaciones, datos, enlaces e identificadores |
| Revisión visual | `visual-review.json` y renders de las mallas exactas de producción |
| Correspondencia final | `final-snapshot-qa.json`: informes, fuentes y renders del mismo estado de código |

Las comprobaciones integradas incluyen también las 53 cancelas del Barrio Obrero, para detectar cambios involuntarios en su relación con el terreno. Se conservan los modelos anteriores y sus datos; sólo los archivos compartidos de integración y la ficha del Sanatorio se modifican.

La revisión corrigió cuatro problemas concretos: el agregado de exclusiones ahora expande tanto arrays como conjuntos `Set`, el basamento cierra hasta el terreno, los recercados se construyen con jambas y dintel para dejar libres los huecos, y el pie de la rampa enlaza con el paseo. Se comprueba físicamente el paso a través de las catorce puertas abiertas y la continuidad de ese enlace. Los marcadores desplazados del plano móvil tienen líneas de llamada y un punto de anclaje más visibles; la escala del fragmento histórico se indica como aproximada.

## Reproducir

Desde la raíz del repositorio:

```sh
node --experimental-loader ./research/validate_loader.mjs research/validation-v30/build-sanatorio-plan.mjs
node --experimental-loader ./research/validate_loader.mjs research/validate_port_v30.mjs --export
node --experimental-loader ./research/validate_loader.mjs research/validation-v30/validate_sanatorio_maps.mjs
node research/validation-v30/validate_visit_controllers.mjs
python research/validation-v30/validate_previous_monuments.py
python research/validation-v30/validate_static_assets.py
python research/validation-v30/render-sanatorio-scenes.py
```

Las pruebas del modelo, contexto y documentación se describen en sus informes específicos. Tras inspeccionar las imágenes y registrar la revisión, ejecutar `python research/validation-v30/validate_final_snapshot.py`. Los grandes archivos `*-geometry.json.gz` y los logs de render son reproducibles y están ignorados en Git.

## Límites de la revisión

Los renders CPU importan mallas, normales, colores, texturas y cámaras de producción. La iluminación es una aproximación para inspeccionar formas y relaciones espaciales; no reproduce píxel a píxel el resultado de Three.js.

La consulta de diagnóstico `sites-preview status` devuelve `Sites preview stopped`. No se ha observado una reparación o recuperación de los fallos previos de autoridad de URL y WebGL, por lo que no se ha reintentado otra vía de navegador. La composición real del navegador, sus fuentes, controles táctiles y rendimiento GPU permanecen sin verificar. La confirmación nativa del despliegue acredita la publicación por separado.
