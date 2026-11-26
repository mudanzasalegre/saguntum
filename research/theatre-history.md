# Teatro Romano de Sagunto — investigación y criterios de la visita

Actualización documental: **26 de noviembre de 2026**. Iteración centrada exclusivamente en el Teatro Romano, integrada en SAGUNTUM Atlas.

## Entrega

La visita está descrita en `dist/assets/data/theatre-visit.json`: **16 paradas, 57 hechos con referencias, 17 hitos cronológicos y 22 fuentes**. Cada parada incorpora explicación, indicaciones de observación, alcance del modelo y grado de confianza. Los hechos se mantienen en ese archivo como registro principal para evitar versiones divergentes entre el contenido de la aplicación y esta memoria.

Los cinco ámbitos organizan la lectura del edificio; no representan cinco fases constructivas. El recorrido comienza por la relación con la ciudad, pasa por el público y la escena, descubre el subsuelo y termina con la rehabilitación y el uso actual. Se puede seguir en secuencia o abrir una parada directamente.

## Evidencias y decisiones

### La arquitectura se estudia en planta y sección

Se contrastaron las mediciones arqueológicas, la documentación anterior a los años noventa y la memoria del proyecto contemporáneo. Las plantas de la colección de Antonio Almagro permiten comprobar la organización previa a la gran intervención; su fecha debe permanecer visible cuando se comparan con el edificio actual. [teatro-almagro-1979]

Medidas publicadas, en metros: diámetros de orchestra 16/22, ima 34, media 49, summa 67, pórtico 79; frente escénico 44. [teatro-arqueologia-1993]

Las cifras describen conceptos diferentes: un diámetro de grada, una longitud de muro exterior y la longitud de una fachada no son magnitudes intercambiables. El estudio constructivo de 1986 resulta útil para entender la infraestructura y los apoyos sobre roca; documenta subestructuras y relaciones entre muros, no únicamente una fachada visible. [teatro-estructura-1986]

El modelo utiliza esos datos como restricciones de proporción. Las irregularidades, espesores y alturas que no se han medido de nuevo se tratan como aproximaciones. El detalle visual no se utiliza para simular una precisión topográfica inexistente.

### Comparar estados fechados

La revisión del 26 de noviembre de 2026 amplía la base visual y arquitectónica. La fecha de una fotografía, la de un proyecto y la de una página consultada describen cosas diferentes:

| Documento | Estado que permite estudiar | Aplicación y límite |
|---|---|---|
| Postal de L. Roisin, hacia 1920, Biblioteca Valenciana | Acceso y cávea antes de las grandes intervenciones posteriores | Comparar fábrica, ruina y pasos; la datación del catálogo es aproximada. [teatro-roisin-1920] |
| Fotografía de Daniel Villafruela, septiembre de 1969 | Graderío de superficie irregular y accesos, ya con restauraciones anteriores | Distinguir ese momento del estado rehabilitado; no presentarlo como el teatro romano original. [teatro-foto-1969] |
| Serie de Antonio Almagro, asociada por la Academia a la publicación de 1979 | Plantas y secciones previas a Grassi y Portaceli | Control de organización arquitectónica a escala 1:200, sin atribuir la fecha de publicación a cada fichero digital. [teatro-almagro-1979] |
| Plantas, secciones y fotografías de la rehabilitación | Relación entre cávea y cuerpo escénico contemporáneo | Base de proporciones y huecos; las fotos del archivo no tienen fecha individual declarada. [teatro-casa-arquitectura] |
| Fotografía de Mike1979 Russia, 29 de julio de 2014 | Silueta, cubierta y flancos del graderío con su ladera | Contraste visual de un estado fechado; no acredita actuaciones posteriores. [teatro-foto-2014] |
| Fotografía de Rjdeadly, 18 de julio de 2015 | Muro posterior, huecos del zócalo de piedra y pasarela metálica | Contrastar el encuentro entre fábrica y rehabilitación; las dimensiones de detalle son interpretativas. [teatro-foto-2015] |
| Galería de Turisme Comunitat Valenciana | Apariencia de conjunto, interior y exterior rehabilitados | Corroboración visual sin fecha de toma; no se adoptan las cifras divulgativas de capacidad o diámetro como medidas de modelado. [teatro-fotos-turisme] |

Las fotografías de 1969 y 2014 no forman una reconstrucción histórica completa. Se usan para reconocer cambios concretos en las superficies y en la silueta. La memoria de Portaceli recuerda las intervenciones de 1950–1974, por lo que «antes de la rehabilitación» no significa «sin restaurar». [teatro-foto-1969; teatro-foto-2014; teatro-casa-arquitectura]

Las secciones del proyecto permiten relacionar orchestra, escenario y coronación mediante las cotas **±0,00 / +1,20 / +20,20**. Son referencias verticales de ese proyecto; no son altitudes geográficas ni alturas antiguas conservadas. Los tamaños de huecos, juntas, desgaste, fragmentos y vegetación siguen siendo aproximaciones del modelo. [teatro-casa-arquitectura]

La ortofoto PNOA ya incorporada al atlas aporta la localización visual de las copas y los afloramientos. Su consulta está fechada el 19 de noviembre de 2026; no se ha identificado la fecha de adquisición. Las especies, alturas y contornos del arbolado son interpretados, no un inventario botánico. [teatro-entorno-pnoa]

### Qué debe poder reconocer el visitante

La visita pone el énfasis en el sector central claro y los flancos rugosos de la cávea, sus corredores, los huecos y las interrupciones del remate. Al llegar a la escena, las indicaciones llevan de la tarima a las tres exedras bajas, los pilares, las galerías, el muro posterior y la cubierta. La vista exterior vuelve a conectar esos elementos con el desnivel de la ladera.

Las paradas de subsuelo conservan su carácter didáctico: activar **Corte** retira partes contemporáneas para observar un esquema. La parada de la rehabilitación propone consultar los documentos fechados y volver a **Leer las capas**; no convierte el corte en un «antes» histórico ni añade una fachada romana hipotética completa.

### Leer las capas y el esquema

| Lectura | Qué significa en la aplicación | Límite |
|---|---|---|
| Arquitectura romana | Estructuras o trazas atribuidas al edificio antiguo | Un volumen interpretado no certifica cada piedra o acabado |
| Rehabilitación contemporánea | Componentes vinculados a la presentación y recuperación recientes | La regularidad visible no demuestra origen romano |
| Encuentro de capas | Sectores donde se combinan restos y obras posteriores | No se impone una fecha única a todo el sector |
| Esquema arqueológico | Subestructuras mostradas para explicar relaciones espaciales | El alzado y el detalle son aproximados |

La documentación de Portaceli expone sus decisiones materiales y el objetivo de recuperar un espacio teatral reconocible. Se cita como fuente primaria del proyecto, distinguiendo una intención declarada de una valoración compartida por todos los investigadores. [teatro-portaceli-1993]

El texto de Grassi sirve para explicar su posición en la discusión sobre restitución y relación urbana. La crítica contemporánea de González Moreno-Navarro aporta la existencia de una lectura contraria del método y del resultado. La aplicación presenta esa controversia sin convertir una opinión en una conclusión arqueológica ni formular afirmaciones sobre el estado judicial actual. [teatro-grassi-1993; teatro-debate-1993]

### El subsuelo y los fragmentos no autorizan cualquier reconstrucción

Las paradas del foso y la cloaca usan una lectura esquemática: se puede comprender una relación espacial sin afirmar que se conoce toda la maquinaria original. No se añade un mecanismo completo de telón, una cubierta antigua íntegra ni mobiliario supuesto.

El inventario de 2022 amplía la atención a las piezas del museo. Sus observaciones sobre trabajo de la piedra, acabados y asignación de elementos ayudan a explicar cómo se argumenta una restitución. Se conservan las incertidumbres de atribución y se evita fijar colores antiguos que la investigación consultada no acredita. Tampoco se generaliza a toda la fachada la asignación hipotética de una pieza o el número de tambores de una columna. [teatro-decoracion-2022]

Las fotografías y los dibujos se consultan como documentación de modelado. La bibliografía de la aplicación enlaza los registros originales, con autoría y fecha de toma cuando constan; no se redistribuyen imágenes de terceros en una galería.

### El presente se verifica por resultados fechados

La actualización de 2026 compara anuncios y balances. La comunicación de mayo presenta actuaciones futuras y recuerda otras realizadas en 2024. El balance de septiembre acredita el resultado de la edición del festival: se utiliza ese dato posterior y se mantiene su contexto temporal. No se interpreta una ampliación de localidades como una ampliación de la arquitectura romana. [teatro-ivc-obras-2026; teatro-ivc-balance-2026]

El anuncio de febrero sobre un Plan Director se identifica expresamente como anuncio. Su resumen histórico contiene una datación incompatible con la investigación arqueológica, por lo que sólo se toma de él la información administrativa sobre planificación. [teatro-plan-2026]

El MAN aporta la referencia de publicación de la declaración patrimonial. Se omite la afirmación de que fue el primer Monumento Nacional de España, difundida en algunas páginas turísticas, al no quedar sustentada por esta documentación. [teatro-man-monumento-2026]

## Posición y navegación

El centro de trabajo se ajustó al arco de la cávea cartografiada: **−0,27795671425 / 39,67686986465** (longitud/latitud). El giro de la escena Three.js es **−0,5027 radianes**. Estas cifras permiten que los focos y la geometría compartan el mismo sistema; sus decimales no expresan precisión arqueológica. [teatro-osm]

Las posiciones locales usan X en el eje de escena hacia el sureste y Z hacia la cávea, aproximadamente al suroeste. `modelLocal` conserva los puntos acordados con el modelado. `coordinate` y `coordinates` contienen el foco geográfico equivalente para compatibilidad con los controles de visita.

No se trata de una nueva fotogrametría, de una guía de accesos físicos ni de una certificación de accesibilidad. Las posiciones elevadas o enterradas son puntos de observación virtual.

## Inventario de paradas

| Orden | Identificador estable | Parada | Ámbito |
|---:|---|---|---|
| 1 | `teatro-conjunto` | Entre el foro y la ciudad | El teatro y la ciudad |
| 2 | `teatro-aditus-oriental` | Aditus: entrar a la orchestra | El espacio del público |
| 3 | `teatro-orchestra` | Orchestra: el centro del espacio teatral | El espacio del público |
| 4 | `teatro-ima-cavea` | Ima cavea: las primeras filas | El espacio del público |
| 5 | `teatro-media-cavea` | Media cavea: organizar al público | El espacio del público |
| 6 | `teatro-summa-cavea` | Summa cavea: ganar altura | El espacio del público |
| 7 | `teatro-vomitoria` | Vomitoria y galerías: circular bajo las gradas | El espacio del público |
| 8 | `teatro-portico` | El remate superior y sus preguntas | El espacio del público |
| 9 | `teatro-tribunalia` | Tribunalia: una posición singular | El espacio del público |
| 10 | `teatro-proscaenium` | Proscaenium: el espacio de los intérpretes | La arquitectura de la escena |
| 11 | `teatro-frons-scaenae` | Scaenae frons: reconstruir a partir de fragmentos | La arquitectura de la escena |
| 12 | `teatro-basilicas` | Los laterales: basílicas y cuerpos de escena | La arquitectura de la escena |
| 13 | `teatro-hyposcaenium` | Hyposcaenium: bajo el escenario | Bajo el escenario |
| 14 | `teatro-cloaca` | El agua bajo la arquitectura | Bajo el escenario |
| 15 | `teatro-restauracion` | 1990–1993: una nueva capa de arquitectura | Rehabilitación y vida actual |
| 16 | `teatro-vivo` | Un teatro que continúa en uso | Rehabilitación y vida actual |

## Verificación del contenido

- Todas las referencias de las fichas resuelven a un identificador de la bibliografía.
- Los 16 identificadores son únicos y el orden está completo.
- Cada parada pertenece a un ámbito y figura en su lista de navegación.
- Los dos campos de coordenadas coinciden; los focos se convierten desde el sistema local acordado con el modelo.
- Las hipótesis se etiquetan en el propio hecho, especialmente las asignaciones de piezas, el alzado perdido y las limitaciones del escenario.
- La declaración patrimonial, las fases antiguas, la intervención reciente y el festival no se mezclan en una misma fecha.
- La investigación no añade una reconstrucción decorativa romana total ni mezcla fotografías de épocas distintas en un único supuesto estado histórico. Los documentos enlazados se consultan en sus archivos originales.

La validación de interacción, rendimiento, corte y publicación corresponde a la revisión integrada de la aplicación. Esta memoria acredita la revisión documental y estructural del archivo de visita.

## Bibliografía y localizadores

Los identificadores remiten a las mismas fuentes usadas por la interfaz. Cada documento conserva su fecha y su alcance: medición, imagen, memoria de autor o comunicación institucional.

### teatro-arqueologia-1993

**Emilia Hernández, Montserrat López, Ignacio Pascual y Carmen Aranegui (1993).** [El teatro romano de Sagunto](https://revistas.um.es/car/article/download/68181/65651/283861).

Localizador: Cuadernos de Arquitectura Romana 2, pp. 25–42; radios y filas pp. 28–30, subsuelo y escena pp. 31–33, restitución decorativa pp. 36–38.

Criterio de uso: La fase inicial se fecha entre Claudio y Nerón; las restituciones del alzado son hipótesis explícitas.

### teatro-estructura-1986

**Emilia Hernández Hervás (1986).** [El teatro romano de Sagunto: sistema constructivo del cuerpo escénico, estado de la cuestión](https://roderic.uv.es/rest/api/core/bitstreams/9cf42415-05d5-45ff-8e2c-966cf613200f/content).

Localizador: SAGVNTVM 20, pp. 243–256; figs. 1–3 y descripción de subestructuras.

Criterio de uso: Registro anterior a la rehabilitación de los años noventa. La catalogación alternativa usa la errata «Sangunto»: hdl.handle.net/10550/34981.

### teatro-decoracion-2022

**María Aidé Gómez Robledo (2022).** [Restos de decoración arquitectónica inéditos del teatro romano de Sagunto (s. I a. C.–s. III d. C.): una aproximación](https://doi.org/10.1344/IHE2022.135.4).

Localizador: Índice Histórico Español 135, pp. 70–82; inventario de basas, fustes, capiteles y cornisas.

Criterio de uso: Estudia piezas conservadas en el Museo de Sagunto. La datación del título no sustituye la cronología estratigráfica del edificio. Texto de la autora disponible en Academia.edu/100549038.

### teatro-portaceli-1993

**Manuel Portaceli (1993).** [La rehabilitación del teatro romano de Sagunto](https://revistas.um.es/car/article/download/68281/65731/284251).

Localizador: Cuadernos de Arquitectura Romana 2, pp. 43–45.

Criterio de uso: Fuente primaria de los objetivos y soluciones del proyecto; expresa la posición de uno de sus autores.

### teatro-grassi-1993

**Giorgio Grassi (1993).** [Un parere sul restauro dei monumenti (a proposito del Teatro di Sagunto)](https://revistas.um.es/car/article/download/68291/65751/284331).

Localizador: Cuadernos de Arquitectura Romana 2, pp. 47–50.

Criterio de uso: Explica el criterio de restitución espacial y el papel urbano del edificio; no equivale a consenso sobre la intervención.

### teatro-debate-1993

**Antoni González Moreno-Navarro (1993).** [Restauración: método y arquitectura (a propósito del Teatro de Sagunto)](https://doi.org/10.3989/ic.1993.v45.i428.1121).

Localizador: Informes de la Construcción 45(428), pp. 3–8.

Criterio de uso: Testimonio crítico contemporáneo, contrapuesto a las memorias de los autores; no se infiere de él el estado judicial actual.

### teatro-proyecto-1993

**Giorgio Grassi y Manuel Portaceli / Arquitectura Viva (1993).** [Teatro romano, Sagunto](https://arquitecturaviva.com/obras/teatro-romano-sagunto).

Localizador: Ficha de obra: 1990–1993; fotografías y descripción arquitectónica.

Criterio de uso: Distingue la cubierta y el nuevo cuerpo escénico de los restos romanos. Las imágenes se consultan como documentación, sin incorporarlas a la aplicación.

### teatro-almagro-1979

**Antonio Almagro Gorbea / Real Academia de Bellas Artes de San Fernando (1979).** [Plantas y secciones del Teatro romano de Sagunto](https://www.academiacolecciones.com/arquitectura/inventario.php?id=AA-013_03).

Localizador: Serie AA-013_02 a AA-013_10; ficha de Planta 2 AA-013_03, escala 1:200; bibliografía del archivo: SAGVNTVM 14 (1979), pp. 165–179.

Criterio de uso: La serie registra el edificio anterior a Grassi y Portaceli. Se conserva 1979 según la bibliografía de la ficha del archivo, sin atribuir esa fecha a cada archivo digital. Uso documental; planos no redistribuidos.

### teatro-archivo-coam

**Biblioteca de la Fundación Arquitectura COAM (2015).** [El teatro de Sagunto. Un recorrido por su historia y su arquitectura](https://www.fundacioncoam.org/media/Default%20Files/fundacion/biblioteca/muestras-fondos/docs/muestras-%20teatro-sagunto.pdf).

Localizador: Secciones «El teatro en los libros y documentos» y «La intervención de Grassi y Portaceli».

Criterio de uso: Se usa para testimonios gráficos y bibliográficos. Sus referencias a resoluciones judiciales no describen necesariamente la situación de 2026.

### teatro-man-urbanismo-2026

**Carmen Aranegui Gascó / Museo Arqueológico Nacional (2026).** [El teatro romano como icono político urbano: Saguntum](https://www.man.es/man/actividades/cursos-y-conferencias/20260915-teatro-romano-saguntum.html).

Localizador: Conferencia del 15 de septiembre de 2026; presentación del argumento urbano.

Criterio de uso: Relaciona el teatro con el foro, la ciudad en terrazas y la imagen monumental de Saguntum.

### teatro-man-monumento-2026

**Museo Arqueológico Nacional, Ministerio de Cultura (2026).** [De la tragedia griega a la comedia romana: el teatro clásico](https://www.man.es/man/exposiciones/vitrina0/20260714-teatro-clasico.html).

Localizador: Vitrina CERO, 14 julio–18 octubre de 2026; referencia a Gaceta de Madrid, 28 agosto de 1896, núm. 241.

Criterio de uso: Acredita la declaración de Monumento Nacional en 1896. No se reproduce la afirmación turística de ser el primero de España.

### teatro-ivc-obras-2026

**Institut Valencià de Cultura / Generalitat Valenciana (2026).** [Cultura impulsa la ampliación del aforo del Teatro Romano y nuevas mejoras en el Conjunto Monumental de Sagunto](https://ivc.gva.es/es/escena/cultura-impulsa-la-ampliacion-del-aforo-del-teatro-romano-y-nuevas-mejoras-en-el-conjunto-monumental-de-sagunto).

Localizador: 4 de mayo de 2026; actuaciones ejecutadas en 2024 y actuaciones previstas en 2026.

Criterio de uso: Distinguir obras ya realizadas de actuaciones anunciadas. La previsión de unas 250 plazas no es el resultado final.

### teatro-ivc-balance-2026

**Institut Valencià de Cultura / Generalitat Valenciana (2026).** [Sagunt a Escena reúne a cerca de 11.000 espectadores en su 43ª edición](https://ivc.gva.es/es/ivc/noticias-ivc/sagunt-a-escena-reune-a-cerca-de-11000-espectadores-en-su-43-edicion).

Localizador: 2 de septiembre de 2026; aforo efectivo, representaciones y balance del festival.

Criterio de uso: Confirma 804 localidades en la edición de 2026, frente a 608 en 2024–2025. Aforo operativo del festival, no capacidad romana.

### teatro-plan-2026

**Ayuntamiento de Sagunto (2026).** [El Ministerio de Cultura elaborará un Plan Director para la actuación integral sobre el Teatro Romano y el Castillo de Sagunto](https://aytosagunto.es/es/actualidad/2026-02-24-el-ministerio-de-cultura-elaborara-un-plan-director-para-la-actuacion-integral-sobre-el-teatro-romano-y-el-castillo-de-sagunto/).

Localizador: 24 de febrero de 2026; anuncio de planificación patrimonial.

Criterio de uso: Se cita exclusivamente el anuncio. La mención de siglo I a. C. de la noticia contradice la datación arqueológica y no se adopta.

### teatro-osm

**Colaboradores de OpenStreetMap.** [Cartografía del Teatro Romano de Sagunto](https://www.openstreetmap.org/#map=19/39.67687/-0.27796).

Localizador: Trazas incluidas en cartography.json; ajuste del arco de la cávea y orientación del cuerpo escénico.

Criterio de uso: Base geográfica, no fuente de atribuciones arqueológicas. Coordenadas de los focos aproximadas, ligadas a la maqueta.

### teatro-casa-arquitectura

**Manuel Portaceli y Giorgio Grassi / La Casa de la Arquitectura, Ministerio de Vivienda y Agenda Urbana (1993).** [Restauración y rehabilitación del Teatro Romano de Sagunto](https://lacasadelaarquitectura.es/recurso/restauracion-y-rehabilitacion-del-teatro-romano/3a26830f-f701-4c15-9cc6-c75f14d29933).

Localizador: Plantas +2,90, +11,00, +13,70 y +16,40; secciones longitudinales y transversales; alzados este y norte; fotografías de Pepa Balaguer, Manuel Portaceli y Duccio Malagamba.

Criterio de uso: Base del volumen escénico y la cávea rehabilitados. Las cotas son relativas al proyecto. La ficha no fecha cada fotografía; no acredita por sí sola el estado exacto de noviembre de 2026.

### teatro-foto-1969

**Daniel VILLAFRUELA / Wikimedia Commons (1969).** [Teatro de Sagunto, fotografía de septiembre de 1969](https://commons.wikimedia.org/wiki/File:Sagunto-1969-Amphit%C3%A9atre-RI-51-0000972.jpg).

Localizador: Fecha de toma: septiembre de 1969; archivo original 6240 × 4128; licencia CC BY-SA 4.0.

Criterio de uso: Documenta el graderío anterior a Grassi y Portaceli, ya afectado por restauraciones previas. El nombre de archivo dice «Amphitéatre»; el edificio es un teatro. Se consulta y enlaza, sin redistribuir la fotografía.

### teatro-foto-2014

**Mike1979 Russia / Wikimedia Commons (2014).** [Teatre Romà de Sagunt 02 — vista desde el castillo](https://commons.wikimedia.org/wiki/File:Teatre_Rom%C3%A0_de_Sagunt_02.jpg).

Localizador: Fecha de toma: 29 de julio de 2014; archivo original 5215 × 3477; licencia CC BY-SA 3.0.

Criterio de uso: Referencia de silueta, cubierta, sectores del graderío y entorno en 2014. No certifica los detalles modificados después. Se consulta y enlaza, sin redistribuir la fotografía.

### teatro-roisin-1920

**L. Roisin / Biblioteca Valenciana Nicolau Primitiu, BIVALDI (1920).** [Teatro Romano de Sagunto — postal de L. Roisin](https://bivaldi.gva.es/es/consulta/registro.cmd?id=11149).

Localizador: Datación del catálogo: ca. 1920; BV Fondo gráfico, JH38/432; registro 11149.

Criterio de uso: Vista de acceso y cávea conservada en postal. La fecha es aproximada. BIVALDI marca la imagen como dominio público (PDM); se enlaza el registro original.

### teatro-fotos-turisme

**Turisme Comunitat Valenciana.** [Teatro Romano — galería oficial](https://www.comunitatvalenciana.com/es/valencia/sagunt-sagunto/monumentos/teatro-romano).

Localizador: Galería multimedia: panorámica interior, edificio escénico y exterior.

Criterio de uso: Contraste visual de materiales, graderíos y cubierta. Fecha de toma no indicada; imágenes consultadas, no redistribuidas. Las cifras divulgativas de aforo y diámetro no sustituyen las medidas arquitectónicas.

### teatro-entorno-pnoa

**Instituto Geográfico Nacional y Centro Nacional de Información Geográfica / PNOA.** [PNOA Máxima Actualidad — ortofoto incorporada al atlas](https://pnoa.ign.es/web/portal/pnoa-imagen/visualizadores-y-servicios-web).

Localizador: Mosaico servido por https://www.ign.es/wms-inspire/pnoa-ma; ortofoto de referencia incorporada al atlas, consultada el 19 de noviembre de 2026.

Criterio de uso: Fecha de adquisición de esta imagen no identificada. Las copas se sitúan por lectura visual de la ortofoto; especies, alturas y contornos son interpretados. La fecha de consulta no es la fecha del vuelo. Atribución: obra derivada de IGN/PNOA, CC BY 4.0.

### teatro-foto-2015

**Rjdeadly / Wikimedia Commons (2015).** [Saguntum rear wall of theatre — muro posterior del teatro](https://commons.wikimedia.org/wiki/File:Saguntum_rear_wall_of_theatre.jpg).

Localizador: Fecha: 18 de julio de 2015; obra propia; archivo original 2560 × 1703; licencia CC BY-SA 4.0.

Criterio de uso: Referencia de las aberturas del zócalo de piedra y de la pasarela en el encuentro con el volumen rehabilitado. La fotografía documenta ese estado de 2015; las dimensiones de detalle del modelo son interpretadas. Se consulta y enlaza, sin redistribuir la fotografía.

