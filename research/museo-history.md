# Casa del Mestre Penya y Museo Arqueológico — dossier V17

Investigación revisada el 20 de noviembre de 2026. Alcance: Casa del Mestre Penya, sede museística, replaza de Castell–Dolors y conexión con la Judería. La identidad del producto sigue siendo **SAGUNTUM · Atlas vivo**, con el título global **SAGUNTUM · Sagunto y Puerto de Sagunto**. Esta ampliación utiliza el lugar existente `museo`; no añade un lugar número 32 ni cambia la entrada general del atlas.

## Resultado documental

La guía `dist/assets/data/museo-visit.json` contiene 20 paradas, cinco ámbitos, cinco capas de lectura, 40 hechos con referencias, 19 hitos y 20 fuentes. Los focos y las plantas se comparten con `museo-plan.json`. El documento distingue una afirmación histórica respaldada de la precisión geométrica alcanzada por el modelo.

La investigación encontró una fuente decisiva para esta iteración: el proyecto de reparación redactado en 2025 y publicado en el expediente de 2026. Sus plantas del estado existente se contrastan con la publicación de la rehabilitación original. Eso permite corregir el encaje de los espacios antes de detallar el entorno.

## Evidencia que modifica el modelo

| Evidencia | Referencia | Decisión de implementación |
| --- | --- | --- |
| Planta baja, superior y cubierta publicadas en 2025. | `mu-proyecto2025`, pp 9–11. | Dibujar dos plantas relacionadas; mantener la franja de circulación, patio y servicios dentro de la parcela del museo. |
| Dos unidades y tres ámbitos diferenciados en la memoria de rehabilitación. | `mu-via`, texto y láminas. | Evitar una casa rectangular genérica con una única sala y un anexo añadido sin contraste. |
| Arcos apuntados debajo; muros de carga arriba. | `mu-man2017`, pp 2430–2431. | La sección debe explicar cómo cambia la estructura entre niveles. |
| Existencia de plantas y fotografías de distintos momentos. | `mu-via`; `mu-proyecto2025`. | No mezclar una imagen de obra con un estado museístico terminado como si fueran simultáneos. |
| Inventario que identifica inscripciones, escultura, ánfora, ancla y mosaicos. | `mu-boe2006`, anexo I. | Usar tipos reconocibles y fichas de colección; no inventar textos epigráficos ni procedencias de piezas. |
| Ruta que separa el paso ante el museo y el Portalet de la Sang. | `mu-jueria`; `mu-osm`. | Reutilizar los dos arcos existentes en el atlas y enlazar la visita de la Judería. |
| La licitación de reparación quedó desierta. | `mu-desierto2026`. | No presentar las propuestas del expediente como una restauración ya ejecutada. |

La fuente técnica identifica la parcela 3558701YJ3935H0001XE. La comprobación conjunta con el modelador sitúa también la franja de Dolors dentro de esa huella. La parcela 3558702 permanece como vecina de contexto. Este ajuste evita convertir una vivienda contigua en parte del museo.

## Certezas, discrepancias y límites

### Cronología y función de la casa

El relato utiliza la expresión **bajomedieval** y conserva la discrepancia entre los siglos XIII y XIV. No se escoge una fecha por el mero hecho de aparecer en el documento más reciente: una memoria de reparación puede describir el inmueble sin resolver una discusión histórica. La datación necesita contrastarse con la bibliografía arqueológica, no solo con el diagnóstico material.

Lonja, almudín y carnicería aparecen con diferentes formulaciones. La guía permite reconocer estas lecturas y evita fijar un uso inequívoco para cada crujía. No convierte el inmueble en una residencia señorial completa, una sinagoga o un edificio ritual reconstruido. Tampoco interpreta un hueco, una moldura o una superficie de distinto color como prueba automática de una fase.

### Museo, sede y colección

Se distinguen la trayectoria del Museo Arqueológico, la creación del Museu Històric en 2006 y la apertura de esta sede en mayo de 2007. Los hitos del museo anterior no se convierten en fechas de la Casa. La declaración de 1962 se explica mediante la relación oficial de museos y no como inauguración de la actual sede.

La fuente de la directora presenta dos referencias al inicio del Cuart de les Pedres. La cronología utiliza **finales del siglo XVIII**; una precisión aparente de un año no mejora un relato cuando la propia evidencia consultada es divergente.

### Colección y museografía

Los objetos tienen una función explicativa. Su familia tipológica puede estar documentada sin que se conozcan su vitrina actual, su posición exacta o sus dimensiones completas. Por eso la visita no llama réplicas escaneadas a sus volúmenes y no añade marcas legibles ficticias en piedras o cerámicas. El rótulo de una parada explica la pieza o el tema; no actúa como un inventario de montaje actualizado.

La cabeza de Diana conserva la formulación de atribución. El mosaico virtual es una evocación geométrica; no se presenta como reconstrucción del gran Castigo de Dirce ni se afirma que este se encuentre completo dentro de la Casa. La relación con la economía mediterránea se ofrece como tema de la colección y permite continuar el atlas hacia Grau Vell, sin construir un puerto dentro del edificio.

### Suelo, patio e historia anterior

La sección retira la cubierta, el forjado y los elementos que impedirían comprender los dos niveles. Mantiene el suelo. Los antecedentes arqueológicos se explican en texto: no se colocan tumbas hipotéticas bajo las salas ni se dibuja una cripta visitable. El patio sirve para leer luz y circulación; no se transforma en un yacimiento abierto inventado.

### Estado de conservación

El diagnóstico de 2025, el anuncio de febrero de 2026 y el resultado de julio son documentos diferentes. Ninguno debe usarse como sustituto de una comprobación de final de obra. La escena representa una configuración arquitectónica documentada y una interpretación material, no un parte actualizado de mantenimiento.

### Entorno urbano

El suelo de la replaza se apoya en los espacios entre huellas y en los ejes de calle. No se presenta como una parcela de plaza trazada en OSM ni como reproducción exacta de su pavimentación. Las alturas de contexto y el relieve son geográficos; los detalles de fachada y el pequeño mobiliario son aproximados. Las posiciones del arco del museo y del Portalet se preservan, con sus respectivas identidades.

## Contrato de visita y capas

Cada fila comparte un identificador con el modelo y el plano. Los grupos son ámbitos de lectura y no fases cronológicas exclusivas.

| Parada | Ámbito / capa | Lectura principal |
| --- | --- | --- |
| `museo-conjunto` | `casa` | El conjunto |
| `museo-plaza` | `barrio` | La replaza |
| `museo-fachada` | `casa` | La fachada |
| `museo-acceso` | `casa` | El acceso |
| `museo-balcones` | `casa` | Los balcones |
| `museo-cubierta` | `estructura` | La cubierta |
| `museo-planta-baja` | `estructura` | La planta baja |
| `museo-arcos` | `estructura` | Arcos y madera |
| `museo-canteria` | `casa` | Muros y cantería |
| `museo-epigrafia` | `coleccion` | Las inscripciones |
| `museo-escultura` | `coleccion` | La escultura |
| `museo-planta-alta` | `estructura` | La planta superior |
| `museo-comercio` | `coleccion` | Economía y comercio |
| `museo-vida-privada` | `coleccion` | Vida privada |
| `museo-dolors` | `rehabilitacion` | El cuerpo de Dolors |
| `museo-patio` | `rehabilitacion` | El patio |
| `museo-rehabilitacion` | `rehabilitacion` | Rehabilitación y cuidado |
| `museo-arco` | `barrio` | El arco cercano |
| `museo-juderia` | `barrio` | La conexión con la Judería |
| `museo-entorno` | `barrio` | Calles y edificios próximos |

Las coordenadas son focos virtuales. El campo `coordinateConfidence` permanece en `approximate`, incluso cuando el hecho histórico tiene confianza `documented`. La planta es `0`, `1` o nula para las vistas exteriores. Las cuatro paradas del barrio se registran con la geometría compartida del contexto. Las vistas interiores no equivalen a navegación libre certificada ni a un itinerario físico de accesibilidad.

## Referencias visuales consultadas

Las veinte láminas de Vía Arquitectura permiten distinguir emplazamiento, alzado, secciones, plantas, fase de obra e interiores acabados. El proyecto de 2025 añade plantas de patologías y fotografías recientes. Los originales se emplean únicamente para inspección y contraste. No se incorporan al sitio fotografías de terceros ni una galería histórica.

El dossier de trabajo identifica las láminas por su número, no por una supuesta fecha de toma que no conste. La fotografía universitaria de una columna reutilizada no se ha asignado al Museo: el pie no acredita esa localización concreta. Esta precaución evita trasladar al modelo una pieza arquitectónica de otro punto del casco histórico.

## Fuentes y localizadores

Las fuentes siguientes se publican también en el panel de la visita. Los identificadores permiten seguir cada hecho y cada hito hasta la evidencia usada.

### `mu-via` — Casa del Mestre Peña · proyecto de rehabilitación publicado en ARAV 07

Julián Esteban Chapapría, Carles Boigues Gregori y José Ignacio Casar Pinazo. [Consultar fuente](https://via-arquitectura.net/arav07/096-arav07.htm).

Texto del proyecto; láminas 01–19 y 21: emplazamiento, secciones, plantas, alzado, obra e interiores terminados.

### `mu-proyecto2025` — Proyecto de adecuación del Museo Mestre Peña de Sagunto

Fernando Cos-Gayón López / Generalitat Valenciana. [Consultar fuente](https://contrataciondelestado.es/FileSystem/servlet/GetDocumentByIdServlet?DocumentIdParam=ihKowu21j5t8CwPcm4L4FDXBIGteKJw%2BbX4Xx1Uy701YxEe7nC3Lu31H68efJ5SUYcvrbM14rcAdZdZL6CYnAnwSmtNeOCNrKZWURXQUmMGB0nvVKRzfe4rpHcnlPhSZ&cifrado=QUC1GjXXSiLkydRHJBmbpw%3D%3D).

Proyecto de 1 de agosto de 2025; visita de inspección de 14 de julio. Identificación p 4; arquitectura pp 6–8; plantas pp 9–11; fotografías pp 7 y 12–19; accesos p 30. Publicado en el expediente CMAYOR/2026/17Y03/0005.

### `mu-man2017` — El Museo Arqueológico de Sagunto (Valencia)

Emilia Hernández Hervás / Museo Arqueológico Nacional. [Consultar fuente](https://www.man.es/man/dam/jcr%3A2af29bca-7dbf-405c-8896-b59669f1a389/man-bol-2017-35-257.pdf).

Boletín del Museo Arqueológico Nacional 35, vol 6, pp 2428–2436; historia institucional, edificio y discurso en pp 2429–2432.

### `mu-cid` — Casa del Mestre-Penya · Museo Histórico de Sagunto

Consorcio Camino del Cid. [Consultar fuente](https://www.caminodelcid.org/servicios/casa-del-mestre-penya---museo-historico-de-sagunto-1823124).

Descripción revisada el 27 de agosto de 2021: fábrica gótica, arcos, madera y antecedentes arqueológicos.

### `mu-gva` — Museu Arqueològic de Sagunt

Turisme Comunitat Valenciana. [Consultar fuente](https://www.comunitatvalenciana.com/es/valencia/sagunt-sagunto/museos/museu-arqueologic-de-sagunt).

Dirección Castillo 23; historia de la colección, Casa del Mestre Peña y restos del enclave.

### `mu-directorio` — Museo Arqueológico de Sagunto · Directorio de Museos de España

Ministerio de Cultura / institución museística. [Consultar fuente](https://directoriomuseos.mcu.es/dirmuseos/mostrarDetalleMuseo.do?idMuseo=1406).

Ficha del museo en Castell 23; información aportada por la institución.

### `mu-boe2006` — Convenio para la exposición de fondos estatales en la Casa del Mestre Peña

Ministerio de Cultura / Generalitat Valenciana. [Consultar fuente](https://www.boe.es/diario_boe/txt.php?id=BOE-A-2006-18617).

Convenio firmado el 7 de septiembre; publicado el 25 de octubre. Antecedentes 2–4 y anexo I: epigrafía, escultura, cerámica, ancla y mosaicos.

### `mu-boe1962` — Decreto 474/1962 · protección de museos y sus colecciones

Boletín Oficial del Estado. [Consultar fuente](https://www.boe.es/boe/dias/1962/03/09/pdfs/A03311-03313.pdf).

Decreto de 1 de marzo, BOE de 9 de marzo, pp 3311–3313. Lista de Valencia en p 3313.

### `mu-spain` — Museo Arqueológico de Sagunto

Turespaña. [Consultar fuente](https://www.spain.info/es/lugares-interes/museo-arqueologico-sagunto/).

Piezas destacadas: toro ibérico de caliza, cerámica del Pic dels Corbs, vasos ibéricos, Hermes y cabeza atribuida a Diana.

### `mu-jaume` — Museo Histórico de Sagunto · salas y colecciones

Rutas Jaume I. [Consultar fuente](https://www.rutasjaumei.com/es/que-ver-en-sagunto/844/museo-historico-de-sagunto.php).

Descripción de las dos plantas, epigrafía y temas expositivos; fotografías del museo.

### `mu-uv` — El Camp de Morvedre · museos y colecciones

Universitat de València / Diputació de València. [Consultar fuente](https://puv.uv.es/doc_pdf/comarques/morvedre.pdf).

Apartado 7.1.4, pp 132–133: museo arqueológico y nueva ubicación desde 2007.

### `mu-smic` — Museo de Historia de Sagunto · presentación municipal

SMIC / Ayuntamiento de Sagunto. [Consultar fuente](https://www.youtube.com/watch?v=caE2gw9820s).

Descripción publicada el 4 de febrero: colección epigráfica, Cuarto de les Pedres y sedes de 1925 y 1952.

### `mu-ayto2026` — Actuaciones anunciadas en el conjunto monumental de Sagunto

Ajuntament de Sagunt. [Consultar fuente](https://aytosagunto.es/es/actualidad/2026-02-24-el-ministerio-de-cultura-elaborara-un-plan-director-para-la-actuacion-integral-sobre-el-teatro-romano-y-el-castillo-de-sagunto/).

Noticia de 24 de febrero, apartado Intervenciones de urgencia: cubierta y climatización del Museo Arqueológico.

### `mu-desierto2026` — Resolución de declaración de desierto · reparación del Museo Arqueológico

Generalitat Valenciana / Plataforma de Contratación del Sector Público. [Consultar fuente](https://contrataciondelestado.es/FileSystem/servlet/GetDocumentByIdServlet?DocumentIdParam=2QAK1U9Ys7YbjPQLxhVaNm6uqU8enfQPe2fVFITWFYBPJyVczXFuEHd8buAYtHSmj9eypJTYlMJ3vIYF7vUK2aAFnVzOTgdfNJiyFKOs%2FTvDdQD9RyhUmzT4jZ2In4zL&cifrado=QUC1GjXXSiLkydRHJBmbpw%3D%3D).

Firmada el 3 de julio de 2026. Expediente CMAYOR/2026/17Y03/0005; antecedente 2 y resuelvo primero.

### `mu-jueria` — Barri de la Jueria · itinerario municipal

Ajuntament de Sagunt / proyecto Xiuxiueig. [Consultar fuente](https://aytosagunto.es/es/ayuntamiento/areas-y-servicios/cultura-y-educacion/campus-abierto-a-la-ciudadania/proyecto-xiuxiueig/barri-de-la-jueria/).

Inicio del recorrido por Castell: entrada frente al museo; después, Portalet de la Sang.

### `mu-placas2020` — Señalización del conjunto patrimonial judío de Sagunto

Ajuntament de Sagunt. [Consultar fuente](https://aytosagunto.es/es/actualidad/el-conjunto-patrimonial-judio-de-sagunto-ya-cuenta-con-la-senalizacion-de-la-red-de-juderias-de-espana/).

Noticia de 8 de septiembre: seis placas de la Red de Juderías, incluida la Casa del Mestre Penya.

### `mu-osm` — OpenStreetMap · museo, arcos y calles de la Judería

Colaboradores de OpenStreetMap. [Consultar fuente](https://www.openstreetmap.org/way/1303697035).

Arco ante el museo 1303697035; Portalet de la Sang 733421700; trazado de Castell y calles próximas.

### `mu-catastro` — Cartografía catastral INSPIRE · Casa del Mestre Penya y entorno

Dirección General del Catastro. [Consultar fuente](https://www.catastro.hacienda.gob.es/webinspire/index.html).

Municipio 46222; museo en parcela 3558701YJ3935H0001XE, concordante con el proyecto de 2025.

### `mu-terreno` — MDT05 y MDSnE · relieve del casco histórico

Instituto Geográfico Nacional / CNIG. [Consultar fuente](https://datos.gob.es/es/catalogo/e00125901-spaignmds-normalizado).

Relieve del atlas y estimación de alturas de los edificios de contexto.

### `mu-pnoa` — PNOA Máxima Actualidad · cubiertas y replaza

Instituto Geográfico Nacional / CNIG. [Consultar fuente](https://datos.gob.es/es/catalogo/e00125901-spaignpnoama).

Cubiertas, patios y ocupación de manzanas alrededor de Castell y Dolors.

## Verificación documental

El script `research/validation-v17/validate_museo_documentation.mjs` comprueba referencias, identificadores, ámbitos, capas, fechas cualificadas, focos compartidos, planta seleccionada y límites de interpretación. El informe `museo-visit-results.json` registra el resultado de cada comprobación. Estos controles no certifican exactitud arqueológica, conservación actual, calidad visual ni accesibilidad física; la geometría, los renders y la interacción tienen sus verificaciones específicas.

Los textos descriptivos son síntesis originales. El recuento por fuente de los hechos y la cronología se mantiene por debajo de 200 palabras, con referencias localizables. Los presupuestos, datos de contacto personales del proyecto y detalles administrativos ajenos a la visita se excluyen del contenido del producto.
