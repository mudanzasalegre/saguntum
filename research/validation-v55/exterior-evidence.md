# Almenara: registro exterior y correcciones de v55

Fecha de consulta: 27 de noviembre de 2026. Responsable: tarea `east_layout`.

## Resultado y relación con las marcas del usuario

| Marca | Elemento actual | Registro usado | Corrección |
|---|---|---|---|
| Lima | Proyección circular y hueco con arco junto al paño norte | Contorno OSM del castillo, vértices 202–211; fotografía Ricsol 26 | Cuerpo cerrado y unido a ambos paños; arco pequeño en la base exterior con fondo retrasado; se elimina el semicírculo separado de v54. |
| Naranja | Restos del nido de ametralladora situado junto a Daoiz | OSM 1419384279; plano municipal 02B, elemento 3; croquis de campo de B. Balanzà, 2022, publicado en CASVA 7, p. 10 | Cámara pequeña, baja y abierta, con paredes de hormigón y suelo interior; se excluye el edificio genérico de aproximadamente once metros. |
| Amarillo | Muralla oriental conservada de Tres Castellets | OSM 1419384286, 523549298 y 1419384303 cotejados con ortofoto PNOA; fotografías Ricsol 5–7 y 12 | Se incorpora el lienzo actual que desciende por la ladera, con cambios de cota por tramos, salientes angulosos y merlones sólidos donde están fotografiados. Se mantienen libres los huecos cartografiados 1419384287 y 1419384304. |

La superposición de la captura del usuario realizada por `east_integration` confirma que 523549298 sigue el borde izquierdo de la marca amarilla y que 1419384286 cruza su cabecera. El registro de esa captura tiene un error aproximado de 4 píxeles y sólo se utiliza para identificar los elementos, nunca para obtener cotas constructivas. Los caminos 1419384285, 1419384288 y 1419384294–4296 son senderos; no se han convertido en muros.

## Fuentes contrastadas

1. **Ayuntamiento de Sagunt, Plan Director de Patrimoni Immoble Defensiu Guerra Civil (1936–1939), plano 02B, diciembre de 2020.** Localización de inmuebles defensivos del castillo, escala 1:3000. Autoría: Carme Antoni Ballanzà, arqueóloga; Marta Navarro Bas, arquitecta. El elemento 3 identifica el nido junto a la batería Daoiz. El icono del plano es un símbolo de localización, no una huella métrica.
   - Índice municipal: <https://memoriahistoricasagunt.com/rutas/>
   - PDF: <https://memoriahistoricasagunt.com/wp-content/uploads/2024/10/4-planols-Itineraris-6.pdf>

2. **B. Balanzà, croquis de campo del nido junto a Daoiz y Velarde, 2022**, reproducido por Miguel Aparici Navarro en **CASVA n.º 7**, julio–septiembre de 2025, p. 10. El dibujo muestra una cámara poligonal y acceso acodado. Sus pequeñas cifras no se leen con suficiente certeza para convertirlas en cotas. La fotografía que aparece debajo corresponde a la Plaza de Estudiantes, igual que las fotografías de la página 11: NO se han usado como alzado del nido Daoiz.
   - Editor: <https://casvacastillosvalencianos.wordpress.com/>
   - PDF del editor: <https://casvacastillosvalencianos.wordpress.com/wp-content/uploads/2025/07/casva-7-julio-agosto-septiembre-2025.pdf>

3. **Ricardo Soler / Fortificaciones de España, fotografías del Castillo de Sagunto.** Se consultan como evidencia visual del estado fotografiado, sin asumir que la fecha de subida de 2022 sea la fecha de cada toma. La cronología genérica del reportaje no se aplica automáticamente a cada paño.
   - Página: <https://castillosricsol.es/castillo-de-sagunto/>
   - Imagen 26, torre y hueco pequeño junto al paño norte: <https://castillosricsol.es/wp-content/uploads/2022/03/sagunto-26.jpg>
   - Imágenes 5 y 6, exterior e interior de la muralla oriental: <https://castillosricsol.es/wp-content/uploads/2022/03/sagunto-5.jpg> y <https://castillosricsol.es/wp-content/uploads/2022/03/sagunto-6.jpg>
   - Imagen 7, pliegue angular y escalera: <https://castillosricsol.es/wp-content/uploads/2022/03/sagunto-7.jpg>
   - Imagen 12, portillo de esa muralla: <https://castillosricsol.es/wp-content/uploads/2022/03/sagunto-12.jpg>

4. **IGN, servicio PNOA Máxima Actualidad.** La consulta GetMap, sus límites y fecha de descarga están en `exterior-pnoa.json`. La resolución solicitada al servidor no equivale a precisión métrica nativa. La comparación conserva las coordenadas OSM y no fuerza encajes centimétricos en la imagen.

5. **OpenStreetMap, lectura API actual del área oriental.** Descarga: <https://api.openstreetmap.org/api/0.6/map?bbox=-0.2752,39.6765,-0.2740,39.6776>. Crédito: © OpenStreetMap contributors, ODbL. El extracto de los elementos usados está en `exterior-layout.json`; los identificadores se conservan en el módulo de datos. OSM proporciona posición y tipología cartográfica, no cronología ni altura arqueológica.

## Contrato geométrico

`dist/js/castle-east-exterior-layout.js` contiene nueve rasgos y exporta:

- `EAST_EXTERIOR_FEATURES`: polígonos, líneas y punto del hueco, con fuentes y límites.
- `EAST_EXTERIOR_REPLACED_WALL_IDS`: 1419384286, 523549298 y 1419384303.
- `EAST_EXTERIOR_REPLACED_BUILDING_IDS`: 1419384279.
- `isEastExteriorPerimeterSegment(a,b)`: sólo selecciona los segmentos 202–210 del perímetro actual. El segmento largo 211–212 continúa siendo propiedad del constructor general.

`dist/js/castle-east-exterior.js` exporta `buildEastExterior`. Recibe la proyección y consulta de suelo del constructor compartido. Devuelve QA, máscaras permanentes para el hueco interior del nido y exclusiones de vegetación. No modifica el MDT ni crea una capa histórica distinta. Las mismas coordenadas se proyectan para Atlas y Simulador.

### Torre y hueco

Los extremos del cuerpo circular coinciden exactamente con los puntos 204 y 211 del contorno. La curva se suaviza entre los puntos de fuente y se cierra por detrás. La torre ya no depende de una exclusión radial de paños que dejaba separaciones. Su remate se estima a `plane + 5,45 m`, aproximadamente 0,8–1 m sobre los merlones de la batería contigua, según la relación visible en la fotografía. La unión conserva `plane + 3,50 m` de parapeto y merlones de 1,10 m, coordinados con la corrección de la crujía norte. Estas son cotas relativas de visualización, no mediciones de un levantamiento.

El hueco mide de forma interpretativa 0,88 m de ancho, con arco rebajado de ladrillo y 0,28 m de profundidad visible. Su base se apoya en el suelo exterior, no en el adarve. La fotografía no permite distinguir con certeza el material del fondo; se representa cerrado y oscuro. No se ofrece como acceso transitable.

### Nido

La cámara conserva la huella cartográfica, aproximadamente 3–3,5 m de extensión. Su suelo se sitúa localmente respecto al terreno final y las paredes tienen una altura de visualización de 1,38 m, con cresta irregular. Se crea un hueco verdadero en la malla del terreno. No se añade cubierta, arma, caserna ni prolongación del corredor acodado del croquis, cuya posición no está registrada en planta. La pequeña apertura trasera es una lectura interpretativa; su orientación exacta permanece menos segura que la ubicación de la cámara. La adscripción moderna/contemporánea del nido está respaldada por el inventario municipal.

### Muralla exterior

Se siguen los tres trazados actuales, incluidos los pliegues y retornos. La suma de sus longitudes es de unos 205,7 m. El tramo restaurado principal usa coronaciones horizontales por paños, variaciones de cota con el suelo, fábrica mixta y merlones sólidos sin aspilleras. El enlace superior y la continuación inferior conservan remates más bajos o rotos; no se extiende una almena continua por toda la ladera. No se construye un recinto antiguo desaparecido ni se le adjudica una fase única.

El portillo alto tiene una separación cartográfica de 1,82 m y el bajo de 1,40 m. No se rellenan. La fotografía del portillo no basta para registrar una bóveda concreta sobre uno de los dos huecos, por lo que no se les inventa un arco nuevo. La escalera fotografiada en el pliegue angular tampoco se implanta en una posición sin identificación suficiente.

## Verificación

`exterior-check.mjs` construye el modelo compartido contra la malla final del Atlas y comprueba los defectos concretos: ausencia del semicírculo antiguo, coincidencia exacta de los extremos nuevos, selección acotada del perímetro, rayos por ambos huecos del camino, rayo vertical hasta el suelo del nido abierto, alturas bajas del nido y geometría finita sin caras degeneradas. El resultado se guarda en `exterior-qa.json`.

La comprobación inicial contiene 7.109 triángulos y 19 mallas de los componentes exteriores; 445 muestras de base no quedan por encima del suelo. Una segunda comprobación de las aristas reales de los pies, incluyendo el espesor y el ensanchamiento de base, detectó y corrigió una separación local de 19 cm en el enlace alto. Tras el ajuste sólo de la cimentación enterrada, las 520 aristas y 2.600 muestras no presentan huecos; la peor muestra queda 0,385 m bajo el terreno final. La comprobación final incluye 170 muestras de pies de hormigón, con una penetración mínima de 0,55 m, y un rayo de control del suelo del acceso. El pequeño corte de terreno de la entrada se cierra con una franja de tierra inclinada, sin prolongar el corredor histórico. Se excluyen árboles procedurales grandes en corredores estrechos junto a la muralla para evitar que sus copas invadan la fábrica; no se cambia la cartografía de vegetación. Los renderizados de inspección usan las mallas reales exportadas y se revisan por separado. Una imagen de Cycles no se presenta como captura del navegador.
