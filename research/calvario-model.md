# Calvario y ermita de la Soledad — modelo V12

## Alcance

Visita exterior de la ermita, el camino del Calvario y sus terrazas, integrada con el caserío próximo y con las visitas existentes. Se conserva el edificio cartografiado como OSM `733104780`, el camino en zigzag de 50 nodos, ocho líneas de muros y los accesos escalonados. El recinto usa el relieve IGN del atlas. Los detalles se orientan a vistas orbitales y próximas; no constituyen un levantamiento fotogramétrico ni un sistema de circulación peatonal.

La aplicación ofrece 18 paradas con sus coordenadas, tres modos de consulta —recorrido, cronología, fuentes— y una lectura cromática de las partes. El grupo `site.userData.vegetation` permite ocultar la vegetación propia con el control general de capas.

## Referencias y decisiones de modelado

### Ermita

La [descripción de Turismo Sagunto](https://saguntoturismoblog.wordpress.com/2015/09/30/ruta-de-las-ermitas-de-sagunto/) identifica una planta casi cuadrada, capillas laterales, contrafuertes con tejadillos, ventanas rectangulares, cubierta de teja a dos aguas, cornisa barroca, pequeña espadaña y tres hornacinas de las últimas estaciones del vía crucis. Se ha modelado ese conjunto exterior sin inventar un interior visitable.

El frente norte del polígono cartográfico mide aproximadamente **11,10 m**. Su orientación se deriva de sus dos vértices, con yaw **−0,4403 rad** en las coordenadas del atlas: la fachada mira aproximadamente al nordeste. La parte rectangular tiene unos 7,19 m de fondo y el ábside cartografiado alcanza unos 10,11 m desde el plano de fachada. Esas medidas describen la geometría de la fuente, no una medición nueva in situ.

Las elevaciones arquitectónicas son estimaciones visuales: alero principal a 6,15 m sobre la base, cumbrera a 7,70 m, fachada con perfil mixtilíneo y pequeña espadaña. El dato MDSnE disponible aporta una referencia de altura de 8 m para la huella. La fachada, tejadillos y campanario se tratan separadamente para conservar su silueta.

### Color recuperado

La [información de la restauración de 2012](https://www.elperiodic.com/sagunto/ermitas-sagunto-recuperan-imagen-original_167408) recoge las catas y las explicaciones del arquitecto Francisco Ribelles: el frente recuperó sillares ocres y juntas blancas dibujadas sobre el revestimiento. La [fotografía publicada](https://archivos.elperiodic.com/archivos/img/noticias/12-04/04/sagermitas2g.jpg) se inspeccionó como referencia.

Por ello, el modelo distingue el frente ocre de los paramentos laterales blancos. Las juntas del frente tienen relieve mínimo; representan un **esgrafiado/revestimiento**, no grandes bloques pétreos salientes. Las hornacinas tienen fondo blanco, marcos claros y pequeñas piezas cerámicas retranqueadas. La puerta gris de dos hojas es rectangular, con un tímpano blanco dentro del arco de medio punto, de acuerdo con la fotografía de la restauración; no se le han añadido rejas ni tablones decorativos. Los peldaños se representan en piedra clara. Los paramentos incorporan grano de revoco mediante mapas Canvas y un relieve superficial discreto.

### Campana

La [ficha de Campaners, campana 2832](https://campaners.com/php/campana1.php?numer=2832) da **25 cm de diámetro y 20 cm de altura**, fecha 1860 y fundidor Juan Traver. La campana conserva esas dimensiones en el modelo. El tamaño del hueco, el yugo y la colocación se estiman visualmente. El ojo de la espadaña es una abertura geométrica real, no una superficie oscura aplicada encima de un muro macizo.

### Camino, muros y estaciones

El artículo de Manuel Civera, «Paleta de lluna de la Setmana Santa Saguntina», en el [Llibre de la Cofradía de 2001](https://semanasantasagunto.com/wp-content/libros/llibre_2001_opt.pdf), pp. 99–110, explica las andanas, las curvas, los cipreses y la roca viva. También describe la evolución de las carxates desde piedra seca a muros rejuntados y encalados. Las fotografías de la [Subida al Calvario publicadas por la Cofradía](https://semanasantasagunto.com/subida-al-calvario/) muestran muros blancos de mampostería irregular, pavimento terroso y cipreses estrechos de copa rugosa.

Las ocho líneas de muro se mantienen en sus coordenadas de origen. La altura expuesta, el grosor y el detalle de mampostería son estimados; el fondo de los muros se prolonga bajo el relieve para evitar piezas suspendidas. La superficie de los caminos se adapta al terreno final, incluidos los cambios introducidos por la base de la ermita. Su pequeño resalto se cierra en ambos bordes y extremos mediante cantos que penetran en el terreno, también en la explanada. Esos cierres eliminan la línea de aire visible bajo la cinta de pavimento en la inspección próxima; se conservan exactamente las posiciones de la superficie superior.

La Cofradía documenta **14 estaciones**. Turismo Sagunto describe **tres hornacinas finales en la fachada**. El modelo utiliza **11 representaciones de casalicios y esas tres hornacinas como composición interpretativa**, sin presentar los 11 emplazamientos como un inventario topográfico verificado. Los paneles cerámicos se sugieren con formas y colores discretos; no reproducen fotografías ni atribuyen una pintura concreta a una posición inventada. El recorrido distingue además las cerámicas de los Dolores de la Virgen de una numeración automática del vía crucis.

### Vegetación y roca

Los cipreses se representan mediante volúmenes irregulares superpuestos, troncos y ramas; no mediante conos idénticos. La revisión próxima llevó a aumentar moderadamente la subdivisión y a compartir normales entre vértices coincidentes de la copa, evitando grandes facetas triangulares sin perder una silueta irregular. La distribución individual y la altura son aproximadas. La presencia de cipreses sí está respaldada por el artículo de Civera y las imágenes de la Cofradía. El matorral y las pequeñas rocas ofrecen una lectura del terreno y no un inventario botánico.

## Adaptación al relieve

El MDT de la huella varía aproximadamente de 85,44 a 89,42 m. La base de la ermita se sitúa en una plataforma interpretada desde la cota del frente. Sólo la huella del edificio aporta un parche de cimentación; las casas del contexto no introducen parches planos.

El primer muestreo de los peldaños encontró huecos bajo las placas iniciales de entre 0,14 y 0,71 m. Se sustituyeron por cuerpos sólidos que descienden al menos 0,30 m bajo el terreno de sus esquinas. La última huella llega a 2 cm de la base de la portada. La inspección del render también detectó hasta 0,30 m de aire bajo el borde exterior del paño frontal. Su cimentación se prolongó 0,40 m bajo la menor cota del borde. La validación posterior muestrea las dos caras de todos los paños exteriores a intervalos máximos de 25 cm, incluidos ambos extremos de la fachada y los laterales. El número, anchura y contrahuella de estos ocho peldaños son aproximaciones visuales, no dimensiones levantadas.

`bindGround()` aplica el terreno final a pavimento, muros y plantación. El pavimento se muestrea por caras y aristas, además de sus vértices, para detectar superficies enterradas entre muestras. El relieve de origen no se altera para nivelar el conjunto del Calvario. Sólo se excluyen del pavimento general las tres vías realmente reconstruidas: el zigzag `733321149` y las escaleras `733321150` y `1419281599`. Los otros cinco ejes de acceso se conservan en el sistema general; esto mantiene completo el camino `733321154`, que continúa hacia el Castillo fuera del recinto.

## Recursos y control de la visita

- `dist/js/calvario.js`: núcleo, materiales, geometría y focos.
- `dist/js/heritage-sacred.js`: integración con el contexto y con los otros templos. La antigua fábrica simplificada del Calvario se ha retirado.
- `dist/assets/data/calvario-plan.json`: plano derivado de la misma geometría y posiciones de los 18 focos.
- `createCalvarioContext`: módulo independiente con huellas del caserío y accesos exteriores. Véase `research/calvario-context.md` para las fuentes y limitaciones de ese ámbito.
- Cada instancia conserva recursos propios en `ownedResources`; los cambios de foco y de lectura recuperan las texturas y colores originales.

## Validación y renderizados

La comprobación reproducible está en `research/validation-v12/validate_calvario_model.mjs`. Comprueba atributos finitos, correspondencia de las 18 paradas con el modelo, referencias, huecos del acceso y de la espadaña, cobertura de cubierta, pavimento frente al terreno final, apoyos de escalera, restauración de materiales y **108 encuadres** de las paradas en escritorio y dos tamaños móviles.

El exportador conserva posiciones, normales, índices, UV, colores por vértice, transformaciones y materiales de las mallas Three.js. Exporta también los mapas Canvas usados por esos materiales. Los renderizados se realizan con Blender/Cycles por CPU, sin añadir edificios o elementos arquitectónicos de presentación. Incluyen los modelos previos del Castillo y del Teatro para dar contexto.

El entorno de Blender no incluye OpenImageDenoise. Los borradores usan 12 muestras; los definitivos usan 128 muestras. Estos PNG son inspecciones del modelo y no capturas de WebGL. No acreditan rendimiento GPU, fluidez en un móvil concreto ni identidad exacta entre los motores de iluminación.

El núcleo supera **494 comprobaciones**, incluidas las 108 cámaras, 31.784 muestras de las superficies de pavimento, 344 muestras de apoyo de los once paños de fachada y laterales, y 8.062 muestras de los cantos del pavimento. Las cimentaciones quedan al menos 0,413 m bajo el terreno; los cantos, al menos 0,307 m. La comparación de posiciones confirma que el cierre de los cantos no modifica ninguno de los vértices superiores del pavimento.

El conjunto del núcleo y el contexto contiene 219 mallas y 265.918 triángulos. Estos recuentos son métricas de geometría, no una garantía de rendimiento en dispositivos concretos.

Los resultados y hashes definitivos se recogen en `calvario-model-qa.json` y `calvario-visual-review.json`, dentro de `research/validation-v12`.
