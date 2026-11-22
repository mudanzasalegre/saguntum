# V31 · Agua del pantalán y litoral

## Alcance

La escena conserva la máscara costera de OpenStreetMap ya corregida para que el
mar pase bajo el pantalán. La geometría no añade agua encima de las explanadas,
playas o muelles. Tampoco modifica el raster IGN ni presenta el fondo expositivo
a −8,5 m como una batimetría medida.

La mejora afecta a `dist/js/coast-environment.js` y al nuevo módulo
`dist/js/coast-water.js`. Se mantiene la cámara de reflejo planar de Three.js r180
incluida en `dist/assets/vendor/Water.js`, su recorte del plano de agua, sus
uniformes de cámara y la restauración del estado del renderer tras cada pasada.
Referencia primaria de la implementación utilizada:
<https://github.com/mrdoob/three.js/blob/r180/examples/jsm/objects/Water.js>.

## Problemas identificados y cambios

- El material anterior aplicaba un color de dispersión uniforme y un Fresnel de
  incidencia normal de 0,30. La nueva superficie utiliza 0,020, una gradación
  azul/turquesa por distancia a la costa real y reflejos más contenidos.
- La ondulación anterior dependía de unas pocas señales periódicas que podían
  producir bandas y patrones regulares. Se emplea ahora un espectro determinista
  de 32 componentes para las normales, cuatro escalas de muestreo y cinco
  ondulaciones suaves evaluadas en metros. El filtrado de derivadas y los mipmaps
  atenúan el detalle que ya no resuelve la pantalla.
- La orilla recibe una franja estrecha y discontinua de espuma suave. Se calcula
  con un campo de distancia de 16 bits a la costa cartográfica, no al borde
  elíptico de la maqueta. Su intensidad diferencia de forma aproximada los
  sectores naturales de los muelles; es un recurso de lectura visual, sin
  pretensión de simular el oleaje de una fecha concreta.
- La superficie recibe las sombras de los apoyos y de las estructuras. El brillo
  solar está acotado y cambia junto con la iluminación de día o dorada del atlas.
- El reflejo sube a 768 px en escritorio y 384 px en móvil. Con movimiento de
  cámara se actualiza cada 33/50 ms; en reposo utiliza un intervalo de 160/220 ms.
  La posición del ojo se actualiza en cada fotograma, incluso cuando se reutiliza
  el reflejo. Esto evita calcular innecesariamente toda la escena reflejada en
  cada fotograma de reposo.
- Se conservan la inspección sin agua y la preferencia de movimiento reducido.
  Al desmontar la región se liberan el render target, las normales, el campo de
  costa, el material y la geometría. El agua se retira del grupo para evitar una
  segunda liberación en el recorrido genérico de recursos de la región.

## Límites de interpretación

Los colores, las pequeñas ondas, la espuma y el gradiente costero son una
representación visual del Mediterráneo. El campo de distancia no expresa
profundidad, transparencia medida, corrientes, mareas o calidad del agua. El
agua se mantiene opaca para que el fondo expositivo y sus cotas no se confundan
con datos hidrográficos. La huella elíptica exterior del atlas permanece.

## Verificación reproducible

Desde la raíz del checkout:

```sh
node --experimental-loader ./research/validate_loader.mjs research/validation-v31/validate-water.mjs
python research/validation-v31/render-water-shader.py
```

`water-checks.json` comprueba máscara, distancia frente al cálculo exacto,
ausencia de espuma en el borde de la maqueta, estados de luz/inspección/movimiento
reducido, renovación de reflejos al mover la cámara, restauración tras errores y
liberación de recursos. Los hashes de los cuatro archivos de entrada están en
`water-shader-input.json`.

`water-shader-diagnostic.json` y `water-shader-diagnostic.png` documentan una
prueba independiente en EGL/Mesa: se compilan los shaders GLSL reales expandidos
con los chunks de Three.js, incluidos niebla, ACES, sRGB y el camino de sombras
direccionales PCF suaves. Se rasteriza la geometría real del agua con un reflejo
de prueba determinista para comparar cerca/lejos y día/luz dorada. Se inspeccionó
la imagen y se corrigió un patrón demasiado periódico antes del resultado final.

Esta prueba no es una captura del navegador ni una verificación de la aplicación
publicada. El navegador gestionado seguía sin estar disponible en esta sesión;
se conserva expresamente esa limitación en los informes.
