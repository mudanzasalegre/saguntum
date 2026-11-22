# Verificación V7 · Castillo de Sagunto

Fecha: 19 de noviembre de 2026.

## Resultado

La iteración integra la identidad visual, las dos apariencias, la visita por el castillo, el nuevo modelo y sus referencias. Conserva las seis maquetas y los 31 lugares del catálogo. Los siguientes resultados verifican aspectos diferentes: las pruebas de geometría no se presentan como una prueba de renderizado WebGL.

| Ámbito | Evidencia |
|---|---|
| Contenido | 18 paradas, 72 hechos, 7 recintos, 14 hitos y 24 fuentes. IDs y referencias válidos; coordenadas dentro del castillo. |
| Modelo | `castle-geometry.json`: 328 comprobaciones del modelo, tres puertas, óculos de Almenara, contacto con el terreno y encuadres. |
| Integración Sagunto | `sagunto-regression.json`: 235 comprobaciones con el builder, preset y liberación reales de app.js; carga diferida y reintento de textura. |
| Cortes anteriores | 40 encuadres en corte/histórica sin oclusión del contexto; 25/25 rayos en la excavación permanente, antes y después de cambiar modos. |
| Recursos de la escena | La textura propia se libera una sola vez incluso tras retirar `map` para leer las épocas; materiales propios liberados y región ajena preservada. |
| Plano del castillo | `castle-map-canvas-results.json`: 64 escenarios y 5.296 comprobaciones sin fallos; ambas apariencias, dos lecturas, cuatro superficies y cuatro selecciones. |
| Mapas anteriores | 226 comprobaciones por configuración (predeterminada, oscura y clara), más 64 comparaciones de geometría y objetivos pulsables. |
| Contraste | 32 pares de texto/superficie por encima de 4,5:1; también comprobados bordes de controles y foco. |
| Navegador | 18 paradas recorridas, cuatro hechos por parada, finalización, plano, selección, fuentes, cronología, cambio de tema, persistencia y navegación de pestañas con teclado. |
| Formato estrecho | Aplicación dentro de un viewport real de iframe de 390 × 844, sin desbordamiento horizontal; cabecera de 112 px y panel inferior de 422 px. Selección y modal funcionales. |
| Continuidad | Se abre Teatro Romano desde el catálogo y se vuelve al Castillo; el cuaderno se oculta/muestra y el fragmento URL cambia correctamente. |

## Navegador y representación

El navegador de esta sesión informa `GL_VENDOR = Disabled` y `GL_RENDERER = Disabled`. Por ello la prueba interactiva se hizo en el modo 2D que ofrece la aplicación. Se verificaron los flujos y las dos apariencias, pero no se certifican FPS, sombras ni interacción orbital mediante GPU en este navegador.

Los archivos `castillo-conjunto.png`, `castillo-foro.png` y `castillo-puerta-almenara.png` son renders de inspección CPU/Cycles de las mallas Three.js exportadas, con el terreno real. Los materiales se aproximan. No son capturas de la aplicación ni sustituyen la comprobación WebGL. El contexto urbano de estas imágenes se limita a la ortofoto y a los modelos incluidos en la exportación; la aplicación conserva la edificación de contexto.

Las capturas `castle-v7-*.jpg` sí proceden del navegador. La captura móvil muestra el marco de prueba de 390 × 844 y la aplicación cargada dentro. El HTML de ese marco se retira antes de publicar.

## Reproducción

```sh
node --experimental-loader ./research/validate_loader.mjs research/validate_castle_v7.mjs
node --experimental-loader ./research/validate_loader.mjs research/validate_sagunto_v7.mjs
node --experimental-loader ./research/validate_loader.mjs research/validation-v7/validate_castle_map_canvas.mjs
node --experimental-loader ./research/validate_loader.mjs research/validation-v7/validate_maps_canvas.mjs
```

Los scripts Canvas usan `@napi-rs/canvas`, disponible en el runtime gestionado. Los scripts de inspección no forman parte del paquete público de la aplicación.
