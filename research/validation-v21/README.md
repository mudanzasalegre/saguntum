# Verificación V21 · Necrópolis judía e hipogeos

La revisión utiliza la escena regional de producción, sus mallas, texturas, focos y controladores. Las comprobaciones geométricas se completan con inspección de renders CPU y navegación real de la interfaz. No constituyen una validación arqueológica métrica ni una medición de rendimiento gráfico WebGL.

## Resultado de cierre

Revisión del 20 de noviembre de 2026, con el modelo y el contexto definitivos:

| Comprobación | Resultado |
| --- | --- |
| Escena regional integrada | 1.105 comprobaciones correctas; 168 configuraciones de cámara; cero incidencias |
| Geometría específica | 51 comprobaciones correctas |
| Contexto paisajístico | 14 comprobaciones correctas y registro geográfico válido |
| Documentación y selección de planos | 36 comprobaciones correctas |
| Controladores de las 15 visitas | 39 comprobaciones correctas |
| Distribución, importaciones y recursos locales | 429 comprobaciones correctas |

El conjunto nuevo integrado tiene 52 mallas y 113.132 triángulos: 41 mallas y 75.261 triángulos en los dos núcleos, y 11 mallas y 37.871 triángulos de paisaje. Estas cifras no incluyen el resto del atlas. El código del núcleo comprobado tiene SHA-256 `31d10d9fed85cf07d7f9663edf872b1f223b20307ea4c93760ea3af4c6ceda88`.

## Documentación y registro

La visita tiene veinte paradas repartidas entre dos sectores independientes, veintiún hechos con referencias, once fuentes, ocho hitos cronológicos y cinco lecturas temáticas. El registro de cada punto se genera desde el foco correspondiente del modelo. La planta funeraria y las cámaras son tipológicas; las cotas y los espesores no se presentan como un levantamiento.

`necropolis-documentation-qa.json` comprueba referencias, cronología, pertenencia a regiones, coincidencia de coordenadas y selección de planos. Los mapas generales presentan dos marcadores; los locales, diez por sector. Se revisan anchuras de 740, 390 y 303 px, con los TTF reales del atlas. Los polígonos de tumbas y cámaras siguen siendo seleccionables dentro de sus contornos mayores. El título de los hipogeos cabe a 303 px sin alcanzar la brújula.

## Geometría y paisaje

`necropolis-model-qa.json` verifica las doce fosas representativas, las losas y rellenos en Actual, las tres entradas rupestres, cámaras, hornacina, cubierta y caras de corte. Los rayos comprueban huecos reales y superficies de cierre. El perfil de dos niveles es analítico y se abre sólo en Corte. Los grupos de terreno y arquitectura mantienen recursos propios.

`necropolis-context-geography-qa.json` y `necropolis-context-model-qa.json` comprueban los seis fragmentos de pavimento, dos contenciones cartográficas y vegetación. Los edificios del castillo y del teatro conservan su propietario. Los sectores se encuentran a unos 194 m en la cartografía del atlas y no forman una excavación continua. El contexto sigue el terreno final sin introducir una gran plataforma horizontal. El acceso de los hipogeos se nivela sólo delante de las bocas; el resto recupera la pendiente. La comprobación integrada de los 449 vértices de su perímetro registra un error máximo de 0,0000084 m respecto al muestreo regional. Esta cifra mide continuidad informática entre mallas, no precisión arqueológica.

## Escena integrada y cámaras

`../validate_sagunto_v21.mjs` ejecuta el constructor regional y las funciones de cámara de `app.js`; sólo sustituye la carga de texturas para poder funcionar fuera del navegador. Verifica carga diferida, recuperación tras fallo de ortofoto, liberación de recursos, ausencia de duplicados y geometría finita. Comprueba las dos ventanas permanentes de terreno, sus dimensiones locales y el estado independiente de ambos sectores.

La matriz incluye las veinte paradas, los dos cortes generales, las dos vistas históricas con cubiertas abiertas y cuatro observaciones anteriores de Circo, Domus y Pòrtic. Cada caso se comprueba en escritorio 1363×936, teléfono vertical 390×844 y teléfono horizontal 844×390, con observación general y cercana: 168 configuraciones en total. Se comprueban encuadres, separación del suelo, obstáculos del terreno y edificios y el espacio inmediato de las cámaras interiores.

La vista histórica conserva la fábrica y el terreno de base; oculta los acondicionamientos contemporáneos del sector activo. El otro sector mantiene su estado Actual. Las hipótesis y las cubiertas se controlan por separado. El periodo de los hipogeos se identifica como no determinado y no hereda los siglos XIV–XV del cementerio.

## Interfaz real

En Chrome se comprueban la portada de 31 lugares y seis ámbitos, el acceso desde el catálogo, el plano general de dos sectores, la selección de una cámara, el cambio al cementerio, las diez paradas de cada plano local, Cronología y Fuentes. La etiqueta «Cronología no determinada» sustituye al antiguo texto ambiguo «Cronología mixta» para los periodos sin atribución. El cuaderno conserva el progreso propio y las conexiones con Judería, Castillo y Teatro.

`necropolis-plan-ui.jpg` es una captura real del plano integrado en la vista previa. Los controles de geometría se verifican fuera del navegador: el navegador disponible informa que no dispone de WebGL y presenta el modo documental. No se afirma una prueba visual de GPU ni una tasa de fotogramas.

## Imágenes de geometría

`render_necropolis.py` reproduce las mallas, UV, normales, colores de vértice y materiales exportados desde Three.js, junto con el terreno y los edificios del entorno. Usa Blender/Cycles CPU e iluminación de inspección aproximada. La compilación disponible carece de OpenImageDenoise, por lo que se usa muestreo nativo sin eliminación de ruido posterior. Estas imágenes no son capturas de la aplicación ni imágenes generadas por IA.

Se inspeccionan el cementerio, las losas, el corte de tumbas, el perfil de niveles, la vista histórica, las entradas rupestres, la cámara, el corte de roca y la puerta contemporánea. Las cachés de geometría y los registros de render se excluyen del repositorio. Los scripts, datos, informes y imágenes finales quedan junto al proyecto.

## Reproducción

```sh
python research/validation-v21/prepare_necropolis_context.py
node --experimental-loader ./research/validate_loader.mjs research/validation-v21/build-necropolis-plan.mjs
node --experimental-loader ./research/validate_loader.mjs research/validation-v21/validate_necropolis_model.mjs
node --experimental-loader ./research/validate_loader.mjs research/validation-v21/validate_necropolis_context.mjs
node --experimental-loader ./research/validate_loader.mjs research/validation-v21/validate_necropolis_documentation.mjs
node research/validation-v21/validate_visit_controllers.mjs
node --experimental-loader ./research/validate_loader.mjs research/validate_sagunto_v21.mjs --export
blender -b -t 3 --python research/validation-v21/render_necropolis.py -- --scene necro-conjunto --full --samples 128
python research/validation-v21/validate_static_assets.py
```

La investigación y los límites de fidelidad se documentan en [historia y fuentes](../necropolis-history.md), [criterios del modelo](../necropolis-model.md) y [entorno](../necropolis-context.md).
