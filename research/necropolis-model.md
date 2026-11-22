# Necrópolis judía e hipogeos · modelo de la iteración 21

El modelo detallado vive en `dist/js/necropolis.js`. Se integra en **SAGUNTUM · Atlas vivo** y conserva las dos referencias geográficas del atlas: el pequeño recinto del cementerio junto al castillo y las cavidades rupestres al este, próximas al teatro. Las fuentes, sus límites y la cronología se desarrollan en [necropolis-history.md](necropolis-history.md).

## Criterio de representación

La huella del recinto del cementerio procede de OSM way 203325111. Su superficie calculada en la proyección del atlas es de aproximadamente 110,69 m²; no se presenta como la extensión total de la necrópolis medieval. Los dos puntos de visita están separados unos 194 m en línea recta. La escena no excava el terreno comprendido entre ellos ni representa esa distancia como un recorrido peatonal.

Dentro del recinto se construyen doce sepulturas **representativas**, sin identificación individual de tumbas excavadas. La orientación norte–sur, la planta trapezoidal, la piedra irregular y las losas se apoyan en la síntesis de Hinojosa (2008, p. 29). Las proporciones concretas, el número de piezas, la profundidad y la ubicación de cada ejemplo son decisiones de modelado. La posición más ancha se encuentra al sur. No se han incorporado cuerpos, ajuares, epitafios o nombres ficticios.

Las fotografías de la guía de la Red de Juderías (pp. 30–31) y del trabajo de Molina Soria (UPV, p. 65) orientan el estado de visita: suelo pardo, losas, muretes bajos y vegetación exterior. El modo Actual muestra nueve cubiertas y tres superficies de relleno de protección. El corte retira esos elementos para revelar cavidades reales; no sustituye un dibujo oscuro por otro modelo.

El perfil de niveles es una pequeña abertura analítica separada del campo de tumbas. Explica dos momentos funerarios y la elevación del suelo mediante tierra descritos por Hinojosa. Sus dos bandas, las trazas discretas de mampostería y su espesor son didácticos. No es una columna estratigráfica levantada en campo. El terreno vuelve a cerrarse al regresar a Actual o a la lectura histórica.

## Cavidades, roca y puerta

El núcleo rupestre está orientado hacia el oeste, hacia el sendero y la calle. La pendiente de base se conserva a partir del muestreo de elevación del atlas. El frente contiene tres bocas irregulares y conductos de acceso abiertos, coherentes con la fotografía municipal reproducida en UPV, p. 65. Cada cámara tiene un suelo, paredes y techo propios. Una cámara incluye una hornacina con volumen y fondo reales.

La forma cuadrangular, las ampliaciones y las hornacinas se toman de la descripción divulgativa reunida por Molina Soria, pp. 22–23. No se ha obtenido una planimetría arqueológica métrica que permita asignar cada cámara a una entrada concreta. Por ello la visita marca las plantas, cotas, espesores, tamaños y distribución interior como tipológicos. Las tres cámaras modeladas tampoco equivalen a un recuento total del conjunto rupestre.

La puerta metálica con menorá se sitúa en una boca rupestre, siguiendo la naturaleza de la referencia visual de UPV, fig. 53, p. 61. Es una pieza contemporánea y su ubicación individual en la maqueta es interpretativa. La escena no la convierte en una puerta medieval del cementerio ni en la puerta del castillo documentada por Pascual Buyé y Aranegui (1993).

La cubierta puede abrirse para leer el interior. El corte mantiene caras verticales de roca alrededor de las cámaras para mostrar el espesor del macizo. Sus aristas están subdivididas para seguir la pendiente real del muestreo, evitando interpolaciones largas que sobresalgan artificialmente de la ladera. En Actual la roca vuelve a cerrar las cámaras; los accesos siguen siendo auténticos huecos.

## Estados y dos sectores independientes

| Estado | Cementerio seleccionado | Hipogeos seleccionados |
| --- | --- | --- |
| Actual | Losas y rellenos de protección, muretes y acceso contemporáneo; perfil analítico cerrado. | Roca completa y cierre contemporáneo; cámaras accesibles por sus bocas. |
| Corte | Elevación o retirada de losas y rellenos; abertura del perfil didáctico. | Retirada de cubiertas y caras de sección del macizo visibles. |
| Histórica | Restitución tipológica de las losas, sin acondicionamiento contemporáneo. | Interpretación de posibles usos sin cronología unificada; hipótesis de cierre opcional. |

El sector no seleccionado conserva su estado Actual. Las lecturas históricas tienen etiquetas independientes: **«Siglos XIV–XV · restitución tipológica»** para el cementerio y **«Cronología no determinada · interpretación de uso»** para las cavidades. La datación del cementerio no se extiende automáticamente a los hipogeos.

Las cubiertas pertenecen al controlador del propio modelo. `cutObjects` permanece vacío para evitar una segunda transformación por el controlador genérico. `roofControl:true` expone la interacción a la interfaz. `setPresentation` recibe el sector geográfico en `focusId`.

## Terreno y contexto

Hay dos ventanas permanentes acotadas: 23 × 14 m en el recinto del cementerio y 16 × 12 m en el núcleo rupestre. Esas dimensiones son límites técnicos de integración, no superficies arqueológicas excavadas. Ambas se cierran completamente con las superficies propias de la escena. No existe una máscara continua entre los dos lugares.

El modelo repone el suelo exterior inmediato y conserva la banda occidental por la que pasa la Senda dels Lladres. El módulo `necropolis-context.js` aporta caminos, contenciones cartográficas y vegetación fuera de los núcleos. Los modelos previos del castillo, su pabellón y el teatro mantienen la propiedad de sus edificios. No se duplican ni se añaden viviendas sin evidencia en esta ladera.

La meseta de entrada de las cavidades se limita al frente de las bocas. Los laterales, la parte posterior y los cuatro bordes de la ventana siguen la elevación de la ladera, también después de adaptar el modelo a la malla final del terreno. Esta transición evita que una plataforma horizontal baja deje visible un vacío entre el núcleo de roca y la superficie del atlas.

Los materiales de piedra, suelo, metal y vegetación son propios y procedurales. Las imágenes documentales se inspeccionaron como referencias y no se redistribuyen ni se reutilizan como texturas. Todas las geometrías, materiales y texturas tienen propiedad explícita para su liberación y para no alterar recursos de otros monumentos.

## Navegación y plano

`site.focuses` contiene dos sectores de excavación: `cementerio` e `hipogeos`. `site.visit.focuses` contiene veinte paradas, diez en cada sector, con `archFocus` y `mapScope`. Los focos generales son `necro-conjunto` y `necro-hipogeos`; los históricos, `necro-historica` y `necro-transformaciones`.

El plano exportado incluye `sectors`, componentes y coordenadas de las paradas. Cada componente declara su ámbito y si su geometría es interpretativa. El contorno del cementerio conserva su origen cartográfico; la planta de las cámaras y los elementos individuales se rotulan como aproximaciones tipológicas. El mapa territorial no añade una línea que sugiera una excavación o acceso continuo.

## Verificación reproducible

La prueba específica del modelo se ejecuta con:

```sh
node --experimental-loader ./research/validate_loader.mjs research/validation-v21/validate_necropolis_model.mjs
```

Comprueba mediante geometría y rayos las fosas abiertas, sus cubiertas en Actual, las entradas rupestres, los suelos y la hornacina; verifica el perfil analítico, las caras del corte de roca, el emplazamiento de las tumbas dentro del recinto, la independencia de los sectores, los recursos propios y la ausencia de vértices no finitos o triángulos degenerados. El resultado se registra en `research/validation-v21/necropolis-model-qa.json`.

La comprobación del contacto del suelo incluye los cuatro bordes de la ventana rupestre sobre el relieve nativo, un muestreo inclinado distinto y una doble adaptación a un nuevo muestreo. El borde debe permanecer a menos de 10 cm de la superficie de referencia; es una tolerancia técnica de unión de mallas, no una precisión arqueológica declarada.

El argumento `--export` produce geometría reproducible para renders aislados de diagnóstico. Esos renders permiten revisar las cavidades y el espesor de la roca sin la complejidad del terreno completo. Son complementarios a la validación integrada de cámaras, oclusiones, relieve, edificios previos y flujo de interfaz que realiza la prueba global de la iteración 21. No constituyen una validación arqueológica métrica.
