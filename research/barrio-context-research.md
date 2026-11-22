# Barrio Obrero — entorno urbano y control de procedencia · V29

## Alcance implementado

El contexto mejora el viario público de las siete manzanas del Barrio Obrero, el frente de la avenida del Nueve de Octubre, las calles del Poeta Llombart y de la Libertad, el cruce de las Casas de Compañía, los bordes de Palleter y Fornás y la plaza de la Independencia al norte de Luis Cendoya. Las calles, los edificios y el arbolado se apoyan en la cartografía ya conservada en el atlas y en una ortofoto PNOA registrada para esta iteración.

El modelo `barrio.js` conserva la arquitectura, los patios, los corrales, los jardines domésticos y los límites internos de las siete manzanas. Este módulo no añade suelo, muros, jardines ni árboles dentro de las viviendas, jardines o corrales. Dos bolsas de aparcamiento público comprobadas en la ortofoto cruzan parcialmente las reservas esquemáticas de las manzanas C/D: se documenta más abajo la excepción acordada con el propietario del modelo. Las partes catastrales propias que sobresalen de esos polígonos también quedan protegidas. Los edificios contemporáneos vecinos mantienen íntegramente sus huellas y huecos catastrales. El Sanatorio, la Gerencia, el Casino y los demás conjuntos del atlas conservan sus propietarios y modelos anteriores; el contexto del Barrio no los duplica ni los reconstruye.

Se incorporan 370 partes catastrales de 139 referencias vecinas, 14 tramos de ejes viarios, aproximadamente 15.609 m² de pavimentos, 27 árboles registrados en la foto, nueve posiciones de pasos peatonales, 53 líneas de bordillo y una capa contenida de mobiliario interpretado en la plaza de la Independencia. Esas cifras describen geometrías de la aplicación: **no son un recuento de viviendas originales**.

## Fuentes y lectura de las láminas

### Catálogo municipal del Puerto de Sagunto

Documento: [Ayuntamiento de Sagunto, Catálogo de protección del patrimonio arquitectónico y urbanístico, parte 2](https://aytosagunto.es/media/u1ip2u2f/03-97_catalogo_proteccion_patrimonio_puerto_sagunto_2-de-9_opt.pdf).

La sección del Barrio Obrero se encuentra en las páginas PDF 77–96. La numeración es la del archivo completo, empezando en uno, no la numeración impresa de las fichas. Se revisaron las imágenes originales de las láminas, ya que el texto extraído automáticamente confunde algunos planos y denominaciones.

| Página PDF | Contenido usado | Consecuencia en el contexto |
| --- | --- | --- |
| 78 | Implantación entre Av. 9 d’Octubre y C. Fornás, trazado de siete bloques | Mantener la organización longitudinal y la relación con los bordes actuales |
| 79 | Viales y espacio público del proyecto original | Leer la antigua plaza central como dato histórico, sin reproducirla como estado actual |
| 81 | Transformaciones: eliminación del espacio libre de la plaza, sustitución de ocho viviendas y eliminación de patios delanteros a la avenida | No añadir una fuente, plaza histórica intacta o sucesión idealizada de jardines delanteros en 9 d’Octubre |
| 82, ficha 3.1 | Secciones globales S1/S2 de la relación vial/edificación | S1: aceras de 1,30 m + calzada de 4,40 m + acera de 1,30 m, total 7 m; patios de 3,50 m. S2: bandas de 1,25 + 4,60 + 1,25 m. Se usan como proporción histórica, no como medición actual |
| 83–85 | Fotografías de las calles y fachadas | Vivienda baja seriada, diferencias posteriores y arbolado doméstico contenido |
| 86 | Plano de las siete manzanas | A/B en la fila norte, C/D en la central, E/F hacia la avenida, G al este de Fornás |
| 87–96 | Tipos, secciones y normativa | Apoyo al modelador; no se convierten en un levantamiento de los interiores actuales |

La ficha 3.1 (página 82) sí contiene cotas verticales legibles: 3,70 y 7,30 m en S1; 7,00 m en S2. Las páginas 79 y 80 no son planos de alturas: son viales y usos, respectivamente. Esta distinción evita una atribución incorrecta de las cotas.

La tabla municipal indica 112 viviendas; otras publicaciones divulgativas indican 115. No se usa una cifra única de viviendas históricas como hecho incontrovertido. Tampoco se identifica la fecha de una referencia catastral con la fecha histórica de la casa.

### PNOA / IGN

[Ortofoto retenida del entorno del Barrio Obrero](https://www.ign.es/wms-inspire/pnoa-ma?service=WMS&version=1.3.0&request=GetMap&layers=OI.OrthoimageCoverage&styles=&crs=EPSG%3A4326&bbox=39.6603%2C-0.22745%2C39.663%2C-0.22225&width=2600&height=1800&format=image%2Fjpeg).

El original se conserva en `research/validation-v29/barrio-context-orthophoto-reference.jpg` con 2600 × 1800 píxeles. Extensión geográfica: oeste −0,22745; este −0,22225; sur 39,6603; norte 39,663. Descarga: 21 de noviembre de 2026. La fecha de descarga **no** se presenta como fecha de vuelo ni como comprobación presencial del estado de las calles en noviembre de 2026.

La plaza arbolada visible al norte de Luis Cendoya se denomina plaza de la Independencia en los ejes OSM conservados. Es una pieza distinta de la plaza original del Barrio, situada entre los bloques centrales y perdida según el catálogo. La escena mantiene esta distinción espacial e histórica.

Los centros de las copas se registran manualmente como píxeles y se convierten a coordenadas geográficas. La especie botánica no se afirma. Altura, volumen de copa y mobiliario se interpretan para la visualización. La copa completa se reduce cuando lo exige la distancia real a una fachada; no se desplazan los troncos para mejorar la composición.

### Catastro, IGN MDS y OpenStreetMap conservados

Las geometrías de `port-cartography.json` se conservan completas: coordenadas, huecos, referencia y parte. Los edificios próximos se toman como partes completas dentro de un ámbito de aproximadamente 34 m alrededor del conjunto, ampliado para incluir la plaza de la Independencia. Los edificios ya gestionados por otro contexto o modelo histórico no se vuelven a dibujar.

Las alturas exteriores usan las estimaciones IGN previamente incorporadas al atlas o, si faltan, el número de plantas atribuido. Los ritmos de ventanas, remates y color de fachada de esos edificios vecinos son recursos de representación, no un levantamiento medido de sus fachadas.

Los ejes OSM no se modifican. Se guardan los ejes de origen completos en cada tramo contextual para permitir la auditoría; únicamente el ancho de visualización es aproximado. Los tramos originales completos solo se excluyen del render genérico cuando el nuevo contexto cubre realmente todo el eje. El resto se mantiene y se recorta mediante las máscaras locales de espacio público.

### Lecturas de apoyo

- [CONTRAST/APIPS — Barrio Obrero](https://www.contrastapips.com/IHACM/IBP/Port/Port_patri_barri.htm): casas de la Compañía, jardines y corrales, fotografías históricas y actuales. Se coteja con el catálogo y no se toma su cifra de 115 viviendas como única cifra documental.
- [Universitat de València — La siderurgia de Puerto de Sagunto](https://paisajesturisticosvalencianos.com/paisajes/la-siderurgia-puerto-sagunto/): relación del tejido residencial con la ciudad industrial. El contexto conserva esa lectura territorial, sin extender la reconstrucción detallada a otros monumentos.

## Registro geométrico y propiedad

El generador reproducible es `research/validation-v29/prepare_barrio_context.py`. Sus exclusiones se forman antes de dibujar el suelo:

1. Unión de los siete polígonos de manzana, descontando exclusivamente los dos bolsillos públicos aprobados de C/D, y todas las partes propias del Barrio, incluidos los salientes de las huellas respecto a los bloques esquemáticos. Se suman explícitamente todos los jardines y corrales domésticos.
2. Edificios próximos, con sus huecos interiores.
3. Superficies previamente dibujadas por Horno, Talleres, Museo Industrial, Gerencia, Casino, Begoña y Economato.
4. Otros monumentos y conjuntos patrimoniales existentes.

Las cuatro familias de superficie pública —calzada, aceras, plaza y alcorques— se recortan a regiones disjuntas y después se intersecan con los triángulos de la cuadrícula de terreno de 5 m del atlas. No se interpone una gran plataforma plana sobre el terreno ni se ponen caras de suelo coincidentes con fachadas.

No hay transferencias de geometría ni cambios en contextos anteriores. Se aprobaron dos excepciones a la reserva nominal de las manzanas C/D, que no estaban dibujadas por el modelo doméstico. Sus hashes se registran y verifican. No se modifican `port-cartography.json`, `port-elevation.json` ni los otros modelos.

## Corrección de continuidad pública tras revisión del render

La vista integrada de calles mostró dos manchas de ortofoto en las cabeceras C/D. El contraste con la PNOA confirma que corresponden a aparcamientos y aceras públicos de las Casas de Compañía. La máscara nominal de C los reservaba íntegramente al modelo, aunque este no los dibujaba; D incluía parte de la acera y la anchura del viario contextual no alcanzaba todo el aparcamiento.

El candidato `barrio-public-heads-candidate.jpg` registra visualmente la decisión. `barrio-public-heads-approved.json` conserva las coordenadas y el acuerdo del modelador y de integración. Los dos polígonos suman 482,10 m²; la cobertura nueva efectiva es de aproximadamente 418,73 m² una vez descontados pavimentos ya existentes, arquitectura y márgenes. Se añaden calzada de aparcamiento, acera, delimitación de plazas y bordillos. Solo 361,33 m² de la geometría final cruzan las envolventes nominales de bloque y todo ese cruce queda dentro de las excepciones aprobadas.

Se restaron todas las huellas catastrales, jardines y corrales, con 0,18–0,20 m de resguardo en la propuesta. La comprobación posterior es cero intersección con geometría doméstica, cero invasión no aprobada de las manzanas y cero solape con otros contextos. No se restituye una plaza o fuente histórica. Una pequeña mancha al oeste del conjunto, cuya foto cae dentro del tejido de una parcela contemporánea, no se rellena por carecer de evidencia de uso público.

La misma revisión localizó cancelas elevadas hasta 0,90 m sobre la acera final. El contexto ya seguía el terreno posterior a todos los ajustes de cimentación. La causa era el datum doméstico obtenido del centro de cada casa, que difería de la rasante pública. El propietario de `barrio.js` corrigió el datum frontal y adaptó jardines/cancelas al terreno final. `initial-barrio-ground-edge-probe.json` conserva la medición inicial y `barrio-ground-edge-probe.json` la comprobación corregida. Este contexto no añadió rellenos ni plataformas para ocultar aquel desnivel.

La inspección de vértices detectó después que dos jardines grandes todavía conservaban solo dos triángulos superiores y atravesaban el terreno hasta 15,60–16,57 cm entre sus esquinas. El modelador subdividió suelos y caminos a celdas de como máximo 0,40 m y limitó su rasante inferior frente al terreno. La comprobación final, con `barrio.js` SHA256 `ce04bd68202eef36c976f3d34308bb7af56ab5aa0d1517e7f39999275f6814db`, inspecciona los 53 jardines, 15.150 triángulos superiores de suelo y 1.818 de caminos: no encuentra penetraciones en los vértices, puntos medios y centroides muestreados. Los 4.770 vértices inferiores de las 53 cancelas difieren como máximo 6,08 mm de la rasante por el espesor de sus barrotes, dentro del centímetro de tolerancia de la prueba. Esta validación inspecciona geometría renderizada, además de los datos de cotas.

## Cinco paradas del contexto

| ID | Lectura | Coordenadas objetivo | Capa |
| --- | --- | --- | --- |
| `barrio-accesos` | Acceso desde 9 d’Octubre | −0,225766; 39,661392 | Entorno |
| `barrio-calles` | Cruce de las Casas de Compañía y calles interiores | −0,225438; 39,6618285 | Entorno |
| `barrio-arbolado` | Plaza de la Independencia y arbolado público | −0,225020; 39,662247 | Entorno |
| `barrio-frente-urbano` | Frente transformado de la avenida | −0,225212; 39,661140 | Entorno |
| `barrio-ciudad-factoria` | Implantación del barrio en el Puerto | −0,2254082; 39,661704 | Memoria |

Los puntos de vista se ajustan al terreno final y evitan colocar la cámara dentro de un edificio o una copa. La parada territorial utiliza una vista alta del contexto existente; no incorpora edificios nuevos fuera del ámbito acordado.

## Verificación

`barrio-context-geometry-validation.json` comprueba cero solape de suelo con las partes domésticas, las zonas privadas de las siete manzanas y los contextos previos; control explícito de las dos excepciones públicas C/D; cero identificadores catastrales duplicados; conservación exacta de huellas y huecos; ausencia de troncos dentro de edificios y cobertura de triangulación, con error numérico inferior a una millonésima de metro cuadrado en las últimas comprobaciones.

`validate_barrio_context.mjs` comprueba geometría Float32 finita sin triángulos colapsados, ajuste del pavimento al terreno real del atlas, copas fuera de la arquitectura, cámaras por encima del suelo y las copas, correspondencia de capas de lectura, cambio reversible de materiales, selección de los cinco focos, liberación de recursos y repetición de `bindGround` sin acumular mallas. La última ejecución local tiene 18 mallas y aproximadamente 149.000 triángulos. La guía y la escena integradas se vuelven a comprobar con la versión final por el agente principal.

Las imágenes `barrio-context-road-survey.jpg`, `barrio-context-ownership-survey.jpg` y `barrio-context-source-overlay.jpg` permiten contrastar límites, ejes viarios y geometría dibujada sobre la misma fotografía de referencia. Son evidencia de alineación cartográfica, no capturas del render de producción.
