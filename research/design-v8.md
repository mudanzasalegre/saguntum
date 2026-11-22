# V8 — Teatro Romano: visita, plano e identidad

## Objetivo

Extender al Teatro Romano la visita documentada que ya tenía el Castillo: recorrer sus espacios, acercarse a cada uno, leer las transformaciones, consultar la evidencia y reconocer qué representa la maqueta. La composición conserva la identidad del atlas y sus dos apariencias. La portada y los metadatos presentan ahora el Teatro; el Castillo sigue disponible con sus 18 paradas.

La documentación arqueológica y los límites de reconstrucción se desarrollan en `research/theatre-history.md`. La geometría y su registro cartográfico se documentan por separado en el trabajo del modelo. Este documento describe las decisiones de interfaz y plano.

## Cuaderno reutilizable

`dist/js/castle-panel.js` exporta `createMonumentVisit`, además del adaptador compatible `createCastleVisit` y de `castlePeriodLabel` como alias de `visitPeriodLabel`.

El controlador recibe `element`, `data`, `monumentId`, `monumentLabel` y las acciones `onSelect`, `onNear`, `onMap`, `onReading`, `onSource` y, opcionalmente, `onSection`. Conserva `setState`, `start`, `showSources`, `getState` y `sourceContent`.

Cada instancia tiene sus propios identificadores de pestañas, referencias ARIA y progreso persistido:

| Visita | Contenedor | Prefijo de pestañas | Clave de progreso |
|---|---|---|---|
| Castillo | `castle-panel` | `castle-tab-` | `saguntum.castle.visited.v1` |
| Teatro | `theatre-panel` | `theatre-tab-` | `saguntum.theatre.visited.v1` |

Se conservan las clases `castle-*` y los atributos internos de acción para reutilizar los componentes visuales. Los eventos se resuelven dentro de cada contenedor, por lo que no se cruzan las selecciones ni el estado.

Las pestañas siguen el patrón de navegación con flechas izquierda/derecha, Inicio y Fin. Sólo la pestaña activa está en la secuencia normal de tabulación. Cada panel referencia su pestaña activa. Las fuentes externas llevan `noopener noreferrer`; los textos se escapan y los enlaces rechazan protocolos distintos de HTTP y HTTPS.

### Jerarquía de contenido

La vista general muestra primero **Iniciar visita** y **Plano del teatro**, después la introducción, los contadores y los cinco ámbitos. Esta prioridad permite encontrar la acción de entrada sin recorrer primero todo el texto. La visita dispone de 16 paradas; los contadores se calculan desde el JSON.

La parada seleccionada muestra posición dentro del recorrido, navegación anterior/siguiente, título, introducción, vistas, hechos con fuente, detalles a observar y límites del modelo. Las tres pestañas son Recorrido, Cronología y Fuentes.

Los rótulos del Teatro se toman del conjunto de datos: ámbitos, «Leer las capas» y el texto que explica esa lectura. El cuaderno bibliográfico se identifica como Teatro Romano. El Castillo conserva su denominación, sus recintos y «Leer las épocas».

### Sección didáctica

El control **Abrir sección / Cerrar sección** se presenta únicamente en una parada seleccionada de la pestaña Recorrido del Teatro. No ocupa espacio en la introducción, la cronología o la bibliografía. Tiene `aria-pressed`, mantiene una altura mínima de 44 px y se desactiva cuando no está disponible WebGL.

El texto explica que retira la cubierta y el tablado actuales para leer el subsuelo escénico. Al abrir, añade que las subestructuras constituyen un esquema apoyado en los elementos documentados y que su conservación no permite una restitución literal completa. El controlador comunica el siguiente estado booleano a la aplicación; la geometría decide qué piezas ocultar.

## Color y legibilidad

La interfaz conserva los tokens V7 del atlas: superficies petróleo, texto cálido y acento arena en Atlas oscuro; superficies claras, tinta petróleo y acento cobre en Lectura clara. `:is(.castle-mode,.theatre-mode)` comparte la composición, sin duplicar ni hacer divergir las reglas de disposición.

La lectura de capas del Teatro utiliza los colores explícitos del conjunto documental. Coinciden entre la leyenda, el modelo y el plano:

| Capa | ID documental | ID del modelo | Color |
|---|---|---|---|
| Arquitectura romana | `roman` | `ancient` | `#d6bd8b` |
| Rehabilitación contemporánea | `contemporary` | `contemporary` | `#77b8c7` |
| Encuentro de capas | `mixed` | `mixed` | `#be98d6` |
| Esquema arqueológico | `interpretation` | `interpretation` | `#929ba0` |

El color expresa la lectura de una parte, no una afirmación de que todas sus superficies sean antiguas o estén documentadas con igual precisión. Las notas de la leyenda y de cada parada explican esos límites.

En el plano, los marcadores de lectura por capas llevan relleno semántico y un número en tinta oscura o blanca calculada para maximizar el contraste. Esto conserva exactamente el color documental en las dos apariencias. El contorno utiliza la paleta del tema. La selección usa el acento del atlas y un halo adicional. En modo materiales se mantiene el tratamiento de marcadores neutros.

El contraste mínimo medido entre números y rellenos fue **5,52:1**, superior a 4,5:1, en las dos apariencias y todos los estados verificados.

## Plano georreferenciado

`dist/js/theatre-map.js` exporta:

```js
drawTheatreMap(canvas, cartography, visit, {
  selected,
  heightAt,
  palette,
  large,
  readingMode,
  showLabels,
  modelGeometry,
  insets
})
```

El resultado contiene `targets`, `bounds`, `shadeCells`, `components`, `scaleMetres` y `hitTarget(x, y)`. La API permite usarlo en el minimapa, en el modal y en el fondo 2D de reserva.

La envolvente procede de `cartography.theatrePolygon`, la huella contemporánea de OpenStreetMap. Los 21 componentes interiores proceden de la misma planta que genera el modelo (`modelGeometry` o `visit.plan`), con el mismo centro, giro y conversión geográfica. El dibujante no crea por su cuenta anillos, edificios ni supuestas trazas arqueológicas. Los componentes interpretativos se indican con línea discontinua. La versión estática `theatre-plan.json` permite conservar esta lectura cuando no hay WebGL.

El relieve de fondo utiliza el muestreador del atlas. Edificios y calles se dibujan como contexto, subordinados al contorno principal y a los espacios del teatro. Norte y escala métrica permanecen visibles. La escala se adapta a 10 o 20 m según el espacio disponible.

### Puntos y etiquetas

Cada parada conserva una posición geográfica real del conjunto de datos. Si dos etiquetas resultan demasiado próximas, sólo se desplaza el círculo numerado; una línea y un pequeño punto señalan su anclaje original. La parada seleccionada se coloca primero y mantiene exactamente ese anclaje.

La separación mínima entre centros es 32 px en el plano grande y 17 px en minimapa. Un buscador radial determinista y una malla de reserva permiten resolver grupos densos. `hitTarget` devuelve el marcador más cercano dentro del radio de interacción, por lo que su centro resuelve siempre la parada correcta. Las coordenadas de componentes malformados o no finitos se rechazan antes de dibujar.

## Disposición adaptable

Los modos Castillo y Teatro comparten los mismos márgenes que utiliza la cámara para encuadrar el modelo dentro de la parte libre de la pantalla:

- Escritorio: cuaderno lateral, escena a la derecha y herramientas distribuidas fuera del texto.
- Móvil: escena en la mitad superior y cuaderno desplazable en la mitad inferior; las pestañas quedan adheridas al borde superior del cuaderno.
- Ventanas bajas en horizontal: cuaderno más compacto, herramientas inferiores y ocultación de elementos secundarios para preservar el espacio de exploración.

Los controles nuevos mantienen el tratamiento de foco y estados desactivados del sistema existente. La visita documental y el plano siguen disponibles sin WebGL; acercamiento y sección indican claramente que necesitan la maqueta.

## Verificación específica

### Controlador

`research/validation-v8/validate_visit_controller.mjs` pasó **16 contratos** con los JSON reales del Castillo y del Teatro. Comprueba el aislamiento de progreso, IDs y referencias ARIA, la compatibilidad del adaptador del Castillo, la navegación de todas las paradas hasta terminar, las pestañas mediante teclado, los enlaces y el escape de fuentes, la leyenda del conjunto de datos y los estados de la sección.

Utiliza un adaptador mínimo del elemento para verificar estado y contenido generado. No sustituye la comprobación de foco real y disposición en un navegador.

### Canvas

`research/validation-v8/validate_theatre_map_canvas.mjs` pasó **272 escenarios y 24.464 comprobaciones** con la planta real del modelo y los 16 estados de selección, además de la vista sin parada seleccionada.

| Superficie | Tamaño | Márgenes: izquierda / derecha / arriba / abajo |
|---|---|---|
| Minimap | 460 × 230 | 0 / 0 / 0 / 0 |
| Modal | 1200 × 650 | 0 / 0 / 0 / 0 |
| Fondo de escritorio | 1363 × 936 | 424 / 80 / 108 / 80 |
| Fondo móvil | 390 × 844 | 16 / 16 / 124 / 434 |

Cada superficie se comprobó en las dos apariencias y en los dos modos de lectura. Las verificaciones cubren los 16 marcadores, coordenadas finitas, separación de etiquetas, identificación exacta al pulsar el centro, conservación de anclajes seleccionados, límites del espacio libre, colores documentales, contraste y acotación del sombreado. También se suministraron componentes erróneos para verificar el rechazo sin bloquear el plano.

Se inspeccionaron visualmente las imágenes de la planta grande y del fondo móvil. La comprobación de navegador de la aplicación completa, la escena WebGL y el despliegue público corresponde a la integración general V8.
