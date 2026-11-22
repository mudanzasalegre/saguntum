# Verificación V8 · Teatro Romano de Sagunto

Fecha: 19 de noviembre de 2026.

## Resultado y alcance

La edición incorpora una visita de 16 paradas con 52 hechos, 14 hitos cronológicos, 15 fuentes y cinco ámbitos. El modelo interpreta el conjunto conservado y rehabilitado. La sección del subsuelo es didáctica; no representa una restitución medida de todos los elementos antiguos.

| Ámbito | Evidencia |
| --- | --- |
| Modelo del Teatro | `theatre-geometry.json`: 105 comprobaciones aprobadas; 47.744 triángulos, 46 mallas, 21 componentes y 16 focos. |
| Huecos y terreno | 90 rayos a través de nueve accesos y la cloaca; 8.194 muestras de superficies superiores despejadas sobre el terreno. |
| Sagunto completo | `sagunto-regression.json`: 727 comprobaciones del constructor, cámaras, terreno, cortes y descarga reales de app.js. |
| Cámaras de la visita | 102 encuadres generales y cercanos en escritorio, móvil vertical y móvil horizontal; objetivos dentro del espacio de la interfaz y sin oclusión de contexto. |
| Corte escénico | Se retiran cubierta y tablado; el foso permanece por encima del terreno final, con separación mínima de 1,225 m en Sagunto. |
| Contexto urbano | Exclusión de tres cuerpos edificados y 27 trazados interiores; 25 rayos comprueban que no se superponen al teatro. |
| Palancia | `palancia-context.json`: 55 comprobaciones; construcción del contexto antes del terreno, encaje final y descarga de recursos sin alterar Sagunto. |
| Castillo en Palancia | 20.000 muestras de suelo coinciden con el interpolador de los triángulos finales; error máximo 0 en la comprobación. |
| Plano del Teatro | 272 escenarios y 24.464 comprobaciones, con 21 componentes, 16 selecciones, cuatro superficies, dos apariencias y dos lecturas. Contraste mínimo de marcadores 5,52:1. |
| Controlador compartido | 16 comprobaciones de separación de progreso, IDs, fuentes, navegación, sección y compatibilidad del Castillo. |
| Navegador | 16 paradas recorridas, finalización, persistencia, 14 hitos, 15 fuentes, fichas bibliográficas, selección en plano y dos apariencias. |
| Continuidad | Catálogo de 31 lugares; cambio entre Teatro y Castillo, conservación de sus 18 paradas y progreso independiente. |
| Adaptación | Viewports reales de iframe de 390 × 844 y 844 × 390; sin desbordamiento horizontal y título de parada visible dentro del panel. |

Las dos comprobaciones de integración reúnen 782 aserciones. Sus archivos incluyen hashes del código y del modelo empleados. La comprobación de geometría y la de integración cubren riesgos distintos; sus cifras no expresan una cobertura porcentual.

## Navegador y renders

El navegador de esta sesión tiene WebGL desactivado. Las comprobaciones interactivas se realizaron en el modo 2D de la aplicación, conservando el plano georreferenciado, la documentación y los controles que no requieren GPU. No se certifican FPS, sombras WebGL ni interacción orbital mediante GPU en este entorno.

Las imágenes `teatro-conjunto.png`, `teatro-orchestra.png` y `teatro-corte.png` son renders CPU/Cycles de las mallas Three.js exportadas con el terreno. Los materiales están simplificados. Son inspecciones de geometría, no capturas de la aplicación. El contexto urbano de esas imágenes se limita a lo exportado; la aplicación conserva su edificación cartografiada.

Las imágenes `theatre-v8-light.jpg`, `theatre-v8-dark.jpg` y `theatre-v8-mobile.jpg` proceden del navegador. La móvil incluye el marco temporal que mantiene un viewport real de 390 × 844. Ese HTML se retira antes de publicar. Los resultados de la navegación están en `browser-results.json`.

## Reproducción

```sh
node --experimental-loader ./research/validate_loader.mjs research/validate_theatre_v8.mjs
node --experimental-loader ./research/validate_loader.mjs research/validate_sagunto_v8.mjs
node --experimental-loader ./research/validate_loader.mjs research/validate_palancia_v8.mjs
node --experimental-loader ./research/validate_loader.mjs research/validation-v8/validate_theatre_map_canvas.mjs
node research/validation-v8/validate_visit_controller.mjs
```

Las pruebas Canvas utilizan `@napi-rs/canvas` del runtime gestionado. Estos scripts e informes están fuera del directorio público `dist/`. La publicación utiliza únicamente el código y los datos estáticos de la aplicación.
