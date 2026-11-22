# Costa 25 · Fortín y poblado del Grau Vell

Revisión: 19 de noviembre de 2026. Modelo de escala métrica para `createCoastGrau({heightAt,project,records,data})`. El centro documental del modelo es la torre, en WGS84 **−0.239697918, 39.635329816**. Su emplazamiento se obtiene de Catastro; la coordenada redondeada del artículo de 2015 no se usa como anclaje geométrico.

## Estado representado y alcance

El centro de interpretación **Sagunt i la Mar abrió al público el 26 de junio de 2026**. La noticia municipal de 25 de junio anuncia las visitas desde el día siguiente; la de 19 de agosto confirma su actividad. Por ello, la noticia de mayo que aún describía la tematización «en su última fase» se utiliza para documentar sus contenidos, no como estado vigente.

El sitio incluye la torre, la batería, el foso, el patio cercado, el pozo, los almacenes y la recepción, además del contexto inmediato del poblado, su antigua escuela, ermita y plaza. La excavación del puerto antiguo al noreste pertenece al lugar 26 y no se duplica aquí. El modelo tiene cámaras orbitales de observación baja; no activa navegación peatonal libre.

La cubierta desmontable permite leer pilares, vigas y organización arquitectónica del almacén norte. Los elementos estructurales, el patio y el resto del poblado permanecen visibles. No se han añadido fotografías históricas, galerías ni una distribución inventada de vitrinas y piezas del museo de 2026.

## Fuentes primarias y comprobación visual

- [Ajuntament de Sagunt, apertura de Sagunt i la Mar, 25/06/2026](https://aytosagunto.es/es/actualidad/2026-06-25-el-nuevo-centro-de-interpretacion-sagunt-i-la-mar-ya-es-una-realidad/).
- [Ajuntament de Sagunt, actividad del centro, 19/08/2026](https://www.sagunto.es/es/actualidad/2026-08-19-el-fortin-del-grau-vell-atrae-a-cerca-de-un-millar-de-visitantes-en-su-primer-mes-de-vida/).
- [Gil-Piqueras y Rodríguez-Navarro, UPV, 2015, DOI 10.4995/FORTMED2015.2015.1736](https://doi.org/10.4995/FORTMED2015.2015.1736). El volumen se consultó también en el [repositorio del congreso](https://fortmed24.blogs.upv.es/files/2018/10/Vol2.pdf). Su descripción y levantamiento informan la masa, los accesos y las dimensiones principales; su estado anterior a la rehabilitación no se presenta como actual.
- [BOE-A-2010-14557, protección y delimitación del entorno](https://www.boe.es/diario_boe/txt.php?id=BOE-A-2010-14557), especialmente el plano del anexo II. Conserva como referencias las alineaciones tradicionales del poblado, los almacenes, la iglesia y el colegio. No se deducen alturas actuales a partir de las alturas permitidas por la norma.
- Blay y Molina, **Memoria de intervención arqueológica 2008/0311, Grau Vell de Sagunto: Fortín**, disponible en la Plataforma de Contratación del Sector Público. La URL completa, los autores y la página de la planta se conservan en `geometryProvenance.archaeologyPlan` y `sources` del JSON. Se inspeccionó visualmente la página 10 del PDF: torre, batería de esquinas redondeadas, foso y refugio meridional. La memoria no equivale al plano de distribución del museo inaugurado en 2026.
- [Red Eléctrica y Ayuntamiento, restauración inaugurada el 29/09/2020](https://www.redeia.com/sites/default/files/paragraph/2021/06/file/2909_Rehabilitacion_Grau_Vell.pdf). Documenta recuperación del foso, batería, refugio, accesos, patio y almacén norte.
- [Turisme Comunitat Valenciana, documentación visual del conjunto](https://www.comunitatvalenciana.com/es/valencia/sagunt-sagunto/monumentos/fortin-o-torre-del-grau-vell). Las fotografías del patio restaurado, fachada e interior del almacén se consultaron como evidencia arquitectónica; no se publican como activos de la aplicación.
- [Ajuntament, tematización y réplica de artillería, 07/05/2026](https://aytosagunto.es/es/actualidad/2026-05-07-la-tematizacion-del-fortin-y-antiguo-almacen-portuario-del-grau-vell-entra-en-su-ultima-fase/). Permite mostrar una sola réplica contemporánea de artillería como parte del conjunto restaurado, evitando equipar por defecto la batería con sus tres cañones históricos.
- [Fotografía directa de la ermita, Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Isglesia_del_Grau_Vell.jpg): fachada blanca con puerta adintelada, remate escalonado y pequeña espadaña; se utiliza como referencia formal, sin publicar la fotografía ni reproducir sus imágenes devocionales.
- [Catastro INSPIRE](https://www.catastro.hacienda.gob.es/webinspire/index.html), metadatos municipales de 21/08/2026; [PNOA Máxima Actualidad, IGN/CNIG](https://www.ign.es/wms-inspire/pnoa-ma); [OpenStreetMap, torre y entorno](https://www.openstreetmap.org/way/1418515035).

## Cartografía utilizada

Se transformaron con GDAL las geometrías de Catastro municipal de EPSG:25830 a EPSG:4326. Se conservan **28 referencias y 57 partes**; esas cifras describen registros geométricos, no un inventario de 28 casas históricas ni de 57 edificios independientes. Se añaden seis construcciones auxiliares pequeñas documentadas en OSM cuya huella no queda cubierta por las partes catastrales.

La referencia principal es `6910216YJ3961S`: la parte 5 corresponde a la torre y la parte 2 al almacén norte. Sus partes 3 y 4 no se levantan como casetas cerradas: el contraste con la restauración permite leer esas pequeñas zonas como acceso y pozo. La recepción se apoya en `6910203YJ3961S`; el almacén meridional en `6910205YJ3961S`.

Las huellas de batería, foso, muros y pozo proceden de OSM, cotejadas con el plano arqueológico y la ortofoto. Los identificadores exactos de los edificios sustituidos están en `osmBuildingIds` y `catastroBuildingIds`. **El way OSM 1418515037, etiquetado como agua, es aquí el foso seco: debe excluirse de las aguas genéricas.**

El recorte PNOA consultado mide 1400 × 1970 píxeles, con límites oeste −0.2414, sur 39.6336, este −0.2390 y norte 39.6362. La URL GetMap se conserva en el JSON. Se priorizan las huellas de muro frente a las posiciones de tejado desplazadas por perspectiva en la ortofoto. Las copas de ocho árboles se digitizaron como referencias de posición; el árbol principal coincide con el nodo OSM 13036056544. Especies y tamaño de copa son interpretativos.

La fecha de consulta, 19/11/2026, **no identifica el vuelo del mosaico**. Tampoco los metadatos recientes del Catastro certifican el estado físico de cada construcción. Dos pequeñas zonas de cubierta visiblemente abierta en la ortofoto se representan como restos abiertos, sin atribuir una demolición ni un uso actual no acreditados.

## Decisiones del modelo y sus límites

La torre usa la planta catastral y una altura publicada de 10,70 m, con acceso elevado, huecos, terraza y cuerpo superior. El artículo de UPV da aproximadamente 6 × 7 m de planta; la huella catastral tiene aproximadamente 48,7 m² y se mantiene sin forzarla a ese rectángulo aproximado. El aparejo, posición menuda de troneras, carpinterías y acceso moderno constituyen una interpretación visual de la documentación.

La batería tiene cuerpo ataluzado, hiladas de sillería, cordón y parapeto. Se distingue el fondo del foso de la calle: el modelo presenta aproximadamente 6 m desde el fondo interpretado hasta el parapeto. La profundidad concreta del foso visible no se afirma como levantamiento actual. El fondo tiene un parche propio a una cota inferior; la adaptación de la malla del terreno usa mínimos en las celdas que lo cruzan y no necesita una excavación temporal por clipping. Las barandillas bordean la excavación sin cerrar los accesos al patio.

El almacén norte conserva la planta cartográfica, su desarrollo longitudinal, pilares centrales, tornapuntas y cubierta de madera. Abrir la cubierta retira sus paños y deja la estructura legible; también se retiran los paños asociados a las dependencias de entrada. El patio contiene el pozo cuadrado, pavimento, bancos, arbolado y el muro posterior de distinta fábrica y altura. No se añaden almenas medievales al fortín.

Los edificios del poblado siguen las huellas reales. Se interpreta el alzado con volúmenes bajos, cubiertas de teja, cuerpos planos, huecos verticales y revocos claros. Se respetan patios y vacíos. La antigua escuela y la ermita aparecen como parte del contexto; no se atribuyen a esos edificios interiores visitables o usos no verificados.

## Integración y comprobación

La fábrica acepta `records` como diccionario, array o `{sites:[]}` y devuelve `{group,sites,stats}`. El sitio `grau-vell` contiene `currentGroup`, `roof`, `roofFocus:'almacen'`, `point`, `views`, seis `focuses`, `patches`, `exclusions` y estadísticas. Las posiciones usan la proyección global de V4, y las cotas se calculan con `heightAt`.

Se comprobó la sintaxis, la construcción con el MDT costero real, la compatibilidad del diccionario de registros y la ausencia de coordenadas no finitas o triángulos degenerados. Los renders CPU de comprobación son auxiliares para revisar la geometría; no se presentan como capturas de WebGL ni como fotografías del lugar.

El resultado final del módulo contiene 31 mallas combinadas y 119.732 triángulos, 64 parches de cota y 66 exclusiones de vegetación/contexto. La revisión visual del conjunto con el MDT confirmó la lectura del foso seco; se corrigieron los hastiales donde las aristas cruzaban la cumbrera y se ajustó la fachada de la ermita a su referencia directa.
