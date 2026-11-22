# Las visitas del Atlas en el simulador

En **Buscar lugar** puedes escribir «orchestra», «salón» o «desembocadura» para ir directamente a una parada. Al seleccionar un lugar se abre su recorrido, agrupado por los mismos ámbitos que en el Atlas. El mapa de paradas indica el norte, los puntos de observación y la cámara. En los puntos que comparten posición, una línea une el número desplazado con su anclaje. Las flechas del selector recorren las paradas en el orden del Atlas. [Abrir el simulador](https://saguntum-atlas-3d.monmode.chatgpt.site/#simulador)

## Qué incluye el catálogo

Los 32 lugares suman 529 entradas. El recuento incluye las cinco vistas del muro de Diana, que el Atlas permite abrir tanto desde Diana como desde Berenguer. Las dos visitas del pantalán comparten la estructura física. Los paisajes conservan sus propios recorridos de observación. El puerto antiguo tiene seis encuadres terrestres y marinos. [Catálogo de paradas y coordenadas](../dist/assets/territory/visit-stops.json)

| Ámbito | Lugares visitables |
| --- | --- |
| Sagunto | Castillo, Teatro Romano, Vía del Pòrtic, Domus dels Peixos, Circo, Necrópolis, Berenguer, muro de Diana, Judería, Museo Arqueológico, Plaça Major, Calvario, Santa María, Salvador, Sangre y Glorieta |
| Puerto de Sagunto | Alto Horno, Talleres, Museo Industrial, Gerencia, Casino, Economato, Begoña, Barrio Obrero y Sanatorio |
| Grau Vell y costa | Grau Vell, puerto antiguo, pantalán del paseo y pantalán marítimo |
| Paisajes | Corredor del Palancia, Marjal dels Moros y dunas de Almardà |

## Modelos, cámaras y entorno

El simulador registra los constructores tridimensionales del Atlas en el sistema ETRS89 / UTM 30N. Cada parada conserva el punto de mira, la posición del observador, la apertura de la cámara y la presentación del modelo. Hay dos calibraciones por parada, obtenidas con la aplicación a 1440 × 900 y 390 × 844. Las proporciones intermedias de pantalla interpolan la cámara. El terreno aporta la referencia vertical. [Encuadres medidos](../dist/assets/territory/visit-cameras.json) · [Transformación territorial](../dist/js/territory-visit-frames.js)

Las visitas activan sus controles originales de cubiertas, excavaciones y conjuntos históricos. En la arqueología marina, el agua se retira únicamente en el área de inspección. La ficha **Visita patrimonial** da acceso a los planos, cronologías, bibliografía y niveles de certeza del Atlas. Los enlaces siguen el formato `#simulador/lugar/parada`. **Volver al simulador** recupera la cámara guardada al salir. [Necrópolis](https://saguntum-atlas-3d.monmode.chatgpt.site/#simulador/necropolis/necro-camara) · [Puerto antiguo](https://saguntum-atlas-3d.monmode.chatgpt.site/#simulador/puerto-antiguo/marina)

Cartografía y reconstrucción tienen precisiones distintas. Las huellas y el parcelario proceden de Catastro, el relieve y la ortofotografía del IGN, y la red viaria de OpenStreetMap. Las geometrías detalladas conservan la documentación de sus autores. En los espacios entre visitas, el parcelario y los ejes viarios permiten estimar los márgenes de calle. La anchura de la acera, las juntas, los materiales, las fachadas sin levantamiento y la forma de las copas siguen siendo aproximaciones visuales. Las posiciones y cotas de la arqueología sumergida tienen la precisión de la topografía publicada. [Fuentes territoriales](SIMULADOR.md) · [Procedencia del parcelario](../dist/assets/territory/street-fronts/index.json)

## Qué se comprobó

Los 529 estados de parada se renderizaron con sus respectivos modelos originales en Chromium/WebGL. Incluyen 115 vistas marcadas como interiores, 55 secciones, 17 paradas históricas y tres inspecciones marinas. Estas categorías pueden coincidir en una misma parada. En la aplicación completa se comprobó la carga de al menos una parada por cada uno de los 32 lugares, las 529 rutas en plano, el buscador, el historial, las capas y el regreso a la cámara del Casino. [Prueba de los constructores](../research/validate-territory-visit-states.py) · [Resultados por lugar](../research/visitas-territoriales/local/chrome/rutas.json)

Se compararon las 1.058 poses con una transformación geográfica independiente. El máximo desvío horizontal del punto de mira fue de 0,95 m en el recorrido más extenso. Esta magnitud mide la diferencia entre dos transformaciones del dibujo existente. En 62 vistas de la aplicación se comprobó la posición final de ojo y objetivo con tolerancia de 2,5 cm respecto a la cámara territorial calculada. Se revisaron también los seis encuadres del puerto antiguo y la apertura de la Glorieta en WebKit sobre Windows con perfil táctil. Queda pendiente la medición en iPhone y iPad físicos. [Cámaras, imágenes y resultados](../research/validation-v38-cameras/README.md) · [Recuperación tras perder WebGL](../research/visitas-territoriales/local/recuperacion.json)

## Reproducir la integración

Desde la raíz del repositorio, sirve `dist/` por HTTP. Las herramientas de calibración y validación requieren Python, Playwright con Chrome instalado, Pillow y pyproj. La prueba móvil utiliza el motor WebKit de Playwright. La exportación de encuadres necesita WebGL.

```sh
python -m http.server 8000 --directory dist
```

En una segunda terminal se puede regenerar el catálogo, medir las cámaras del Atlas y comprobar la transformación, la aparición de los modelos y la navegación.

```sh
python research/prepare-territory-visits.py
python research/export-territory-visit-cameras.py --base http://127.0.0.1:8000
python research/check-territory-visit-cameras.py --base http://127.0.0.1:8000
python research/validate-territory-visit-states.py http://127.0.0.1:8000
python research/check-territory-visit-routes.py --base http://127.0.0.1:8000 --out research/visitas-territoriales/local/chrome
```
