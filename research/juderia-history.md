# Judería y Portalet de la Sang · investigación V11

Fecha de consulta y edición: **19 de noviembre de 2026**.

## Entrega y alcance

La visita contiene **16 paradas, 48 notas con fuente y grado de certeza, 16 hitos enlazados a paradas, 5 ámbitos y 21 referencias**. El contenido público se encuentra en `dist/assets/data/juderia-visit.json`. Combina historia del barrio, lectura arquitectónica y trayectorias de personas documentadas. Los focos temáticos permiten explicar la vida de la comunidad sin adjudicar sus protagonistas a viviendas que no se han identificado.

Se mantiene la distinción entre el barrio conservado, los edificios vecinos ya presentes en el atlas y las interpretaciones históricas. La visita utiliza cámaras exteriores. Las fotografías se consultan como referencias de forma y materiales; no se publican galerías ni se copian como texturas.

## Decisiones que afectan al modelo

| Cuestión | Decisión aplicada | Evidencia o criterio |
|---|---|---|
| Portalet de la Sang | Arco de medio punto, fábrica pétrea irregular, paños enfoscados blancos y paso abierto entre viviendas. | Fotografías municipales de 2020 (`jd-portal-placa`) y galería `jd-rutas`. |
| Arco frente al museo | Elemento independiente del Portalet, con su propia geometría y foco. | Itinerario `jd-xiuxiueig`, fotografía de `jd-rutas` y dos huellas OSM distintas. |
| Fecha del acceso | El permiso de cierre de 1321 no se convierte en fecha exacta de toda la fábrica actual. | Diferencia entre un acto documentado y la datación material de cada parte. |
| Fachadas domésticas | Volúmenes registrados y acabados interpretados, sin atribuir una casa a una familia medieval por proximidad. | Catastro, relieve y referencias visuales de fechas diferentes. |
| Sinagoga | El desacuerdo historiográfico sigue visible; no se asigna una planta completa ni se construye un interior. | Comparación de `jd-lacave1990` y `jd-civera2003`. |
| Posible micvé | Punto exterior junto a Berenguer, sin piscina ni sección hipotética. | La documentación municipal y la Diputación conservan la cautela de la atribución (`jd-placas`, `jd-dival`). |
| Mezuzá | Lectura doméstica sin copiar el hueco en una vivienda no identificada. | Las referencias institucionales discrepan sobre el número de la portada; se conserva la discrepancia (`jd-cid`, `jd-xiuxiueig`). |
| Refugio de 1391 | Punto situado en el extremo del barrio, con una mirada hacia el castillo. | Relación histórica documentada, sin inventar un trayecto preciso ni duplicar la visita de la fortaleza. |
| Necrópolis e hipogeos | Se explica la relación territorial y se mantiene su localización arqueológica independiente. | Evita trasladar al barrio residencial elementos que pertenecen a la ladera. |
| Corte del edificio | No se ofrece en esta iteración. | Los datos disponibles no justifican una restitución interior que pueda observarse al retirar un suelo o cubierta. |

El relieve de las juntas, la carpintería, los colores y algunos remates pertenecen a la interpretación gráfica. Las fotografías permiten reconocer el carácter del acceso; no equivalen a una nube de puntos ni certifican el estado de cada fachada en 2026. Las variaciones de señalización y mobiliario entre fotografías se tratan como referencias de momentos distintos.

## Criterio histórico y revisión editorial

Se han contrastado los metadatos de los estudios académicos con las cabeceras y los índices editoriales, diferenciando publicación de fecha de carga del archivo. El artículo de actividades mercantiles corresponde a **ARSE 35 (2001)**. El estudio de Civera corresponde a **ARSE 37 (2003)**. La fecha contenida en un nombre local de descarga no tiene valor bibliográfico.

La cronología articula transformaciones del barrio, crisis, vida económica y memoria reciente. Los registros fiscales se explican como tales, sin multiplicarlos mecánicamente para publicar una población exacta. Los episodios de protección se presentan junto a las dificultades que continuaron afectando a la comunidad. La experiencia de Salomó Saporta se utiliza como una trayectoria individual, con la fuente de José Bordes García, sin generalizarla a todos los vecinos.

Las síntesis turísticas se contrastan antes de convertir sus afirmaciones en arquitectura o historia pública. No se adopta la errata del siglo del Museo Histórico que aparece en la página de la Red de Juderías. Tampoco se presenta como demostrado un origen romano de la comunidad a partir de una lectura epigráfica discutida, ni se recupera aquí una atribución firme al llamado templo de Diana.

Las fechas del itinerario describen hechos y debates; no se aplican como una única antigüedad a todas las casas. El modo de lectura diferencia funciones, transformaciones y ámbitos interpretativos, y permite consultar la fuente de cada nota.

## Registro de las paradas

Todas las coordenadas utilizan WGS84, en orden **longitud, latitud**. Son focos aproximados de observación, no una certificación de acceso físico. Las siete posiciones del modelo principal y las nueve del contexto se han sincronizado con sus respectivos registros. La precisión decimal conserva la coincidencia informática entre capas; no implica precisión topográfica equivalente.

| Orden | ID | Punto de lectura | Coordenadas |
|---|---|---|---|
| 1 | `juderia-conjunto` | Un barrio que se lee caminando | -0.27855000, 39.67835000 |
| 2 | `juderia-portalet` | Portalet de la Sang, el umbral conservado | -0.27799550, 39.67818350 |
| 3 | `juderia-dovelas` | La piedra que dibuja el paso | -0.27799550, 39.67818350 |
| 4 | `juderia-sang-vella` | Sang Vella: una calle, varios tiempos | -0.27821800, 39.67820700 |
| 5 | `juderia-segovia` | Vecinos con nombre en los registros | -0.27834940, 39.67803840 |
| 6 | `juderia-rams` | Oficios y conexiones más allá del barrio | -0.27862090, 39.67812815 |
| 7 | `juderia-antigons` | Antigons y una historia individual | -0.27810530, 39.67775250 |
| 8 | `juderia-casas` | La casa y el recuerdo de la mezuzá | -0.27815500, 39.67819500 |
| 9 | `juderia-sinagoga` | La sinagoga: un lugar todavía discutido | -0.27864000, 39.67844000 |
| 10 | `juderia-berenguer` | Casa dels Berenguer, junto al barrio | -0.27901000, 39.67879000 |
| 11 | `juderia-micve` | El posible baño ritual | -0.27890030, 39.67862710 |
| 12 | `juderia-museo` | Mestre Penya: el edificio y sus lecturas | -0.27800800, 39.67851200 |
| 13 | `juderia-arco-museo` | Dos accesos que conviene distinguir | -0.27818129, 39.67855579 |
| 14 | `juderia-teatro` | El borde occidental y la ladera | -0.27913530, 39.67813730 |
| 15 | `juderia-refugio` | 1391: mirar al castillo como refugio | -0.27813415, 39.67739979 |
| 16 | `juderia-memoria` | 1492 y la memoria que permanece | -0.27796020, 39.67820160 |

### Correspondencia cartográfica

- El Portalet se registra sobre el elemento OSM **733421700**; el arco frente al museo, sobre **1303697035**. Los focos de cámara se sitúan en el plano de sus pasos, con pequeños ajustes para hacerlos legibles.
- Sang Vella, Segovia, Rams, Antigons y Pere Cartagena se leen sobre trazas cartográficas. No se rebautiza un espacio de Pere Cartagena como «placeta de la Jueria» sin una identificación suficiente.
- La parada de la sinagoga señala un sector de lectura. Las de oficios y personas no localizan negocios históricos en las parcelas enfocadas.
- La parada del posible micvé permanece fuera del edificio. La geometría heredada de Berenguer y del museo se conserva como referencia de su entorno.

El PEP del casco histórico se incluye como referencia urbanística general. **Esta iteración no atribuye al modelo una lectura de folios arquitectónicos concretos del PEP**: para la forma detallada del Portalet se emplearon fotografías y cartografía, con las limitaciones indicadas.

## Certeza y límites

**Documentado** significa que la fuente respalda la afirmación; no convierte en medida exacta un volumen aproximado. **Interpretación** identifica una relación editorial, un foco temático o una restitución visual que admite revisión. **En debate** conserva explícitamente una discrepancia entre propuestas o identificaciones.

El modelo representa el barrio actual interpretado a partir de evidencias disponibles. No es una reconstrucción integral de un año medieval concreto, ni una restitución fotogramétrica de cada fachada. En futuras revisiones, un levantamiento de detalle o documentación arqueológica específica podrá sustituir inferencias por medidas y plantas contrastadas.

## Comprobaciones del contenido

Se comprobaron IDs únicos, tres notas por parada, fuentes existentes, pertenencia a los cinco ámbitos, hitos enlazados a paradas y coincidencia de las dieciséis coordenadas con el plan. También se revisaron los nombres de autores, años y paginación de los estudios principales. No hay promesas de un interior navegable ni de un control de corte inexistente. La revisión visual final y la publicación pertenecen a la integración de la aplicación.

## Fuentes y localizadores

Los siguientes identificadores son los que utiliza el JSON para vincular cada nota. La fecha de consulta no sustituye a la de un documento, vuelo, fotografía o registro catastral. Los enlaces a datos cartográficos incluyen sus condiciones de reutilización en el archivo público de la visita.

- **jd-xiuxiueig** — Ajuntament de Sagunt · proyecto Xiuxiueig. [Barri de la Jueria](https://aytosagunto.es/es/ayuntamiento/areas-y-servicios/cultura-y-educacion/campus-abierto-a-la-ciudadania/proyecto-xiuxiueig/barri-de-la-jueria/) (sin fecha indicada). Apartados Portalet, cierre de 1321, oficios, refugio de 1391 y recorrido de calles.

- **jd-rutas** — Rutas Jaume I. [Judería de Sagunto](https://www.rutasjaumei.com/es/que-ver/218/-juderia-de-sagunto.php) (sin fecha indicada). Descripción del barrio, acontecimientos de 1321, 1348, 1391 y 1492; galería fotográfica.

- **jd-placas** — Ajuntament de Sagunt. [El conjunto patrimonial judío de Sagunto ya cuenta con la señalización de la Red de Juderías de España](https://aytosagunto.es/es/actualidad/el-conjunto-patrimonial-judio-de-sagunto-ya-cuenta-con-la-senalizacion-de-la-red-de-juderias-de-espana/) (2020). Noticia de 8 de septiembre de 2020; relación de seis emplazamientos y fotografías.

- **jd-portal-placa** — Ajuntament de Sagunt. [Colocación de la primera placa de la Red de Juderías en Sagunto](https://aytosagunto.es/es/actualidad/sagunto-da-un-paso-mas-en-el-camino-de-la-red-de-juderias-de-espana-con-la-colocacion-de-una-placa-de-senalizacion-de-la-red-en-la-ciudad/) (2020). 28 de julio de 2020; Portalet de la Sang.

- **jd-red** — Red de Juderías de España. [Sagunto · Caminos de Sefarad](https://redjuderias.org/ciudades/sagunto/) (sin fecha indicada). Historia medieval, protección real, 1366, 1391 y expulsión de 1492.

- **jd-ingreso** — Ajuntament de Sagunt. [Sagunto ya forma parte de la Red de Juderías de España-Caminos de Sefarad](https://aytosagunto.es/es/actualidad/sagunto-ya-forma-parte-de-la-red-de-juderias-de-espana-caminos-de-sefarad/) (2019). Adhesión a la red y visita de su comisión evaluadora.

- **jd-civera2003** — Manuel Civera i Gómez. [La Jueria de Morvedre](https://www.centroarqueologicosaguntino.es/uploads/descargas/409_06_la_juderia_de_morvedre.pdf) (2003). ARSE 37, pp. 65–91; fotos pp. 73 y 75; discusión de sinagoga pp. 72–82.

- **jd-lacave1990** — José Luis Lacave. [De nuevo sobre la sinagoga de Sagunto](https://sefarad.revistas.csic.es/index.php/sefarad/article/view/937) (1990). Sefarad 50(1), pp. 211–213, especialmente p. 213.

- **jd-hinojosa1995** — José Hinojosa Montalvo. [Apuntes para la demografía de la aljama judía de Sagunto en los siglos bajomedievales](https://sefarad.revistas.csic.es/index.php/sefarad/article/download/1123/1294/0) (1995). Sefarad 55(2), pp. 273–284; p. 277: 43 fuegos y límites del registro de 1379.

- **jd-hinojosa2001** — José Hinojosa Montalvo. [Las actividades mercantiles de los judíos saguntinos. De Valencia a Granada y Berbería](https://www.centroarqueologicosaguntino.es/uploads/descargas/560_101%20Las%20actividades%20mercantiles%20de%20los%20judios%20saguntinos%20de%20Valencia%20a%20Granada%20y%20Berberia%2035.pdf) (2001). ARSE 35, pp. 101–132; p. 115: comercio comarcal y venta de aceite.

- **jd-saporta2017** — José Bordes García. [Salomó Saporta: un mercader judío ante la Inquisición valenciana](https://sefarad.revistas.csic.es/index.php/sefarad/article/view/757) (2017). Sefarad 77(2), pp. 353–374; pp. 360–362: actividades y tienda de paños.

- **jd-diaz2004** — Andrés Díaz Borrás. [Los judíos de Morvedre durante la crisis de 1348–1349](https://centroarqueologicosaguntino.es/wp-content/uploads/2018/09/401_09_los_judios_de_morvedre.pdf) (2004). ARSE 38, pp. 247–318.

- **jd-berenguer** — Turisme Comunitat Valenciana. [Descubre la Casa dels Berenguer en el corazón de Sagunto](https://www.comunitatvalenciana.com/es/inspirate/casa-dels-berenguer) (2024). 7 de febrero de 2024; fachada, patio, buhardilla y aljibe.

- **jd-dival** — València Turisme · Diputació de València. [Qué ver en Sagunt](https://turisme.dival.es/que-ver-en-sagunt/) (sin fecha indicada). Apartados 4 y 5: Casa dels Berenguer, posible mikvé y judería.

- **jd-museo** — Turisme Comunitat Valenciana. [Museu Arqueològic de Sagunt](https://www.comunitatvalenciana.com/es/valencia/sagunt-sagunto/museos/museu-arqueologic-de-sagunt) (sin fecha indicada). Casa del Mestre Penya, Carrer del Castell 23; descripción del inmueble y antecedentes arqueológicos.

- **jd-cid** — Consorcio Camino del Cid. [Judería de Sagunto](https://www.caminodelcid.org/en/node/20906) (2021). Revisión indicada: 27 de agosto de 2021; portal, cierre occidental y fachada con mezuzá.

- **jd-pep** — Ajuntament de Sagunt; Universitat Politècnica de València; Politecnico di Torino. [Plan Especial de Protección del Conjunto Histórico-Artístico de Sagunt · tomo I](https://aytosagunto.es/media/y1zhyqmy/04-95pl_tomoi_opt.pdf) (2000). Fichas y planos del casco histórico; consulta de apoyo al contexto.

- **jd-osm** — Colaboradores de OpenStreetMap. [OpenStreetMap · judería y calles del entorno](https://www.openstreetmap.org/way/733421700) (sin fecha indicada). Portalet 733421700; arco ante museo 1303697035; trazas de Sang Vella, Segovia, Rams, Antigons y Pere Cartagena.

- **jd-catastro** — Dirección General del Catastro. [Cartografía catastral INSPIRE · edificios de Sagunto/Sagunt](https://www.catastro.hacienda.gob.es/webinspire/index.html) (sin fecha indicada). Municipio 46222; cuerpos, patios y plantas del entorno de la judería.

- **jd-terreno** — Instituto Geográfico Nacional / Centro Nacional de Información Geográfica. [Modelos de terreno MDT05 y alturas MDSnE de Sagunto](https://datos.gob.es/es/catalogo/e00125901-spaignmds-normalizado) (sin fecha indicada). Relieve y alturas del atlas.

- **jd-pnoa** — Instituto Geográfico Nacional / Centro Nacional de Información Geográfica. [PNOA Máxima Actualidad · ortofotografía del casco histórico](https://datos.gob.es/es/catalogo/e00125901-spaignpnoama) (sin fecha indicada). Cubiertas y ocupación del suelo del entorno.
