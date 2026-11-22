# V23 · Verificación de Talleres Generales

Fecha: 20 de noviembre de 2026. Esta ampliación mantiene la identidad del atlas, los 31 lugares y seis ámbitos territoriales. Talleres añade la decimoséptima visita detallada.

## Controles ejecutados

| Área | Resultado | Evidencia |
|---|---|---|
| Documentación | 20 paradas, 40 hechos, 17 fuentes, 10 hitos; referencias y discrepancias verificadas | `documentary-check-v23.json`, `source-image-manifest.json` |
| Modelo arquitectónico | 112 comprobaciones superadas: huecos físicos, continuidad interior, cámaras, cubierta y recursos | `talleres-model-qa.json` |
| Procedencia del contexto | 10 comprobaciones superadas; huellas, ejes, PNOA y propietarios de geometría | `talleres-context-source-qa.json` |
| Contexto construido | 19 comprobaciones superadas; adaptación al terreno, edificios, árboles y liberación de recursos | `talleres-context-model-qa.json` |
| Puerto integrado | 768 comprobaciones, 126 configuraciones de cámara, sin errores y con entradas estables durante la prueba | `integrated-scene-qa.json` |
| Plano e interacción | 64 casos de tamaño, tema y selección; veinte destinos únicos, selección correcta y números separados | `talleres-map-qa.json` |
| Guías y progreso | 44 controles sobre las 17 visitas; recorrido, fuentes, cronología, cubiertas y progreso independiente | `visit-controller-results.json` |
| Distribución | 463 controles: 85 módulos JS, 97 JSON, 165 importaciones locales y todos los recursos solicitados | `static-assets-qa.json` |

La escena integrada utiliza el constructor real del Puerto extraído de la aplicación. Reemplaza únicamente el cargador de textura de terreno por una adaptación para Node; no sustituye la geometría patrimonial, las calles, la ciudad ni los encuadres. Las cámaras se comprueban a 1363 × 936, 390 × 844 y 844 × 390, en vista normal y cercana. Las comprobaciones de entrada/salida de la capa Vegetación ejecutan el manejador real de la aplicación.

La nave tiene 55 mallas y 175.852 triángulos; su contexto, 17 mallas y 77.711 triángulos. El Puerto completo suma 322 mallas y 3.934.086 triángulos en esta instancia. Estas cifras son complejidad de la geometría, no una medida de fluidez en un dispositivo.

## Revisión visual

Los PNG de conjunto, interior, fachada y cubierta abierta se producen a partir de las mallas, normales, colores, texturas y focos exportados por `research/validate_port_v23.mjs`. Se revisan la silueta de las cuatro cubiertas, los portones, la continuidad interior, el sistema de cerchas y la relación del recinto con sus calles y vecinos. La cara inferior clara del monitor conserva la tapa opaca; la fotografía no permite atribuirle un material translúcido específico. El anexo mantiene un volumen proporcional sin añadir un forjado no acreditado.

Los renders CPU son inspecciones de geometría con iluminación aproximada. La exposición del interior se compensa para observar un espacio cerrado. No son capturas de la aplicación ni deben utilizarse como prueba de iluminación fotométrica. El plano Canvas también se revisa en tema claro y oscuro; la prueba no reproduce la carga de fuentes tipográficas del navegador.

## Límites de esta comprobación

La infraestructura del navegador bloqueó la recarga por autoridad de URL en la revisión anterior, y no se ha observado su recuperación. No se reintenta ni se elude esa restricción con otro navegador, CDP o una ruta alternativa. V23 no atribuye a esta sesión una nueva revisión de interfaz en navegador. El navegador de revisión observado anteriormente tampoco ofrecía WebGL. Véase `browser-limitations.json`.

Quedan sin verificar aquí la composición final del render WebGL, el rendimiento GPU y los gestos de un dispositivo móvil real. La publicación se verifica mediante el estado de la versión y del despliegue nativo de Sites.

Las medidas no levantadas, las alturas, los materiales de cada pilar y los detalles menores siguen siendo interpretativos. Los errores numéricos de ajuste al terreno no equivalen a precisión topográfica.

## Reproducir

Desde la raíz del repositorio, con las dependencias de Canvas del entorno:

```sh
node --experimental-loader ./research/validate_loader.mjs research/validation-v23/build-talleres-plan.mjs
node --experimental-loader ./research/validate_loader.mjs research/validation-v23/validate_talleres_model.mjs
node --experimental-loader ./research/validate_loader.mjs research/validation-v23/validate_talleres_context.mjs
node --experimental-loader ./research/validate_loader.mjs research/validate_port_v23.mjs --export
node research/validation-v23/validate_talleres_maps.mjs
node research/validation-v23/validate_visit_controllers.mjs
python research/validation-v23/validate_static_assets.py
blender -b -t 4 --python research/validation-v23/render_talleres.py -- --scene talleres-conjunto --samples 48
blender -b -t 4 --python research/validation-v23/render_talleres.py -- --scene talleres-interior --draft --samples 24
```

Las exportaciones geométricas comprimidas y los registros de ejecución son cachés reproducibles y no se publican en la distribución. Los informes, código de verificación y las imágenes de inspección quedan en el repositorio.
