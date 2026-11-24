# Aproximación a la Glorieta y al Alto Horno

Chrome 156, WebGPU nativo, calidad Media, ventana de 920 × 600 y escala 1. El ensayo abrió el simulador sin lugar ni parada seleccionados. La rueda acercó la cámara orbital y la tecla de avance movió la cámara de vuelo. Se muestrearon la escena y las colas de carga en cada fotograma. [Registro de ambas aproximaciones](aproximacion-patrimonio.json)

| Momento observado | La Glorieta, radio orbital | Alto Horno n.º 2, distancia horizontal al ancla |
| --- | ---: | ---: |
| Comienzo | 556 m | 525 m |
| Sector de calles y edificios disponible en la aproximación | 536 m | 465 m |
| Modelo con entorno del Atlas visible | 498 m | 446 m |
| Modelo patrimonial interactivo disponible | 498 m | 285 m |

La plaza entró directamente con su modelo patrimonial, 313 edificios de entorno, 45 fachadas detalladas y 18 tramos de calle. El Alto Horno conservó su silueta específica en los fotogramas anteriores al modelo urbano. Su entorno incorporó cinco edificios y 20.070 m² de pavimento. El modelo interactivo sustituyó al urbano durante el vuelo. Ambas sesiones alcanzaron un máximo de dos conjuntos residentes y dos precargas simultáneas.

El radio orbital mide de la cámara al punto que se observa. En el vuelo se mide la distancia horizontal de la cámara al ancla registrada del Alto Horno. Los campos `distanceM` y `projectedM` del diagnóstico miden desde el foco de carga hasta el contorno o ancla más próximos. Las distancias de la tabla corresponden a estos dos recorridos en el equipo de prueba y varían con la velocidad y el dispositivo.

Para repetir con `dist` servido en el puerto 8492, ejecutar `python research/check-heritage-approach.py --base http://127.0.0.1:8492 --engine webgpu --out research/render-v4/aproximacion-patrimonio.json`. La política de previsión para el desplazamiento a pie, los topes para móvil y la preparación de una fachada próxima en el trabajador se comprueban por separado con `node research/test-territory-stream-policy.mjs` y `node research/test-territory-local-cache.mjs`.
