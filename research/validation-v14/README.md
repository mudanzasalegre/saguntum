# V14 · Casa dels Berenguer, muro de Diana y entorno

Revisión del 19 de noviembre de 2026. Se mantiene **SAGUNTUM · Atlas vivo**, el título global **SAGUNTUM · Sagunto y Puerto de Sagunto**, la entrada general y el catálogo de 31 lugares en seis ámbitos.

## Resultado y alcance

La casa dispone de una visita de 18 paradas en cinco ámbitos y cinco lecturas temáticas, con 47 hechos vinculados a 24 fuentes y una cronología de 15 acontecimientos. Diana utiliza cinco de esas paradas y seis acontecimientos en una visita propia. Comparten el modelo y su plano; guardan el progreso por separado. Las seis visitas detalladas anteriores conservan sus datos y controles.

El modelo representa portada, balcones, desván, cubiertas de teja, dos patios a distinta altura, arcadas, galería contemporánea, escaleras, aljibe en sección y anexo occidental. Diana distingue grandes bloques antiguos, fábricas posteriores y el espacio público acondicionado. Su vista histórica mantiene el terreno actual y permite activar una terraza interpretativa, sin añadir un templo completo.

El contexto nuevo incluye 23 partes de nueve parcelas: doce alturas proceden del MDS normalizado del IGN y once del número de plantas de Catastro. Cuatro fragmentos de calles y unos 342,7 m² de pavimento se adaptan a la malla final del terreno. Tres partes que antes dibujaban los contextos de Santa María y la judería pasan al núcleo Berenguer, evitando edificios duplicados.

## Evidencia de validación

| Informe | Resultado | Qué verifica |
| --- | --- | --- |
| `integrated-scene-qa.json` | 508 controles; sin errores | Construcción real de la región, propiedad única de Diana, exclusiones de ciudad, carga diferida, secciones, restauración de estado, geometría finita y cámaras. |
| `berenguer-model-qa.json` | 23 controles | Huecos reales de portada y arcadas, continuidad del muro, apertura hasta el suelo del aljibe, restauración de materiales y plano. |
| `berenguer-context-qa.json` | 151 controles | Plantas y alturas conservadas, transferencia de edificios, pavimentos sobre el terreno, recursos y compatibilidad de los contextos anteriores. |
| `berenguer-visit-results.json` | 22 controles | Fuentes, coordenadas, capas, cronologías, enlaces relacionados, progreso independiente y compatibilidad de los ocho cuadernos de visita. |
| `static-assets-qa.json` | 315 controles; sin errores | 145 archivos de distribución, 58 módulos JavaScript, 107 importaciones locales, 70 JSON, 36 peticiones iniciales, 16 diferidas y 114 identificadores HTML. |

La comprobación integrada registra 108 observaciones: 18 paradas, tres relaciones de aspecto (1363 × 936, 390 × 844 y 844 × 390) y dos distancias. No quedan obstáculos en los rayos centrales ensayados. Los encuadres que se ajustan a límites se comprueban contra esos límites; los interiores conservan una posición física fija para que una pantalla estrecha no desplace la cámara dentro de un muro. Esta prueba geométrica no equivale a una revisión visual completa de una interfaz móvil ni garantiza que toda la arquitectura quepa en los encuadres interiores.

Los resultados guardan las huellas de sus entradas. La revisión visual detectó paredes laterales en primer plano en el patio pese a que el rayo central estaba libre. Se corrigieron las posiciones interiores y se repitieron la comprobación integrada y los renders. La comprobación estática final y la revisión del navegador incluyen también la escala del plano y el singular de «ámbito».

## Navegador y renders

La revisión del navegador verificó la portada genérica, el catálogo de 31 lugares, el inicio de la visita, la apertura del plano de 18 paradas, una ficha de fuente, la cronología de Diana, el salto desde un acontecimiento a su parada y la navegación entre ambas visitas con progreso independiente. La captura `berenguer-plan-browser.jpg` muestra la interfaz real de la previsualización.

El navegador disponible no proporciona WebGL. Se verificó su alternativa 2D, con los controles tridimensionales deshabilitados. **No se ha medido rendimiento gráfico, FPS ni interacción 3D en un dispositivo móvil.** La ejecución de Three.js sin renderizador, las pruebas geométricas y los renders CPU complementan esa limitación; no se presentan como una prueba WebGL.

Las imágenes PNG de composición se producen en Blender a partir de las posiciones, normales, UV, colores, texturas procedurales y estados de sección de los objetos reales de Three.js. No son imágenes generadas a partir de una descripción. La iluminación de inspección CPU difiere del navegador y no reproduce exactamente sus reflejos ni su tratamiento de color.

## Límites históricos y métricos

- La cartografía fija el registro de plantas y entorno; fotografías y planos ayudan a representar alzados. Los interiores, cotas menores, desgaste y carpinterías de contexto son interpretativos. No es un levantamiento fotogramétrico.
- La estancia abovedada se explica como aljibe y posible micvé. Su función ritual no se presenta como demostrada y la sección virtual no certifica acceso físico actual.
- La denominación «templo de Diana» es tradicional. Función, datación e identificación arqueológica permanecen discutidas. La plataforma opcional se etiqueta como hipótesis.
- El anexo representa el límite documental de la primera fase de 2025. El expediente administrativo de 2026 no prueba que una segunda fase constructiva haya concluido.
- Los 70 bloques del modelo son una decisión geométrica de representación, no un inventario arqueológico piedra a piedra.

Documentación: [historia y fuentes](../berenguer-history.md), [modelo](../berenguer-model.md) y [entorno](../berenguer-context.md).

## Reproducción

Desde la raíz del repositorio:

```sh
python research/validation-v14/validate_static_assets.py
node research/validation-v14/validate_berenguer_visit.mjs
node --experimental-loader ./research/validate_loader.mjs research/validation-v14/validate-berenguer-model.mjs
node --experimental-loader ./research/validate_loader.mjs research/validation-v14/validate_berenguer_context.mjs
node --experimental-loader ./research/validate_loader.mjs research/validate_sagunto_v14.mjs --export
blender -b --threads 6 --python research/validation-v14/render_berenguer.py -- --scene berenguer-patio-arcos --full --samples 48
```

Los módulos de geometría usan la versión de Three.js incluida en `dist/vendor`; el cargador de validación resuelve sus importaciones. La exportación de las texturas Canvas requiere `@napi-rs/canvas` del entorno. Los ficheros `*-geometry.json.gz` son cachés reproducibles, excluidas de Git; los scripts, informes, texturas de inspección e imágenes sí se conservan.
