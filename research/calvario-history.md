# Calvario de Sagunto y ermita de la Soledad

## Alcance de la iteración V12

Investigación cerrada el **19 de noviembre de 2026** para una visita virtual de **18 paradas, 5 ámbitos, 54 notas documentadas o interpretativas y 12 hitos cronológicos**. El contenido estructurado se encuentra en `dist/assets/data/calvario-visit.json`. Los identificadores de fuentes de este documento son los mismos que utiliza la visita.

El objeto de estudio es el Calvario del casco histórico de Sagunto, en la ladera del monte del Castillo. Se mantiene la denominación **ermita de la Soledad / Mare de Déu de la Soletat**, también conocida como ermita del Calvario. La advocación de la campana es distinta: los Dolores. El modelo representa un estado interpretado a partir de cartografía y referencias posteriores a la restauración de 2012; no equivale a una inspección material realizada en 2026. [cv-turismo, cv-campanario, cv-restauracion]

## Decisiones históricas que condicionan la representación

### Una fecha de inauguración, varias fases posibles

El catálogo de Manuel Civera **Matèria i ànima d’un poble**, publicado por el Centre Arqueològic Saguntí en 2010, sitúa la inauguración del Calvari de Santa Maria en **1854**, en su página 18. El mismo pasaje recuerda recorridos anteriores de la Pasión. Se comprobó la página escaneada y la portada de créditos: la carpeta web de 2023 corresponde al alojamiento del archivo, no a la edición. [cv-materia]

La fecha del recorrido no resuelve la del edificio. Campaners lo atribuye al siglo XVIII; Civera, en 2001, lo sitúa en la segunda mitad del XIX; la descripción turística utiliza una referencia a los siglos XVIII y XIX. La visita hace visible esta discrepancia. Para resolverla harían falta documentos de obra o una lectura estratigráfica publicada de sus fábricas. Ninguna restitución del atlas convierte 1854 en una fecha cierta de cada muro. [cv-campanario, cv-civera2001, cv-turismo]

### Estaciones religiosas y construcciones físicas

La Cofradía describe **catorce estaciones** en el vía crucis. La ficha turística identifica **tres hornacinas finales en la fachada**. Esos datos no constituyen por sí solos un censo georreferenciado de los pequeños cuerpos del camino. [cv-cofradia, cv-turismo]

El modelo dispone once representaciones de casalicios y tres nichos en el frente como composición interpretativa. No asigna una escena, número, inscripción o autor histórico a cada posición. Tampoco convierte los cuerpos repetidos en once construcciones documentadas individualmente. El panel de los Dolores conocido a través de la memoria de 2012 recuerda que existen iconografías que no deben mezclarse automáticamente con la secuencia del vía crucis. [cv-ceramica2012]

El texto de Civera de 2001 menciona doce pasos al comentar un poema. Esa cifra se conserva en la nota crítica de la fuente, pero no se utiliza como inventario del estado presente. Para la práctica ceremonial se adopta la cifra publicada por la entidad organizadora. [cv-civera2001, cv-cofradia]

### Cuidado, reparación y memoria material

La restauración de 2012 se documenta mediante declaraciones del arquitecto Francisco Ribelles: las catas y los análisis sustentaron la recuperación del acabado ocre con juntas blancas. Su despiece es una decoración del revestimiento, no evidencia de una fachada compuesta por grandes sillares ocres. La fotografía del artículo sirve para comprobar el aspecto general del frente. [cv-restauracion]

La memoria de la Cofradía de 2012 identifica una sustitución cerámica realizada por **Vicen Escrig** y explica el destino previsto para la pieza anterior. El texto se conserva en su tiempo verbal: una intención de incorporación a la colección no demuestra que el traslado se completara. [cv-ceramica2012]

## Arquitectura y materiales: de la evidencia al modelo

| Elemento | Base documental y decisión | Precisión declarada |
|---|---|---|
| Implantación de la ermita | Huella OSM 733104780, contrastada con el contexto cartográfico | Posición y contorno aproximados, no levantamiento arquitectónico |
| Recorrido | Curvas y conexiones del camino cartografiado | No se regulariza el zigzag en una figura geométrica ideal |
| Muros de terrazas | Trazas OSM y referencias del recinto | Se aproximan altura, juntas y espesor |
| Acabado blanco del recinto | Referencias visuales de la Cofradía y testimonio local | No se extiende el mismo tratamiento a todas las fases históricas |
| Frente de la ermita | Fotografía y noticia de la restauración de 2012 | Ocre y juntas claras; desgaste interpretado |
| Puerta, nichos y coronación | Descripción turística y fotografía | Relaciones formales, sin medidas comprobadas de cada moldura |
| Capillas, cubierta y cabecera | Descripción institucional y huella | Exterior legible; sin interior inventado |
| Campana | Ficha individual 2832 de Campaners | Dimensiones publicadas; soporte y detalles pequeños aproximados |
| Arbolado | Fotografías y ortofotografía | Carácter paisajístico, no inventario de ejemplares |
| Edificios vecinos | Catastro, OSM y alturas del atlas | Huellas registradas; huecos y acabados interpretativos |

Fuentes de la matriz: [cv-osm, cv-catastro, cv-terreno, cv-pnoa, cv-cofradia, cv-turismo, cv-restauracion, cv-campana].

### Lectura cromática de arquitectura y paisaje

La opción **«Leer arquitectura y paisaje»** comparte exactamente los cinco identificadores, rótulos y colores de `calvarioPeriods` en el modelo. Los tonos expresan ámbitos del recinto; la cronología permanece en las paradas y los hitos históricos, sin asignar fechas a los objetos por su color.

| Identificador | Rótulo del modelo y de la leyenda | Color |
|---|---|---|
| `route` | Camino y terrazas del Calvario | `#b6c593` |
| `hermitage` | Arquitectura de la ermita | `#d7b36b` |
| `ceramic` | Cerámicas y memoria devocional | `#7fb7c4` |
| `restoration` | Conservación y color recuperado | `#c99bba` |
| `landscape` | Paisaje y vegetación interpretados | `#80aa85` |

Los campos históricos `period` de las 18 paradas se mantienen independientes de esta leyenda. El campo `readingLayer` asigna el tema cromático de cada marcador del plano:

| Capa | Paradas |
|---|---|
| `route` | Conjunto, acceso, escaleras, zigzag, muros, explanada, vía crucis y Passió |
| `hermitage` | Portada, laterales y campana |
| `ceramic` | Casalicios, paneles cerámicos y hornacinas |
| `restoration` | Fachada restaurada |
| `landscape` | Cipreses, mirador y memoria |

Se verificó la coincidencia de las cinco claves, etiquetas y colores con la exportación del módulo, la pertenencia de las 18 paradas a esas capas y la conservación de todos sus valores históricos `period`, además de los 54 hechos, 12 hitos y 18 fuentes.

La descripción arquitectónica permite reconocer dos capillas por cada lado, ventanas entre contrafuertes, cubierta de teja y cabecera semicircular. La visita utiliza esas relaciones para explicar el exterior. No genera altares, mobiliario o una sección visitable que la documentación consultada no permite reconstruir con seguridad. [cv-turismo]

La campana ofrece una excepción útil al detalle aproximado: se publican diámetro de **25 cm**, altura de bronce de **20 cm** y peso estimado de **9 kg**, además de la atribución a **Juan Traver, Artana, 1860**. La fecha corresponde a esa pieza. La espadaña o el resto de la fábrica no se datan automáticamente por ella. [cv-campana]

## El lugar como práctica y como representación

La subida del Viernes Santo se explica con el relato de la Cofradía: salida desde la Sangre, tránsito por la judería y acompañamiento ceremonial. El relato se atribuye a la entidad y se diferencia de una reconstrucción visual de una procesión concreta. La publicación de 2012 aporta además una referencia de archivo a la nueva imagen del Nazareno que subió por primera vez en 1943. [cv-cofradia, cv-ceramica2012]

La **Passió en Viu** se trata como representación teatral contemporánea. La noticia municipal de marzo de 2026 permite contextualizar su recorrido urbano y su edición anunciada, sin convertir un anuncio en crónica de un acto ya celebrado. [cv-passio2026]

La conexión artística se conserva con dos evidencias independientes: la institución cultural paraguaya identifica **Calvario de Sagunto**, de **Santiago Rusiñol**, en el Museo Nacional de Bellas Artes de Asunción; el Ayuntamiento integra el lugar en la **Ruta Bru i Vidal**. No se atribuye al cuadro un año de ejecución que la fuente museística no proporciona. No se reproduce el poema. [cv-mnba, cv-brui]

## Organización de la visita

| Ámbito | Paradas e identificadores | Objetivo |
|---|---|---|
| La llegada y el desnivel | `calvario-conjunto`, `calvario-acceso`, `calvario-escalinata` | Situar el recinto y distinguir entrada y escaleras laterales |
| El camino y las terrazas | `calvario-zigzag`, `calvario-casalicios`, `calvario-ceramica`, `calvario-muros`, `calvario-cipreses` | Leer la construcción del paisaje y sus cuidados |
| La ermita de la Soledad | `calvario-explanada`, `calvario-fachada`, `calvario-portada`, `calvario-hornacinas`, `calvario-laterales`, `calvario-campana` | Observar los componentes del edificio a distintas escalas |
| La celebración y la escena | `calvario-viacrucis`, `calvario-passio` | Explicar dos usos diferentes del mismo recinto |
| Paisaje, arte y memoria | `calvario-mirador`, `calvario-memoria` | Relacionar la ladera con la ciudad y sus representaciones |

Los focos comparten coordenadas con el modelo y el plano. Algunos coinciden horizontalmente porque miran partes distintas de una misma fachada; sus identificadores y propósito son diferentes. El foco de cerámica señala un tipo de objeto y no pretende localizar exactamente la pieza de Vicen Escrig. La escalera lateral no se confunde con la fotografiada en la entrada en 1919. Las paradas describen observación virtual, no condiciones reales de acceso o movilidad.

## Referencias verificadas y localizadores

1. **cv-turismo** — Sagunto Turismo. [Ruta de las ermitas de Sagunto](https://saguntoturismoblog.wordpress.com/2015/09/30/ruta-de-las-ermitas-de-sagunto/). 30-09-2015; actualización de 25-10-2019. Apartado de la ermita de la Soledad. Fuente institucional de descripción arquitectónica.
2. **cv-cofradia** — Cofradía de la Purísima Sangre. [Subida al Calvario](https://semanasantasagunto.com/subida-al-calvario/). Relato de la práctica y fotografías de referencia. El directorio de imágenes de 2020 no fecha la toma.
3. **cv-restauracion** — Elperiodic.com, 04-04-2012. [Las ermitas de Sagunto recuperan su imagen original](https://www.elperiodic.com/sagunto/ermitas-sagunto-recuperan-imagen-original_167408). Declaraciones del arquitecto Francisco Ribelles. Fuente secundaria con testimonio directo del proyecto.
4. **cv-campana** — Campaners. [Campana 2832, Mare de Déu dels Dolors](https://campaners.com/php/campana1.php?numer=2832). Ficha individual, dimensiones y atribución de fundición. Se verificó también el resultado indexado de la relación de campanas de la ermita.
5. **cv-campanario** — Campaners. [Ermita 899, Mare de Déu de la Soletat o del Calvari](https://campaners.com/php/campanar.php?numer=899). La ficha del edificio y la de la campana son registros distintos del mismo conjunto.
6. **cv-civera2001** — Manuel Civera i Gómez. [Paleta de lluna de la Setmana Santa Saguntina](https://semanasantasagunto.com/wp-content/libros/llibre_2001_opt.pdf), *Llibre 2001*, pp. 99–110. Pasajes específicos: p. 102, poemario; p. 106, andanas; p. 108, muros; pp. 109–110, usos y cronología propuesta. Observación local y comentario literario se distinguen.
7. **cv-llueca2001** — Emilio Llueca Úbeda. [La vinculación de la familia Ribelles a la Semana Santa Saguntina](https://semanasantasagunto.com/wp-content/libros/llibre_2001_opt.pdf), *Llibre 2001*, pp. 84–85. Fotografía de acceso, p. 85, tomada por Vicente Peydró en 1919; Arxiu Llueca-Juesas d’Imatges de Sagunt.
8. **cv-materia** — Manuel Civera i Gómez. [Matèria i ànima d’un poble](https://centroarqueologicosaguntino.es/wp-content/uploads/2023/10/materia-i-anima-dun-poble.pdf). Centre Arqueològic Saguntí, 2010; p. 18, página 20 del PDF. Exposición en Casa Capellà Pallarès, febrero de 2010, con Fundació Bancaixa. Depósito legal V-387-2010.
9. **cv-ceramica2012** — Cofradía y Mayoralía. [Llibre de la Setmana Santa Saguntina 2012](https://semanasantasagunto.com/wp-content/libros/llibre_2012_opt.pdf). «La Junta informa», pp. 158–159, y reportaje gráfico, p. 315. Se consultaron el texto y sus localizadores; la imagen antigua no se redistribuye.
10. **cv-brui** — Ajuntament de Sagunt. [Calvari, Ruta Bru i Vidal](https://aytosagunto.es/es/el-municipio/ruta-bru-i-vidal/calvari/). Interpretación literaria, sin reproducción del poema.
11. **cv-passio2026** — Ajuntament de Sagunt. [La plaza Mayor albergará la XXIII representación de la Passió en Viu](https://aytosagunto.es/es/actualidad/2026-03-26-la-plaza-mayor-albergara-la-xxiii-representacion-de-la-passio-en-viu/), 26-03-2026. La fecha corresponde a la noticia.
12. **cv-mnba** — Secretaría Nacional de Cultura de Paraguay. [Museo Nacional de Bellas Artes](https://cultura.gov.py/2011/05/museo-nacional-de-bellas-artes/), 30-05-2011. Relación de obras de la colección española.
13. **cv-semanasanta** — Ajuntament de Sagunt. [Semana Santa](https://aytosagunto.es/es/el-municipio/fiestas/semana-santa/). Contexto institucional del patrimonio festivo.
14. **cv-acceso** — Col·lectiu pel Patrimoni Saguntí. [Crònica de la visita de la ruta d’Úrsula](https://pelpatrimonisagunti.blogspot.com/2013/02/cronica-de-la-visita-de-la-ruta-dursula.html), 24-02-2013. Testimonio del recorrido por el barrio, empleado con atribución.
15. **cv-osm** — Colaboradores de OpenStreetMap. [Ermita, huella 733104780](https://www.openstreetmap.org/way/733104780). El JSON incluye los identificadores de muros y escaleras utilizados.
16. **cv-catastro** — Dirección General del Catastro. [INSPIRE](https://www.catastro.hacienda.gob.es/webinspire/index.html), municipio 46222. Volumetría del contexto; condiciones de uso enlazadas en la ficha de fuente.
17. **cv-terreno** — IGN/CNIG. [Modelos de elevación](https://datos.gob.es/es/catalogo/e00125901-spaignmds-normalizado). Base del relieve y estimación de alturas; su resolución no acredita cotas de peldaños.
18. **cv-pnoa** — IGN/CNIG. [PNOA Máxima Actualidad](https://datos.gob.es/es/catalogo/e00125901-spaignpnoama). Referencia de cubiertas y ocupación; fecha de consulta y fecha de vuelo son conceptos distintos.

### Fotografías consultadas para el modelado

Se emplean como consulta visual y no como galería de la aplicación:

- [Fachada publicada en 2012](https://archivos.elperiodic.com/archivos/img/noticias/12-04/04/sagermitas2.jpg), asociada a la noticia de restauración.
- [Subida al Calvario, referencia 1](https://semanasantasagunto.com/wp-content/uploads/2020/02/subida-calvario-01-800x450.jpg) y [referencia 2](https://semanasantasagunto.com/wp-content/uploads/2020/02/subida-calvario-02-800x450.jpg), alojadas por la Cofradía.
- Fotografía de entrada de 1919, reproducida y atribuida en *Llibre 2001*, p. 85. Es archivo histórico, no prueba del estado posterior a 2012.

## Comprobación del contenido entregado

Se verificaron 18 identificadores de parada únicos; 54 hechos con referencias; 5 ámbitos que incluyen cada parada una vez; 12 hitos enlazados a paradas existentes; 18 fuentes con URL y localizador. No quedan identificadores de fuente sin resolver. Las coordenadas se tomaron del archivo común del modelador y se redondearon a ocho decimales, sin desplazar intencionadamente ningún foco. El JSON mantiene los campos del esquema de la visita previa a la judería y añade `readingLayer` a cada parada para separar la lectura cromática del período histórico.

Quedan declarados como interpretación la disposición individual de los casalicios, la iconografía esquemática, los pequeños elementos constructivos, los encuentros locales con el terreno y los acabados del caserío. La principal cuestión histórica abierta es la secuencia de fases de la ermita. Estas limitaciones se incorporan a las paradas afectadas y a la metodología, para que el mayor detalle visual no se confunda con una precisión documental inexistente.
