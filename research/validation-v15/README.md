# V15 · Verificación de la Ermita de la Sangre

Esta revisión separa las comprobaciones del modelo, el entorno cartográfico, la integración regional, el cuaderno documental y la interfaz. Los renders se obtienen de las mallas, coordenadas, normales, UV y materiales de Three.js exportados por el constructor regional de producción. No son imágenes generadas ni capturas de un navegador con WebGL.

## Alcance

- Geometría y sección de la ermita, cúpula, capillas, presbiterio y anexos.
- Plaza, calles y 152 cuerpos del contexto, con procedencia catastral/OSM y alturas explicadas.
- Registro del pavimento con el terreno definitivo y retirada de bordillos duplicados.
- 16 paradas con coordenadas compartidas entre historia, plano y modelo.
- Regresión de la Casa dels Berenguer y de los nueve cuadernos del atlas.
- Carga diferida regional, liberación de recursos y recuperación tras un fallo de textura.
- Permanencia de la marca general, los 31 lugares y los seis ámbitos.

## Comprobaciones reproducibles

Desde la raíz del proyecto:

```sh
node --experimental-loader ./research/validate_loader.mjs research/validate_sagunto_v15.mjs --export
node research/validation-v15/validate_visit_controllers.mjs
node research/validation-v15/validate_sangre_documentation.mjs
python research/validation-v15/validate_static_assets.py
blender -b --python research/validation-v15/render_sangre.py -- --scene sangre-conjunto --samples 48
```

El informe `integrated-scene-qa.json` registra cámaras de escritorio, móvil vertical y móvil horizontal, en vista general y cercana. Comprueba que el suelo no intercepta sus ejes y distingue el contacto deliberado de la cámara exterior con el tejado del propio monumento. En los interiores también comprueba nueve rayos próximos para detectar superficies a menos de 0,8 m de la cámara. Esto no sustituye la inspección visual.

El informe `static-assets-qa.json` comprueba sintaxis, imports locales, recursos, datos, IDs HTML y concordancia de plano y visita. `visit-controller-results.json` recorre las paradas de los nueve cuadernos y verifica secciones, fuentes y persistencia independiente del progreso. `sangre-visit-results.json` registra la auditoría documental.

Los informes específicos del modelo y del contexto describen apertura real de huecos, peldaños, límites de ornamentación, propiedad de parcelas, recortes, materiales y adaptación a la malla del suelo.

## Resultados del 20 de noviembre de 2026

| Comprobación | Resultado | Evidencia |
| --- | --- | --- |
| Integración regional y cámaras | 928 condiciones correctas; 204 variantes de cámara, sin intercepciones no previstas | [integrated-scene-qa.json](integrated-scene-qa.json) |
| Arquitectura de Sangre | 27 condiciones correctas, incluidos los 24 primeros impactos sobre rosetas visibles y el retranqueo de cubierta respecto a la fachada | [sangre-model-qa.json](sangre-model-qa.json) |
| Contexto cartográfico | 49 condiciones correctas; 152 cuerpos, 62 parcelas, huellas preservadas | [sangre-context-qa.json](sangre-context-qa.json) |
| Pavimentos y calles duplicadas | Superficies sin solapes con edificios o pavimentos protegidos; cinco condiciones de sustitución de bordillos y conservación de continuaciones | [pavimentos](sangre-context-pavement-qa.json), [calles](sangre-street-overlap-qa.json) |
| Recursos y sintaxis | 330 comprobaciones correctas | [static-assets-qa.json](static-assets-qa.json) |
| Controladores de las visitas | 25 comprobaciones correctas para las nueve visitas documentadas | [visit-controller-results.json](visit-controller-results.json) |
| Documentación | 9 comprobaciones correctas; 16 paradas, 39 hechos, 17 hitos y 22 fuentes | [sangre-visit-results.json](sangre-visit-results.json) |
| Interfaz de navegador | Portada general, visita, enlaces a paradas, cronología, fuentes, plano y lectura temática verificados en modo 2D | [browser-qa.json](browser-qa.json) |

La revisión visual corrigió el encuentro frontal del tejado con la silueta curvilínea, los apoyos de las bóvedas laterales, la profundidad de las cartelas y rosetas de la cúpula, el basamento del presbiterio y los bordillos genéricos que se superponían al pavimento detallado. Las viviendas conservan sus huellas; las correcciones de encuadre no mueven las parcelas.

### Vistas de inspección

Los siete PNG, de 1.440 × 1.080 píxeles, se calculan con Blender CPU a partir de las mallas finales del constructor regional. Las cámaras interiores conservan bóvedas y cubiertas; la vista de sección las abre de forma deliberada.

- [Conjunto y caserío](sangre-conjunto.png)
- [Plaza y fachada](sangre-plaza.png)
- [Portada y escalinata](sangre-portada.png)
- [Nave y crucero](sangre-nave.png)
- [Interior de la cúpula](sangre-cupula.png)
- [Presbiterio](sangre-presbiterio.png)
- [Sección arquitectónica](sangre-seccion.png)

La [captura del plano en el navegador](sangre-plan-browser.jpg) muestra la interfaz real, los marcadores y la leyenda temática. Se diferencia expresamente de los renders de inspección.

## Límites de la verificación

El navegador disponible en esta sesión informa de WebGL desactivado. En él se comprueban navegación, enlaces, cronología, fuentes y plano 2D; la geometría y las cámaras se verifican con el constructor real y con render CPU. No se certifican rendimiento GPU, fotogrametría ni una prueba en un teléfono físico. Los tres tamaños de pantalla se comprueban mediante las funciones de encuadre de producción.

La luz del render CPU incluye relleno amplio para hacer legible el interior, de forma análoga a la iluminación ambiente de la aplicación; no pretende reproducir exactamente un motor WebGL ni la instalación lumínica real del templo.

Los acabados y piezas artísticas son interpretativos. Las cámaras preparadas no constituyen una navegación libre en primera persona ni un itinerario físico accesible.
