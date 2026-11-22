# Santa María de Sagunto: documentación de la visita V9

Fecha de consulta: **19 de noviembre de 2026**.

## Alcance de la entrega

La visita contiene **16 paradas, 5 ámbitos, 49 hechos con referencias, 17 hitos cronológicos y 24 fuentes**. Abarca la iglesia conservada, sus tres accesos, la escalinata, la torre y cuatro focos de su entorno inmediato. El archivo de contenido es `dist/assets/data/santa-maria-visit.json`; geometría, mapa, cámaras e integración corresponden a los módulos de modelo y contexto.

Las narraciones y las indicaciones para mirar están redactadas para la experiencia digital. Los hechos históricos y arquitectónicos llevan `sourceIds` y `confidence`. La clasificación cronológica de un componente digital no pretende fechar cada sillar ni ofrecer una cartografía estratigráfica.

## Criterio documental

Se han contrastado estudios que observan y dibujan el edificio, inventarios especializados, fuentes institucionales y comunicaciones de obra. La documentación gráfica más útil es la planta de Cabrera —página 10 del PDF, p. 32 / 646 impresa— y las plantas, sección y axonometría de Gomis y Espín publicadas por Zaragozá. El PDF de Cabrera fue descargado y su planta inspeccionada visualmente; las publicaciones permanecen enlazadas en origen, sin incorporar sus fotografías históricas al producto.

La [parroquia reproduce el estudio de Cabrera](https://santamariasagunto.wordpress.com/historia/). Para los dibujos y la interpretación arquitectónica de Zaragozá se ha utilizado la copia compartida por el propio autor de una edición de la Generalitat. El texto de Navarro Fajardo se cotejó con los datos del [repositorio RODERIC de la Universitat de València](https://roderic.uv.es/items/773aaced-943d-4e07-aaf3-2202a72f6594): su portada fecha la tesis en 2004. Una ficha secundaria de producción científica muestra otra fecha; se conserva la de la edición consultada.

## Decisiones que afectan a la interpretación

| Cuestión | Decisión en la visita | Evidencia |
|---|---|---|
| Estado representado | Edificio conservado con sus transformaciones; las esculturas desaparecidas no se reponen. | Cabrera; Serrano. |
| Organización espacial | Cuatro tramos. Los dos grandes tramos medievales centrales no son el total de la iglesia. | Zaragozá, pp. 72–75. |
| Arcos elevados | Se presentan como soportes del desagüe, atribuyendo la lectura al autor; no se aplica automáticamente una explicación de contrarresto. | Zaragozá frente a la descripción genérica de Cabrera. |
| Escalinata | La fecha 1799 corresponde al pretil. Se mantiene abierta la cronología completa del acceso. | Forner y Palomar, pp. 74–76. |
| Torre | Se distingue la reconstrucción del siglo XX de la base anterior. No se atribuye el hierro a Eiffel. | Inventario de Campaners y estudios del templo. |
| Declaración monumental | Se separan decreto y publicación. No se usa la fecha secundaria del 25 de octubre. | BOE-A-1983-2860. |
| Reloj | El foco mira al cuerpo del reloj, sin situar una vitrina ni fabricar el mecanismo expuesto. | Ayuntamiento, marzo de 2026. |
| Anexo de Berenguer | Se cita el balance de la primera fase y el carácter posible de la ocupación islámica. | Ayuntamiento, agosto de 2025. |
| Restos de Sagrari | Se conserva el topónimo tradicional y se hace visible la discusión de su atribución. | Comunicación municipal y Civera, p. 199, nota 7. |

Las medidas publicadas de altura no son mediciones realizadas por este proyecto. El valor de 58 m de la torre procede de la bibliografía recogida por Campaners. La muestra raster de alturas existente en el atlas no debe interpretarse como una medida equivalente de la punta metálica.

La noticia municipal del reloj y la [ficha técnica especializada](https://campaners.com/php/rellotge.php?numer=338) discrepan en atribuciones de fabricante, mantenedor y restauración. Por eso la visita comunica únicamente los hechos concordantes que necesita: función cívica, servicio durante el siglo XX y exposición comunicada por el Ayuntamiento. La fecha de la noticia no se convierte en una fecha exacta de ejecución de todos los trabajos.

## Contrato de coordenadas e identificadores

Registro acordado con el módulo de iglesia y el módulo de entorno:

- Anclaje geográfico: **longitud −0,27910948; latitud 39,67903398**.
- Giro local: **1,173 rad**.
- Eje local **+x hacia NNE**, frente de la Plaça Major; **+z hacia ESE**, cabecera.
- Conversión compatible con la proyección existente: `lonScale = 111320 × cos(39.679°)`; `east = x cos(yaw) + z sin(yaw)`; `south = −x sin(yaw) + z cos(yaw)`.
- Cada `coordinate` / `coordinates` se deriva del mismo `modelLocal`. Todos son focos de interpretación aproximados.
- Los puntos urbanos se registran con las huellas y ejes cartográficos existentes; no representan una auditoría de accesibilidad del itinerario físico.

| Orden | ID | Ámbito | x local | z local | Longitud | Latitud |
|---|---|---|---:|---:|---:|---:|
| 1 | `santa-maria-conjunto` | ciudad | -1 | -3 | -0.27914628 | 39.67903614 |
| 2 | `santa-maria-plaza-mayor` | ciudad | 56.556444 | 20.794145 | -0.27863 | 39.67943 |
| 3 | `santa-maria-cavallers` | ciudad | 25.4 | -16 | -0.2791668 | 39.67930001 |
| 4 | `santa-maria-portada-norte` | portadas | 19.42 | 0.35 | -0.27901791 | 39.67919359 |
| 5 | `santa-maria-escalinata` | portadas | 23.2 | 0.35 | -0.27900081 | 39.6792249 |
| 6 | `santa-maria-portada-sur` | portadas | -21.55 | 0.35 | -0.27920315 | 39.67885429 |
| 7 | `santa-maria-portada-principal` | portadas | -1.1 | -27.72 | -0.27941274 | 39.67912133 |
| 8 | `santa-maria-naves` | arquitectura | -1.1 | -3.4 | -0.27915104 | 39.6790367 |
| 9 | `santa-maria-bovedas` | arquitectura | -1.1 | 2.6 | -0.27908648 | 39.67901582 |
| 10 | `santa-maria-capillas` | arquitectura | 16.1 | -6.2 | -0.2791034 | 39.67918889 |
| 11 | `santa-maria-abside` | arquitectura | -1.1 | 17 | -0.27893152 | 39.67896571 |
| 12 | `santa-maria-contrafuertes` | arquitectura | -12 | -3.4 | -0.27920032 | 39.67894643 |
| 13 | `santa-maria-campanario` | torre | 16.46 | 11.2 | -0.27891454 | 39.67913132 |
| 14 | `santa-maria-reloj` | torre | 19.5 | 11.2 | -0.27890079 | 39.6791565 |
| 15 | `santa-maria-sagrario` | entorno | 1.62 | 23.6 | -0.27884821 | 39.67896527 |
| 16 | `santa-maria-berenguer` | entorno | -29.320773 | 19.929806 | -0.2790276 | 39.6787218 |

## Sección y lectura de materiales

El contrato del modelo retira cubiertas exteriores, paños de bóvedas, partes altas de los cerramientos norte y occidental y una tapa de cúpula. Mantiene pilares, arcos, nervaduras, envolvente del ábside y tracerías. Los focos `santa-maria-naves`, `santa-maria-bovedas` y `santa-maria-capillas` llevan `requiresSection: true` y `sectionRecommended: true`.

El corte es un recurso didáctico del modelo. No representa una fase histórica sin techos. No se desarrolla una cripta ni se localizan enterramientos; tampoco se reconstruyen un órgano antiguo, retablos desaparecidos, esculturas figurativas, pinturas o mobiliario sin documentación espacial suficiente. Las advocaciones sirven para explicar las etapas, sin convertir un punto aproximado en una localización precisa de todas las capillas.

| Código | Color | Uso |
|---|---|---|
| `medieval` | `#d6bd8b` | Componentes vinculados a campañas góticas. |
| `modern` | `#d4a578` | Transformaciones de los siglos XVI–XVIII. |
| `contemporary` | `#77b8c7` | Reconstrucciones y conservación de los siglos XX–XXI. |
| `mixed` | `#be98d6` | Encuentro de fábricas, reutilizaciones y épocas. |
| `interpretation` | `#929ba0` | Síntesis espacial y relaciones esquemáticas. |

## Geodatos y límites del entorno

El contexto conserva 44 partes de edificios procedentes de 16 parcelas catastrales. Usa alturas estimadas MDSnE2.5 para 28 partes y plantas catastrales × 3 m para las otras 16. Las plantas y patios son cartográficos; huecos, carpinterías, cornisas, pendientes y remates de cubierta son una síntesis doméstica. Los colores de cubierta proceden de muestras PNOA del atlas. La fecha de descarga no se confunde con la del vuelo.

La cota del suelo del templo y los peldaños se adaptan al terreno de presentación derivado del MDT05. No se declara una medición topográfica de los umbrales ni un recuento histórico documentado de peldaños. El modelo de terreno excluye edificios y no resuelve cada escalón. Las referencias geográficas visibles son `sm-context-catastro`, `sm-context-mds`, `sm-context-pnoa` y la fuente compartida `sm-osm`.

## Verificación del contenido

La revisión local comprueba que los 16 IDs son únicos, que cada parada pertenece a un ámbito, que todas las referencias de hechos y cronología existen, que los 17 hitos enlazan mediante `stopId` a una parada válida y relacionada con su contenido, que cada posición local produce la coordenada publicada y que todos los periodos y niveles de confianza tienen leyenda. Se mantienen los campos compatibles con la visita del Teatro y se añaden las etiquetas genéricas solicitadas por el controlador de monumentos.

La revisión editorial comprueba especialmente la diferencia entre presente y pasado: las observaciones de 1987 no se enuncian como una inspección actual; un estudio de conservación no implica obra ejecutada; una solicitud municipal de 2015 no acredita restauración finalizada; el balance de agosto de 2025 no prueba la finalización de una segunda fase. La noticia de marzo de 2026 se presenta como comunicación de restauración y exposición.

Los horarios de culto, posibles visitas al campanario y accesibilidad física no forman parte de esta entrega. El enlace parroquial permite consultar la información operativa en origen. La prueba del modelo, las cámaras, los materiales y la presentación responsive corresponde a la integración V9 y sus informes específicos.

## Fuentes enlazadas

Los identificadores siguientes coinciden con `sourceIds` del JSON. Los títulos, páginas o secciones de consulta se conservan junto a cada enlace.

### `sm-cabrera-1987`

**La Iglesia Parroquial de Santa María de Sagunto** — Valentín Cabrera Fombuena / Centro Arqueológico Saguntino, 1987. [Consultar fuente](https://www.centroarqueologicosaguntino.es/uploads/descargas/295_23_La_Iglesia_parroquial_de_Santa_Maria_de_Sagunto_22.pdf).

ARSE 22, pp. 23–35; planta en p. 32 (p. 646 de la paginación acumulada), página 10 del PDF. Registro de un estado del edificio y de su historiografía. Transcripción consultable también en la web parroquial; las observaciones de 1987 no acreditan por sí solas el estado de 2026.

### `sm-zaragoza-2000`

**Arquitectura gótica valenciana. Siglos XIII–XV** — Arturo Zaragozá Catalán / Generalitat Valenciana, 2000. [Consultar fuente](https://www.academia.edu/6925675/2000_Arquitectura_G%C3%B3tica_Valenciana).

Monumentos de la Comunidad Valenciana, tomo I, pp. 72–75; plantas, sección y axonometría según Juan Gomis y Eduardo Espín. Copia publicada por el autor. Fuente para la sección, cuatro tramos, altura de bóvedas y lectura funcional de los arcos de desagüe.

### `sm-navarro-2004`

**Bóvedas valencianas de crucería de los siglos XIV al XVI. Traza y montea** — Juan Carlos Navarro Fajardo / Universitat de València, 2004. [Consultar fuente](https://www.academia.edu/78069190/B%C3%B3vedas_valencianas_de_cruceria_de_los_siglos_XIV_al_XVI_Traza_y_montea).

Tomo I, pp. 79, 93 y 136; referencia al levantamiento de Juan Gomis. Se cita el texto de la tesis, cuya portada fecha la defensa en junio de 2004. El modelo sintetiza su descripción geométrica sin reproducir una montea exhaustiva.

### `sm-serrano-2018`

**Un enfoque a la Iglesia de Santa María de Sagunto, tesoro arquitectónico del Murviedro** — Alberto Serrano Monferrer / Universitat Jaume I, 2018. [Consultar fuente](https://www.academia.edu/38386111/Un_enfoque_a_la_Iglesia_de_santa_Mar%C3%ADa_de_Sagunto_tesoro_arquitect%C3%B3nico_del_Murviedro).

Braçal 55, pp. 125–138; portadas, organización espacial, capillas y pérdidas patrimoniales. Se emplean sus observaciones sobre el templo. No se trasladan a otras partes del atlas las cronologías generales de teatro y castillo mencionadas en la introducción.

### `sm-turismo`

**Iglesia Parroquial de la Natividad de Nuestra Señora** — Turisme Comunitat Valenciana. [Consultar fuente](https://www.comunitatvalenciana.com/es/valencia/sagunt-sagunto/monumentos/iglesia-parroquial-de-la-natividad-de-nuestra-senora-2).

Denominación, inicio de las obras y descripción general. Referencia para identificación y contexto básico. Las fechas detalladas de la torre se contrastan con el inventario y los estudios.

### `sm-ruta-iglesia`

**Iglesia de Santa María** — Rutas Jaume I. [Consultar fuente](https://www.rutasjaumei.com/es/que-ver-en-sagunto/222/sagunto-iglesia-de-santa-maria.php).

Campañas medievales y reuniones de las Cortes. La cronología del acceso norte se contrasta con el estudio epigráfico de 2024: la fecha de 1799 se asigna al pretil.

### `sm-lapidas-2024`

**Estudio preliminar sobre las lápidas romanas de la escalera de la iglesia de Santa María de Sagunto** — María Forner Palanca y José Manuel Palomar Abascal / Centro Arqueológico Saguntino, 2024. [Consultar fuente](https://centroarqueologicosaguntino.es/wp-content/uploads/2025/08/Arse_58-74-89.pdf).

ARSE 58, pp. 73–88; ubicación y pretil en pp. 74–76; diagnóstico y propuesta de conservación. Distingue lo documentado de las hipótesis sobre procedencia y fecha inicial de la escalera. Una propuesta de intervención no equivale a obra ejecutada.

### `sm-perales-2023`

**Reseñas de hallazgos …–2022 (parte II)** — Pablo Perales Cabrejas / Centro Arqueológico Saguntino, 2023. [Consultar fuente](https://centroarqueologicosaguntino.es/wp-content/uploads/2024/05/arse_57-107-150.pdf).

ARSE 57, pp. 128–132: «Rehabilitación de Casa Abadía y un ventanal gótico». Compara los motivos de las tracerías conservadas. La futura exposición de un ventanal mencionada allí es una previsión, no una instalación comprobada en esta visita.

### `sm-campaners`

**Parròquia de Santa Maria – Campanar de la Vila** — Campaners de la Catedral de València; documentación de campo y fuentes históricas. [Consultar fuente](https://campaners.com/php/campanar.php?numer=376).

Ficha de torre 376; descripción material, reconstrucción y referencia a Sarthou Carreres. La altura de 58 m es una medida histórica publicada; no procede de una medición nueva del proyecto.

### `sm-campanas`

**Inventario de las campanas de Santa Maria de Sagunt** — Campaners de la Catedral de València. [Consultar fuente](https://campaners.com/php/torrepdf.php?numer=376).

Tabla de campanas actuales: seis campanas principales de 1948; localización y fundidor. El conjunto incluye también otras piezas. Se evita equiparar la fecha de la torre con la de todas sus campanas.

### `sm-reloj-2026`

**El Ayuntamiento de Sagunto recupera y exhibe el reloj mecánico municipal** — Ayuntamiento de Sagunto, 2026. [Consultar fuente](https://aytosagunto.es/es/actualidad/2026-03-05-el-ayuntamiento-de-sagunto-recupera-y-exhibe-el-reloj-mecanico-municipal/).

5 de marzo de 2026; recuperación, uso histórico y exposición. Acredita la exposición del mecanismo en la iglesia. No ofrece una planta de su emplazamiento; el foco de la maqueta mira al cuerpo del reloj.

### `sm-boe-1982`

**Real Decreto 3956/1982, de 15 de diciembre** — Ministerio de Cultura / Boletín Oficial del Estado, 1982. [Consultar fuente](https://www.boe.es/diario_boe/txt.php?id=BOE-A-1983-2860).

BOE 22, de 26 de enero de 1983, p. 2036; BOE-A-1983-2860. Se distingue la fecha del decreto de la de publicación, evitando fechas de fichas secundarias que no coinciden.

### `sm-conservacion-2015`

**El Pleno aprueba solicitar la restauración de la torre de Santa María** — Ayuntamiento de Sagunto, 2015. [Consultar fuente](https://aytosagunto.es/es/actualidad/el-pleno-aprueba-solicitar-la-restauracion-de-la-torre-de-santa-maria/).

29 de octubre de 2015; referencia a restauración de cubiertas de julio de 1988. El texto documenta una solicitud de restauración de la torre. No se utiliza como prueba de que esa actuación estuviera ejecutada.

### `sm-parroquia`

**Parroquia la Natividad de Nuestra Señora de Sagunto** — Parroquia de Santa María. [Consultar fuente](https://santamariasagunto.wordpress.com/).

Presentación parroquial y contacto. Fuente para el uso religioso y comunitario. Esta visita digital no reproduce horarios de culto ni garantiza acceso físico al campanario.

### `sm-plaza`

**Plaza Mayor de Sagunto** — Rutas Jaume I. [Consultar fuente](https://www.rutasjaumei.com/es/que-ver-en-sagunto/220/plaza-mayor-de-sagunto.php).

Soportales, Almudín y calles principales. La lectura urbana se contrasta con la cartografía actual; no implica que todos los frentes de la plaza sean medievales.

### `sm-entorno`

**Historia de Sagunto** — Delegación de Turismo de Sagunto, 2020. [Consultar fuente](https://saguntoturismoblog.wordpress.com/2020/06/10/historia-de-sagunto/).

Transformación urbana medieval: plazas Mayor y Pescadería, calles y casas señoriales. Se emplea para contexto urbano, sin transformar las menciones documentales en restituciones de edificios desaparecidos.

### `sm-diana-2022`

**El Ayuntamiento consolida y restaura el muro del Templo de Diana y la mikvé de la Casa dels Berenguer** — Ayuntamiento de Sagunto, 2022. [Consultar fuente](https://aytosagunto.es/es/actualidad/el-ayuntamiento-consolida-y-restaura-el-muro-del-templo-de-diana-y-la-mikve-de-la-casa-dels-berenguer/).

9 de agosto de 2022; localización y descripción del muro. El título tradicional identifica el lugar; su atribución arqueológica no se toma como demostración de la forma de un santuario.

### `sm-diana-debate`

**Els aqüeductes de la ciutat de Saguntum** — Manuel Civera i Gómez / Centro Arqueológico Saguntino, 2008. [Consultar fuente](https://www.centroarqueologicosaguntino.es/uploads/descargas/352_010_els_aqueductes.pdf).

ARSE 42, pp. 193–225; p. 199, nota 7: discusión del llamado muro del Templo de Diana y bibliografía de Olcina y Aranegui. El autor defiende una identificación que otros investigadores discuten. Se cita para hacer visible la existencia del debate, sin resolverlo en la maqueta.

### `sm-berenguer`

**Descubre la Casa dels Berenguer en el corazón de Sagunto** — Turisme Comunitat Valenciana, 2024. [Consultar fuente](https://www.comunitatvalenciana.com/es/inspirate/casa-dels-berenguer).

7 de febrero de 2024; uso del edificio y etapas arquitectónicas. Describe un conjunto transformado, no un palacio de una sola fecha.

### `sm-berenguer-2025`

**Concluye la primera fase de las obras en el inmueble anexo a la Casa dels Berenguer** — Ayuntamiento de Sagunto, 2025. [Consultar fuente](https://aytosagunto.es/es/actualidad/2025-08-04-concluye-la-primera-fase-de-las-obras-en-el-inmueble-anexo-a-la-casa-dels-berenguer/).

4 de agosto de 2025; plaza dels Berenguer 5; fase 1 y actuaciones posteriores previstas. Las referencias a posible ocupación islámica son provisionales. No se da por finalizada una fase 2 sin una comunicación posterior que lo acredite.

### `sm-osm`

**Santa María y su entorno en OpenStreetMap** — Colaboradores de OpenStreetMap. [Consultar fuente](https://www.openstreetmap.org/way/203070952).

Huella de iglesia 203070952; torre 1303693357; calles y parcelas de cartography.json y landmarks.json. Base de localización y registro de la maqueta; no fuente para fechar fábricas ni certificar cotas arquitectónicas.


### `sm-context-catastro`

**Cartografía catastral INSPIRE · edificios de Sagunto/Sagunt** — Dirección General del Catastro. [Consultar fuente](https://www.catastro.hacienda.gob.es/webinspire/index.html).

Conjunto Buildings del municipio 46222; plantas, patios y número de plantas. La selección del entorno contiene 44 partes de edificios de 16 parcelas. Las plantas sustentan la volumetría; los huecos, carpinterías y cornisas domésticas son interpretativos. El producto del atlas no equivale a información catastral oficial ni a un levantamiento de fachadas.

[Descarga municipal de los datos](https://www.catastro.hacienda.gob.es/INSPIRE/Buildings/46/46222-SAGUNTO%20SAGUNT/A.ES.SDGC.BU.46222.zip).

### `sm-context-mds`

**Alturas MDSnE2.5 y terreno MDT05 del entorno** — Instituto Geográfico Nacional / Centro Nacional de Información Geográfica. [Consultar fuente](https://datos.gob.es/es/catalogo/e00125901-spaignmds-normalizado).

MDSnE de edificación, primera cobertura, malla de 2,5 m; terreno del atlas derivado del MDT05. El entorno usa estimaciones MDSnE para 28 partes de edificios; otras 16 se estiman a partir de las plantas catastrales a razón de 3 m por planta. Son alturas de representación, no aleros medidos. El terreno MDT05 se interpola para la presentación; la cota del templo y los peldaños se adaptan a esa superficie.

[Documentación del terreno MDT05 usado por el atlas](https://blog-idee.blogspot.com/2024/03/nuevo-servicio-xyz-del-modelo-digital.html).

### `sm-context-pnoa`

**PNOA Máxima Actualidad · ortofotografía del entorno** — Instituto Geográfico Nacional / Centro Nacional de Información Geográfica. [Consultar fuente](https://datos.gob.es/es/catalogo/e00125901-spaignpnoama).

Servicio PNOA Máxima Actualidad; muestras de color de cubiertas incorporadas al atlas. Apoya el color y la lectura de los tejados. Pendientes, remates y detalles domésticos son esquemáticos. La fecha de consulta o descarga no establece la fecha del vuelo ni acredita el estado actual de cada inmueble.

[Servicio de ortofotografía](https://www.ign.es/wms-inspire/pnoa-ma).
