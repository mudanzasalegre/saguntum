# SAGUNTUM · Atlas vivo

Atlas patrimonial y paisajístico de Sagunto, Puerto de Sagunto y su costa en Three.js, con **32 lugares explorables** sobre cartografía real. Reúne monumentos, arqueología, memoria industrial, costa y paisajes en seis ámbitos territoriales, con visitas documentadas y vistas históricas.

## La Glorieta · Plaza del Cronista Chabret

La visita recorre el paseo de Sagunto en **24 paradas**. Desde el jardín de José Romeu se llega a la fuente, la pérgola y los juegos, al frente del Mercado Municipal, la biblioteca y el auditorio, y a los arcos y el reloj del Ayuntamiento. Tiene plano seleccionable, comparación con la configuración anterior a 2009, 16 hitos históricos y una sección arqueológica del sondeo III. [Entrar en la Glorieta](https://saguntum-atlas-3d.monmode.chatgpt.site/#glorieta) · [Explorar en el simulador](https://saguntum-atlas-3d.monmode.chatgpt.site/#simulador/glorieta/glorieta-romeu) · [Fuentes, modelo y validación](docs/GLORIETA.md)

## Simulador 3D

Elige **A pie** desde la panorámica para empezar en el centro de Sagunto. Un clic en la escena activa la mirada con ratón. WASD permite caminar, Mayús correr, Espacio saltar y E entrar en la visita que tienes delante. Al acercarte a un monumento, el simulador carga su modelo original. En pantallas táctiles puedes moverte con un dedo y mirar con el otro. [Abrir el simulador](https://saguntum-atlas-3d.monmode.chatgpt.site/#simulador) · [Controles, alcance y comprobaciones](docs/EXPLORACION.md) · [Comparar el Atlas y el simulador](research/validation-atlas-parity/v41/comparacion.jpg)

Los **32 lugares visitables** tienen recorrido dentro del territorio continuo. El buscador admite el nombre del lugar o de una parada. En cada lugar puedes elegir una de sus vistas desde la lista o el mapa numerado, pasar a la visita del Atlas y regresar a la posición que habías dejado. Hay **529 entradas de visita** entre arquitectura, excavaciones, patrimonio industrial y paisajes. El encuadre, las cubiertas, las secciones y la fase documentada proceden de la visita original. [Orchestra del Teatro Romano](https://saguntum-atlas-3d.monmode.chatgpt.site/#simulador/theatre/teatro-orchestra) · [Salón del Casino](https://saguntum-atlas-3d.monmode.chatgpt.site/#simulador/casino/casino-salon) · [Desembocadura del Palancia](https://saguntum-atlas-3d.monmode.chatgpt.site/#simulador/rio-palancia/delta) · [Catálogo y criterios de integración](docs/VISITAS_TERRITORIALES.md)

La panorámica se abre con luz solar y ortofotografía. En una visita seleccionada, el ajuste **Automático** recupera el terreno y la luz del Atlas. En **Capas y luz** puedes elegir esos ajustes por separado. Las cubiertas reciben color de la fotografía aérea sobre sus huellas catastrales. Para las fachadas de las calles, la fecha declarada en Catastro orienta los acabados y las proporciones de los huecos cuando se conoce. Los alzados individuales siguen siendo aproximaciones. [Abrir el simulador](https://saguntum-atlas-3d.monmode.chatgpt.site/#simulador)

La Glorieta comparte la escena regional de Sagunto con el Teatro Romano y los demás monumentos. Sus enlaces directos abren la parada dentro de esa misma escena. Si se pierde WebGL, la misma parada se abre en su plano y ofrece **Reintentar vista 3D**. También se puede abrir el plano directamente. [Glorieta en plano](https://saguntum-atlas-3d.monmode.chatgpt.site/?vista=plano#glorieta) · [Prueba de recuperación en WebKit](research/glorieta-memoria/recuperacion-webkit.json)

El menú principal abre el [Simulador 3D — Explora Sagunto](https://saguntum-atlas-3d.monmode.chatgpt.site/#simulador). En un territorio continuo se puede pasar de la Plaça Major al Puerto y al Grau Vell, cambiar de vuelo a peatón y abrir cualquiera de los 32 destinos del Atlas. El recorrido guiado sigue 9,68 km de calles y caminos cartografiados.

La versión 35 lleva al simulador los entornos originales del Atlas. Se puede empezar bajo los soportales de la Plaça Major, en las oficinas de Gerencia o ante el Alto Horno, con el encuadre y la luz de su visita. En las calles vecinas, las jambas y los huecos tienen profundidad y las medianeras se distinguen de las fachadas. [Soportales](https://saguntum-atlas-3d.monmode.chatgpt.site/#simulador/plaza-mayor/plaza-soportales) · [Gerencia](https://saguntum-atlas-3d.monmode.chatgpt.site/#simulador/gerencia/gerencia-oficinas) · [Alto Horno](https://saguntum-atlas-3d.monmode.chatgpt.site/#simulador/horno/horno-acceso) · [Comparación gráfica con el Atlas](research/validation-atlas-parity/README.md)

El simulador usa 44.838 volúmenes cartográficos, 1.560 patios, relieve IGN, ortofotos PNOA y una red de 15.671 aristas. Carga por proximidad las escenas existentes y documenta el origen de alturas y materiales. El código estático y sus recursos se sirven directamente desde `dist/`. [Instalación, arquitectura, fuentes, pruebas y limitaciones](docs/SIMULADOR.md)

La revisión gráfica incorpora ortofotos PNOA de 2024 de hasta 25 cm por píxel, fachadas y pavimentos con materiales escaneados, reflejos del cielo en el agua y el metal y una panorámica urbana de 15.862 volúmenes. Las capturas permiten comparar las dos versiones desde las mismas calles y monumentos. [Comparación visual](research/validation-visual/README.md) · [Fuentes y límites de la reconstrucción](docs/GRAFICOS.md)

## Identidad y portada estables

Por indicación del usuario, la marca **SAGUNTUM · Atlas vivo**, el título **SAGUNTUM · Sagunto y Puerto de Sagunto** y la portada representan siempre al conjunto del atlas. Las ampliaciones de monumentos se integran en sus propias visitas y no sustituyen esta identidad ni la entrada general. Esta regla se aplica a las próximas iteraciones.

La raíz del sitio y `#atlas` abren la portada general. El logotipo, «Explorar» y la tecla Home vuelven a ella. «Explorar el atlas» abre el mapa territorial con sus seis ámbitos; cada ámbito conserva su recorrido regional. La escena inicial muestra el casco histórico de Sagunto y está identificada como tal. Las rutas regionales y los enlaces directos a cada monumento y parada se mantienen.

## V30 · Antiguo Sanatorio y jardines

La **vigésima cuarta visita detallada** se abre en `#sanatorio`, con 21 paradas por el edificio, su fragmento interior histórico, jardines y entorno. La vista `#sanatorio/sanatorio-seccion` descubre la planta baja documentada antes de entrar al vestíbulo, la capilla, la sacristía y la escalera.

La arquitectura conserva las catorce partes de Catastro y se contrasta con PNOA y fotografías de archivo: fachada asimétrica, tres accesos centrales con ventanas superiores en arco, cornisa de ladrillo, pórtico lateral, terraza y cubiertas. El recinto incluye pabellones, antiguos chalets médicos, paseos y jardines. Los edificios, calles y parque contiguo se integran mediante su cartografía actual, con superficies coordinadas para evitar duplicados o invasiones del recinto.

El plano publicado por CONTRAST/APIPS es un **fragmento histórico central de la planta baja**. La visita lo identifica como tal y diferencia sus espacios de los usos del Centro Cívico actual. Las dimensiones sin cota, materiales, equipamiento y detalle vegetal son interpretativos. El remate histórico desaparecido no se incorpora a la imagen exterior actual; el destino anunciado para el Archivo Industrial no se presenta como una apertura acreditada.

Los planos muestran el conjunto y acercan el fragmento histórico al seleccionar una parada interior. Sus huecos y escalera proceden de la geometría representada. La sección retira los elementos superiores que impedirían leer la planta baja. La vegetación interior y exterior responde al mismo control del atlas.

La escena de producción supera **828 comprobaciones**, con **132 combinaciones de cámara, acercamiento y pantalla**. Los planos Canvas superan 114 casos y los controladores comprueban las 24 visitas. La revisión visual utiliza renders CPU de las mallas finales; su iluminación aproxima la de la aplicación. El navegador y WebGL permanecen sin verificar por la limitación documentada de la vista previa.

Documentación: [investigación histórica](research/sanatorio-research.md), [modelo](research/sanatorio-model.md), [contexto](research/sanatorio-context-research.md) y [verificación V30](research/validation-v30/README.md).

## V29 · Barrio Obrero y entorno

La **vigésima tercera visita detallada** abre en `#barrio-obrero`. Reúne veinte paradas, cuarenta hechos con referencias, doce fuentes, cinco capas de lectura y seis hitos. Las paradas enlazan directamente, por ejemplo `#barrio-obrero/barrio-hileras` y `#barrio-obrero/barrio-seccion`.

### Siete manzanas y dos tipos domésticos

Se conserva el registro de 95 referencias y 287 partes catastrales, incluidas las transformaciones actuales. No equivale a un recuento de las viviendas históricas. El modelo incorpora hileras, extremos de dos plantas, cubiertas de teja, aleros, chimeneas, huecos escarzanos, recercados, carpintería, cierres, jardines y corrales ajustados al espacio libre entre construcciones.

El catálogo municipal de protección, páginas PDF 77–96, proporciona plantas, alzados y secciones. Su lámina 82 documenta aleros de 3,70 y 7,30 m, jardín de 3,50 m y calle de 7 m en S1; esas cotas orientan los tipos representados y no se extienden a todas las reformas. Se contrastan con Catastro, PNOA, CONTRAST/APIPS e investigación tipológica.

Dos muestras permiten explorar el interior: casa baja tipo III y pareja de dos plantas tipo IV. Sus paredes, pasos, suelos, techos y escalera forman geometría física. Sala, cocina, dormitorios, equipamiento y dimensiones no acotadas constituyen una interpretación doméstica; no representan el estado privado actual de esas casas. Los planos originales no rotulan el uso de todas las habitaciones.

La sección retira las cubiertas de las dos muestras y conserva el forjado intermedio. Abrirla desde cualquiera de las dos vistas generales conduce a la casa baja; abrir o cerrar desde un interior mantiene la parada. El plano selecciona casa y planta, muestra los huecos registrados y los veinte peldaños de la escalera, y evita representar jardines como espacios de la planta alta.

### Calles, terrenos y edificios próximos

El contexto desarrolla catorce tramos viarios, aceras, bordillos, pasos peatonales, la plaza de la Independencia y veintisiete árboles contrastados con la ortofoto. Mejora 370 partes catastrales vecinas correspondientes a 139 referencias. Las superficies residenciales se coordinan con el modelo de viviendas; las dos bolsas públicas de las cabeceras se pavimentan sin invadir huellas, jardines ni corrales. No se duplican superficies de los contextos anteriores. La plaza actual se distingue de la antigua plaza del conjunto descrita en el catálogo.

Los pavimentos se ajustan a los triángulos del terreno de producción. La capa Vegetación controla tanto el arbolado público como los árboles de los jardines domésticos. Alturas de árboles, mobiliario y detalles de fachadas vecinas son aproximaciones visuales; la fecha de consulta de PNOA no se presenta como fecha de vuelo.

### Verificación

La escena de producción supera 786 comprobaciones, con 126 combinaciones de cámara, sección, acercamiento y pantalla. Los planos Canvas superan 98 casos y los controladores comprueban las 23 visitas. La revisión visual utiliza las mallas, normales y texturas reales exportadas a un render CPU; su iluminación aproxima la de la aplicación. El navegador y el renderizador WebGL permanecen sin verificar por la limitación documentada de la vista previa.

Documentación: [investigación histórica](research/barrio-research.md), [modelo](research/barrio-model.md), [contexto](research/barrio-context-research.md) y [verificación V29](research/validation-v29/README.md).

## V26 · Casino Recreativo y Cultural

El Casino incorpora la **vigésima visita detallada**, con **20 paradas, 40 hechos referenciados, 17 fuentes, cinco ámbitos y diez hitos**, en `#casino`, con enlaces a cada parada como `#casino/casino-patio`. El recorrido relaciona el edificio de 1921, sus usos sociales, las transformaciones de finales de los años sesenta y el jardín de los bailes. Mantiene la entrada general del atlas y su relación con la Gerencia, Begoña y el patrimonio industrial.

### Edificio, patio e interiores

La huella y el patio se apoyan en Catastro y se contrastan con PNOA, fotografías municipales y documentación de la entidad, la UV/APIVA, CONTRAST y el equipo de rehabilitación. La lectura arquitectónica distingue el zócalo elevado, los machones de ladrillo, los recercados, la terraza y la escalera exterior. El patio conecta los espacios sociales y las galerías de las dos plantas.

La biblioteca, el salón, el vestíbulo y las estancias superiores se interpretan a partir de sus usos documentados. Las particiones, el mobiliario y las dimensiones interiores sin levantamiento no se presentan como una reproducción exacta. La sección permite leer esas relaciones espaciales; las vistas interiores normales conservan sus techos.

### Jardín y contexto

El jardín, la pista, el escenario y el arbolado se componen sobre el trazado reconocible en la ortofoto y las fotografías. El perímetro se coordina con el contexto ya modelado de la Gerencia para asignar una sola geometría a cada superficie. Las calles y los edificios circundantes mantienen su base cartográfica y sus proporciones estimadas.

### Cronología y estado de la rehabilitación

La historia de la entidad sitúa la terraza y su escalera en el verano de 1968; CONTRAST las relaciona con mejoras financiadas en 1969. La guía conserva ambas referencias. La noticia municipal del 6 de octubre de 2026 documenta obras en curso: el vidrio previsto para cubrir el patio no se da por ejecutado, y la visita digital no certifica una reapertura física. El patio abierto del modelo facilita la lectura de la fábrica y de sus galerías.

La inspección utiliza la geometría de producción, cámaras, mapas Canvas, controles y renders CPU. Estos últimos no son capturas WebGL: la interacción completa del navegador, su composición final y el rendimiento GPU permanecen sin verificar por la limitación de la infraestructura de revisión.

Documentación: [historia y fuentes](research/casino-history.md), [criterios del modelo](research/casino-model.md), [jardín y contexto](research/casino-context.md) y [verificación V26](research/validation-v26/README.md).

## V25 · Gerencia y ciudad jardín

La Gerencia incorpora la **decimonovena visita detallada**, con 20 paradas, 17 fuentes, 40 hechos referenciados, cinco ámbitos y diez hitos. El recorrido se abre en `#gerencia`; las paradas tienen enlaces como `#gerencia/gerencia-vestibulo`. La portada del atlas mantiene sus 31 lugares y seis ámbitos territoriales.

### Arquitectura del recinto e interiores de las oficinas

El nuevo modelo distingue el cuerpo de oficinas de 1921 y la ampliación de 1952, enlazados mediante el paso retranqueado y su arco carpanel. Las fachadas combinan zócalos, revoco, ladrillo y cercos pétreos; ventanas y puertas presentan huecos físicos. El vestíbulo, la escalera y las salas principales recuperan la secuencia y los materiales descritos por la UV y fotografiados por CONTRAST: piedra pulida, madera oscura y vidriera. La composición de esta última es procedural e interpretativa, no una reproducción de la obra artística.

Los chalés conservan sus huellas cartográficas y se diferencian en viviendas aisladas, parejas y filas de cuatro. Se detallan miradores, atrios, aleros, carpinterías verdes, frontones curvos, cubiertas y chimeneas según sus tipos. El modelo reúne doce grupos del registro, con dos volúmenes de oficinas en el primero. El dato histórico de 21 viviendas de CONTRAST y las 22 de UV/APIVA se conservan como recuentos distintos; no equivalen al número de polígonos ni se fuerzan a coincidir.

Las tres vistas interiores corresponden a las oficinas. Sus proporciones y particiones no proceden de un levantamiento completo. Las viviendas se exploran desde el exterior y en sección tipológica. La sección retira cubiertas, forjados y elementos dependientes de las plantas superiores; las vistas interiores normales mantienen sus techos.

### Jardines, caminos y ciudad

El paisaje toma como referencia PNOA, el viario y la parcelación, junto con las fotografías municipales del jardín oriental recuperado. Los caminos se recortan contra los edificios; los suelos se triangulan sobre el terreno final. El arbolado tiene posiciones contrastadas con la ortofoto, mientras sus especies, alturas y detalle botánico son aproximados. El oeste mantiene espacios abiertos y suelo seco, y el este incorpora los acabados y elementos contemporáneos observados.

Se conserva la propiedad de las geometrías del Casino, Begoña y los anteriores contextos industriales. Las superficies compartidas se restan por su ocupación real para evitar duplicados y vacíos. La capa Vegetación gobierna también los árboles del recinto.

El plano general incluye edificios, caminos, jardines y veinte paradas. Al seleccionar un interior, se amplía la planta correspondiente de las oficinas y conserva la numeración del recorrido. Las fuentes y la cronología explican tanto la arquitectura como la organización social del recinto y su recuperación ciudadana.

### Estado documental y verificación

La apertura de diciembre de 2023 corresponde al jardín oriental. El Ayuntamiento seguía describiendo pendientes las fases 2 y 3 en febrero de 2026. La adjudicación paisajística del entorno en marzo de 2026 no acredita la finalización de esas fases ni la apertura de oficinas o viviendas. La fecha de consulta de la ortofoto no equivale a su fecha de vuelo.

La verificación comprende geometría del Puerto, cámaras, controles, planos Canvas y recursos de distribución. Los renders CPU permiten inspeccionar la geometría y las texturas reales con iluminación aproximada. El render WebGL, el rendimiento GPU y la interacción completa en un navegador quedan sin verificar por la limitación de la infraestructura de revisión.

Documentación: [historia y fuentes](research/gerencia-history.md), [criterios del modelo](research/gerencia-model.md), [paisaje y contexto](research/gerencia-context.md) y [verificación V25](research/validation-v25/README.md).

## V24 · Nave de Efectos y Repuestos / Museo Industrial y de la Memoria Obrera

El lugar 16 pasa a ser la **decimoctava visita detallada**, con 20 paradas, 18 fuentes, 40 hechos referenciados y diez hitos cronológicos. La entrada es `#museo-industrial`; cada parada admite un enlace propio, como `#museo-industrial/museo-industrial-nave-central`. La Casa del Mestre Penya continúa en su visita independiente `#museo`. Se conservan los 31 lugares, seis ámbitos y la portada general del atlas.

### La nave histórica y el museo abierto en 2026

La arquitectura combina la huella catastral, PNOA, la ficha y el porfolio de espacios de la Fundació y las fotografías municipales de la rehabilitación y de la apertura. El Ayuntamiento confirmó la apertura el 15 de octubre de 2026. La guía distingue ese estado actual de los proyectos museográficos y de las fases de rehabilitación anteriores.

El modelo incorpora tres vanos longitudinales: un espacio central de altura completa con carriles protegidos bajo vidrio y dos franjas laterales con andenes y galerías a distintas cotas. Los huecos de fachada y los portones atraviesan físicamente los muros. Se reconocen las cerchas abiertas, los pilares, las barandillas, las estanterías tipológicas, el anexo y los cuerpos de acceso contemporáneos. Las tres plantas del recorrido tienen cámaras interiores y se reflejan en el plano.

La vista normal mantiene los techos. La sección retira conjuntamente cubiertas, forjados superiores, escaleras y mobiliario de esas plantas, conservando la estructura y el nivel inferior. Se evita así mostrar vitrinas o barandillas flotantes. El eje ferroviario se conserva bajo un suelo de vidrio contemporáneo; la diferencia de un metro con los antiguos andenes sigue siendo legible.

### Ciudad, superficies y plano

El entorno detalla 69 partes de 18 parcelas, veinte fragmentos de calle y superficies trianguladas que siguen el terreno final. La composición incorpora el espacio de llegada, el entorno de la avenida, bordillos, pasos peatonales, árboles y farolas. Los modelos patrimoniales próximos conservan su geometría y sus propietarios. El nuevo contexto excluye sus superficies para no superponer las intervenciones del Alto Horno y Talleres Generales.

Dos cuerpos catastrales coinciden con un espacio abierto en la ortofotografía consultada. Se conservan sus registros y se documenta la discrepancia, pero no se levantan allí dos bloques ficticios. Esta elección visual no certifica una demolición ni la fecha actual de la imagen.

El plano general mantiene las veinte paradas. Al elegir un punto interior, muestra los componentes y las paradas del nivel correspondiente. En formato amplio añade una sección transversal interpretativa que explica la asimetría de las galerías.

### Alcance de la representación

La envolvente cartográfica de aproximadamente 60,7 × 20,2 m difiere de los 70 × 18 m nominales publicados por la Fundació. El modelo conserva esa discrepancia. Alturas sin levantamiento, espesores, posición de escaleras y soportes expositivos son aproximados. Las piezas y testimonios de la colección se explican documentalmente; el mobiliario de la maqueta no equivale a una reproducción exacta del inventario ni de la museografía de 2026.

La verificación combina geometría y cámaras de la región completa, planos Canvas, fuentes, recursos, navegación y progreso independiente. Los renders CPU inspeccionan las mallas reales con iluminación aproximada. La comprobación visual del render WebGL y del rendimiento GPU queda sin verificar por una limitación del entorno de revisión.

Documentación: [historia y fuentes](research/museo-industrial-history.md), [criterios del modelo](research/museo-industrial-model.md), [contexto urbano](research/museo-industrial-context.md) y [verificación V24](research/validation-v24/README.md).

## V23 · Nave de Talleres Generales y su recinto

El lugar 15 incorpora una visita detallada con **20 paradas, 17 fuentes, 40 hechos referenciados y diez hitos cronológicos**. La entrada `#talleres` y sus enlaces de parada —por ejemplo `#talleres/talleres-interior`— utilizan el sistema de recorrido, cronología, fuentes y progreso independiente del atlas. Se conservan los 31 lugares, seis ámbitos territoriales y las dieciséis guías anteriores.

### Cuatro naves y un interior continuo

La representación se apoya en la huella cartográfica, PNOA, la descripción patrimonial del BOE, estudios de APIVA y la Universitat de València y fotografías institucionales e históricas. Las dos naves centrales son más altas que las laterales. La envolvente nominal publicada de 120 × 80 m se distingue de las luces útiles de 22,5 m y 15 m; la geometría se registra proporcionalmente sobre el contorno del edificio.

Los portones y las ventanas tienen huecos físicos. Las fachadas combinan piedra, ladrillo, grandes arcos, pilastras y cornisas. En el interior se reconocen el suelo continuo, las cerchas metálicas, los pilares de hormigón y de celosía, las vigas carrileras, las ventanas altas redondeadas y los lucernarios longitudinales. Las vistas interiores mantienen la cubierta; «Abrir cubiertas» retira su piel para observar la estructura desde arriba. Las instalaciones y máquinas desaparecidas se explican en la guía sin convertirlas en equipamiento actual.

### Explanadas, calles y edificios próximos

El contexto sigue el recinto contemporáneo: viales, rotondas, espacios de grava y pavimento, bordillos, árboles y palmeras observados en PNOA. Se detallan 31 partes de cuatro parcelas residenciales al norte. Los suelos se adaptan al terreno final; las trece partes catastrales de la nave y su versión OSM se excluyen de la ciudad genérica para evitar duplicados. El distrito del Alto Horno conserva su propietario y su escena.

El plano norte arriba muestra las cuatro naves, sus sobrecubiertas y el recinto. Al abrir las cubiertas aparecen pilares y cerchas en planta. En pantalla ancha incluye una sección transversal interpretativa; los números conservan las veinte paradas en móvil y en el modo documental.

### Evidencia y verificación

Las alturas, el paso exacto de cada cercha, la identificación material individual de los apoyos y los detalles menores sin levantamiento se declaran aproximados. Las fuentes difieren en el cómputo de hileras de pilares; el cuaderno conserva esa discrepancia. La visita digital no acredita apertura presencial ni presenta los anuncios de conservación como obras ejecutadas.

Se verifican la escena completa del Puerto, las cámaras, los planos, las fuentes, las importaciones y el comportamiento de las diecisiete guías. Los renders de inspección usan las mallas y texturas de la aplicación con iluminación CPU aproximada; no son capturas WebGL ni una medición de rendimiento en el dispositivo del visitante.

Documentación: [historia y fuentes](research/talleres-history.md), [criterios del modelo](research/talleres-model.md), [recinto y entorno](research/talleres-context.md) y [verificación V23](research/validation-v23/README.md).

## V22 · Alto Horno n.º 2 y su entorno industrial

El horno incorpora la primera visita detallada del Puerto: **20 paradas, 12 fuentes, 40 hechos referenciados y ocho hitos cronológicos**, con cinco ámbitos temáticos. Se entra desde `#horno` y cada parada conserva un enlace propio, como `#horno/horno-interior`. El atlas mantiene sus 31 lugares, seis ámbitos territoriales y las quince visitas detalladas anteriores.

### Una máquina reconocible, por fuera y por dentro

El modelo sustituye la representación anterior por una estructura con crisol, etalajes y cuba huecos, revestimiento refractario, doce toberas, tubo anular, 315 cajas de refrigeración en 21 filas, escaleras abiertas, plataformas, dos purgas superiores, puentes grúa y plano inclinado. La losa de trabajo es de hormigón; la cimentación se representa parcialmente enterrada. Se usan las dimensiones publicadas en el BOE —64,20 m de altura exterior, 31 m de diámetro de base y 24,5 m de altura interior nominal— y se contrastan proporciones y materiales con planos y fotografías de la rehabilitación.

El visitante puede entrar virtualmente sobre la pasarela en Y, reconocer las tres aperturas contemporáneas y abrir una sección didáctica. Las vistas interiores conservan la envolvente cuando procede; los cortes muestran el perfil y el espesor del revestimiento. Las pasarelas y conductos tienen vacíos físicos, los peldaños permanecen abiertos y las barandillas distinguen los acabados metálicos conservados.

### El recinto y la ciudad

La recepción combina dos volúmenes inclinados con un corredor que llega a la plataforma del horno. El contexto sigue la cartografía de calles y parcelas, la ortofoto y los planos arquitectónicos: pavimentos, vallado abierto, vías y traviesas, arbolado y cinco partes de edificios industriales cercanos. Se excluyen las versiones genéricas duplicadas y las superficies se ajustan al terreno final.

El alzado permite seleccionar las 20 paradas y leer las alturas principales. En pantalla ancha se acompaña de la planta del recinto; en móvil se prioriza el alzado. Recorrido, Cronología, Fuentes, lectura cromática y progreso independiente utilizan el mismo sistema del atlas, ahora también en el Puerto. La guía conecta con Talleres Generales, el Museo Industrial y la Gerencia.

### Evidencia y límites

Las dimensiones publicadas y los componentes conservados se distinguen de las restituciones de la rehabilitación y del detalle modelado por interpretación. El registro del alzado, los espesores finos, las fachadas del contexto y las cotas sin levantamiento son aproximados. Las antiguas estufas, chimeneas y depurador desaparecidos se explican en la documentación. Las cámaras elevadas son observaciones virtuales y no representan la disponibilidad de acceso presencial.

La comprobación reúne geometría y cámaras del Puerto completo, lectura documental, planos y navegación. Los renders CPU usan las mallas y texturas de la aplicación con iluminación aproximada; el navegador de verificación disponible no dispone de WebGL y se utiliza para comprobar la interfaz y el modo documental.

Documentación: [historia y fuentes](research/horno-history.md), [criterios del modelo](research/horno-model.md), [recinto y entorno](research/horno-context.md) y [verificación V22](research/validation-v22/README.md).

## V21 · Necrópolis judía, hipogeos y paisaje de la ladera

El lugar 13 incorpora una visita detallada con **20 paradas, 11 fuentes, 8 hitos cronológicos y cinco lecturas temáticas**. Conserva el acceso `#necropolis`, las catorce visitas anteriores y la portada general de 31 lugares en seis ámbitos. Cada parada dispone de enlace propio, como `#necropolis/necro-camara`.

### Dos ámbitos con sus propios accesos

El cementerio junto al castillo y los hipogeos próximos al teatro mantienen sus emplazamientos independientes, separados unos 194 m en la cartografía del atlas. El plano general presenta ambos sectores; al elegir una parada aparece su planta local con diez observaciones. No se extiende la excavación de uno al otro.

El sector funerario se registra en el contorno OSM del pequeño recinto visitable. Las doce sepulturas representadas son una muestra tipológica dentro de ese contorno: fosas trapezoidales orientadas norte–sur, mampostería caliza, grandes losas desiguales y rellenos de protección. La secuencia de dos niveles se explica mediante un perfil didáctico. La síntesis de Hinojosa, las intervenciones recogidas en ARSE y las fotografías institucionales respaldan la lectura, sin atribuir precisión de inventario a cada tumba.

En los hipogeos se modelan tres bocas con huecos físicos, umbrales, cámaras, una hornacina y la roca que las cubre. El cierre metálico con menorá se reconoce como contemporáneo y se sitúa de forma representativa en una boca. La antigua puerta medieval documentada por Pascual y Aranegui pertenece al castillo. La planta interior, las cotas y los espesores rupestres son interpretativos; sus transformaciones no reciben automáticamente la cronología del cementerio medieval.

### Actual, Corte e Histórica

- **Actual:** conserva las losas y rellenos de protección, la cubierta de roca y los acondicionamientos contemporáneos. Las observaciones interiores mantienen sus techos.
- **Corte:** abre las sepulturas en el cementerio o retira la cubierta de roca en los hipogeos. Cada sector actúa por separado; el otro conserva su estado actual.
- **Histórica:** propone una lectura medieval del cementerio y una posibilidad de uso de las cavidades identificada como hipótesis sin datación común. Las cubiertas pueden abrirse y los complementos hipotéticos pueden ocultarse.

Recorrido, Cronología, Fuentes, lectura por capas y progreso independiente comparten el sistema del atlas. Los planos admiten selección tanto por números como por superficies. La guía enlaza con la Judería, el Castillo y el Teatro Romano.

### Paisaje y acabado

Se detallan seis fragmentos de sendero o calle, dos contenciones cartografiadas y el relieve inmediato. El contexto incorpora 22 árboles —siete cipreses— y 180 pequeños elementos de vegetación y piedra, con posiciones interpretadas y exclusiones alrededor de tumbas, cámaras y caminos. Los tres cuerpos edificados cercanos y las cuatro vías ya representadas conservan sus modelos del castillo y teatro.

Las superficies siguen el terreno final. Los huecos de visualización se limitan a cada núcleo y se cierran con terreno propio alrededor de las estructuras. Los materiales diferencian losas, aparejo, relleno, roca tallada, suelo y metal. Las texturas se producen mediante código; las fotografías documentales sirven de referencia visual.

La revisión comprende geometría y cámaras de la escena completa, documentación, planos y navegación. Las imágenes CPU se generan desde las mallas y texturas de la aplicación. El navegador disponible carece de WebGL; allí se comprueban el modo documental y la interfaz, sin afirmar una prueba visual del renderizado GPU.

Documentación: [historia y fuentes](research/necropolis-history.md), [criterios del modelo](research/necropolis-model.md), [paisaje y entorno](research/necropolis-context.md) y [verificación V21](research/validation-v21/README.md).

## V20 · Puerta del Circo Romano y su ciudad

La puerta tiene una visita detallada propia con **20 paradas, 22 hechos referenciados, 7 fuentes y 8 hitos cronológicos**. La entrada `#circo` y los enlaces de parada, como `#circo/circo-puerta` o `#circo/circo-historica`, conservan la navegación del atlas. Se mantienen la portada territorial, los 31 lugares y las trece visitas detalladas anteriores.

### De la sillería a la arena

El modelo combina las medidas de Bru recogidas por Civera, la memoria de intervención de López, Sañudo y Verdasco y la revisión fotogramétrica de Melchor y colaboradores, publicadas en 2017. Se contrasta con fotografías del recinto y su cartografía urbana. La puerta conserva **6,21 × 2,07 × 4,10 m** de volumen de referencia y un vano físicamente abierto de **1,20 × 2,20 m**, con hiladas desiguales, dintel y coronación incompleta.

El acceso conduce a los muros y corredores documentados. El umbral con gozne se sitúa en el muro del podio; la caja de la escalera permanece sin peldaños reconstruidos. El departamento de la tribuna reproduce aproximadamente los **9 m²** y el relleno de **0,90 m** descritos. Las ubicaciones interiores y las cotas son un registro proporcional, no un levantamiento topográfico.

### Tres maneras de leer el conjunto

- **Actual:** puerta, restos, contenciones, vallado azul, tarima, vidrio y escalera contemporánea, dentro de su recinto irregular abierto.
- **Corte:** las protecciones actuales pueden hacerse transparentes u ocultarse. Se conserva la fábrica antigua y se añade una lectura esquemática de estratos, incluido el enlosado UC 211 del sondeo que hoy está protegido y cubierto. Este corte no inventa una cubierta desplazable.
- **Histórica:** el circo aparece como una hipótesis de trabajo de **273 × 70 m**, dentro de los intervalos publicados. La arena y el euripus se relacionan con la ciudad. Gradas de madera, metas, salidas occidentales, agua y elevación de la tribuna son interpretaciones opcionales. El cierre occidental sigue siendo incierto.

El plano dispone de dos escalas coordinadas con las paradas: **puerta y recinto** o **antiguo circo**. Los números y las superficies seleccionables enlazan con el cuaderno. Recorrido, Cronología, Fuentes, cinco capas temáticas y progreso independiente también funcionan en el modo documental sin WebGL.

### Entorno y acabado

El barrio inmediato se desarrolla con **91 partes de 21 parcelas**, seis patios y ocho fragmentos de calle. La plaza norte se apoya en su polígono cartográfico. Cinco árboles, bordillos, bolardos y espejo vial aportan escala; su detalle es interpretativo. La medianera occidental permanece ciega, y las alturas dudosas figuran en una revisión explícita.

Un pavimento de cierre mantiene la superficie entre el recinto irregular y la ventana rectangular del terreno. Al abrir el trazado histórico, se recortan también los edificios detallados que lo ocupan y se restituyen al regresar a Actual. Cada conjunto tiene un único propietario geométrico y conserva la disposición de sus recursos.

La inspección gráfica usa mallas y texturas de la aplicación, con iluminación CPU aproximada. El navegador de pruebas no dispone de WebGL; allí se comprueban la interfaz, el plano y la documentación. No se atribuye a esa comprobación una medición de rendimiento gráfico.

Documentación: [historia y fuentes](research/circo-history.md), [entorno urbano](research/circo-context.md) y [verificación V20](research/validation-v20/README.md).

## V19 · Domus dels Peixos, museo y entorno urbano

La Domus tiene una visita propia dentro de **SAGUNTUM · Atlas vivo**, con **20 paradas, 38 hechos referenciados, 9 fuentes y 12 hitos cronológicos**. La portada general, los 31 lugares, los seis ámbitos y las doce visitas detalladas anteriores conservan sus accesos. La visita se abre con `#domus`; cada parada mantiene un enlace directo, como `#domus/domus-impluvium`.

### La casa y sus evidencias

El informe de excavación de Antoni, Hernández y De Antonio (2002) se contrasta con la planta de F. J. Hernández publicada por Hurtado Mullor (2021), las revisiones de Peñalver (2014 y 2019), la síntesis de 2022 y fotografías del espacio musealizado. El modelo conserva las dimensiones publicadas del patio, estanque, cocina, recinto hidráulico y sala de recepción. La cocina y el pequeño recipiente se representan como espacios contiguos y diferenciados.

El estanque mantiene su vaso hueco, esquinas redondeadas, revestimiento hidráulico, encuentros curvos y decoración marina exterior. Los motivos son dibujos originales para la maqueta. Los muros bajos muestran pérdidas y juntas; la pequeña zona de *opus spicatum*, los umbrales, el fragmento de columna caído con policromía y los revestimientos de la sala principal completan la lectura próxima.

Las denominaciones tradicionales se acompañan de su grado de certeza. Se presenta un patio central, tradicionalmente llamado atrio; una sala de recepción, identificada como *tablinum* o posible *triclinium*; y un recinto hidráulico interpretado como baño o depósito. No se construyen un hipocausto ni un horno fijo sin evidencia.

### Actual, Corte e Histórica

- **Actual:** el yacimiento permanece bajo el edificio contemporáneo. La observación interior conserva la cubierta, los soportes, las instalaciones, la pasarela y la iluminación de museo. El acceso moderno se sitúa en el frente de València y se diferencia del acceso romano occidental propuesto.
- **Corte:** la cubierta y el edificio superior se desplazan para descubrir las estancias. Los detalles disponen de cámaras próximas; el contorno irregular de la parcela conserva el suelo exterior entre el edificio y la ventana rectangular de visualización.
- **Histórica:** una restitución interpretativa de la vivienda permite leer volúmenes, colores y cubierta. La parada del *compluvium* muestra inicialmente el tejado; el usuario puede abrirlo. Los añadidos hipotéticos, el agua y el mobiliario tienen control independiente.

La planta es seleccionable: además de los números de parada, las superficies de las estancias permiten acceder a sus fichas. El plano distingue el subsuelo y la ciudad actual. Recorrido, Cronología, Fuentes, lectura por capas y progreso independiente funcionan también en el modo documental sin WebGL.

### Barrio y registro espacial

El edificio anfitrión conserva sus **10 partes catastrales**. El entorno añade **54 partes de 19 parcelas**, dos patios, diez fragmentos de calle, aceras y bordillos derivados de la cartografía. Se reutilizan las geometrías de los nueve contextos anteriores que alcanzan la zona. Las fachadas y detalles menores son interpretativos; no se atribuye una reproducción exacta de cada puerta o ventana.

La planta romana se registra de forma proporcional en el bloque oriental del solar. El ala occidental del edificio actual no se presenta como una habitación romana. El plano, las cámaras y la documentación comparten coordenadas generadas desde el mismo modelo. La profundidad y los alzados carecen de control topográfico arqueológico y se identifican como aproximaciones.

Documentación: [historia y fuentes](research/domus-history.md), [criterios del modelo](research/domus-model.md), [entorno urbano](research/domus-context.md) y [verificación V19](research/validation-v19/README.md).

## V18 · Vía del Pòrtic, Antiga Moreria y ciudad actual

La ampliación desarrolla el espacio arqueológico bajo los dos edificios de la plaza de la Antiga Moreria. Conserva la marca, la portada general, los **31 lugares en 6 ámbitos** y las visitas anteriores. La visita mantiene el identificador `portic` y se enlaza con la Domus dels Peixos y el Museo Arqueológico.

### Arqueología y musealización

Las memorias de excavación de *ARSE*, la revisión de las viviendas publicada en *Pyrenae* en 2022 y las plantas del conjunto guían la calzada de unos 60 m, sus anchuras variables, los nueve apoyos occidentales y cinco orientales descritos en 2005, la cloaca, el basamento monumental, los depósitos y las ocupaciones posteriores. Los detalles se contrastan con fotografías del proyecto museográfico y de las mejoras de accesibilidad inauguradas en 2022.

El modelo representa los restos, sus materiales y pérdidas, junto con las tarimas, protecciones de vidrio, barandillas, apoyos modernos y cubierta del espacio musealizado. La distribución arqueológica se registra proporcionalmente sobre las huellas actuales. Las cotas subterráneas y las disposiciones de menor respaldo documental conservan una nota de interpretación; no se atribuye al atlas el escaneo láser realizado por otro equipo.

### Tres presentaciones coordinadas

- **Actual:** los edificios anfitriones mantienen sus volúmenes; las cámaras interiores observan el yacimiento bajo su cubierta, con iluminación museográfica.
- **Corte:** el usuario puede levantar y apartar la cobertura contemporánea, mostrar u ocultar el bloque desplazado y descubrir un tramo de la cloaca retirando sus losas. El recorte conserva los pavimentos y edificios vecinos.
- **Histórica:** interpretación de la fase del siglo II. El arco y los alzados monumentales perdidos se diferencian visualmente y pueden ocultarse; las etapas domésticas, funerarias y medievales se estudian en la visita documentada.

### Veinte paradas e historia específica

El cuaderno reúne **20 paradas, 40 hechos referenciados, 18 hitos cronológicos y 19 fuentes**. Sus seis ámbitos son la vía y el agua, el área monumental, la ocupación doméstica, las transformaciones tardías, las etapas medievales y el museo con la ciudad actual. El plano distingue el subsuelo y el espacio urbano. Recorrido, Cronología, Fuentes, lectura por capas, progreso y enlaces profundos conservan el sistema común de la aplicación.

Los enlaces `#portic`, `#portic/portic-calzada`, `#portic/portic-cloaca` y `#portic/portic-historica` abren directamente la visita o una observación preparada. La navegación sigue siendo orbital. La relación con la Vía Augusta, la función del gran monumento y el alzado del arco se explican con sus incertidumbres. El espacio inmersivo anunciado en 2026 figura como proyecto cuya ejecución no se ha verificado.

### Plaza, relieve y edificios

El conjunto integra las **27 partes catastrales de los dos edificios anfitriones** y un contexto de **152 partes de 44 parcelas vecinas**, diez patios y diecisiete fragmentos de calles. Los pavimentos diferencian asfalto, aceras, plaza y parterres; 24 árboles y seis bancos interpretativos completan el espacio público. Las alturas combinan estimaciones IGN y número de plantas, con revisión explícita de discrepancias.

La superficie exterior se adapta al relieve final. Un complemento de terreno conserva la plaza que queda entre las huellas irregulares de los edificios y la ventana rectangular de corte. Las fachadas, carpinterías, mobiliario y vegetación son aproximaciones documentadas, sin pretensión de inventario exacto.

### Verificación

Se verifica la escena regional de producción, la independencia de las doce visitas, la recuperación tras fallos de carga, los materiales y las presentaciones arqueológicas. Las cámaras se comprueban frente al terreno y los edificios completos. Los renders de inspección proceden de las mallas y texturas de Three.js; la iluminación CPU tiene una equivalencia visual aproximada. El navegador de pruebas carece de WebGL y se utiliza para comprobar la interfaz, el plano y la documentación, sin atribuirle una prueba visual GPU.

Documentación: [historia y fuentes](research/portic-history.md), [modelo arqueológico](research/portic-model.md), [plaza y contexto](research/portic-context.md) y [verificación V18](research/validation-v18/README.md).

## V17 · Casa del Mestre Penya, Museo Arqueológico y Judería

La ampliación conserva **SAGUNTUM · Atlas vivo**, el título general **SAGUNTUM · Sagunto y Puerto de Sagunto**, los **31 lugares en 6 ámbitos** y las visitas anteriores. El museo mantiene su identificador `museo`; su nueva visita se enlaza con la Judería sin crear un segundo arco ni un segundo museo.

### Arquitectura e interior documentados

La memoria de los arquitectos de la rehabilitación, publicada en *Vía Arquitectura*, se contrasta con las plantas e imágenes del proyecto de conservación redactado en agosto de 2025. El modelo diferencia el edificio principal, sus dos plantas y el cuerpo de la calle Dolors. La planta baja muestra arcos apuntados y estructura de madera; la superior se organiza mediante muros de carga y pasos entre salas. La cubierta contemporánea y la circulación rehabilitada permanecen reconocibles.

La sección arquitectónica retira cubierta y forjado, junto con los elementos expositivos que dependen de la planta retirada. Al cerrar el corte se recuperan las plantas y las cubiertas. Las vistas interiores normales conservan sus techos y suelos. El corte explica el edificio y no presenta un subsuelo arqueológico excavado inexistente en el modelo.

### Veinte paradas y dos plantas

El cuaderno incorpora veinte paradas: conjunto, plaza, fachada, acceso, balcones, cubierta, planta baja, arcos, cantería, epigrafía, escultura, planta alta, comercio, vida privada, Dolors, patio, rehabilitación, arco, Judería y entorno. El plano distingue las plantas según la parada seleccionada. Recorrido, Cronología, Fuentes, lectura temática, enlaces profundos y progreso independiente mantienen el sistema del atlas.

El relato distingue la arquitectura de la casa, la historia de las colecciones y la presentación museística. La publicación de Emilia Hernández Hervás en el *Boletín del Museo Arqueológico Nacional* de 2017 documenta la apertura de la sede actual en mayo de 2007 y la organización temática de sus salas. Las piezas y expositores modelados son representaciones didácticas; no constituyen un inventario de la instalación expositiva actual.

### Plaza y edificios vecinos

La confluencia del Carrer del Castell y las calles de su entorno conserva su escala de calles estrechas, pendientes y fachadas próximas. Los cuerpos añadidos se apoyan en huellas cartográficas. El contexto detallado de la Judería y la Sangre se reutiliza; el arco próximo al museo conserva su único propietario geométrico en la Judería y se diferencia del Portalet de la Sang.

El contexto nuevo comprende **44 cuerpos en 21 parcelas**, cinco fragmentos de calle y aproximadamente **491 m²** de pavimento. Mantiene 178 partes y 15 fragmentos de calles de los contextos previos. Sus alturas combinan 25 estimaciones IGN y 19 derivaciones del número de plantas; los detalles menores de fachadas y las cuatro jardineras son interpretativos.

### Alcance documental

La casa se describe como bajomedieval y se explican las atribuciones cronológicas y funcionales divergentes. Los planos de un proyecto de conservación no acreditan la ejecución de la obra: la documentación de 2026 no se utiliza para afirmar una restauración terminada. Las alturas y detalles menores del caserío conservan su carácter estimado. La navegación es orbital con observaciones interiores preparadas; no se presenta como paseo libre en primera persona.

La edición supera 1.037 comprobaciones integradas con 228 encuadres, además de las verificaciones documentales, arquitectónicas, de contexto, de once controladores de visita y de recursos estáticos. Los renders de inspección utilizan la geometría exportada de Three.js. El navegador de comprobación tiene WebGL desactivado: se revisa allí el recorrido documental y el plano, sin afirmar una prueba visual GPU ni una medición de rendimiento gráfico.

Documentación: [historia y fuentes](research/museo-history.md), [modelo arquitectónico](research/museo-model.md), [plaza y contexto](research/museo-context.md) y [verificación V17](research/validation-v17/README.md).

## V16 · Iglesia del Salvador, plaza y Raval

La nueva visita desarrolla el templo, sus espacios interiores y el entorno urbano inmediato. Mantiene la marca **SAGUNTUM · Atlas vivo**, el título **SAGUNTUM · Sagunto y Puerto de Sagunto**, la portada general, los **31 lugares** y los **seis ámbitos territoriales**. Las nueve visitas detalladas anteriores conservan sus accesos y su progreso independiente.

### Un templo con una arquitectura propia

El modelo toma como referencia la descripción oficial del BIC, la planta publicada de las excavaciones de 1992, las fotografías institucionales y el inventario de Campaners. Desarrolla la fachada de sillería con portada de medio punto, ventana superior apuntada, gran contrafuerte lateral y marquesina contemporánea; la torre austera de dos cuerpos, con sus tres vanos de campanas; la nave de tres tramos, sus arcos diafragma y la cubierta de madera; y la cabecera pentagonal con crucería y óculo sobre el arco triunfal.

La capilla bautismal, la de la Comunión con su cúpula y la sacristía completan la lectura del edificio. Los detalles ornamentales y el mobiliario se expresan con un grado de simplificación acorde con la documentación disponible. El techo actual se distingue del antiguo artesonado pintado, dispersado a comienzos del siglo XX; el retablo destruido no se presenta como mobiliario conservado.

### Visita, historia y sección

El recorrido reúne **18 paradas**, **40 hechos con referencias**, **19 hitos cronológicos** y **19 fuentes**: conjunto, plaza, portada, torre, campanas, nave, arcos, techumbre, ábside, crucería, bautismo, Comunión, cúpula, sacristía, arqueología, artesonado, conservación y entorno. Los apartados **Recorrido**, **Cronología** y **Fuentes**, el plano y las cinco capas temáticas utilizan el sistema común del atlas.

Los enlaces `#salvador`, `#salvador/salvador-nave` y `#salvador/salvador-comunion` abren directamente la visita o una observación interior. Las cámaras interiores conservan la cubierta cuando sirve para comprender el espacio. **Abrir sección** ofrece una lectura arquitectónica del conjunto; no inventa una excavación abierta ni un recorrido subterráneo actual. La navegación sigue siendo orbital y mediante cámaras preparadas.

La historia distingue la fecha tradicional de 1248 de la datación oficial del edificio a finales del siglo XIII. También separa los hallazgos arqueológicos, las adiciones de capillas, la memoria del artesonado y la restauración de 1991–1992. Las capas de color agrupan temas de lectura y no adjudican una fecha uniforme a cada muro.

### Plaza y caserío

El contexto diferencia la plataforma peatonal próxima a la iglesia y el jardín triangular de la Plaça del Salvador. Los pavimentos, las escaleras y las calles se adaptan al terreno final, conservando las conexiones con el Raval. Las huellas edificadas proceden de la cartografía incorporada al proyecto; los huecos de fachada, las cubiertas menores y el mobiliario urbano son interpretativos.

La ampliación incorpora **163 partes de 51 parcelas**, **3 patios**, **11 tramos de calle** y **1.529,20 m² de pavimento**. La plataforma mantiene placas de hormigón y las calles adoquinado, con su separación sobre el límite cartografiado. El jardín de 278,32 m² contiene seis árboles interpretados. Las alturas combinan 85 estimaciones IGN y 78 derivaciones del número de plantas, con dos discrepancias revisadas explícitamente. Las escaleras conservan los recuentos documentados donde se representa la vía completa; el fragmento de Ben Montel explica su ajuste proporcional. Las continuaciones de las vías y los contextos detallados anteriores se preservan.

### Precisión y verificación

Esta escena es una interpretación arquitectónica documentada, no un levantamiento fotogramétrico. La planta arqueológica de 1992 aporta información parcial y no sustituye un plano actual completo de todas las capillas. Las imágenes de referencia se utilizan para contrastar la composición; no se añade una galería de fotografías históricas.

La verificación contrasta la escena regional real, las cámaras, el terreno ensamblado, la restauración de materiales al cerrar secciones y el funcionamiento de las diez visitas. Los renders proceden de las mallas de la aplicación. La validación de interfaz y la capacidad gráfica del navegador se documentan por separado.

Documentación: [historia y fuentes](research/salvador-history.md), [modelo arquitectónico](research/salvador-model.md), [plaza y contexto](research/salvador-context.md) y [verificación V16](research/validation-v16/README.md).

## V15 · Ermita de la Sangre, plaza e interior

La visita profundiza en la ermita, la plaza de Sang Nova y sus calles inmediatas. La marca **SAGUNTUM · Atlas vivo**, el título global, la portada y la entrada `#atlas` mantienen el alcance de Sagunto y Puerto de Sagunto. Se conservan los **31 lugares**, los **seis ámbitos territoriales** y los ocho cuadernos anteriores.

### Arquitectura contrastada con planos

El exterior y los espacios interiores se apoyan en las plantas, cubiertas, cuatro cortes y cuatro alzados publicados por el equipo de Francisco J. Ribelles Villar en *Setmana Santa Saguntina 2001*, pp.166–170. Se contrastan con fotografías institucionales y con el estudio de la restauración de 2024 publicado por Ignasi Corresa en 2025.

El modelo desarrolla la fachada curvilínea, la portada con edículo, la espadaña, la campana, los siete peldaños de acceso, las cubiertas de teja y la cúpula azul. En el interior representa una nave con cuatro capillas laterales, arcos, bóvedas, crucero, pechinas, presbiterio elevado mediante siete peldaños, retablo, sacristía, archivo y volumen del museo. La cúpula incorpora una interpretación geométrica de la ornamentación gris y dorada y de la clave documentada en 2024.

Las observaciones de la nave, el crucero y la cabecera conservan el techo para leer el interior completo. **Abrir sección** retira cubiertas y bóvedas cuando se quiere estudiar la distribución; las dependencias que lo requieren abren esa sección al seleccionarlas. El corte es arquitectónico y no inventa restos bajo el suelo. La navegación sigue siendo orbital, con cámaras interiores preparadas; no se presenta como un paseo libre en primera persona.

### Historia, fuentes y recorrido

El cuaderno contiene **16 paradas**, **39 hechos con referencias**, **17 hitos cronológicos**, **22 fuentes** y **5 ámbitos temáticos**. Recorrido, Cronología, Fuentes, progreso independiente y selección sobre el plano mantienen el sistema común del atlas. El plano y la documentación funcionan también sin WebGL.

| Ámbito de lectura | Contenido |
| --- | --- |
| La plaza y la ladera | Conjunto, plaza, escalera y entorno |
| La fachada | Portada, edículo, espadaña y campana |
| La arquitectura interior | Nave, capillas y crucero |
| Cúpula y cabecera | Cúpula, pechinas, presbiterio y Vera Cruz |
| Cuidado y memoria | Sacristía, museo y conservación |

Las capas de color distinguen temas; no atribuyen una fecha uniforme a cada muro. La pintura del presbiterio de **1973** se diferencia de la nueva clave de la cúpula de **2024**. Las atribuciones pictóricas, la relación de la sede anterior con una sinagoga y las interpretaciones menores se expresan con sus límites documentales. La ermita conserva su propia identidad respecto al Portalet de la Sang.

Los enlaces `#sangre`, `#sangre/sangre-nave` y `#sangre/sangre-cupula` permiten abrir directamente el conjunto o una observación. No se incorporan galerías de fotografías históricas.

### Plaza, relieve y caserío

El entorno incorpora **152 piezas de 62 parcelas**: 151 partes catastrales y un residual OSM documentado de 52,11 m². Añade 13 tramos de calle y 1.402,07 m² de pavimento, con una plaza inferida de 146,27 m². El pavimento sigue los triángulos de 2,5 m de la malla final del terreno. Los ajustes locales de cimentación quedan restringidos al edificio, sus anexos y el encuentro de la escalera.

Las alturas combinan 76 estimaciones IGN y 76 derivaciones de plantas; cuatro discrepancias graves se resuelven para la visualización con el número de plantas, conservando los datos originales y su explicación. No se introducen alturas de reserva ni transferencias de edificios desde los conjuntos detallados anteriores. Los duplicados se excluyen por su identidad y por el espacio que ocupa la nueva representación.

### Precisión y verificación

Las huellas y el relieve tienen procedencia cartográfica. Las molduras, las pinturas, la imaginería, los huecos de las viviendas, la disposición del museo y las dimensiones menores son interpretaciones. Esta escena no es un levantamiento fotogramétrico ni un inventario actualizado de las piezas de la Cofradía.

La verificación usa el constructor regional de producción y sus cámaras, comprueba la recuperación tras fallos de carga y la independencia de las visitas, y revisa renders de las mallas exactas de Three.js. La prueba de interfaz documenta por separado las capacidades del navegador disponible. Los resultados definitivos y sus límites están en el informe de V15.

Documentación: [historia y fuentes](research/sangre-history.md), [modelo arquitectónico](research/sangre-model.md), [plaza y contexto](research/sangre-context.md) y [verificación V15](research/validation-v15/README.md).

## V14 · Casa dels Berenguer y muro de Diana

La ampliación reúne la casa, sus patios, el espacio abovedado y el muro contiguo en una misma escena registrada al casco histórico. La marca, el título global, la portada y la entrada `#atlas` siguen representando a **Sagunto y Puerto de Sagunto**. Se mantienen los 31 lugares y los seis ámbitos del atlas.

### Una visita conjunta y dos accesos

La Casa dels Berenguer incorpora **18 paradas**, **47 hechos con referencias**, **15 hitos cronológicos** y **24 fuentes**. El muro de Diana mantiene su lugar en el catálogo y ofrece una subvisita de **5 paradas** y **6 hitos**, con progreso independiente. Los enlaces relacionados conectan ambas lecturas; el plano, la cronología y las fuentes funcionan también sin WebGL.

| Ámbito | Elementos de la visita |
| --- | --- |
| La casa y su fachada | Conjunto, portada y escudo |
| Patios y desniveles | Arcadas, galería, escalera y patio superior |
| La estancia del agua | Aljibe y bóveda |
| El muro y sus preguntas | Conjunto, aparejo, retorno, fábricas posteriores e interpretaciones |
| Usos, conservación y ciudad | Desván, anexo, Sorolla y mirador |

Las capas de color son temáticas: casa, patios, agua, muro y conservación/entorno. No asignan una fecha a cada piedra. Los enlaces `#berenguer`, `#berenguer/berenguer-aljibe` y `#diana` abren directamente el conjunto, una parada o la lectura arqueológica.

### Arquitectura, materiales y secciones

La nueva fachada sigue las referencias fotográficas: portada de medio punto con dovelas y escudo, tres balcones, tres ventanas superiores y cuatro huecos de desván. Los dos patios mantienen cotas diferenciadas, arcadas rebajadas, columna, galería de acero y vidrio, pavimentos, barandillas y conexiones entre niveles. El anexo occidental se representa mediante los elementos conservados y consolidados documentados en la primera fase de 2025.

«Abrir sección» retira cubiertas y elementos que impiden leer la estancia del aljibe. Las paradas correspondientes abren la sección automáticamente; al cerrarla se recupera el conjunto exterior. La ventana elimina el terreno sólo sobre la cavidad, conserva los edificios vecinos y restaura todos los materiales al salir. La sección es didáctica: no equivale a un levantamiento del subsuelo ni acredita el uso ritual del depósito.

Diana comparte el mismo modelo entre las visitas civil y arqueológica. La vista histórica muestra una lectura de la fábrica antigua y una hipótesis de terraza que se puede ocultar. Mantiene el suelo contemporáneo como contexto; no restituye un templo completo. Los bloques, las fábricas posteriores, las reparaciones, la plaza, los bancos y la vegetación se distinguen en la composición actual.

Las cámaras de calle y patio se ajustan al espacio libre real entre edificios. Los interiores disponen de un campo visual más amplio y posiciones que no se alejan automáticamente al cambiar la proporción de pantalla. El campo visual habitual se recupera al salir de esas paradas.

### Relieve y contexto inmediato

El entorno añade **23 partes de 9 parcelas**, **4 fragmentos de calle** y **342,67 m²** de pavimento, adaptado a la malla final del terreno. Doce alturas proceden de estimaciones IGN y once del número de plantas catastrales. Las huellas fuente se preservan. Tres partes antes gestionadas por Santa María y la judería pasan al modelo específico de Berenguer para evitar duplicados, sin retirar sus pavimentos ni calles anteriores.

### Documentación y límites

Se contrastan Turismo Sagunto, documentación municipal, publicaciones arqueológicas, el proyecto de acondicionamiento del espacio de Diana y referencias institucionales. La identificación del aljibe como micvé se presenta como posible; la función y cronología del muro siguen discutidas. La continuidad administrativa de obras en 2026 no se convierte en una segunda fase terminada.

El conjunto utiliza cartografía real e interpretación arquitectónica. Los interiores, los detalles menores, algunas cotas y las superficies de desgaste no proceden de fotogrametría. Las fotografías se usan como referencias y no se incorpora una galería histórica.

Documentación: [historia y fuentes](research/berenguer-history.md), [modelo](research/berenguer-model.md), [entorno](research/berenguer-context.md) y [verificación V14](research/validation-v14/README.md).

## V13 · Inicio general del atlas

Título y descripción generales, portada estable, accesos distribuidos entre los seis ámbitos y catálogo de todos los lugares. Se separa el inicio general de la vista de cada región. Los enlaces vacíos o no reconocidos llevan al inicio; las seis visitas detalladas conservan su contenido y sus modelos.

## V12 · El Calvario, un camino entre cipreses

### Recorrido y documentación

La visita se desarrolla desde los accesos y la subida en zigzag hasta la explanada y la ermita. Sus **18 paradas, 54 notas históricas, 12 hitos y 18 fuentes** tratan la arquitectura, los casalicios, la cerámica, los muros y la vegetación, y relacionan el conjunto con el vía crucis de Semana Santa, la Passió, el paisaje y su memoria artística. Las 18 paradas temáticas no representan 18 estaciones devocionales: la Cofradía describe catorce estaciones del vía crucis.

| Ámbito | Paradas |
| --- | --- |
| La llegada y el desnivel | Conjunto, acceso y escalinata |
| El camino y las terrazas | Zigzag, casalicios, cerámica, muros y cipreses |
| La ermita de la Soledad | Explanada, fachada, portada, hornacinas, laterales y campana |
| La celebración y la escena | Vía crucis y Passió |
| Paisaje, arte y memoria | Mirador y memoria artística |

**Recorrido**, **Cronología** y **Fuentes** mantienen su funcionamiento común y el progreso independiente de las seis visitas detalladas. Los enlaces `#calvario`, `#calvario/calvario-fachada` y `#calvario/calvario-casalicios` permiten abrir el conjunto o una parada concreta. El plano comparte posiciones con el modelo y añade curvas de nivel cada 5 m; los números identifican temas de observación, sin calcular un paseo peatonal libre.

**Leer arquitectura y paisaje** utiliza las mismas cinco categorías y colores en la maqueta, el plano y su leyenda: camino, ermita, cerámica, conservación y paisaje. Las fechas históricas se explican por separado, sin convertir estos colores en una datación de cada pieza.

### Arquitectura y relieve

La ermita conserva la planta y orientación cartografiadas. La fachada toma como referencia su restitución cromática documentada: ocre con juntas claras, cornisa mixtilínea, espadaña y tres hornacinas; los laterales mantienen sus volúmenes blancos, contrafuertes y ventanas. El modelo detalla la portada, las cubiertas, las tejas, la campana, las escalinatas y los encuentros con la plataforma.

La subida utiliza el trazado cartografiado y los ocho muros registrados. Los casalicios, el pavimento, los cipreses y el matorral aportan detalle a los encuadres próximos. Las posiciones menores de las estaciones y los ejemplares vegetales son interpretativas. Las fotografías son referencias de trabajo y no forman una galería incorporada a la web.

El entorno agrega **156 partes edificadas de 60 parcelas completas**, **3 patios** y **10 tramos exteriores**. Se preservan los conjuntos detallados anteriores y se retiran sus duplicados del caserío genérico. Las alturas combinan **71 estimaciones IGN** y **85 derivaciones de plantas catastrales**, sin alturas de reserva. Dos cubiertas requieren ajustes visuales, con un máximo aproximado de **0,51 m en el terreno ensamblado**; sus huellas y el suelo no se desplazan. Las casas de contexto no introducen nuevos parches que aplanen las calles. Se conservan también los caminos exteriores no reemplazados, incluida la continuación hacia el Castillo.

### Cómo se expresa la certeza histórica

El catálogo *Matèria i ànima d’un poble* (Centre Arqueològic Saguntí, 2010, p. 18) sitúa la inauguración del Calvario de Santa María en **1854**. Esa fecha se diferencia de las dataciones divulgativas atribuidas a la ermita. La documentación de Turismo Sagunto, la Cofradía, Campaners y los estudios históricos se cita en cada explicación; las discrepancias se conservan como tales.

Las proporciones y acabados menores se interpretan a partir de fotografías y descripciones, sin atribuirles precisión de levantamiento. El modelo exterior permite estudiar el edificio; no presenta un interior actual completo que no se haya documentado. El relieve se mantiene en escala real, con soluciones gráficas de pavimento y encuentros que no sustituyen una medición de obra.

### Verificación

Los controles específicos comprueban la geometría, los focos, el suelo, las fuentes y el plano, y se complementan con la regresión del constructor regional real y las visitas anteriores. La revisión visual combina los renders de las mallas con las comprobaciones de navegación, lectura y adaptación de la interfaz. El informe definitivo describe resultados y límites de la verificación.

Documentación: [historia y fuentes](research/calvario-history.md), [arquitectura del modelo](research/calvario-model.md), [cartografía del entorno](research/calvario-context.md) y [verificación V12](research/validation-v12/README.md).

## V11 · La judería, calles de la memoria

### Un barrio, sus habitantes y sus umbrales

La nueva visita relaciona la arquitectura conservada con la vida de la aljama: el Portalet, Sang Vella, Segovia, Rams, Antigons, las casas y sus transformaciones. Las paradas del entorno enlazan Casa dels Berenguer, Mestre Penya, el arco ante el museo, la ladera del teatro y la dirección del castillo. La narración incorpora vecinos documentados, fiscalidad, oficios, comercio, protección en 1391, expulsión de 1492 y memoria contemporánea.

| Ámbito | Paradas |
| --- | --- |
| El barrio y sus umbrales | Conjunto, Portalet, piedra y dovelas |
| Calles, casas y oficios | Sang Vella, Segovia, Rams, Antigons y casas |
| Espacios de la comunidad | Debate sobre la sinagoga, Berenguer y posible micvé |
| Los bordes y el entorno | Mestre Penya, arco ante el museo y ladera del teatro |
| Refugio, expulsión y memoria | Protección de 1391 y ruptura de 1492 |

El cuaderno ofrece **Recorrido**, **Cronología** y **Fuentes**, con progreso independiente para las cinco visitas detalladas. Los enlaces `#juderia/juderia-portalet` y `#juderia/juderia-sinagoga` abren puntos concretos. Los marcadores comparten las coordenadas del modelo; en pantallas pequeñas se separan mediante guías para que puedan seleccionarse. El plano y la historia permanecen disponibles sin WebGL.

### Portalet y caserío

El Portalet auténtico se diferencia del arco situado frente al Museo Histórico. Su representación reproduce un paso abierto de medio punto, dovelas y jambas irregulares, paño revocado, coronación, placas y encuentros con las casas. Las fotografías institucionales sirven de referencia visual; no se convierten en una galería ni se reutilizan como texturas.

El núcleo detalla **12 parcelas y 40 cuerpos edificados**. Se conservan sus huellas, cambios de altura y cubiertas, con fachadas revocadas, zócalos, balcones, persianas y carpinterías. Los huecos domésticos, pendientes de cubierta, acabados y dimensiones menores son interpretativos; no equivalen a un levantamiento fotogramétrico.

El entorno incorpora **344 partes de 146 parcelas**, con **3 patios**, **26 tramos de calle** y una pequeña superficie peatonal en Pere Cartagena. Sus alturas se reparten entre **172 estimaciones IGN** y **172 derivaciones por plantas catastrales**, sin alturas de reserva. La selección cartográfica protege el teatro y el castillo y evita repetir los conjuntos ya detallados de Santa María, Plaça Major, Berenguer, Museo y Sangre. Las cámaras se ajustan al espacio libre entre edificios, sin desplazar las plantas para despejar las vistas.

### Historia y grado de certeza

La licencia de cierre de **1321** documenta una actuación urbana; no fecha por sí sola cada piedra del portal ni todas las viviendas. Los registros fiscales se explican como fuentes parciales sobre hogares y contribuyentes. Los nombres históricos no se asignan a casas actuales por proximidad.

La sinagoga presenta las distintas propuestas de Lacave y Civera y mantiene visible su discusión. La estructura de Berenguer se describe como **posible micvé**, con un punto de lectura exterior. El hueco documentado para mezuzá no se coloca en una vivienda arbitraria porque las fuentes difieren en su numeración. La visita no añade interiores hipotéticos a esos lugares.

**Leer las capas** distingue funciones medievales, transformaciones modernas, memoria contemporánea, encuentros de épocas y ámbitos interpretativos. El color no atribuye una fecha única a toda una casa.

### Verificación y alcance

La revisión combina pruebas sobre el constructor regional real, cámaras en escritorio y móvil, aperturas, cubiertas, materiales, terreno y recursos; navegación y planos en el navegador; e inspección visual de las mallas exportadas. Los informes y sus huellas de archivos están en [verificación V11](research/validation-v11/README.md).

El navegador de prueba tiene WebGL desactivado. Sus capturas documentan la interfaz en modo 2D; los PNG son renders CPU de las mallas reales, con aproximación de materiales e iluminación, y no acreditan rendimiento GPU ni el aspecto exacto del renderizador WebGL. La navegación de la aplicación sigue siendo orbital, con vistas cercanas; no se presenta como un paseo en primera persona.

Documentación: [Historia y fuentes de la judería](research/juderia-history.md), [arquitectura del modelo](research/juderia-model.md), [cartografía del entorno](research/juderia-context.md) y [verificación V11](research/validation-v11/README.md).

## V10 · Plaça Major, la memoria del encuentro

### Plaza, arquitectura cotidiana e historia

La visita recorre el espacio del mercado, los soportales, sus distintos apoyos y las piedras reutilizadas; se acerca a la Puerta del Almudín y al escudo; explica el abastecimiento, el horno, el mustassaf y la vida municipal; y relaciona la plaza con Pescadería, Santa María, Cavallers, Major y Castell. Cada parada incorpora hechos referenciados, qué observar y una nota sobre su representación.

El cuaderno mantiene **Recorrido**, **Cronología** y **Fuentes**, con progreso independiente para cada una de las cuatro visitas detalladas. Los enlaces `#plaza-mayor/plaza-almudin` y `#plaza-mayor/plaza-escudo` abren directamente esos puntos. Los marcadores del plano y las vistas 3D comparten coordenadas. La documentación y el plano siguen disponibles cuando el navegador no ofrece WebGL.

### Correcciones documentales y modelo

El catálogo municipal identifica el portal en **Plaça Major número 17**, parcela 3459611; la fotografía institucional permite contrastar su posición al fondo del soportal, el arco carpanel y el escudo en la clave. La nueva maqueta corrige la ubicación aproximada anterior y amplía el frente de casas para incluir esa finca y su vecina. Los frentes se diferencian según las fichas patrimoniales: pilares, columnas pétreas, apoyos metálicos, arcos transversales, balcones y cubiertas forman conjuntos de parcelas distintas.

Las galerías tienen huecos reales, pavimento, techo y un cerramiento doméstico retranqueado. El portal incorpora dovelas, hojas de madera, escudo y placa del número actual. Las fachadas y cubiertas se apoyan en las plantas cartográficas; los detalles de alzado siguen siendo estimaciones documentadas visualmente. La lectura por capas identifica la atribución de los componentes y mantiene como mixta la fábrica del portal: la propiedad regia no proporciona por sí sola una fecha para cada piedra.

La investigación distingue el **almudín antiguo bajo los soportales** del **edificio posterior de la calle Abril**. La planta de dos naves descrita por Chabret pertenece a este último y no se aplica al portal de la plaza. El horno y la antigua casa del consejo se explican como memoria de usos y sectores documentados; la maqueta no los convierte en interiores conservados. La cronología contrasta las fuentes antiguas con investigaciones posteriores, incluida la fecha de 1755 para la adquisición de derechos de la bailía por Múzquiz.

### Entorno urbano

El caserío próximo mantiene 94 partes edificadas de 36 parcelas, con tres patios y cambios de altura. Hay 51 estimaciones de cubierta del IGN y 43 alturas derivadas del número de plantas. Se reconstruyen las superficies de la plaza y los accesos próximos, adaptándolas a la malla final del terreno. Las fachadas del entorno son interpretaciones de esos volúmenes y no un inventario fotogramétrico de huecos.

Santa María conserva su arquitectura y contexto V9. Los edificios y tramos de calle sustituidos por piezas más detalladas se excluyen del conjunto urbano genérico para evitar duplicaciones. Las cámaras se comprueban frente a los edificios vecinos y el relieve; ajustar un encuadre no desplaza las huellas cartográficas.

### Verificación

La integración supera 1.663 comprobaciones, incluidas 102 variantes de cámara de la plaza y las 102 de cada una de las visitas de Santa María y del teatro. La revisión incluye huecos, cierres de cubierta, pavimentos, recursos y navegación. Se verifican el plano, las fuentes y la lectura en móvil vertical y horizontal. Los renders CPU inspeccionan las mallas exportadas; las capturas de navegador documentan el modo 2D, ya que WebGL está desactivado en el entorno de prueba. No se acredita rendimiento GPU.

Documentación: [Historia y fuentes de la plaza](research/plaza-mayor-history.md), [arquitectura del modelo](research/plaza-mayor-model.md), [cartografía del entorno](research/plaza-mayor-context.md) y [verificación V10](research/validation-v10/README.md).

## V9 · Santa María, piedra y ciudad

### Visita documentada al templo y su entorno

La visita relaciona el conjunto con la Plaça Major, el Carrer dels Cavallers, la escalinata y las tres portadas; recorre naves, bóvedas, capillas, ábside y contrafuertes; explica el campanario y el reloj; y termina en el Carrer del Sagrari y la Casa dels Berenguer. Cada parada enlaza los hechos con sus fuentes, diferencia lo documentado de lo interpretativo y explica qué muestra la maqueta.

**Recorrido**, **Cronología** y **Fuentes** comparten el cuaderno de visitas ya utilizado por teatro y castillo. Los tres monumentos conservan su propio progreso, selección y plano. Los enlaces `#santa-maria/santa-maria-naves` y `#santa-maria/santa-maria-campanario` abren paradas concretas. El mapa, los documentos y las fuentes siguen disponibles si no hay WebGL.

### Arquitectura y sección

El estudio de Arturo Zaragozá, las plantas y secciones de Juan Gomis y la descripción de Valentín Cabrera permiten corregir la interpretación anterior: **tres naves y cuatro tramos**, pilares octogonales, bóvedas escalonadas, cabecera poligonal y portadas diferenciadas. La portada a los pies tiene composición barroca. El campanario actual combina ladrillo rojo, elementos claros, vanos abiertos y coronación metálica. Los arcos altos exteriores se explican por su relación con la evacuación de las aguas, siguiendo la lectura de Zaragozá.

**Abrir sección** retira cubiertas y parte de los cerramientos para observar el espacio interior; mantiene las nervaduras como referencia. Las paradas de naves, bóvedas y capillas abren este corte automáticamente. Pasar a una parada exterior restituye el edificio. **Leer las capas** distingue fábrica medieval, transformaciones modernas, reconstrucción contemporánea, encuentros y esquemas de lectura.

### Entorno y precisión

La huella y la orientación se ajustan a la cartografía; los accesos se acomodan al relieve final de la escena. La escalinata norte incorpora dos tramos paralelos a la fachada y el pretil pétreo documentado. El contexto inmediato añade edificios sobre sus partes catastrales, cubiertas, calles y la plaza de Cervantes, preservando las maquetas existentes de Plaça Major y Casa dels Berenguer y excluyendo volúmenes duplicados.

La reconstrucción es una **síntesis arquitectónica documentada**, no un levantamiento fotogramétrico. Los detalles menores, espesores, acabados y ajustes de cotas son aproximados. La cripta cegada, retablos perdidos y esculturas desaparecidas se explican en los textos sin inventar sus interiores o recrearlos como bienes conservados. La cronología diferencia obras realizadas, propuestas y anuncios, y fecha expresamente los datos contemporáneos.

### Verificación y límites

La integración supera 1.196 comprobaciones, incluidas 102 variantes de cámara de Santa María sobre el terreno y los edificios reales de la escena. La geometría, los planos y el controlador común tienen sus propios informes. Se verificaron la navegación, la cronología, las fuentes y la adaptación a móvil vertical y horizontal. El navegador de prueba tiene WebGL desactivado: las capturas de interfaz muestran el modo 2D y los renders de inspección CPU utilizan las mallas reales exportadas. No se presenta esa revisión como una prueba de rendimiento GPU.

Documentación: [Historia y fuentes](research/santa-maria-history.md), [arquitectura del modelo](research/santa-maria-model.md), [cartografía del entorno](research/santa-maria-context.md) y [verificación V9](research/validation-v9/README.md).

## V8 · El Teatro Romano, de cerca

### Una visita por su arquitectura y su historia

| Ámbito | Paradas |
| --- | --- |
| Teatro y ciudad | Conjunto en la ladera, relación con el foro y la ciudad |
| Espacio del público | Aditus, orchestra, ima cavea, media cavea, summa cavea, vomitoria, pórtico superior y tribunalia |
| Arquitectura escénica | Proscaenium, scaenae frons y basílicas laterales |
| Bajo el escenario | Hyposcaenium, fosos del telón y drenaje |
| Rehabilitación y vida actual | Intervención de 1990–1993 y uso escénico documentado hasta 2026 |

Cada parada incluye hechos con sus referencias, grado de certeza, indicaciones de observación y límites del modelo. La cronología distingue fechas de construcción propuestas, testimonios históricos, intervenciones y anuncios todavía pendientes. Se explica el debate de la rehabilitación mediante textos de sus autores y una crítica contemporánea. El aforo de 804 localidades corresponde a Sagunt a Escena 2026; no se atribuye al teatro romano antiguo ni se presenta como aforo permanente.

El controlador común ofrece **Recorrido, Cronología y Fuentes**, selección en el plano, vistas de conjunto y detalle, y progreso independiente para teatro y castillo. El avance es manual. Los enlaces `#theatre/teatro-orchestra` y `#theatre/teatro-hyposcaenium` abren directamente una parada. La selección revela su texto bajo las pestañas; las apariencias Atlas oscuro y Lectura clara mantienen el sistema visual V7.

### Modelo, secciones y encaje cartográfico

La orientación y la huella se encajan sobre OpenStreetMap y PNOA. Las proporciones principales se basan en el estudio arqueológico de Hernández, López, Pascual y Aranegui (1993): orchestra de 16 m sin las filas senatoriales, 22 m incluyéndolas, tres órdenes de graderío y 79 m para el diámetro del pórtico superior. Los volúmenes muestran el conjunto conservado y rehabilitado; no convierten una hipótesis del frente romano desaparecido en una fachada íntegra conservada.

La maqueta incorpora graderíos, pasillos, vomitorios, aditus abovedados, puertas escénicas con huecos reales, cuerpos laterales y cubierta contemporánea. **Abrir sección** retira cubierta y tablado actuales para observar una representación esquemática del foso, sus tabiques, los pozos del telón y el drenaje. Las dos paradas del subsuelo abren la sección automáticamente cuando la vista 3D está disponible. No se reconstruye una maquinaria completa desconocida.

**Leer las capas** separa arquitectura romana, rehabilitación contemporánea, encuentros entre ambas y esquema arqueológico. Los materiales de piedra, ladrillo, cubierta y pavimento se restauran al volver a la lectura habitual. Se excluyen tres cuerpos edificados y 27 trazados interiores que duplicaban la arquitectura. El terreno se acomoda bajo el graderío y la escena, también en el contexto del Palancia.

El plano utiliza la huella cartográfica y 21 componentes del mismo modelo. Conserva anclajes geográficos, escala y selección en el modo 2D sin WebGL. Los materiales y texturas pertenecen a cada instancia, permitiendo descargar y reconstruir regiones sin reutilizar recursos liberados.

### Verificación y límites

Las comprobaciones de geometría, cámaras, terreno, sección, carga y descarga regional se documentan por separado de las pruebas de interfaz. El navegador de verificación tiene WebGL desactivado: se han comprobado allí la navegación, los planos, las fuentes, las apariencias y la adaptación móvil en 2D. Los renders de inspección CPU proceden de las mallas reales exportadas; no son capturas WebGL ni acreditan rendimiento GPU.

Documentación: [Historia del teatro](research/theatre-history.md), [modelo y cartografía](research/theatre-model.md), [interfaz y plano](research/design-v8.md) y [verificación V8](research/validation-v8/README.md).

## V7 · El Castillo y sus épocas

### Identidad y composición

Dos apariencias coordinadas: **Atlas oscuro** (petróleo, caliza y bronce) y **Lectura clara** (fondos claros, tinta petróleo y cobre). Los colores se definen con variables semánticas compartidas por paneles, controles, mapas territoriales y planos locales. La elección se conserva en el navegador; si el almacenamiento está bloqueado, el selector sigue funcionando durante la sesión. Los colores históricos de los materiales 3D conservan su significado al cambiar la interfaz.

La visita se organiza en **Recorrido**, **Cronología** y **Fuentes**. En escritorio, el cuaderno queda a la izquierda; en pantalla estrecha ocupa la mitad inferior. Los encuadres reservan el espacio disponible fuera de los paneles. Al seleccionar una parada, el contenido se desplaza hasta la lectura y los controles de avance. Hay navegación de pestañas con flechas, Home y End, y las paradas visitadas se recuerdan localmente.

### Recorrido del castillo

1. **Una fortaleza, muchas épocas** — Antes de acercarte a una ruina, recorre la cresta completa. Su forma reúne una ciudad antigua, sucesivas fortificaciones y espacios transformados por la investigación y la conservación.
2. **El umbral y el Museo Militar** — Cruzar este umbral sirve para aprender a separar la arquitectura antigua de la forma en que fue presentada después. La visita comienza por esa lectura de las capas visibles.
3. **El foro y sus terrazas** — Imagina este espacio como una plaza cívica que debía ordenar edificios, personas y mensajes públicos. Acércate después a sus bordes para entender el trabajo necesario para sostenerla.
4. **El templo republicano** — La plaza imperial conservó un foco religioso anterior. Esta parada permite leer lo que la planta demuestra y separar esa evidencia de las propuestas sobre su fachada y su dedicación.
5. **La curia: gobierno municipal** — El gobierno de la ciudad también necesitaba un lugar propio. La identificación de este edificio muestra cómo la excavación puede corregir nombres que durante mucho tiempo parecieron seguros.
6. **La basílica y sus subestructuras** — Mira primero la planta y después su apoyo sobre la ladera. La palabra basílica designa aquí un edificio civil romano, relacionado con la administración de justicia y la actividad pública.
7. **Bajo el foro: la gran cisterna** — El agua y el terreno forman parte de la arquitectura de la plaza. Esta parada se concentra en el depósito alargado del lado sur, que debe distinguirse de los pequeños aljibes del recinto.
8. **La cisterna del flanco norte** — Un depósito pequeño puede revelar una secuencia histórica extensa. Aquí importa tanto la estructura como lo que la rellenó y las construcciones que terminaron por ocultarla.
9. **Un nombre escrito en el foro** — Las letras permiten escuchar a quienes financiaban y utilizaban la ciudad. La inscripción monumental del foro cuenta una historia de donación, prestigio y fragmentos que cambiaron de lugar.
10. **La Puerta de Almenara** — Este paso concentrado contrasta con las grandes explanadas. Su fábrica y los materiales reaprovechados permiten observar cómo un edificio nuevo podía incorporar testimonios de otro tiempo.
11. **Almenara: el extremo oriental** — Recorre el último recinto hacia levante. Su interés está en leer conjuntamente los muros, los depósitos y las huellas de ocupación, sin reducirlos a una sola época.
12. **Conejera y los Nueve Pilares** — Este espacio abre una lectura del castillo menos monumental: reserva, agua y abastecimiento. Sigue el borde norte para relacionar la plaza con el relieve exterior.
13. **El paso a San Fernando** — Atravesar esta puerta marca un cambio de escala en el recorrido. El paso conecta la concentración de edificios de Armas con las plazas que prolongan la fortaleza hacia poniente.
14. **San Fernando: vida de guarnición** — Para sostener una fortaleza hacían falta dependencias y servicios además de murallas. Esta parada se centra en el uso cotidiano del sector y en sus cambios de nombre.
15. **Antiquarium: las voces de la piedra** — Haz una pausa para pasar de la gran arquitectura a las personas que dejaron sus nombres. Una inscripción puede hablar de cargos, creencias o memoria sin conservar el edificio al que perteneció.
16. **Estudiantes: el acceso antiguo** — El lado norte permite seguir la historia de puertas clausuradas y estructuras enterradas. Aquí la lectura vertical de los restos es tan importante como recorrer su superficie.
17. **Ciudadela: la altura defensiva** — Subir a esta parte del recorrido ayuda a comprender el dominio visual de la fortaleza. Desde aquí, observa cómo los recintos centrales se subordinan a las posiciones más elevadas.
18. **Dos de Mayo: el frente occidental** — El recorrido termina en el extremo donde el castillo afrontaba uno de sus accesos más comprometidos. Lee el baluarte, las bóvedas y el foso como piezas de un sistema.

Cada parada incorpora cuatro hechos con referencias, una indicación de certeza, sugerencias de observación y una nota sobre su representación. Las fuentes incluyen autor, año y localizador cuando están disponibles. El plano permite elegir cualquiera de las 18 paradas. Los enlaces `#castle` y `#castle/foro`, por ejemplo, conservan la selección; el recorrido es virtual y no calcula un itinerario peatonal real.

### Maqueta y precisión

El castillo usa su contorno cartográfico de 272 vértices y la red interior de muros, restos, edificios y caminos. La geometría se construye después del relieve definitivo para ajustar pavimentos y sendas a sus triángulos reales. Las puertas tienen huecos abiertos, los edificios del foro se distinguen por su función documentada y los sectores occidentales forman parte de la visita. La lectura **Piedra y materiales / Leer las épocas** identifica componentes, sin asignar automáticamente una fecha a todo un recinto.

Se interpreta el conjunto conservado: las alturas y detalles menores son aproximados, no un levantamiento fotogramétrico integral. La cisterna norte tiene un foco de sector aproximado; la inscripción se sitúa en el contexto del foro, sin adjudicar una posición original exacta a cada fragmento. La documentación explica las restituciones propuestas por la arqueología sin levantar un templo completo no conservado. Los documentos del siglo XIX se distinguen del estado material actual, y los anuncios de intervenciones de 2026 no se representan como obras terminadas.

Documentación: [Historia y fuentes del castillo](research/castle-history.md), [modelo y cartografía](research/castle-model.md), [identidad visual](research/design-v7.md) y [verificación V7](research/validation-v7/README.md).

## Lugares y exploración

1. Iglesia de Santa María: tres naves, ábside, contrafuertes, portadas, ventanales, campanario abierto y coronación metálica. Altura total de la torre de 58 m según la referencia municipal; las restantes medidas arquitectónicas son aproximadas.
2. Plaça Major y puerta del Almudín: once plantas de edificios, soportales abiertos, arcos, balcones, faroles y portada integrada en la fachada. La localización fina de la portada es interpretativa.
3. Judería y Portalet de la Sang: visita V11 de 16 paradas; Portalet y dos pasos diferenciados, núcleo de 12 parcelas y 40 cuerpos, contexto de 344 partes catastrales, calles, patios y memoria de la aljama.
4. Calvario y ermita de la Soledad: visita V12 de 18 paradas; fachada restaurada, portada, hornacinas, campana, cubiertas, subida, muros, casalicios y cipreses; contexto de 156 partes en 60 parcelas. Catorce estaciones devocionales con posición menor interpretativa, diferenciadas de las paradas temáticas.
5. Casa dels Berenguer: conjunto irregular, casa principal, portada, escudo, patios, arcadas, galerías y cubierta que puede ocultarse.
6. Ermita de la Sangre: nave y crucero, cúpula azul, tambor, fachada barroca y escalinata.
7. Iglesia del Salvador: nave, contrafuertes, cubiertas, portada y campanario.
8. Casa del Mestre Penya / Museo Arqueológico: visita de 20 paradas, dos plantas, arcos apuntados, estructura de madera, salas, colección interpretativa, circulación rehabilitada, cubierta contemporánea desmontable y plaza conectada con la Judería.

9. Vía del Pòrtic: 60 m de calzada, pilares cuadrados, aceras, cloaca abierta por tramos, cimentaciones monumentales y estructuras de las sucesivas fases. La histórica muestra el siglo II; el arco y los alzados perdidos son hipótesis opcionales.
10. Domus dels Peixos: patio e impluvium con pintura marina original interpretada a partir de la publicación, sala de recepción, posible cocina y recinto hidráulico de función discutida, pavimentos, restos de columnas y techumbre independiente. V19 desarrolla una visita de veinte paradas y diferencia museo, corte y restitución de la vivienda; no se inventa un hipocausto.
11. Puerta del circo romano: vano adintelado de 1,20 m realmente abierto y excavación conservada; restitución del circo según ARSE 2017, aproximadamente 273 × 70 m. Graderío de madera, cierre occidental, alzados y carceres quedan como hipótesis separadas.
12. Muro del llamado Templo de Diana: grandes sillares, retorno, fábricas superiores de mampostería y ladrillo, roca y espacio de contemplación. La atribución y fecha son discutidas; se restituye el muro, con una posible terraza opcional, sin completar un santuario no documentado.
13. Necrópolis judía e hipogeos: dos ámbitos separados unos 194 m. El cementerio reproduce tipologías de fosas y losas y propone una fase XIV–XV; las cámaras de los hipogeos son explícitamente esquemas interpretativos, sin planta arqueológica levantada accesible. Losas y techos de roca se elevan de forma independiente.

14. Alto Horno nº 2: configuración conservada de 64,20 m, crisol, cuba, 315 cajas de refrigeración, 12 toberas, plataformas, conductos, barandillas y plano inclinado de carga. Las estufas y chimeneas desaparecidas no se incorporan al estado actual. Detalles menores y algunos espesores se estiman.
15. Nave de Talleres Generales: cuatro naves longitudinales, huella de aproximadamente 79 × 121 m, frentes de arcos, mampostería y ladrillo, portones, cerchas, carriles y respiraderos. Abrir la cubierta conserva la estructura de las cerchas.
16. Nave de Efectos y Repuestos / Museo Industrial y de la Memoria Obrera: huella catastral actual, fachada rehabilitada, vía central, andenes, forjados laterales y cubierta desmontable. Se documenta la discrepancia entre 70 × 18 m publicados y aproximadamente 60,7 × 20,2 m cartográficos. Museo abierto desde el 15/10/2026; la museografía contemporánea no se ha modelado.
17. Gerencia y Ciudad Jardín: complejo de oficinas y once agrupaciones residenciales sobre plantas contrastadas, pabellones, paseos y arbolado. Los once grupos corresponden a la organización de las veintidós viviendas históricas, no a veintidós edificios separados.
18. Casino Recreativo y Cultural: volumen con patio central abierto, fachadas de dos plantas, terraza y jardín. La noticia municipal del 6/10/2026 acredita obras en curso; la futura cubierta de vidrio del patio no se representa como ejecutada.
19. Iglesia de Nuestra Señora de Begoña y Alameda: tres naves, espadaña abierta con campanas, accesos, dependencias, plaza y palmeras. La cubierta se puede retirar para apreciar la organización interior, interpretativa.
20. Antiguo Economato: tres cuerpos principales con cubiertas a dos aguas, dos pórticos abiertos, pilares octogonales, galería transversal y anexos sobre cinco partes catastrales. Rehabilitación documentada en enero de 2026, con finalización prevista en 2027.
21. Barrio Obrero: siete manzanas históricas, 95 referencias de edificios y 287 partes catastrales actuales, con patios abiertos, cubiertas, puertas, chimeneas, jardines y cerramientos. Las referencias y partes actuales no equivalen al número de viviendas originales; se conservan sustituciones cartografiadas.
22. Antiguo Sanatorio y jardines: planta principal en T, cuerpos con cubiertas diferenciadas, pabellones, fuente, paseos cartografiados y arbolado. Se distingue su uso de Centro Cívico del acuerdo de 2025 para trasladar el Archivo Industrial; no se afirma una apertura del nuevo archivo sin acreditación.

23. Paseo del pantalán y mirador: paseo de aproximadamente 600 m, banda principal a +5,60 m, mirador a +8,80 m, siete pérgolas y 600 lamas de madera, rampa, escalera, carril ciclista, tolva recuperada, barandillas, bancos, iluminación y mobiliario interpretado. Apertura documentada el 19/07/2024. Encuadres bajos a 1,65 m sobre el pavimento; cámara orbital. La vista histórica restituye cinta y tablero del tramo terrestre.
24. Pantalán marítimo histórico: 21 apoyos principales actuales y cinco puntos auxiliares cartografiados, vanos desmontados y plataforma final conservada de 272 × 20 m. La fase de hacia 1984–1987 recompone tablero, trípodes, transición, cintas, cargador, cinco tolvas y pasarela final. La instalación original se puso en servicio en 1977, pero cuatro tolvas son de 1984: no se mezclan ambas fechas. Estado actual sin continuidad peatonal hacia el tramo marítimo.
25. Fortín y poblado del Grau Vell: torre, batería, foso seco, patio, pozo, almacenes, recepción y poblado inmediato con ermita, plaza y antigua escuela. 28 referencias catastrales, 57 partes y seis construcciones auxiliares OSM. El centro Sagunt i la Mar abrió el 26/06/2026; el modelo muestra la arquitectura restaurada. La cubierta del almacén es desmontable, sin reproducir una museografía no levantada.
26. Antiguo puerto de Arse/Saguntum: trazas de muros, torre, pavimento y restos consolidados; restitución parcial romana de los siglos I–II d.C. con tres unidades de almacén. La sección retira cubierta, forjado superior y frente para leer el espacio interior. Gola, Trencatimons y derrumbe exterior se representan como conjuntos diferentes, con posiciones submarinas aproximadas declaradas. El control de lectura marina oculta la lámina de agua; la histórica distingue hipótesis de estructuras conservadas.

27. Marjal dels Moros: lagunas con cotas independientes, carrizal, saladar y vegetación litoral; pasarelas, observatorios y ocho puntos de observación. Las grandes zonas estacionales no se rellenan como lagunas permanentes.
28. Dunas de Almardà y Almenara: cuatro pasarelas cartografiadas, vegetación dunar por comunidades, dos golas, límite documental de la microrreserva y seis puntos de observación. El MDT no se exagera y la cartografía no se atribuye al perfil final de la regeneración costera de 2026.
29. Río Palancia: 8,375 km de eje principal y 901 m de brazo sur, cauce predominantemente seco, gravas, vegetación de ribera, tres conjuntos de puentes con cinco tableros y delta con laguna meridional. Siete puntos de observación enlazan el núcleo histórico con el litoral.

El Teatro Romano utiliza el modelo y la visita V8; el Castillo conserva el modelo y la visita V7 descritos arriba. No se incorporan galerías de fotografías históricas.

### Controles

- Arrastrar: orbitar. Rueda o pellizco: zoom. Botón derecho o dos dedos: desplazar.
- **Apariencia:** Atlas oscuro o Lectura clara, también en los mapas.
- **Castillo:** recorrido de 18 paradas, cronología y bibliografía. El avance es manual; las vistas cercanas siguen siendo orbitales.
- **Lugares:** catálogo buscable, filtros por templos, vida urbana, cerro, arqueología, industria, ciudad factoría, costa y paisajes. Los números 1–29 conservan el orden de la selección del usuario.
- **Sagunto / Puerto / Costa / Paisajes:** cambia entre seis maquetas; Paisajes permite seleccionar Marjal, Dunas o Palancia y sus mapas locales; mantiene la ubicación geográfica y escala métrica de cada ámbito.
- **Puntos de observación:** cada nuevo conjunto ofrece encuadres de sus elementos principales.
- **Vista cercana:** encuadre más próximo del lugar; sigue siendo una cámara orbital.
- **Abrir cubierta:** disponible en Berenguer, Talleres Generales, Museo Industrial, Begoña y el almacén del Grau Vell. La sección del almacén romano aparece solo en Histórica.
- **Actual / Corte / Histórica:** restos en su contexto, una ventana inferior con apertura de 0–100 %, o una fase/interpretación histórica indicada en la ficha. Corte está disponible en Pòrtic, Domus y ambos ámbitos funerarios. La puerta del circo permanece en su excavación abierta y Diana se observa en superficie.
- **Hipótesis y cubierta:** controla los complementos conjeturales y las cubiertas históricas. No implica que todo alzado visible sin la capa Hipótesis esté medido: las tablas especifican las restituciones de cada conjunto.
- **Actual / Histórica en Costa:** el cambio de una mitad del pantalán cambia también la otra. Las fases actúan sobre el monumento, mientras el territorio conserva su cartografía contemporánea. El fortín muestra solo su estado restaurado.
- **Lectura bajo el agua:** retira la lámina marina para observar bloques o hipótesis de la fase activa. No representa una retirada física del mar ni una batimetría levantada.
- **Documentación y evidencias:** tabla por lugar con elementos, base documental, certeza y fuentes enlazadas.
- **Mapa local:** quince puntos en Sagunto, nueve en el Puerto o cuatro en la costa, sobre plantas y calles cartografiadas.
- **Recorrido guiado:** quince paradas en Sagunto, nueve en el Puerto, cuatro en la costa, recorridos naturales de 8 / 6 / 7 puntos o los 31 lugares desde El territorio. Avance manual; no es una ruta peatonal calculada.
- Día / atardecer, órbita automática, capas y ortofoto.
- Home: panorámica. + / −: zoom. Escape: cerrar panel o recorrido.
- Enlaces de selección mediante el fragmento URL, por ejemplo `#santa-maria`, `#berenguer`, `#horno` o `#sanatorio`; `#sagunto`, `#puerto`, `#coast`, `#marjal`, `#almarda` y `#palancia` abren las panorámicas.

## Cartografía y precisión

### Sagunto

**Relieve:** servicio IGN/CNIG derivado de MDT05 (5 m de malla de origen). La aplicación usa 1.025 × 1.025 muestras sobre un ámbito de 2.050 × 1.950 m, con separación de muestreo de aproximadamente 2 × 1,9 m. El muestreo más denso no implica una nueva medición de 2 m. La malla visual tiene celdas de 2,5 m en el centro histórico y 10 m en el exterior. Sin exageración vertical.

**Imagen aérea:** PNOA Máxima Actualidad, entregada a 4.096 × 3.896 píxeles. La fecha de descarga (19/11/2026) no es la fecha de vuelo.

**Plantas y calles:** INSPIRE de Catastro y OpenStreetMap. Los datos contienen 10.104 partes catastrales y 197 plantas OSM complementarias. Se conservan patios y cambios de plantas; los cuerpos que duplican monumentos se retiran del contexto. El contexto urbano genérico representa 9.212 partes de edificios; los conjuntos patrimoniales y los entornos detallados de Santa María y Plaça Major se modelan aparte.

**Alturas urbanas:** 5.878 partes en los datos tienen estimación del MDS normalizado de edificación IGN, primera cobertura PNOA-LiDAR, malla de 2,5 m. El contexto genérico representado utiliza 5.283 estimaciones IGN, 3.912 alturas por plantas catastrales, dos alturas explícitas, dos recuentos OSM y trece estimaciones visuales. Se usa el percentil 60 de celdas positivas interiores, al menos tres muestras y 45 % de cobertura. Son estimaciones de cubierta, no mediciones actuales de aleros o fachadas. La prioridad es altura explícita, MDSnE, plantas y altura interpretativa. Los tonos de cubierta se muestrean en PNOA; ventanas y faldones siguen siendo aproximados.

### Puerto de Sagunto

- **Relieve:** MDT05 del IGN, sin exageración vertical, 741 × 721 muestras con paso de 5 m. La malla usa celdas de 5 m en el núcleo industrial y 12,5 m en el exterior. El ámbito de datos abarca 3,7 × 3,6 km; la base expositiva elíptica tiene 3,4 km de diámetro.
- **Ortofoto:** PNOA Máxima Actualidad, 4.096 × 3.985 píxeles. La descarga del 19/11/2026 no acredita una fecha de vuelo ni todas las obras terminadas en 2026.
- **Plantas:** producto transformado a partir de INSPIRE Buildings de la Dirección General del Catastro para Sagunto y Canet d’en Berenguer, metadatos del 21/08/2026: 18.953 partes edificadas sobre rasante y 70 plantas OSM adicionales sin solapamiento. Se conservan anillos de patios, número de plantas y referencias de procedencia. No es un plano catastral oficial; los GML originales no se redistribuyen.
- **Contexto renderizado:** 15.966 cuerpos edificados después del recorte territorial y las sustituciones por modelos patrimoniales. No equivalen a 15.966 edificios independientes ni a viviendas históricas.
- **Alturas:** 11.190 partes en los datos tienen estimación de cubierta a partir del MDSnE2.5 de primera cobertura PNOA-LiDAR. Dentro del contexto finalmente renderizado se usan 9.358 estimaciones IGN, 6.591 alturas derivadas de plantas catastrales y 17 estimaciones visuales. Las alturas raster no son un levantamiento actual de fachadas.
- **Calles y espacio libre:** 1.583 trazados de vías, 191 polígonos de cobertura del suelo, 52 tramos ferroviarios y cinco líneas de costa en los datos OSM. El render filtra el ámbito visible y evita duplicar los paseos modelados específicamente. Vegetación detallada junto al patrimonio y volúmenes urbanos más ligeros en el exterior.

### Costa: pantalán y Grau Vell

- **Relieve:** MDT05 IGN, 1.031 × 751 muestras a 5 m, sobre un ámbito de 5,15 × 3,75 km. Malla visual de 5 m en el núcleo y 12,5 m en el exterior; base expositiva elíptica de 5 × 3,5 km. Sin exageración vertical.
- **Ortofoto:** PNOA, 4.096 × 2.983 píxeles. La imagen disponible muestra obras en el paseo; para su arquitectura terminada se prioriza documentación oficial posterior. La descarga del 19/11/2026 no se confunde con la fecha del vuelo.
- **Edificación de contexto:** 885 partes derivadas de Catastro y 61 plantas adicionales OSM en los datos. Después del recorte y la sustitución por modelos específicos se representan 424 cuerpos de contexto; las casas detalladas del Grau Vell forman parte del modelo 25. Las partes no equivalen al número de edificios independientes.
- **Alturas:** 591 partes de los datos cuentan con estimación IGN MDSnE. El contexto renderizado utiliza 241 estimaciones IGN, 158 alturas a partir de plantas catastrales y 25 estimaciones visuales. Las fachadas y cubiertas menores siguen siendo interpretativas.
- **Mar:** polígono derivado de la costa OSM, recortado a la base. Se corrige el contorno antiguo que incluía el tablero del pantalán como tierra firme. El foso del fortín (`way/1418515037`) permanece seco. El mar usa el complemento oficial `Water.js` de Three.js r180, con normales procedurales, reflejo planar y actualización moderada para reducir el coste.
- **Fondo marino:** superficie expositiva bajo la lámina, no batimetría medida. Las cotas aproximadas y la incertidumbre espacial de los restos marinos se explican en la ficha26. Los datos originales de elevación del IGN permanecen intactos.
- **Vegetación litoral:** pequeños grupos de matorral interpretados en una banda de costa junto al Grau Vell, además del arbolado cartografiado. Los tres nuevos paisajes de la sexta edición disponen de ámbitos independientes conectados desde el mapa territorial.

### Criterios comunes

**Arquitectura:** los monumentos utilizan plantas y localizaciones reales y referencias fotográficas/documentales para sus rasgos reconocibles. Las alturas sin fuente, detalles, interiores parciales, acabados, mobiliario y vegetación son interpretativos. No es una fotogrametría ni un levantamiento arquitectónico.

**Integración del suelo:** las calles conservan el perfil longitudinal del MDT y tienen un ajuste transversal limitado. Las cimentaciones aplanan pequeñas zonas. La malla se rebaja únicamente en las celdas que intersectan esos apoyos, para que no atraviese los pisos; zócalos bajo el suelo cubren los encuentros. En el Puerto, un muestreador de la superficie triangulada permite cerrar con faldones los encuentros de pavimento que quedan más de 30 cm por encima de la malla acomodada, manteniendo las cotas de las calles. Estos apoyos, ajustes, pavimentos, peldaños y bordillos son modelado, no nuevos datos topográficos. La base elíptica y sus bandas laterales son un recurso expositivo.

## Arqueología: criterios y límites

Los modelos se apoyan en informes de excavación de ARSE, estudios universitarios, documentación municipal, fotografías y localizaciones cartográficas. Las dimensiones publicadas se incorporan donde existen. El encaje fino de los esquemas, alturas restituidas, profundidad respecto al MDT y texturas de detalle siguen siendo interpretaciones; no se presentan como escaneos ni fotogrametría.

La histórica reemplaza el estado actual del ámbito seleccionado. En el Pòrtic no superpone enterramientos tardíos a la fase monumental romana. Los dos focos funerarios no se unen en un recinto ficticio ni se fechan ambos automáticamente en época medieval. La falta de una planta interior precisa de los hipogeos aparece en la ficha y en sus vistas.

Desde V19, la ventana de la Domus sigue la envolvente cartográfica del edificio actual y conserva el suelo exterior entre el recorte rectangular y las huellas irregulares. Es un recorte expositivo, no el perímetro de excavación. Las bandas de suelo de los cortes tampoco son estratigrafías medidas. Las máscaras dinámicas actúan sobre materiales clonados y restauran los originales al cambiar de lugar. La excavación ya abierta del circo se recorta geométricamente una sola vez para seguir visible en el conjunto.

Notas detalladas: `research/domestic-archaeology.md`, `research/archaeology-public.md` y `research/necropolis.md`.

## Verificación de la edición 4

La prueba integrada ejecuta la geometría real de Three.js con el MDT del Puerto: **44 comprobaciones superadas**, nueve números 14–22, 24 lugares y recorrido sin duplicados, geometría finita, implantación dentro del terreno, cajas métricas plausibles y altura máxima del horno de 64,20 m. **64 encuadres** entre escritorio (1.363 × 936) y móvil (390 × 844): modelos generales dentro de pantalla y ningún punto de observación obstruido por terreno, cimentaciones o edificios de contexto.

El conjunto visible del Puerto tiene 132 mallas y aproximadamente 3,48 millones de triángulos. Las superficies urbanas usan índices en cuadriláteros planos y acumuladores Float32 por bloques; se conserva el sombreado de pavimentos no planos. Estas cifras son de geometría, no una medición de fotogramas por segundo en GPU.

Se comprueban el catálogo, filtros, fichas documentales, mapas, cambio de región y los recorridos regional y completo en el navegador. Evidencias y renders de comprobación en `research/validation-v4/`. Notas de los nueve conjuntos en `research/port-industrial.md`, `research/port-garden.md` y `research/port-workers.md`.

### Regresión de arqueología y revisión visual

La regresión de arqueología supera 86 comprobaciones integradas y 34 de excavación permanente (120 en total), con cero errores. Los 16 encuadres en corte y 24 históricos quedan libres de oclusiones; las intersecciones en el estado actual son coherentes con restos cubiertos por el suelo o el edificio moderno.

Validación de geometrías con Three.js vendorizado: atributos finitos, huecos de puertas y cámaras comprobados con raycasts, y grupos históricos separados. Pruebas integradas de modos, capas, cubiertas, cambios de foco, restauración de materiales y encuadres de escritorio/móvil. El recorte permanente del circo se verifica con 25 rayos interiores, 48 exteriores próximos al borde y ausencia de triángulos degenerados nuevos. Se han inspeccionado renderizados CPU de las geometrías reales, incluidos restos, restituciones y cubiertas abiertas/cerradas.

El navegador del entorno de pruebas tiene WebGL deshabilitado. La interfaz, catálogo, mapas, navegación y evidencias se comprueban en la vista alternativa 2D. La revisión CPU y las pruebas geométricas no sustituyen a una prueba del renderizador WebGL en un dispositivo con aceleración gráfica. La aplicación conserva su detección y aviso de compatibilidad.

## Preparación para una futura vista a pie

El conjunto comparte un sistema métrico: origen WGS84 `[-0.278, 39.679]`, X este / Z sur, Y en metros. `urban-surface.js` proporciona `groundHeight`, `slopeAt` y un índice espacial de plantas para consultas preliminares de obstáculos. Los pasos abiertos de la judería se distinguen de las plantas sólidas. En el Puerto se conservan los huecos de patios en la geometría y en las consultas preliminares de obstáculos. El relieve expone además `meshHeightAt`, que consulta la superficie triangulada final en celdas completas y usa el suelo analítico como respaldo en el borde elíptico; no sustituye las colisiones contra pisos, cubiertas y pasos de los modelos.

**La primera persona no está activada en esta edición.** Antes de incorporarla hay que integrar raycasts contra pisos y peldaños, colisiones tridimensionales en puertas/arcadas, las pequeñas diferencias entre la malla de apoyo y la consulta analítica del suelo, pendientes transitables y controles táctiles. No considerar `canStand` una malla de navegación terminada.

## Estructura

Aplicación estática, sin compilación ni claves API. Three.js r180, fuentes y cartografía se sirven desde el mismo sitio.

- `dist/index.html`, `style.css`: interfaz adaptable, catálogo y paneles.
- `dist/js/app.js`: integración, cámaras, iluminación, capas, navegación y carga con caché de una región móvil o dos de escritorio.
- `dist/js/landscapes.js`, `landscape-marjal.js`, `landscape-dunes.js`, `landscape-palancia.js`: catálogo natural, geometrías, recorridos y evidencias.
- `dist/js/landscape-environment.js`: máscaras de agua, niveles, islas, reflejos y liberación de recursos.
- `research/acquire_landscapes.py`, `enrich_atlas_buildings.py`, `derive_landscape_water.py`, `summarize_atlas_data.py`, `compact_cartography.py`: adquisición, derivación y empaquetado de datos de la sexta edición.
- `dist/js/catalog.js`: fichas del casco histórico; `archaeology.js` registra las cinco fichas arqueológicas y agrega sus modelos.
- `dist/js/archaeology-domestic.js`, `archaeology-public.js`, `archaeology-necropolis.js`: geometría detallada por fases.
- `dist/js/excavation.js`: planos de recorte local, contexto desplazado, secciones de suelo, cubiertas y excavación permanente del circo.
- `dist/js/archaeology-panel.js`: modos, ámbitos, límites y registro de evidencias.
- `dist/assets/data/archaeology-*.json`: coordenadas, referencias, periodos, medidas y certeza de los nuevos conjuntos.
- `dist/js/port.js`: registro de los nueve lugares, integración de ámbitos, huellas, focos y evidencias.
- `dist/js/port-industrial.js`, `port-garden.js`, `port-workers.js`: modelos del patrimonio industrial y la ciudad factoría.
- `dist/assets/data/port-*.json`: cartografía, relieve, procedencia de alturas, modelos y referencias del Puerto.
- `research/acquire_port_cartography.py`, `enrich_port_buildings.py`, `acquire_building_heights.py --port`: adquisición y transformación reproducible de los datos.
- `dist/js/monuments.js`: teatro y castillo.
- `dist/js/heritage-sacred.js`: cuatro conjuntos religiosos.
- `dist/js/heritage-civic.js`, `heritage-civic-data.js`: cuatro conjuntos civiles y plantas de contexto.
- `dist/js/terrain.js`: muestreo, malla, texturas y cimentaciones.
- `dist/js/urban-surface.js`: suelo común, índices métricos y consultas de obstáculos.
- `dist/js/city.js`: plantas, alturas de cubierta, fachadas, pavimentos, escalones y vegetación instanciada.
- `dist/js/historic-map.js`, `map.js`: mapa local seleccionable y contexto territorial.
- `dist/assets/data/`: datos y procedencia, incluidos `landmarks.json` y `building-height-provenance.json`.
- `research/`: scripts reproducibles y notas de investigación. Archivos grandes originales y resultados temporales de QA están ignorados en Git.
- `.openai/hosting.json`: identidad y despliegue del Site existente.

## Créditos

- IGN / PNOA, CC BY 4.0: [servicios oficiales](https://www.ign.es/web/ign/portal/ide-area-nodo-ide-ign), [MDS normalizado](https://datos.gob.es/es/catalogo/e00125901-spaignmds-normalizado), [licencia](https://www.ign.es/resources/licencia/Condiciones_licenciaUso_IGN.pdf).
- Dirección General del Catastro: [INSPIRE Buildings](https://www.catastro.hacienda.gob.es/webinspire/), [licencia](https://www.catastro.hacienda.gob.es/webinspire/documentos/Licencia.pdf). Geometría transformada para el atlas; no cartografía oficial.
- © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), ODbL 1.0.
- Arqueología: informes de excavación de ARSE / Centre Arqueològic Saguntí, Universidad de Alicante, Universitat de València, UPV y GeoSefarad. Referencias y alcance detallados en cada ficha.
- Arquitectura e historia: Ayuntamiento de Sagunto, Turisme Comunitat Valenciana, Sagunto Turismo, Red de Juderías, Rutas Jaume I, Turespaña, UPV y Manuel Portaceli Arquitecturas. Referencias por lugar en el catálogo y los datos.
- Patrimonio del Puerto: Ayuntamiento de Sagunto, Fundació de Patrimoni Industrial i Memòria Obrera, BOE, APIVA y Universitat de València. Referencias y revisión de estados a 19/11/2026 en las fichas.
- Texturas arquitectónicas originales procedurales; no se redistribuyen fotografías de referencia.
- Three.js, MIT. Manrope y Cormorant Garamond, SIL Open Font License.

## Quinta edición: fuentes, implementación y verificación

La investigación específica se conserva en `research/coast-pier.md`, `research/coast-grau.md` y `research/coast-archaeology.md`. Cada ficha publicada incluye fuentes primarias y una tabla que separa documentación, cartografía e interpretación. Se revisaron Valenciaport, documentación municipal de 2025–2026, el levantamiento UPV del fortín y publicaciones arqueológicas de Grau Vell. Se mantiene la distinción entre consolidación, proyecto futuro y obra ejecutada.

El pantalán (`coast-pier.js`) y el puerto antiguo (`coast-archaeology.js`) mantienen geometrías Actual e Histórica separadas; el Grau Vell (`coast-grau.js`) muestra su arquitectura restaurada. `coast.js` coordina los lugares y la fase compartida del pantalán. `coast-environment.js` reúne máscara del mar, reflejo y vegetación. `app.js` prepara cada región bajo demanda; catálogo, fuentes y mapa siguen disponibles cuando WebGL no está habilitado. Los modelos de otras regiones permanecen accesibles con sus controles anteriores.

Las pruebas `research/validate_coast.mjs` cargan los modelos y la cartografía reales para revisar coordenadas, mallas, exclusiones de contexto, fases, sección, agua y cámaras en escritorio/móvil. `research/render_coast_validation.py` produce comprobaciones visuales de esa geometría mediante Cycles. Los resultados y capturas se conservan en `research/validation-v5`. Estos renders sustituyen los materiales WebGL y se identifican como inspección geométrica: no son capturas del navegador ni pruebas de rendimiento GPU. El navegador gestionado disponible para esta edición declara `GL_RENDERER=Disabled`; se ha verificado la interfaz y la alternativa 2D, mientras la fluidez y los reflejos reales requieren una comprobación en un dispositivo con WebGL.

Reproducir los datos costeros: `research/acquire_coast_cartography.py`, `research/enrich_coast_buildings.py`, `research/acquire_building_heights.py --coast` y `research/derive_coast_water.py`. Los scripts GDAL requieren `/usr/bin/python3`. Los datos de origen y la geometría derivados mantienen atribución y enlaces de licencia en los JSON. No se ha añadido galería de fotografías históricas.

## Sexta edición: paisajes y contexto urbano

Documentación específica en `research/landscape-marjal.md`, `landscape-dunes.md` y `landscape-palancia.md`. Se contrastan MITECO/Natura 2000, CEACV/Generalitat, BOE, documentación municipal, ADEAC y las bases IGN/PNOA, Catastro y OSM. La fecha de consulta es 19/11/2026; no acredita fecha de vuelo, estado hidrológico actual ni finalización de las obras.

Los seis ámbitos incluyen cuerpos edificados cartografiados en 3D: Sagunto 9.374, Puerto 15.966, Costa 424, Marjal 700, Almardà–Almenara 6.068 y Palancia 33.364. Son **partes**, no edificios únicos. Los recortes se superponen. La escena del Palancia abarca también contexto de Sagunto y del Puerto; no es un inventario completo del término municipal. Las correcciones de encaje de cubiertas en ladera se declaran en las estadísticas de la escena y no modifican las alturas de los datos fuente.

El agua utiliza un máximo de dos reflejos planares por paisaje; los estanques restantes conservan su propio nivel con un material más ligero. El fondo se rebaja para exponer las láminas, sin atribuirle batimetría. Las islas y el cauce seco se preservan. Algunas láminas diminutas y bordes de laguna quedan parcialmente resueltos por la malla de visualización; véase la memoria. La vegetación es una interpretación de comunidades, no un inventario de ejemplares.

La navegación mantiene cámara orbital y añade encuadres bajos a aproximadamente 1,6–1,75 m sobre pasarelas o suelo. No representa una ruta peatonal calculada. El recorrido general reúne 31 lugares, mientras los recorridos de paisaje enlazan 8, 6 y 7 puntos respectivamente.

La memoria `research/validation-v6.md` y los resultados en `research/validation-v6/` recogen geometría, cámaras, agua, cartografía, regresión de arqueología, industria y costa, contexto urbano y liberación de escenas. El navegador disponible tiene WebGL desactivado: se ha comprobado la interfaz y los mapas 2D, y la geometría 3D se ha inspeccionado con renders CPU. Estos últimos emplean materiales de comprobación y no son capturas del renderizador WebGL ni una medición de fluidez.
