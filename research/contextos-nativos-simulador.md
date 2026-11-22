# Entornos del Atlas en el simulador

El simulador emplea 29 constructores originales para 31 lugares seleccionables. El paseo y el tramo marítimo comparten el modelo del pantalán. Diana y Berenguer comparten el conjunto del palacio. La selección del lugar y las fases históricas siguen vinculadas a cada visita.

## Qué se dibuja alrededor de los monumentos

Los 23 constructores de entorno del Atlas acompañan ahora a sus monumentos en el simulador. Incluyen 12 entornos de Sagunto, nueve del Puerto y los dos de Grau Vell y el pantalán. Aportan las manzanas vecinas, los pavimentos, vallados, jardines y demás piezas que cada visita tiene modeladas. Los otros seis constructores principales corresponden al Castillo, el Teatro, el puerto antiguo y los tres paisajes. Sus piezas exteriores se obtienen del propio modelo. [Registro de constructores](../dist/js/territory-heritage-contexts.js)

Se cargan los JSON de construcción y contexto de cada visita. La base métrica local del Atlas se convierte al marco territorial UTM con la misma transformación para el monumento y su entorno. Se conservan las matrices locales, materiales, UV, texturas y geometrías originales. Las fundaciones y excavaciones de la visita modifican el terreno. Una vez compuesto el relieve, se vuelven a apoyar en él los elementos que el constructor nativo permite ajustar. [Construcción de los modelos](../dist/js/territory-heritage-models.js)

Las huellas, patios, exclusiones de vegetación y posiciones de mobiliario delimitan los elementos territoriales que ceden su lugar al modelo patrimonial. Santa Maria, la Judería y la Plaça Major siguen el reparto original de parcelas con Berenguer. El pavimento se muestrea directamente sobre los triángulos existentes. Se conserva su cota para el peatón y se recortan por fragmento las calzadas territoriales que cruzan la superficie. El terreno fotográfico se retira en el interior de las superficies cubiertas y se conserva alrededor de los bordes. La celda de la máscara mide como mínimo 32 cm y cada lado tiene hasta 896 muestras. El borde es aproximado a esa escala. Al descargar un lugar se restablece el territorio que cubría. [Muestreo de superficies](../dist/js/territory-heritage-paving.js) · [Máscaras de renderizado](../dist/js/territory-heritage-roadmask.js)

La carga simultánea admite hasta cuatro conjuntos en calidad alta de escritorio, dos en los demás presupuestos de escritorio y uno en móvil. La selección mantiene el conjunto visible desde el encuadre de la visita. En Marjal, Almardà y Palancia, la calidad alta a menos de 200 m de distancia de cámara recupera toda la vegetación y los cantos instanciados por la escena original. Al alejarnos o reducir la calidad se limita el número de instancias dibujadas manteniendo posiciones y colores del original. [Gestión de cercanía y capas](../dist/js/territory-heritage.js)

Las luces puntuales de lectura de cada edificio conservan su posición, color, intensidad, alcance, decaimiento y fase. El estado contemporáneo visible incluye 20 luces originales entre Salvador, el Museo, el Horno, Talleres y el Museo Industrial. El renderizador activa las más cercanas al punto observado hasta un máximo de ocho en calidad alta, cuatro en media y dos en ligera. Las visitas patrimoniales conservan su configuración propia.

## Comprobación con WebGL

Se abrió Chromium con WebGL2 por software en Windows. El ensayo construye cada lugar con el trabajador de producción, transfiere las mallas y las texturas al renderizador y dibuja una vista junto a su relieve. Valida las superficies de referencia, las fases históricas, los cortes de terreno y el shader original del mar. Los 29 constructores completaron el ensayo. La consulta de errores de WebGL devolvió cero en todos. Los 23 entornos aportaron, sumando sus cargas individuales, 420 lotes visibles, 1.408.660 triángulos y 2.174 registros de edificios o partes tras aplicar las exclusiones del Atlas. El total de áreas pavimentadas o ajardinadas por contexto fue de 246.181 m² y puede incluir superficies que se encuentren en dos contextos. [Registro de cada carga](validation-atlas-parity/contextos-webgl.jsonl)

| Paisaje | Instancias originales con nivel de detalle variable | Instancias en aproximación alta | Instancias en vista lejana |
| --- | ---: | ---: | ---: |
| Marjal dels Moros | 19.250 | 19.250 | 1.699 |
| Dunas de Almardà | 18.972 | 18.972 | 2.091 |
| Río Palancia | 23.840 | 23.840 | 1.362 |

El ensayo de los paisajes cercanos dibujó entre 1,01 y 1,86 millones de triángulos por vista en el renderizador de comprobación. Los totales anteriores abarcan los grupos cuya densidad cambia. Los grupos pequeños se dibujan completos en ambos niveles. Las capturas comparativas de la aplicación y las pruebas de rendimiento se publican junto a los resultados de esta iteración. [Comparaciones con la cámara del Atlas](validation-atlas-parity/README.md)

El ensayo complementario usa el buscador y el botón de cambio de encuadre en la aplicación. La vista general del paseo del pantalán dibujó su modelo a 1.094 m en escritorio y 2.430 m en vertical. El tramo marítimo lo conservó a 1.988 y 4.496 m respectivamente. La panorámica regional descargó el modelo en todos los casos. En el Horno, la aproximación de escritorio registró 96 llamadas y 250.743 triángulos del conjunto patrimonial, con sus dos luces puntuales activas. [Registro de los encuadres](validation-atlas-parity/encuadres-pantalan-horno.json)

Para reproducir las pruebas de interfaz, con Python, Playwright y Chrome, sirva primero la aplicación y ejecute `python research/validate-territory-landmark-detail.py --base http://127.0.0.1:8455/`.

Para reproducir la comprobación desde la raíz del repositorio, con Node 22 y Chrome o Chromium instalados, ejecute `node research/validate-territory-heritage.mjs`. La variable de entorno `CHROME_PATH` permite seleccionar el navegador. Tras un cambio en los constructores, regenere antes el trabajador con `node research/build-territory-heritage.mjs` y la dependencia esbuild indicada en el propio script.

La correspondencia geométrica se refiere al modelo ya documentado en el Atlas. La precisión geográfica, las alturas inferidas, el aspecto interpretado de las fachadas y la cronología conservan las limitaciones de las fuentes de cada visita. El paisaje lejano y el tejido situado fuera del radio de los entornos se dibujan con los datos territoriales y su propio nivel de detalle.
