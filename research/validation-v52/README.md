# SAGUNTUM v52 · Validación de Plaza del Fórum

La ampliación incorpora `forum-plaza` como lugar **12**, inmediatamente después de la Puerta del Circo. El catálogo completo conserva sus identificadores y queda en **33 visitas: Sagunto 1–17, Puerto 18–26 y costa/paisajes 27–33**. La portada y la marca general de SAGUNTUM se conservan.

## Qué se ha verificado

### Catálogo, guía e integración

`research/test-atlas-order.mjs` carga los inventarios reales mediante los dos caminos independientes del Atlas y del Simulador. Comprueba las 33 entradas, números consecutivos sin duplicados, grupos territoriales, enlaces estables y orden determinista de futuras ampliaciones. Los números de las fuentes y de las paradas interiores no se renumeran.

La visita tiene diez paradas y las lecturas `romana`, `huellas`, `parque` y `ciudad`. Presenta el parque actual y la lectura de sus épocas, sin ofrecer una restitución completa del supuesto foro romano ni un corte temporal vacío. La ficha, el plano, las fuentes y la cronología siguen disponibles en la vista sin WebGL.

### Terreno y excavación permanente

`research/test-polygon-excavation.mjs` prueba la sustracción de un contorno cóncavo sobre una malla de sólo dos triángulos, en ambos sentidos del anillo y con una transformación de escena. Comprueba el área retirada, la conservación del entrante ocupado por edificios, las UV de la ortofoto, el caso rectangular anterior y la correspondencia entre geometría y máscaras del Simulador.

La parcela de Fórum se abre mediante **diez triángulos** derivados de su contorno, sin sustituirla por un rectángulo. Las ventanas temporales rectangulares de las visitas anteriores conservan su camino de ejecución.

La inspección visual de las mallas detectó dos encuentros abiertos entre el paseo inferior y las calles de Ordóñez y Remedio. Se cerraron con paños modernos de contención sobre el límite real de la parcela, desde el subsuelo hasta tres centímetros por debajo de la rasante. La corrección conserva las medianeras, la galería y sus accesos.

Se distinguen tres niveles de cálculo:

- `ground.terrainHeight`: una tapa preparatoria a la cota de calle dentro del parque, usada antes de retirar la parcela. Evita que la interpolación gruesa del terreno arrastre la acera hacia el nivel arqueológico. El Simulador limita esta preparación al contorno más tres metros.
- `ground.surfaceHeight`: los niveles visibles propios del parque, incluida la diferencia documentada de 2,50 m y los perfiles interpretados de accesos. También sirve al control de altura de la cámara del Atlas.
- `publicDeck`: las caras públicas reales del modelo, que sustentan rampas, peldaños y galería elevada en el Simulador.

`forum-height-alternatives.json` compara las tres preparaciones del terreno sobre la malla del Atlas. La diferencia RMS en el borde respecto de la cota de calle pasa de **0,6645 m** al introducir directamente los niveles visibles a **0,1336 m** con la tapa preparatoria. Esta es una comprobación de continuidad de la representación; no sustituye una medición topográfica del parque.

### Superficies y contexto urbano

`forum-surface-qa.json` registra trece superficies y cuatro rutas sobre una parcela OSM de aproximadamente **1.532,50 m²**. El ámbito del proyecto municipal publicado, **1.608,44 m²**, corresponde a otro alcance y se mantiene separado. Los restos, plantaciones y pavimentos se preparan como polígonos disjuntos. Sus triángulos se calculan con la triangulación restringida de Shapely para conservar correctamente los agujeros que tocan los límites de las escaleras.

`forum-context-geography-qa.json` comprueba pavimentos, patios, edificios y parcelas con propietario previo. El contexto añade 63 partes catastrales y conserva 32 partes de entornos ya detallados. La corrección del antiguo pavimento del Circo se limita al solape cartográfico documentado en `forum-previous-overlap.json`; no modifica su visita ni su arqueología. `forum-blank-facade-qa.json` verifica la supresión de ventanas automáticas en medianeras ciegas.

### Cámaras, plano y conservación de visitas anteriores

`export-forum-cameras.mjs` ejecuta la función `preset()` del `app.js` actual, sin copiar su fórmula a una implementación paralela. Comprueba **22 encuadres**: la vista general y las diez paradas, a 1440 × 900 y 390 × 844, con el espacio ocupado por el panel abierto. Los encuadres que ajustan límites quedan dentro del área útil; los demás conservan sus ojos de cámara previstos. La separación mínima comprobada respecto del suelo visible es **4,45 m**.

Las cotas de referencia de las cámaras se guardan respecto del MDT bruto, que es la referencia que usa el adaptador territorial. La prueba de registro aplica la transformación UTM real y una diferencia de elevación conocida. `forum-integration-report.json` conserva el resultado y los hashes de las otras 32 visitas: la exportación modifica únicamente la clave `forum-plaza` en `visit-cameras.json`, `atlas-frames.json` y `visit-stops.json`.

El mismo comando exporta el plano de la geometría vigente. Los mapas de escritorio, teléfono y lectura de épocas contienen las diez paradas, con sus puntos seleccionables comprobados. Las imágenes `forum-map-desktop.png`, `forum-map-phone.png` y `forum-map-epochs.png` documentan ese resultado.

### Recorrido del Simulador y máscaras gráficas

`test-forum-simulator.mjs` construye el modelo mediante el adaptador real del Simulador. Valida doce puntos de las cuatro rutas y seis de la galería elevada, con un radio libre de 32 cm. Comprueba la altura del pavimento, las barreras de paredes y barandillas, la conservación del entrante de edificios y que cambiar entre las diez paradas no cierre la excavación permanente. El error máximo observado entre la altura prevista y la cuadrícula de caras públicas es **9,5 mm**. El informe completo está en `forum-simulator-report.json`.

Las hojas del jardín vertical emplean los materiales `leaf`, `leafLight`, `leafDark` y `leafRed`. El muestreador de obstáculos las trata como follaje, conservando como barreras los muros, armazones y barandillas. Esto evita bloquear artificialmente el paso de la galería.

La prueba de excavación también construye el grafo real de Three.js r180 y genera WGSL mediante su `NodeBuilder`. Comprueba que el bucle de triángulos depende de la cantidad activa; no se ejecutan 64 pruebas de triángulo por fragmento cuando no hay un parque abierto.

## Comandos reproducibles

Requieren Node.js 24 o posterior para usar `registerHooks`. Las pruebas utilizan el Three.js r180 distribuido con el sitio. Para construir texturas y mapas de validación se necesita `@napi-rs/canvas`; `forum-scene.mjs` lo busca mediante `CODEX_PRIMARY_RUNTIME_NODE_MODULES` o los módulos locales. No se instala otra versión de Three.js.

Desde la raíz del proyecto:

```sh
node research/test-atlas-order.mjs
node research/test-polygon-excavation.mjs
node research/validation-v52/test-forum-simulator.mjs
node research/validation-v52/export-forum-cameras.mjs --check
```

Después de cambiar geometría, focos o contenido de la guía, regenerar primero los recursos de esta visita:

```sh
node research/validation-v52/export-forum-cameras.mjs
```

El worker se genera con esbuild 0.25.12. Se puede instalar en un directorio de herramientas temporal, sin modificar el paquete de la aplicación:

```sh
npm install --prefix /tmp/saguntum-v52-buildtools --no-save --package-lock=false esbuild@0.25.12
NODE_PATH=/tmp/saguntum-v52-buildtools/node_modules node research/build-territory-heritage.mjs
```

Los scripts `prepare_forum_context.py` y `prepare_forum_surfaces.py` preparan los datos de cartografía y geometría y escriben recursos del proyecto; requieren Shapely con triangulación restringida. No forman parte de la carga del sitio. Los archivos de registro PNOA y las notas de investigación documentan la procedencia de las imágenes y las decisiones interpretativas.

Los cinco renders de inspección se generan a partir de los buffers, matrices, colores, UV y texturas de la escena real, incluyendo el contexto urbano y el terreno excavado:

```sh
node research/validation-v52/export-forum-geometry.mjs --out /tmp/forum-geometry.json.gz
blender -b -t 8 --python research/validation-v52/render_forum.py -- --input /tmp/forum-geometry.json.gz --output /tmp/forum-renders
```

`render-inspection.json` identifica los archivos fuente y las cinco imágenes finales con SHA-256. La iluminación usa Blender Cycles por CPU; estas imágenes documentan la inspección de la geometría y no se presentan como capturas del navegador.

Antes de empaquetar, ejecutar también:

```sh
python research/validation-v52/compact-distribution-json.py
```

Sites limita el TAR expandido a 256 MiB. La compactación elimina exclusivamente espacios y saltos de línea fuera de las cadenas JSON en los recursos de Fórum; conserva claves, cadenas y literales numéricos. `distribution-json-equivalence.json` registra los hashes anteriores y posteriores y comprueba la igualdad de todos los valores analizados. Los hashes JSON de `render-inspection.json` corresponden a los archivos antes de esta compactación: sus geometrías y contenidos son exactamente equivalentes a los publicados. Los scripts, texturas y cinco imágenes no cambian en este paso.

## Alcance de las comprobaciones

La comprobación del navegador en esta sesión pudo abrir el catálogo, las rutas, las paradas y la documentación. Su aceleración gráfica devolvió WebGL deshabilitado, por lo que se comprobó la vista de documentación/plano. Las pruebas de geometría, proyección, máscaras y generación WGSL anteriores son de CPU. **No constituyen una prueba de renderizado WebGL/WebGPU en ese navegador.** Los renders de inspección y la verificación posterior de publicación se registran por separado.

La reconstrucción conserva la diferencia entre hechos documentados, registro cartográfico e interpretación. Los perfiles de rampas, los detalles de fábricas, la vegetación, los alzados y el trazo didáctico de la cloaca no proceden de un levantamiento topográfico de precisión.
