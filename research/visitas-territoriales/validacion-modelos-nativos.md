# Modelos patrimoniales en el simulador

El catálogo contiene 32 lugares y 529 paradas. Treinta constructores originales proporcionan la geometría. La Casa dels Berenguer y el muro de Diana comparten un constructor, al igual que los dos tramos del pantalán.

## Selección de una parada

El simulador construye el lugar seleccionado con sus materiales, interiores, cubiertas y controles del Atlas. Conserva las mallas que el constructor oculta en la vista exterior. Al cambiar de parada, el gestor aplica el foco, la sección y la fase correspondientes. Al salir, recupera la configuración contemporánea. Las visitas lejanas pueden usar una instantánea producida en un trabajador. La sustitución libera una representación antes de incorporar la otra. En pantallas pequeñas se conserva un solo conjunto patrimonial detallado a la vez.

Las excavaciones usan el controlador del Atlas. El simulador transforma sus ventanas de corte al terreno métrico territorial. La vista histórica del Circo también corta el contexto urbano alrededor del recinto. Los tres focos de arqueología marina del puerto antiguo abren una ventana local de inspección en la envolvente cartográfica del fondo expositivo. Las profundidades y la disposición del lecho conservan la incertidumbre de la fuente original.

La selección puede mantener visible un lugar por la posición de su parada. El mirador de Casablanca queda a más de cuatro kilómetros del anclaje del conjunto dunar. La vegetación y los cantos próximos mantienen sus instancias originales en los tres paisajes. La densidad de los elementos alejados se ajusta a la calidad gráfica.

## La Glorieta

La visita conserva sus 24 encuadres, el monumento a Romeu, los juegos de agua y 45 frentes con dibujo arquitectónico. Se incorporó la primera franja de calles y edificios del sector que usa el Atlas. Las fuentes son las que acompañan a `glorieta-buildings.json` y `glorieta-sector-cartography.json`, con cartografía catastral, trazados de OpenStreetMap y estimaciones de altura o color procedentes del IGN. La correspondencia de puertas, ventanas y acabados conserva el grado de aproximación del modelo original.

El cruce geométrico detectó que siete fachadas dibujadas para la visita ocupaban parte de 34 envolventes genéricas. El proceso conserva las fachadas y recorta las partes superpuestas. También identificó dos contornos OSM redundantes con las partes catastrales en el anillo exterior. El resultado tiene 172 partes en el núcleo y 141 a su alrededor. Los 22 tramos de acceso corresponden a 18 vías. Se respetan los puntos de sus 59 árboles, 17 farolas y 21 bancos al cargar las capas generales del simulador.

## Comprobaciones reproducibles

Con `dist` servido en el puerto 8471, Python con Playwright, Chrome y Shapely, los siguientes comandos recorren la preparación y las dos verificaciones.

```sh
python research/prepare-glorieta-surroundings.py
python research/validate-territory-visit-states.py http://127.0.0.1:8471
node research/validate-territory-heritage.mjs
```

El recorrido de modelos renderizó cada encuadre en Chromium con WebGL y SwiftShader. Comprobó los 32 lugares, sus 529 paradas, 55 paradas con sección, 115 con cámara interior, 17 con fase histórica y 3 con inspección marina. Una misma parada puede pertenecer a varias categorías. El resultado por lugar figura en [resultados-modelos-nativos.json](resultados-modelos-nativos.json). Las observaciones de paisaje que miran al mar incluyen el terreno y el Mediterráneo del simulador en el ensayo.

El ensayo separado del trabajador reconstruyó los 30 modelos en WebGL, verificó excavaciones persistentes, pavimentos, encendido del Alto Horno, fases del pantalán y shader costero. La extensión de la prueba de vegetación cercana usa el presupuesto móvil y contrasta las instancias conservadas con sus matrices originales.

También se abrieron los enlaces públicos del simulador para las fachadas de la Glorieta, la lectura histórica del Pòrtic y el espigón de la Gola en la revisión local. Se inspeccionaron capturas del render de la aplicación y se contrastó el encuadre de las fachadas con el Atlas original. La prueba automatizada de las 529 paradas indica que la escena se puede dibujar. La inspección visual manual abarcó una selección de encuadres. SwiftShader tampoco mide el rendimiento de una GPU de iPhone.
