# V22 · Verificación del Alto Horno n.º 2

Fecha de revisión: 20 de noviembre de 2026. El conjunto integra la máquina conservada, su adaptación patrimonial y el recinto contemporáneo dentro del atlas existente.

## Resultados

| Ámbito | Resultado | Evidencia |
| --- | --- | --- |
| Máquina | 61 controles superados: veinte focos, altura, 315 cajas, doce toberas, tres pasos reales, hueco de escalera, corte y recursos | `horno-model-qa.json` |
| Contexto | 18 controles superados: terreno final, geometría, pavimentos, foco, propiedad y liberación de recursos | `horno-context-model-qa.json` |
| Cartografía del contexto | 7 controles superados | `horno-context-source-qa.json` |
| Puerto completo | 756 comprobaciones, 126 cámaras, sin errores | `integrated-scene-qa.json` |
| Alzado y planta | 64 combinaciones: cuatro formatos, dos temas, dos lecturas y cuatro selecciones | `horno-map-qa.json` |
| Controladores del atlas | 42 comprobaciones, las 16 visitas detalladas | `visit-controller-results.json` |
| Archivos de distribución | 446 comprobaciones, 82 módulos JavaScript, 94 JSON y 60 solicitudes iniciales | `static-assets-qa.json` |
| Documentación | 20 paradas, 12 fuentes, 40 hechos y 8 hitos; referencias e identificadores válidos | `documentary-integrity.json` |
| Navegador | Recorrido, plano, parada interior, cronología, fuentes, lectura cromática, tema claro y vínculo con Talleres | `browser-review.json` |

Las 126 cámaras proceden de la función real `preset` y del encuadre de la aplicación. Cubren veinte paradas y la sección del conjunto, cada una en 1363×936, 390×844 y 844×390, con vista general y cercana. Se comprueban coordenadas, separación del terreno final, rayos hacia el foco, encuadre de los límites y cámara interior fuera de geometría inmediata. Se preservan los nueve lugares del Puerto y los 31 del atlas.

La máquina contiene 116 mallas agrupadas y 230.896 triángulos; el contexto propio, 26 mallas y 61.029 triángulos. La escena completa del Puerto conserva 264 mallas y aproximadamente 3,76 millones de triángulos, incluidas las instancias de la ciudad. Estos recuentos no son una medición de rendimiento GPU.

## Revisión visual

Los archivos `horno-conjunto.png`, `horno-interior.png`, `horno-acceso.png`, `horno-corte.png` y `horno-entorno.png` proceden de las mallas y materiales Three.js exportados por `research/validate_port_v22.mjs`. El render CPU conserva geometría, normales, colores, texturas y cámaras; la iluminación y la respuesta de materiales son una aproximación para inspección y no una captura WebGL.

La revisión ha corregido la plataforma de trabajo de hormigón, el apoyo de las ménsulas, el paso de la escalera por la losa, la unión del pabellón con el portal NE, la cabina azul documentada del plano inclinado, la cámara que muestra la pasarela en Y y el contraste de las cajas interiores. La figura 11 de Besó confirma que las cajas afloran en el revestimiento; no se eliminan por una preferencia estética.

El alzado se genera con el perfil, la cimentación, las plataformas, los conductos, el plano inclinado y los puentes del mismo modelo. Las alturas permanecen métricas; un pequeño desplazamiento oblicuo permite distinguir las dos purgas. En pantallas amplias se muestra también la planta cartográfica. Se verifican los veinte objetivos de selección y la ausencia de solapes entre sus números.

## Navegador y límites de la comprobación

El navegador de revisión no dispone de WebGL. Se ha comprobado su modo documental 2D y el funcionamiento de la interfaz. No se afirma una inspección del render GPU ni una medición de fluidez en un teléfono.

Después de comprobar las funciones descritas en `browser-review.json`, la política de autoridad de URL del navegador bloqueó la última recarga. No se intentó eludirla mediante CDP, otra superficie o una ruta alternativa. El último ajuste de márgenes del alzado queda cubierto por los controles Canvas y sus imágenes. La publicación y su estado se tramitan por las herramientas de Sites.

## Alcance documental

Las magnitudes nominales del BOE se distinguen de las cotas del alzado arquitectónico, cuyo origen vertical no se equipara a una cota topográfica de la calle. Perfil fino, espesores, fachadas, apoyos y alturas no medidas del pabellón son interpretativos. La cimentación permanece parcialmente enterrada. Las vistas elevadas son observaciones virtuales y no describen la apertura al público de las plataformas.

La ortofoto PNOA se consultó el 20 de noviembre de 2026; esa fecha no se presenta como la fecha del vuelo. Las fotografías históricas y de la rehabilitación se utilizan como referencia; no se incorporan como texturas.

## Reproducir

```bash
node --experimental-loader ./research/validate_loader.mjs research/validation-v22/build-horno-plan.mjs
node --experimental-loader ./research/validate_loader.mjs research/validation-v22/validate_horno_model.mjs
node --experimental-loader ./research/validate_loader.mjs research/validation-v22/validate_horno_context.mjs
node --experimental-loader ./research/validate_loader.mjs research/validation-v22/validate_horno_maps.mjs
node --experimental-loader ./research/validate_loader.mjs research/validation-v22/validate_visit_controllers.mjs
python research/validation-v22/validate_static_assets.py
node --experimental-loader ./research/validate_loader.mjs research/validate_port_v22.mjs --export
blender -b -t 4 --python research/validation-v22/render_horno.py -- --scene horno-conjunto --samples 48
```

Las exportaciones comprimidas de geometría y los borradores son reproducibles y se excluyen de Git. Los informes, los renders revisados y las referencias cartográficas necesarias quedan en el proyecto.
