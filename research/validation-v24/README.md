# V24 · Verificación del Museo Industrial y de la Memoria Obrera

Revisión: 20 de noviembre de 2026. Esta iteración desarrolla la Nave de Efectos y Repuestos y su entorno dentro de **SAGUNTUM · Atlas vivo**. Conserva los 31 lugares, los seis ámbitos regionales y las visitas anteriores; el Museo Industrial es la decimoctava visita detallada. La visita `museo-industrial` y sus archivos permanecen separados de `museo`, correspondiente a la Casa del Mestre Penya y el Museo Arqueológico.

## Resultados de las comprobaciones

| Área | Resultado real | Evidencia |
|---|---|---|
| Documentación | 20 paradas, 40 hechos, 18 fuentes, 5 ámbitos y 10 hitos; diez controles documentales y cinco controles de cierre superados | `documentary-check-v24.json` |
| Arquitectura | 105 comprobaciones superadas: huecos, niveles, cerchas, escaleras, sección, recursos y focos | `museo-industrial-model-qa.json` |
| Procedencia del contexto | 12 comprobaciones superadas; coordenadas catastrales, cobertura y atribución de geometría | `museo-industrial-context-source-qa.json` |
| Modelo de contexto | 20 comprobaciones superadas: edificios, patios, terreno, vegetación, cámaras y recursos | `museo-industrial-context-model-qa.json` |
| Puerto integrado | 757 comprobaciones y 126 configuraciones de cámara superadas; ningún error | `integrated-scene-qa.json` |
| Plano Canvas | 96 casos superados, con dos temas, dos modos de lectura, cuatro tamaños y seis selecciones | `museo-industrial-map-qa.json` |
| Visitas y progreso | 46 controles sobre las 18 visitas superados; fuentes, navegación, progreso y secciones independientes | `visit-controller-results.json` |
| Distribución | 480 comprobaciones superadas: sintaxis, importaciones, JSON, recursos, referencias e integración | `static-assets-qa.json` |

La última integración registrada terminó a las 22:13:31 UTC. Al cerrar estos informes, sus 22 archivos de entrada conservaban los mismos hashes. Las tres últimas comprobaciones —plano, controladores y distribución— se ejecutaron secuencialmente y terminaron con código de salida 0. No modifican los recursos de producción.

La distribución comprobada contiene 205 archivos, 88 módulos JavaScript, 100 JSON y 172 importaciones locales. Se verificaron las 66 solicitudes iniciales, las 16 diferidas y 127 identificadores HTML. Estas cifras describen el alcance de las comprobaciones, no una evaluación del rendimiento de descarga.

## Qué comprueba la integración

Se ejecuta el constructor real del Puerto y los encuadres de la aplicación con una adaptación del cargador de texturas para Node. Las 126 configuraciones comprenden las veinte paradas y una vista general en sección, a 1363 × 936, 390 × 844 y 844 × 390, cada una en modo normal y cercano. Se comprueban coordenadas finitas, altura sobre el terreno final, líneas de visión, encuadres y proximidad a geometría sólida. Las comprobaciones de obstrucción del contexto tienen excepciones explícitas para las vistas de conjunto, memoria y entorno; no son una garantía universal de visibilidad de todos los elementos desde cualquier órbita.

La prueba ejecuta también el manejador de capas de la aplicación: ocultar y restaurar Vegetación afecta tanto a los árboles detallados del museo como a los de la ciudad y conserva la arquitectura. Se comprueba la exclusión de duplicados catastrales y la conservación de los nueve lugares patrimoniales industriales.

El edificio aporta 54 mallas y 35.106 triángulos; su contexto, 16 mallas y 54.848 triángulos. El Puerto completo, en esta instancia de prueba, suma 378 mallas y 3.997.574 triángulos. Son medidas de complejidad geométrica, no de FPS ni de memoria GPU en un dispositivo.

## Entorno y fidelidad documental

El contexto modela 69 partes catastrales de 18 parcelas vecinas, 20 fragmentos viarios y aproximadamente 25.288 m² de pavimentos. Incluye 30 árboles, ocho farolas y cinco pasos de peatones registrados a partir de la referencia visual. Dos partes catastrales que contradicen el terreno abierto observado en la ortofoto permanecen documentadas, pero no se extruyen. Los entornos ya desarrollados del Alto Horno y Talleres Generales mantienen su atribución de geometría.

La desviación numérica del ajuste de pavimentos es inferior a 0,00003 m en la prueba. Esta cifra expresa la coincidencia de dos representaciones numéricas del mismo terreno, no precisión topográfica real.

La guía conserva la diferencia entre dimensiones nominales publicadas y envolvente cartográfica. También mantiene la discrepancia de 5/6 m para la plataforma o forjado sur: el datum no está demostrado y su reconciliación geométrica es interpretativa. Los muebles expositivos esquemáticos no representan el inventario o la posición exacta de la exposición actual.

El control **Abrir sección** retira la cubierta y también los forjados superiores, sus barandillas, escaleras y muebles; permite leer el nivel inferior, la vía y la estructura sin dejar objetos flotantes. Las vistas interiores normales conservan sus techos y niveles. La guía declara esta operación como recurso digital.

`documentary-check-v24.json` conserva el hash y la fecha de su revisión anterior; `finalReview` añade el hash actual, la revisión del registro geométrico, la cota sur y el comportamiento de la sección. Así se distingue la trazabilidad histórica del estado que se publica.

## Revisión visual y límites

La revisión de seis vistas —conjunto, fachada, eje central, primera galería, segunda galería y corte general— se documenta por separado en `visual-review.json`, a cargo del agente principal. Los renders parten de las mallas, texturas, materiales y focos exportados por la integración final. Este informe no sustituye esa revisión ni atribuye una aprobación visual a las pruebas numéricas.

Los PNG de inspección se generan con render CPU e iluminación aproximada. **No son capturas de la aplicación ni verifican el render WebGL.** Las pruebas Canvas utilizan fuentes del entorno que pueden diferir de las tipografías cargadas por un navegador. El adaptador de los controladores comprueba estados y contratos, sin demostrar el foco real del navegador, su composición visual o gestos físicos de un móvil.

Según `browser-limitations.json`, siguen sin verificarse aquí la composición final de WebGL, el rendimiento GPU, la memoria gráfica y el comportamiento completo en navegador. La infraestructura de revisión anterior no ofrecía WebGL y presentó un rechazo de autoridad de URL; no se observó su recuperación ni se intentó eludir el bloqueo. La publicación se verifica aparte mediante el resultado nativo de Sites.

## Reproducir comprobaciones

Desde la raíz del repositorio, con las dependencias Canvas del entorno:

```sh
node --experimental-loader ./research/validate_loader.mjs research/validation-v24/validate_museo_industrial_model.mjs
node --experimental-loader ./research/validate_loader.mjs research/validation-v24/validate_museo_industrial_context.mjs
node --experimental-loader ./research/validate_loader.mjs research/validate_port_v24.mjs --export
node research/validation-v24/validate_museo_industrial_maps.mjs
node research/validation-v24/validate_visit_controllers.mjs
python research/validation-v24/validate_static_assets.py
```

`build-museo-industrial-guide.py` reconstruye la guía inicial con coordenadas provisionales. No debe ejecutarse después de registrar los focos sin ejecutar a continuación `build-museo-industrial-plan.mjs` y repetir las comprobaciones pertinentes. Los exportados geométricos comprimidos y registros de ejecución son cachés reproducibles; los informes y referencias de investigación se conservan en el repositorio y no se incluyen en la distribución web.
