# Validación del contexto urbano · edición 6

## Resultado

Las seis regiones pasan la validación de la geometría emitida por `createCity` con la cartografía y las exclusiones finales. Los conteos corresponden a **partes de edificios**. Las regiones se solapan y no deben sumarse como edificios distintos.

| Región | Partes representadas | Cubiertas con color PNOA | Altura IGN | Plantas de Catastro | Triángulos de edificación |
|---|---:|---:|---:|---:|---:|
| Sagunto | 9.374 | 9.374 | 5.380 | 3.977 | 725.717 |
| Puerto | 15.966 | 15.966 | 9.358 | 6.591 | 1.761.415 |
| Costa | 424 | 424 | 241 | 158 | 12.443 |
| Marjal | 700 | 699 | 343 | 348 | 23.064 |
| Almardà–Almenara | 6.068 | 5.353 | 3.415 | 2.638 | 237.530 |
| Palancia | 33.364 | 24.566 | 18.688 | 14.571 | 1.768.647 |

El resto de alturas utiliza altura explícita OSM, plantas OSM o una estimación visual identificada en los JSON. La fuente original no se modifica al acomodar una cubierta a la malla de presentación.

## Comprobaciones y correcciones

- Atributos, matrices de instancias e índices finitos y válidos en edificios, calles, árboles y terreno.
- Cero triángulos degenerados y normales nulas en la edificación. Los diez casos de Almardà y Palancia procedían de triángulos planos que quedaban colineales al pasar a Float32; se descartaron sin cambiar las plantas.
- Cero centros de triángulos de cubierta sobre láminas de agua cartografiadas.
- Cero cubiertas dentro de las exclusiones de modelos patrimoniales, incluido castillo y teatro cuando aparecen como contexto. La intersección de polígonos evita las duplicaciones periféricas que no detectaba la prueba del centro de parcela.
- Cero vértices de cubierta bajo la malla de terreno visible. Las correcciones expositivas se contabilizan aparte: 11 partes en Sagunto y 14 en Palancia.
- Las clases de procedencia de altura suman exactamente las partes renderizadas.
- Los árboles del contexto respetan las láminas de agua y las áreas de vegetación de los paisajes.

## Revisión de clasificación territorial

Se mantienen avisos informativos sobre edificios cartografiados dentro de polígonos amplios de cobertura natural: 28 partes del entorno del Marjal y un edificio OSM en la playa de Canet dentro de Palancia. El primer grupo incluye la alquería del CEACV y pequeñas construcciones existentes en Catastro; una etiqueta territorial de humedal puede abarcar instalaciones y parcelas terrestres. No se eliminan automáticamente construcciones documentadas por compartir una cobertura natural. Ninguno de estos avisos corresponde a una cubierta sobre agua. Los identificadores y coordenadas están en `suspectParts` para facilitar una futura revisión individual.

## Alcance visual

La imagen `city-sagunto.png` se generó con las geometrías Three.js y la ortofoto reales mediante render CPU; permite revisar la continuidad volumétrica del casco, el teatro, el castillo y las manzanas de contexto. Los materiales WebGL, las texturas de fachada generadas en canvas, las reflexiones y la fluidez en dispositivos requieren la comprobación de navegador de la integración.

Los resultados detallados son los seis ficheros `city-<región>.json`. Los exportes geométricos grandes se guardan fuera de los archivos versionados como `research/qa-city-*.json.gz`.

Para repetir una región:

```sh
node --experimental-loader ./research/validate_loader.mjs research/validate_city_v6.mjs --region=palancia
```
