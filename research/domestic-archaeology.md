# Vía del Pòrtic y Domus dels Peixos: fuentes y criterios del modelo

## Alcance y representación

Esta iteración añade dos modelos procedurales Three.js. Sus dimensiones principales proceden de publicaciones arqueológicas, y su posición urbana se ajusta a solares cartografiados en OpenStreetMap. No son escaneos, ni se dispone de un levantamiento tridimensional de las excavaciones vinculado al datum vertical del terreno IGN. Las profundidades internas, los alzados perdidos y el trazado fino no deben usarse como medidas patrimoniales de precisión.

Cada monumento expone tres grupos: `remains` (lectura de la excavación), `reconstruction` (una fase histórica elegida y autosuficiente), `hypotheses` (complementos conjeturales, en turquesa translúcido). La cubierta está separada y se devuelve mediante `roofs: [{object: roof}]`. El modo histórico debe ocultar los restos; estos últimos reúnen huellas que no pertenecen a un único momento.

## 9. Vía del Pòrtic

### Fuentes primarias inspeccionadas

1. Melchor Monserrat, J. M.; Benedito Nuez, J. (2004), «La excavación del solar de la calle Huertos–calle Alorco–Plaza Morería de Sagunto: avance de resultados», *ARSE* 38, pp. 63–80. [PDF](https://www.centroarqueologicosaguntino.es/uploads/descargas/396_04_la_excavacion_del.pdf). Texto, croquis por zonas en p.75 y fotografías de calzada/pórtico en p.79.
2. Melchor Monserrat, J. M.; Benedito i Nuez, J. (2005), «La excavación del solar de la Plaça de la Moreria Vella (Sagunto, Valencia) y la Saguntum romana», *ARSE* 39, pp.11–34. [PDF](https://centroarqueologicosaguntino.es/wp-content/uploads/2018/09/381_03_la_excavacion_del_solar.pdf). Secciones de calzada, podio y ocupaciones posteriores; vistas cenitales en p.30. La página de lámina29 aparece vacía en el PDF obtenido: no se ha supuesto que contuviera una planta legible.
3. Melchor Monserrat et al. (2004), «El monumento funerario del solar de la Morería (Sagunto). Avance arqueológico y antropológico», *ARSE*38, pp.113–167. [PDF](https://www.centroarqueologicosaguntino.es/uploads/descargas/398_06_el_monumento_funerario.pdf). Formas de los loculi y ejemplos medidos.
4. Ayuntamiento de Sagunto, [mejoras de accesibilidad](https://aytosagunto.es/es/actualidad/sagunto-inaugura-las-mejoras-de-accesibilidad-en-la-via-del-portic/), 4-11-2022. Confirma la musealización bajo dos edificios y la pluralidad de fases.

### Datos representados

Se conservan 60 m de calle, con caliza gris y anchura variable (4,10 m al norte; 5–5,40 m en el sector porticado). La cloaca es un canal abierto de sección rectangular con 0,68 m de luz y más de1,20 m de profundidad; el modelo abre un tramo y mantiene el canal hueco. Los soportes del pórtico son pilares de sillería, no una sucesión de columnas marmóreas idénticas. Se representa el número publicado de16 apoyos y una distribución irregular simplificada.

El podio y sus cimientos se modelan en el sector oriental. El tramo publicado de24,35 m y la fábrica de1,53 m orientan la volumetría. No se afirma conocer el orden arquitectónico completo ni la divinidad del recinto. El alzado de ese edificio y el arco sobre la vía aparecen en el grupo opcional de hipótesis.

Las tumbas de incineración, dependencias posteriores y huecos de inhumación en la cloaca aparecen en la lectura de los restos. Las formas de los pequeños loculi se basan en las publicaciones, pero no se pretende restituir sus coordenadas individuales. La escena del sigloII omite las viviendas tardías y los enterramientos de la cloaca. Los ajuares y restos humanos retirados en excavación no se presentan como si siguieran expuestos.

### Posición y corte

El centro se ajusta al solar de OSM203064254: `[-0.27257375,39.67970795]`; el acceso museístico es un punto distinto, `[-0.2728361,39.6796023]`. Corte rectangular de36×68 m, giro−0,50 rad. El pavimento romano se coloca3,45 m por debajo de la superficie del modelo y el fondo de corte4,95 m por debajo. Estas dos últimas cotas son aproximaciones visuales para el sótano, no medidas extraídas de una sección topográfica.

## 10. Domus dels Peixos

### Fuentes primarias inspeccionadas

1. Antoni, C.; Hernández, F. J.; de Antonio, J. M. (2002), «Notícia preliminar de les excavacions de la domus romana del solar del cinema Marvi (Sagunt)», *ARSE*36, pp.99–116. [PDF](https://centroarqueologicosaguntino.es/wp-content/uploads/2018/09/321_06_noticia_preliminar.pdf). Se han inspeccionado el texto completo, la fotografía general, el esquema de planta(fig.8), los fragmentos de pintura y la columna. Es la base geométrica principal.
2. Peñalver Carrascosa, T. (2014), «Estado de la cuestión sobre la vivienda urbana romana en el área valenciana», *SAGVNTVM*46, DOI10.7203/SAGVNTVM.46.3816. [Repositorio UV](https://roderic.uv.es/bitstream/10550/42535/1/3816.pdf). Se consultó el texto indexado; el acceso directo al PDF devolvió un bloqueo. Su referencia a Antoni et al. como2006 se contrasta con el ejemplar original de ARSE36/2002.
3. Hurtado Mullor, T. (2021), «Hallazgos numismáticos en una domus de Saguntum. La Casa dels Peixos», *XVI Congreso Nacional de Numismática*, pp.311–330. [Publicación del MNAC](https://www.museunacional.cat/pdf/Interactivo_XVI_CONGRESO_NACIONAL_DE_NUMISMATICA_1r_TOMO.pdf). Se consultó el texto indexado para la secuencia: construcción al final delI/inicio delII, reformasII–III y abandonoIV. El PDF completo no pudo descargarse desde el entorno.
4. Civera i Gómez, M. (2004), «Aproximació a l'evolució urbana del Saguntum antic», *ARSE*38. [PDF](https://www.centroarqueologicosaguntino.es/uploads/descargas/397_05_aproximacio_a.pdf). Su referencia a restos aproximadamente a1m bajo la calle orienta la implantación vertical.

### Datos representados

El esquema mantiene el eje de vestíbulo, atrio y tablinum, con tienda y cocina al norte y baño contiguo. Las dimensiones publicadas se conservan: atrio7,31×3,50 m; impluvium exterior4,22×2,46 m e interior3,06×1,56 m; tablinum4,26×5,50 m; cocina3,44×3,70 m; balneum1,94×1,36 m. El umbral principal tiene una luz de2,24 m.

El nombre de la casa procede de pinturas de peces y otros motivos marinos sobre el enlucido del estanque. **No hay un mosaico figurado de peces** en este modelo. Existe una pequeña zona de pavimento de terracota en espiga; no se extiende ese acabado al conjunto de la casa. Los motivos pintados se dibujan de nuevo, inspirados en el tema conservado: no son fotografías ni calcos de los fragmentos.

El tablinum conserva en la publicación un esquema de zócalo de imitación marmórea, paneles verdes y separaciones rojas con filetes claros. Estos colores guían la restitución. La distribución exacta de paneles y las dimensiones superiores no están documentadas. Se distinguen huellas de columnas y un fuste caído; apoyos adicionales de una cubierta completa se añaden solo como hipótesis.

La identificación de la cocina se apoya en recipientes. No se halló un hogar fijo, por lo que el posible equipamiento aparece únicamente entre las hipótesis. El baño no tiene hipocausto; no se ha añadido un sistema de termas. No se presume que se conozcan el cierre de la entrada, la extensión total hacia el norte y el sur, ni un jardín posterior.

### Posición y corte

Centro `[-0.27243885,39.67744781]`, ajustado al solar del cine Marvi / host OSM203064322. Corte de23×15 m girado−π/4. La orientación deriva del esquema con flecha de norte y del edificio moderno; conserva una incertidumbre mayor que la cartografía de las calles. Pavimento romano a1,15m bajo terreno; fondo del corte a1,80m. La puesta en relación de las cotas no reemplaza una topografía de excavación.

## Verificación

- Sintaxis del módulo y JSON válidos.
- Instanciación con Three.js r180 vendorizado y muestreador del terreno real.
- Sin posiciones/normales no finitas ni triángulos degenerados.
- Todos los vértices quedan dentro de la ventana de corte de su monumento en planta.
- Pòrtic:8 mallas visibles en restos;8 de reconstrucción y2 opcionales (incluida la cubierta separada).
- Domus:11 mallas visibles en restos;14 de reconstrucción y3 opcionales (tres de las14 son cubiertas). Los grupos excluyentes evitan dibujar las28 mallas almacenadas a la vez.
- Las cubiertas no forman parte del grupo de restos y se pueden abrir independientemente.
- Se generan renders CPU de la geometría para inspección; no equivalen a una prueba WebGL en navegador. La exportación de verificación conserva colores y geometría, no el resultado exacto de las texturas Canvas.

Los scripts y PDFs de trabajo en `research/domestic-sources` son referencias intermedias. Los recursos usados por la aplicación son el módulo JS y el JSON de metadatos; no se publican fotografías de artículos como activos del sitio.

## Comprobación del corte en contexto urbano

El integrador amplía la ventana visual de la Domus a la envolvente girada del edificio actual OSM203064322, con2m de margen, para levantar todas las fachadas que ocultan la excavación. Esa ventana mide aproximadamente29,61×34,52m; **no es la extensión excavada de la casa**, que se mantiene como referencia geométrica separada.

Se exportó la escena completa del comprobador integrado con el modo Corte y apertura máxima, aplicando a los triángulos los planos de los materiales, incluido el edificio desplazado. La cámara de Blender reproduce la matriz de proyección de Three.js con el mismo desplazamiento horizontal de pantalla. Se comprobaron nueve líneas de visión sobre el interior, sin oclusión del contexto sólido, y un0% de vértices del modelo fuera del encuadre. El ensayo inicial permitió detectar una superposición visual del bloque translúcido; el controlador se corrigió para desplazarlo alejándose de la cámara y permite ocultarlo.

El resultado se guarda en `research/qa-domus-context-cut.png`, con métricas en `research/qa-domus-context-results.json`. El render CPU omite las texturas cartográficas y las texturas Canvas; verifica geometría, posición, corte, transparencia y encuadre.
