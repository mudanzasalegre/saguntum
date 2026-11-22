# Validación v19 · Domus dels Peixos

**Estado del 20 de noviembre de 2026:** las comprobaciones finales de datos, geometría e integración han pasado. La exportación y la revisión visual de las seis escenas finales están cerradas; sus parámetros, dimensiones y huellas se registran en `visual-review.json`.

## Métodos y evidencia

| Comprobación | Resultado registrado | Evidencia |
| --- | --- | --- |
| Geometría de la Domus | 22 comprobaciones correctas | `domus-geometry-qa.json` |
| Documentación y plano | 14 comprobaciones; 20 paradas, 38 hechos, 9 fuentes y 12 hitos | `domus-documentation-qa.json` |
| Controladores de visita | 35 comprobaciones correctas | `visit-controller-results.json` |
| Distribución estática | 396 comprobaciones correctas | `static-assets-qa.json` |
| Integración con Sagunto | 1.011 comprobaciones, sin errores; 156 observaciones de cámara | `integrated-scene-qa.json`, generado a las 17:38:09.658 UTC |
| Interfaz en navegador | Visita, plano, selección de áreas, fuentes, cronología y enlaces verificados en modo documental | `browser-qa.json` y `domus-plan-interface.jpg` |

El ensayo integrado utiliza el constructor real de la aplicación y registra 105 mallas y 50.757 triángulos para la Domus y sus diez volúmenes anfitriones. El barrio circundante añade geometría fuera de ese recuento. Comprueba cámaras cercanas y generales en 1.363 × 936, 390 × 844 y 844 × 390, además de carga diferida, recuperación de errores, corte del terreno y conservación de las visitas anteriores. Sus 70 huellas SHA-256 identifican los archivos de entrada; un cambio posterior exige volver a contrastarlas.

Los controladores se prueban también con un adaptador DOM mínimo. Ese ensayo verifica contratos de estado y contenido; las observaciones de interfaz del navegador se registran por separado.

### Navegador y límites

Chrome del entorno de prueba no pudo crear un contexto WebGL. Se comprobó el modo de plano y documentación a 1.363 × 936. La recarga final del 20 de noviembre de 2026 mantuvo la marca del atlas y abrió `#domus/domus-impluvium`, parada 6 de 20, con sus medidas, fuentes y plano. `domus-plan-interface.jpg` es una captura real de ese navegador. Las interacciones anteriores con la misma interfaz están diferenciadas en `browser-qa.json`.

**No se ha medido rendimiento GPU ni se presenta esta revisión como una prueba del render WebGL.** Las comprobaciones matemáticas de cámara tampoco acreditan por sí solas fluidez o equivalencia visual en un dispositivo físico.

### Renders CPU

El exportador conserva posiciones, normales, UV, colores, transformaciones y texturas Canvas de las mallas Three.js generadas por la aplicación. Exporta la escena visible, sus recortes y un entorno limitado alrededor de cada foco. Blender Cycles reconstruye esos datos y renderiza en CPU; no sustituye el modelo por una imagen generada.

La iluminación ambiental, la potencia equivalente de las luces y la transparencia de Blender pueden diferir de WebGL. Los renders sirven para revisar composición, geometría y materiales, no para medir el resultado GPU. El script conserva el ruido de render y no usa alteraciones generativas.

| Render previsto | Parámetros de cierre | Qué revisar |
| --- | --- | --- |
| `domus-conjunto.png` | 960 × 720 · 12 muestras | Edificio actual y contexto urbano |
| `domus-corte.png` | 1.440 × 1.080 · 96 muestras | Planta abierta, separación de cocina y recinto hidráulico |
| `domus-museo.png` | 960 × 720 · 12 muestras | Pasarelas, apoyos y lectura interior |
| `domus-impluvium.png` | 960 × 720 · 12 muestras | Estanque, escala y pintura exterior |
| `domus-historica.png` | 1.440 × 1.080 · 96 muestras | Restitución y diferencia respecto a los restos |
| `domus-compluvium.png` | 960 × 720 · 12 muestras | Abertura y pendientes de la cubierta interpretativa |

## Reproducibilidad

Ejecutar desde la raíz del repositorio con Node, Python y Blender disponibles. Los scripts Canvas requieren `@napi-rs/canvas` accesible mediante `CODEX_PRIMARY_RUNTIME_NODE_MODULES`; el cargador resuelve la versión vendorizada de Three.js.

El primer comando regenera el plano y sincroniza coordenadas en `dist`; debe ejecutarse antes de las validaciones, con el código estable y sin otra integración simultánea.

```sh
node --experimental-loader ./research/validate_loader.mjs research/validation-v19/build-domus-plan.mjs
node research/validation-v19/validate_domus_documentation.mjs
node --experimental-loader ./research/validate_loader.mjs research/validation-v19/validate_domus_geometry.mjs
node research/validation-v19/validate_visit_controllers.mjs
python research/validation-v19/validate_static_assets.py
node --experimental-loader ./research/validate_loader.mjs research/validate_sagunto_v19.mjs --export
```

El último comando exporta por defecto las seis escenas de la tabla. Todos los renders de cierre usan `--full` para tomar las cámaras ajustadas de la aplicación desde el informe integrado:

```sh
blender -b -t 4 --python research/validation-v19/render_domus.py -- --scene domus-historica --full --samples 96
blender -b -t 4 --python research/validation-v19/render_domus.py -- --scene domus-corte --full --samples 96
blender -b -t 4 --python research/validation-v19/render_domus.py -- --scene domus-museo --full --draft
blender -b -t 4 --python research/validation-v19/render_domus.py -- --scene domus-impluvium --full --draft
blender -b -t 4 --python research/validation-v19/render_domus.py -- --scene domus-compluvium --full --draft
blender -b -t 4 --python research/validation-v19/render_domus.py -- --scene domus-conjunto --full --draft
```

Para reproducir la revisión documental en el entorno Sites, iniciar la vista previa con `sites-preview start <ruta-del-checkout>`. Desde la raíz del checkout:

```sh
sites-preview start "$PWD"
```

Abrir la URL que devuelva la herramienta con el fragmento `#domus/domus-impluvium`, recorrer el plano y verificar los enlaces descritos en el informe de navegador. En esta sesión la vista previa utilizó `http://127.0.0.1:4173/`.

## Cierre visual

Se inspeccionaron las seis imágenes con el visor de archivos. El conjunto conserva el edificio anfitrión y su barrio; el museo mantiene techo, instalaciones, pasarela y restos visibles. El estanque aparece hueco y separado de cocina y recinto hidráulico. La propuesta de cubierta muestra su abertura y pendientes. Las vistas generales de Corte e Histórica muestran las estancias sin que los edificios vecinos las oculten. Estas dos últimas vistas tuvieron además una segunda revisión independiente, sin riesgos materiales identificados.

Las 70 huellas de entrada del ensayo integrado coinciden con los archivos finales. `visual-review.json` vincula los PNG revisados con sus dimensiones y SHA-256. Las cuatro imágenes de 12 muestras conservan ruido visible de Cycles; la iluminación es aproximada y no se atribuye esta aprobación visual a un render WebGL.
