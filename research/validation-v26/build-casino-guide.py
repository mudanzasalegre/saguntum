#!/usr/bin/env python3
"""Build the documentary guide. Coordinates are deliberately provisional.

Run BEFORE final model registration only: the integration step replaces the
coordinates/targets and sets modelRegistration.provisionalCoordinates to false.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'dist/assets/data/casino-visit.json'
TODAY = '2026-11-21'
CENTER = [-0.22260667, 39.65925]

def source(id, title, author, url, type, year, locator, note):
    return dict(id=id, title=title, author=author, url=url, type=type,
                year=year, locator=locator, note=note, accessed=TODAY)

sources = [
    source('c-history', 'Historia del Casino Recreativo y Cultural', 'Casino Recreativo y Cultural de Puerto de Sagunto', 'https://www.casinopuertosagunto.com/historia/', 'historia de la propia entidad', None, 'Orígenes; constitución; apertura social; terraza y escalera.', 'La entidad fecha la terraza en 1968; CONTRAST relaciona la intervención con un crédito de 1969.'),
    source('c-contrast', 'Casino de productores de AHV', 'CONTRAST · Joan Costa Sanz, Antonio Ortiz López y José María Prats Escriche', 'https://contrastapips.com/IHACM/IBP/Port/Port_patri_casi.htm', 'investigación patrimonial y documentación de campo', 2022, 'Materiales, patio, fachadas y evolución del conjunto.', 'La descripción del patio repite este en dos lados incompatibles; la distribución se contrasta con fotografías. El presente del texto no describe 2026.'),
    source('c-uv', 'El Casino dentro del conjunto de la Gerencia', 'Universitat de València', 'https://www.uv.es/patrimoni_industrial_sagunt/bicgerencia/gerencia.html', 'ficha patrimonial universitaria', None, 'Apartado 4: alas, vestíbulo, terraza, jardín, escenario y taquilla.', 'Descripción histórica sin fecha de actualización: no acredita apertura física actual.'),
    source('c-dau2021', 'Licitación de las obras de rehabilitación del Casino Gerencia', 'DAU Arquitectos', 'https://www.dauarquitectosvalencia.es/noticias/licitacion-de-las-obras-de-rehabilitacion-del-casino-gerencia', 'explicación de los autores del proyecto', 2021, '23 de agosto de 2021: organización en dos plantas alrededor de un patio.', 'Explica el edificio y la intención de rehabilitación; la intención no equivale a obra terminada.'),
    source('c-dau2022', 'Avanzan las obras del Casino Gerencia', 'DAU Arquitectos', 'https://www.dauarquitectosvalencia.es/noticias/avanzan-las-obras-del-casino-gerencia', 'seguimiento del proyecto por sus arquitectos', 2022, '25 de abril de 2022: salas, biblioteca y antiguas habitaciones.', 'Programa de intervención, no inventario de un centro reabierto.'),
    source('c-usos2021', 'La rehabilitación del Casino tendrá uso sociocultural', 'Ayuntamiento de Sagunto', 'https://aytosagunto.es/es/actualidad/el-equipo-de-gobierno-aclara-que-las-obras-de-rehabilitacion-del-casino-de-la-gerencia-estaran-destinadas-exclusivamente-a-darle-un-uso-sociocultural/', 'explicación municipal del proyecto', 2021, '19 de agosto de 2021: uso cultural e interpretación de las antiguas habitaciones.', 'Las habitaciones históricas no se presentan como un nuevo hotel.'),
    source('c-obras2022', 'Avance de las obras del Casino de la antigua Gerencia', 'Ayuntamiento de Sagunto', 'https://aytosagunto.es/es/actualidad/avance-obras-casino-gerencia-ahm-2022-04-12/', 'noticia y reportaje municipal de obra', 2022, '12 de abril de 2022: vaciado, elementos a conservar, superficie y cubierta prevista.', 'Distingue elementos históricos de actuaciones proyectadas, incluida la cubierta de vidrio.'),
    source('c-obras2026', 'Avanzan las obras de rehabilitación del Casino de la Gerencia', 'Ayuntamiento de Sagunto', 'https://aytosagunto.es/es/actualidad/2026-10-06-avanzan-las-obras-de-rehabilitacion-del-casino-de-la-gerencia/', 'estado municipal documentado de la intervención', 2026, '6 de octubre de 2026: reanudación y obras en curso.', 'Último estado municipal localizado. No es un anuncio de reapertura; la noticia presenta una referencia retrospectiva a 2015 que no se concilia con el inicio de 2022.'),
    source('c-biblioteca', 'La biblioteca del Casino', 'Casino Recreativo y Cultural de Puerto de Sagunto', 'https://www.casinopuertosagunto.com/actividades/biblioteca/', 'historia institucional de la biblioteca', None, 'Origen de la colección y préstamo desde finales de 1942.', 'Los servicios descritos sin fecha no se convierten en horarios o acceso actual a esta sede.'),
    source('c-bailes', 'Bailes familiares y talleres', 'Casino Recreativo y Cultural de Puerto de Sagunto', 'https://www.casinopuertosagunto.com/actividades/bailes/', 'información de la entidad sobre sus sedes', None, 'Traslado de bailes al Casino Playa durante la reforma de Nou d’Octubre, 5.', 'Distingue el edificio representado de la sede de la avenida Mediterráneo.'),
    source('c-instalaciones', 'Galería institucional de instalaciones', 'Casino Recreativo y Cultural de Puerto de Sagunto', 'https://www.casinopuertosagunto.com/portfolio/instalaciones/', 'fotografías del edificio, cafetería y jardines', None, 'fachada-2, casinofachada, casinobar, jardin, jardines y vista-entrada.', 'Fotografías sin datación precisa. Mobiliario y vegetación representan un estado histórico, no una comprobación del estado de 2026.'),
    source('c-patio1958', 'Patio del Casino: lados norte y este', 'R. Velo · archivo reproducido por CONTRAST', 'https://contrastapips.com/IHACM/IBP/Port/Port_patri_casi_archivos/image017.jpg', 'fotografía histórica del patio', 1958, 'Agosto de 1958, según el pie publicado por CONTRAST.', 'Contraste de las arcadas y de la diferencia entre lados; no proporciona cotas.'),
    source('c-patio2026', 'Galería superior del patio durante las obras', 'Ayuntamiento de Sagunto', 'https://aytosagunto.es/media/acuib44s/img_7810_c.jpg', 'fotografía documental interior', 2026, 'Reportaje municipal de 6 de octubre: galería, antepecho y teja hacia el patio.', 'La imagen registra una fase de obra con andamios, no un interior restaurado y abierto.'),
    source('c-escalera2022', 'Escalera interior durante las obras', 'Ayuntamiento de Sagunto', 'https://aytosagunto.es/media/wcrnmxo2/c2pa_visitaobrascasino_img_7274.jpg', 'fotografía documental interior', 2022, 'Reportaje de 12 de abril: tramo junto al muro, barandilla oscura y zócalo rojizo.', 'Permite reconocer materiales y disposición de un tramo, sin resolver el desarrollo métrico completo.'),
    source('c-catastro', 'Cartografía INSPIRE de edificios', 'Dirección General del Catastro', 'https://www.catastro.hacienda.gob.es/webinspire/index.html', 'cartografía oficial de contornos', None, 'Huella del Casino y patio en el registro cartográfico heredado del atlas.', 'No define una distribución interior ni certifica las alturas aproximadas del modelo.'),
    source('c-pnoa', 'PNOA Máxima Actualidad', 'Instituto Geográfico Nacional', 'https://www.ign.es/wms-inspire/pnoa-ma', 'ortofotografía de referencia', None, 'Cubiertas, ocupación del jardín y relación con el tejido urbano.', 'La fecha de consulta no equivale a la fecha del vuelo de cada imagen.'),
    source('c-osm', 'Calles y elementos urbanos del entorno', 'Colaboradores de OpenStreetMap', 'https://www.openstreetmap.org/copyright', 'cartografía colaborativa', None, 'Contexto viario heredado y contrastado con Catastro y PNOA.', 'No acredita accesibilidad, permisos de paso ni deslindes jurídicos.'),
]

def fact(text, ids, confidence='documented'):
    return dict(text=text, sourceIds=ids, confidence=confidence)

def stop(id, title, label, region, intro, narrative, facts, look, note,
         floor=None, interior=False, section=False, confidence='documented', extra=()):
    ids = list(dict.fromkeys([sid for f in facts for sid in f['sourceIds']] + list(extra)))
    return dict(id='casino-'+id, title=title, label=label, regionId=region,
        period='mixed', intro=intro, narrative=narrative, facts=facts,
        lookFor=look, modelNote=note, sourceIds=ids, confidence=confidence,
        coordinateConfidence='approximate',
        coordinateMethod='Coordenada provisional del entorno del Casino; pendiente de registrar el foco en la geometría final. Sin levantamiento métrico interior.',
        coordinate=list(CENTER), coordinates=list(CENTER),
        coordinateSourceIds=['c-catastro','c-pnoa'], osmIds=[],
        readingMinutes=1, readingLayer=region, floor=floor,
        fabricStatus='mixed', recommendedMode='current', mapScope='recinto',
        requiresSection=section, interiorView=interior,
        buildingId='casino' if interior else None)

stops = [
    stop('conjunto','De Casa Gerencia a espacio de encuentro','El conjunto','edificio',
        'Acércate a la casa y recorre después sus dos mundos: el patio y el jardín.',
        'Mira primero la relación entre el volumen compacto y el espacio libre. La visita propone una lectura histórica de su arquitectura.',
        [fact('La historia de la entidad fecha la Casa Gerencia en 1921 y recuerda las estancias de Ramón de la Sota.',['c-history']),
         fact('El Casino se constituyó el 26 de diciembre de 1941, con sede en la planta baja.',['c-history'])],
        'El edificio alrededor del patio y el jardín que prolonga sus espacios de reunión.',
        'Maqueta interpretativa sobre cartografía contemporánea; no representa una rehabilitación ya concluida.'),
    stop('fachada','Las fachadas hacia la población','Fachadas','edificio',
        'Observa cómo el ritmo de los huecos ordena los dos pisos.',
        'Acércate al encuentro entre una ventana y la esquina. El contraste de textura ayuda a reconocer las partes del edificio.',
        [fact('Las fachadas principales combinan revoco claro, arcos escarzanos y machones de ladrillo rojo rematados con bolas.',['c-contrast','c-instalaciones']),
         fact('En la fachada sur, fotografías de CONTRAST muestran ladrillo revestido que imita la piedra en arcos y molduras.',['c-contrast'])],
        'Arcos bajos, bandas horizontales, esquinas rojizas y zócalo.',
        'Los materiales conservan diferencias entre frentes; escala de juntas, desgaste y color son aproximados.'),
    stop('terraza','La casa se abre al jardín','Terraza','edificio',
        'Recorre el borde elevado desde el que se contempla el espacio de reunión exterior.',
        'La terraza permite comparar la cota del edificio con la del jardín y reconocer el paso entre ambos.',
        [fact('La entidad fecha terraza y escalera en 1968; CONTRAST las vincula a mejoras financiadas en 1969.',['c-history','c-contrast'],'disputed'),
         fact('Las fotografías institucionales muestran el frente de cafetería abierto hacia la terraza.',['c-instalaciones'])],
        'El borde bajo, la secuencia de puertas y el descenso hacia el jardín.',
        'Se representa la transformación de finales de los sesenta; no se atribuye íntegramente al edificio inicial.',confidence='disputed'),
    stop('escalinata','Un acceso en la esquina','Escalinata','edificio',
        'Baja la mirada al punto donde el recorrido exterior alcanza la plataforma de la casa.',
        'La curvatura del acceso suaviza el cambio de nivel y orienta la aproximación al edificio.',
        [fact('La ficha de UV identifica escalones concéntricos en la esquina nordeste.',['c-uv']),
         fact('El basamento sobresale del volumen y prolonga una terraza por los lados norte y este.',['c-uv'])],
        'La sucesión de peldaños y la continuidad del basamento.',
        'Número, alturas y radios de los peldaños interpretativos; el dibujo de CONTRAST sirve de contraste visual.',extra=['c-contrast']),
    stop('vestibulo','El umbral de los espacios comunes','Vestíbulo','edificio',
        'Entra y sitúa el patio como referencia antes de recorrer las salas.',
        'Este punto permite reconocer la transición entre exterior, espacio central y comunicación vertical.',
        [fact('UV describe un vestíbulo que comunica con el salón central y con la escalera.',['c-uv']),
         fact('El proyecto municipal de 2021 prevé un uso sociocultural para la totalidad del edificio.',['c-usos2021'])],
        'La dirección hacia el patio y la llegada a la escalera.',
        'Posición relativa documentada; puertas secundarias, proporciones y mobiliario son interpretación.',floor=0,interior=True),
    stop('patio','El vacío que organiza la casa','Patio central','patio',
        'Mira hacia arriba y compara los dos niveles alrededor del espacio central.',
        'La vista abierta facilita entender la profundidad de las galerías y las relaciones entre las alas.',
        [fact('Los arquitectos describen dos plantas organizadas alrededor de un patio con circulación claustral.',['c-dau2021']),
         fact('La fotografía de 1958 distingue el acceso norte y el pórtico oriental de la planta baja.',['c-patio1958'])],
        'La diferencia entre los lados de la planta baja y las arcadas superiores.',
        'Se muestra una lectura abierta del patio. No se afirma que su cubierta proyectada de vidrio esté terminada.',floor=0,interior=True,extra=['c-obras2026']),
    stop('galeria','Una segunda mirada al patio','Galería alta','patio',
        'Desde la planta alta se entiende mejor cómo se enlazan las distintas alas.',
        'Sigue visualmente los antepechos y compara los vanos superiores con los inferiores.',
        [fact('CONTRAST documenta pórticos de arcos en los cuatro lados de la planta alta.',['c-contrast']),
         fact('La imagen municipal de 2026 muestra pilares cuadrados, antepecho corrido y cubiertas de teja hacia el patio.',['c-patio2026'])],
        'La arcada, el antepecho y la profundidad de la galería.',
        'Se conservan los rasgos reconocibles; anchuras, alturas y número exacto de módulos son aproximados.',floor=1,interior=True),
    stop('salon','Café, conversación y juegos','Salón y cafetería','vida-social',
        'La sala longitudinal enlaza la vida interior con la terraza.',
        'Observa el ritmo de ventanas y el cambio de material en la parte baja de los muros.',
        [fact('UV sitúa el salón de bar en el ala oriental y la cocina y el mostrador al sur.',['c-uv']),
         fact('La fotografía histórica de la cafetería muestra zócalos cerámicos azules y claros y una celosía de madera.',['c-instalaciones'])],
        'El zócalo, los huecos altos y la secuencia de espacios.',
        'El mobiliario expresa usos históricos; no reproduce un montaje actual ni cada objeto de la fotografía.',floor=0,interior=True),
    stop('biblioteca','Un lugar para leer','Biblioteca','vida-social',
        'Detén el recorrido en el ámbito más recogido de la planta baja.',
        'Los libros ayudan a recordar que este edificio también organizaba el acceso cotidiano a la lectura.',
        [fact('La biblioteca nació con el Casino y organizó el préstamo circulante a finales de 1942.',['c-biblioteca']),
         fact('UV localiza la biblioteca y la sala de lectura en el ala oeste.',['c-uv'])],
        'La escala de la sala y su relación con las circulaciones.',
        'Estanterías, ejemplares y mesa son recursos interpretativos, sin inventario individual verificado.',floor=0,interior=True),
    stop('escalera','De las salas a las habitaciones','Escalera interior','patio',
        'Reconoce el vínculo entre los espacios de reunión y el nivel superior.',
        'El recorrido vertical permite comprender dos usos superpuestos dentro de una misma casa.',
        [fact('La escalera descrita por UV parte del vestíbulo y alcanza las dependencias superiores.',['c-uv']),
         fact('La fotografía municipal de 2022 muestra un tramo junto al muro con barandilla oscura de barrotes verticales.',['c-escalera2022'])],
        'El arranque, el descanso y la relación con la galería.',
        'Se interpreta el tramo fotografiado; desarrollo y cotas aproximados, sin plano métrico público completo.',floor=0,interior=True),
    stop('planta-alta','La memoria de quienes se alojaron aquí','Planta alta','vida-social',
        'Recorre el nivel que permite leer la dimensión residencial de la antigua Casa Gerencia.',
        'La visita sugiere las habitaciones sin atribuir a cada recinto un ocupante o una función no documentados.',
        [fact('CONTRAST documenta alojamiento de ingenieros solteros en la planta alta durante la etapa de AHV.',['c-contrast']),
         fact('En 2022 se anunció la conservación posible de suelos, baños y mobiliario empotrado de las antiguas habitaciones.',['c-obras2022','c-dau2022'])],
        'La relación entre galería, puertas y espacios de estancia.',
        'Divisiones y objetos no levantados son orientativos. No se representan habitaciones hoteleras contemporáneas.',floor=1,interior=True),
    stop('cubiertas','Teja alrededor, luz en el centro','Cubiertas','edificio',
        'Vuelve a una vista alta para reconocer la forma del patio dentro del volumen.',
        'Compara el borde de las cubiertas con el espacio central y con las fachadas exteriores.',
        [fact('Las fotos municipales de 2026 registran teja curva en las vertientes hacia el patio.',['c-patio2026']),
         fact('El 6 de octubre de 2026 seguía en curso la rehabilitación, que incluía una cubierta de vidrio para el patio.',['c-obras2026'])],
        'Vertientes de teja, aleros y apertura central.',
        'La lectura histórica abierta no equivale al estado final del proyecto; el vidrio no se da por ejecutado.'),
    stop('seccion','Leer la casa por dentro','Sección abierta','edificio',
        'Abre la sección para relacionar plantas, patio y habitaciones.',
        'La herramienta retira elementos superiores y mantiene las partes que permiten orientarse en el edificio.',
        [fact('La documentación municipal de 2022 da 1.446,10 m² de superficie construida para el edificio.',['c-obras2022']),
         fact('La intervención documentada incluye también la reforma del semisótano.',['c-obras2022','c-obras2026'])],
        'El espesor de las alas, las comunicaciones y la posición del patio.',
        'La superficie publicada no es la huella de planta. El semisótano carece de levantamiento verificado y no se inventa como interior visitable.',section=True),
    stop('jardin','El otro espacio de reunión','Jardín','jardines',
        'Amplía la visita hacia la explanada y las isletas que acompañan el edificio.',
        'Alterna la mirada entre el suelo libre y la sombra: ambos participan de la composición.',
        [fact('UV describe un jardín casi cuadrangular con islas ajardinadas alrededor de la pista.',['c-uv']),
         fact('La galería institucional muestra bordillos bajos ocres y recorridos entre isletas curvas y rectangulares.',['c-instalaciones'])],
        'El borde de las isletas y el espacio despejado junto a la terraza.',
        'Trazado ajustado a las referencias disponibles; no se certifica la conservación de cada plantación o acabado.'),
    stop('pista','Bailar al aire libre','Pista de baile','jardines',
        'Sitúate en el espacio libre que permite reunir a muchas personas frente al escenario.',
        'La amplitud de la pista se entiende al compararla con los ámbitos más recogidos de sus bordes.',
        [fact('En 1942 se autorizaron primero bailes al aire libre y después en el interior.',['c-history']),
         fact('Las fotos de las instalaciones registran mesas y sillas desmontables sobre el espacio de reunión.',['c-instalaciones'])],
        'La continuidad del pavimento y la relación con escenario y terraza.',
        'La escena evita fijar como arquitectura permanente un montaje concreto de fiesta.'),
    stop('escenario','La música al fondo del jardín','Escenario','jardines',
        'Mira hacia el extremo que da una dirección al espacio de reunión.',
        'La estructura ligera deja que la vegetación siga formando parte del fondo de la escena.',
        [fact('UV sitúa la pérgola que funciona como escenario al sur de la pista.',['c-uv']),
         fact('Las fotos muestran un escenario elevado, estructura ligera y frente claro con motivos azules.',['c-instalaciones'])],
        'El nivel elevado y la estructura por encima del frente.',
        'Posición y dimensiones aproximadas; se representan rasgos documentados sin reproducir equipos temporales.'),
    stop('arbolado','Sombra y claros','Arbolado','jardines',
        'Recorre los bordes donde las copas enmarcan las vistas de la casa.',
        'Las diferencias de altura ayudan a separar el espacio abierto de la pista y las zonas de estancia.',
        [fact('Las fotografías propias registran palmeras de distintas alturas y masas de arbolado denso en los bordes.',['c-instalaciones']),
         fact('UV describe zonas tranquilas con bancos y mesas alrededor del ámbito de baile.',['c-uv'])],
        'La alternancia de copas altas, sombra baja y espacios libres.',
        'Los ejemplares son representación paisajística; no constituyen un inventario botánico ni una fotografía del estado actual.'),
    stop('taquilla','El límite del recinto','Taquilla y cierre','memoria',
        'Reconoce el pequeño elemento que relaciona la vida del Casino con la calle.',
        'El límite permite pensar cómo se entraba, quién podía participar y cómo cambió ese acceso.',
        [fact('UV identifica una ventana de taquilla conservada en el cierre hacia la calle.',['c-uv']),
         fact('Desde 1968 los no socios podían acceder a ciertos bailes y verbenas pagando entrada.',['c-history'])],
        'El hueco en el cerramiento y la relación entre dentro y fuera.',
        'Ubicación puntual y forma simplificadas; la fuente acredita su existencia, no un levantamiento exacto.'),
    stop('entorno','Entre el recinto y la población','Entorno urbano','memoria',
        'Aléjate lo suficiente para ver la casa junto a los edificios que la rodean.',
        'El atlas conserva la continuidad con la Gerencia y con la trama de calles para orientar esta pieza dentro de la ciudad.',
        [fact('CONTRAST sitúa Casa Gerencia y oficinas en el frente del recinto que mira hacia la población.',['c-contrast']),
         fact('Las fotografías institucionales muestran edificaciones residenciales urbanas junto al jardín.',['c-instalaciones'])],
        'El contraste entre casa, arbolado, medianeras y edificios del entorno.',
        'Los volúmenes de contexto proceden de cartografía y lectura aérea; sus interiores no se reconstruyen.',extra=['c-catastro','c-pnoa','c-osm']),
    stop('memoria','De la sociabilidad industrial a la recuperación','Memoria y presente','memoria',
        'Cierra la visita relacionando la arquitectura con sus cambios de uso y acceso.',
        'La escena permite imaginar la vida histórica del conjunto mientras las fuentes explican sus transformaciones.',
        [fact('La afiliación se abrió a todos los trabajadores en 1968 y al público general en 1972.',['c-history']),
         fact('La entidad anuncia los bailes en el Casino Playa mientras se reforma esta sede.',['c-bailes'])],
        'El edificio, el acceso y el jardín como una misma secuencia.',
        'Documentación revisada el 21 de noviembre de 2026. Las obras municipales constan en curso el 6 de octubre; no se acredita reapertura de este interior.',extra=['c-obras2026']),
]
for order, item in enumerate(stops, 1):
    item['order'] = order

region_specs = [
    ('edificio','Casa y accesos','#d6b585','Volumen, fachadas, basamento y lectura en sección.'),
    ('patio','El patio y sus galerías','#8db9bf','El espacio central y las comunicaciones entre plantas.'),
    ('vida-social','Lectura, encuentro y alojamiento','#c89779','Usos documentados de las salas y de la planta alta.'),
    ('jardines','Jardín y celebraciones','#95b58f','Isletas, sombra, pista y escenario.'),
    ('memoria','Recinto, ciudad y memoria','#b39ac4','Límites, transformación social y recuperación contemporánea.'),
]
regions = []
for id,name,color,note in region_specs:
    items=[s for s in stops if s['regionId']==id]
    regions.append(dict(id=id,name=name,aliases=[],summary=note,
        sourceIds=list(dict.fromkeys(sid for s in items for sid in s['sourceIds'])),
        stopIds=[s['id'] for s in items],coordinate=list(CENTER)))

timeline_specs = [
    ('1921','Casa Gerencia','La entidad sitúa aquí el origen del edificio.',['c-history'],'conjunto','documented'),
    ('1941','Nace el Casino','Constitución de la sociedad el 26 de diciembre.',['c-history'],'conjunto','documented'),
    ('1942','La lectura circula','La biblioteca organiza el préstamo de libros.',['c-biblioteca'],'biblioteca','documented'),
    ('1942','Bailes dentro y fuera','Se autorizan bailes exteriores y, después, interiores.',['c-history'],'pista','documented'),
    ('1968','Acceso para todos los trabajadores','Cambian los estatutos y el nombre de la entidad.',['c-contrast'],'memoria','documented'),
    ('1968–1969','Terraza y nuevas conexiones','La cronología de terraza y escalera difiere entre las fuentes.',['c-history','c-contrast'],'terraza','disputed'),
    ('1972','Una afiliación más abierta','La entidad admite también socios ajenos a la siderúrgica.',['c-history'],'memoria','documented'),
    ('2021','Proyecto sociocultural','Se plantea recuperar el edificio completo para usos culturales.',['c-usos2021','c-dau2021'],'vestibulo','documented'),
    ('2022','Intervención interior','Se documentan vaciado y trabajos de rehabilitación iniciados en enero.',['c-obras2022'],'seccion','documented'),
    ('2026','Obras reanudadas','La noticia del 6 de octubre registra la intervención en curso.',['c-obras2026'],'cubiertas','documented'),
]
timeline = [dict(id=f'c-t-{i}',date=date,title=title,text=text,sourceIds=ids,
    period='contemporary' if date.startswith('20') else 'industrial',
    confidence=confidence,stopId='casino-'+stopid)
    for i,(date,title,text,ids,stopid,confidence) in enumerate(timeline_specs,1)]

guide = dict(
    schemaVersion=1,id='casino',title='Casino Recreativo y Cultural',
    subtitle='Casa Gerencia, patio y jardín de la vida social',
    introduction='Una casa organizada alrededor de un patio y un jardín preparado para encontrarse. Explora su arquitectura, sus salas y los cambios que vinculan este lugar con la ciudad industrial. Esta visita interpreta espacios históricos; las obras documentadas seguían en curso en octubre de 2026.',
    researchDate=TODAY,regionsLabel='Ámbitos del Casino',mapButtonLabel='Plano del Casino',overviewButtonLabel='Ver el conjunto',
    readingModeLabel='Leer el conjunto',readingModeNote='Cinco ámbitos de visita; sus colores no representan fases constructivas exactas.',
    timelineIntroduction='Una secuencia de usos y transformaciones. Las fechas divergentes permanecen identificadas.',
    visitAriaLabel='Visita al Casino Recreativo y Cultural',sectionOnOverview=True,
    sectionOpenLabel='Abrir sección',sectionCloseLabel='Cerrar sección',
    sectionInstructions='Retira cubiertas y elementos superiores para reconocer el patio, las alas y los espacios de la planta baja.',
    sectionNote='La sección es una herramienta digital. La lectura abierta del patio recupera su organización espacial; no representa una cubierta de vidrio ya finalizada.',
    mapInstructions='Selecciona una parada para pasar del edificio al patio, las salas o el jardín.',
    mapNote='Plano orientativo sobre cartografía contemporánea. Los detalles interiores y las cotas sin levantamiento son aproximados.',
    visitNote='Reconstrucción histórica interpretativa, documentada el 21 de noviembre de 2026. El Ayuntamiento registró obras en curso el 6 de octubre; la entidad sitúa los bailes durante la reforma en el Casino Playa. Esta visita virtual no acredita acceso físico al interior.',
    methodology=[
        'Se cruzan cartografía heredada del atlas, investigación patrimonial, historia de la entidad y fotografías de distintos momentos. No es un levantamiento arquitectónico.',
        'Los dos niveles del patio, la diferenciación de fachadas, la terraza y el jardín se apoyan en fuentes. Las medidas no publicadas, comunicaciones secundarias y objetos se interpretan.',
        'La descripción de CONTRAST contiene una repetición de orientación en la planta baja del patio. Se contrastan sus lados con la fotografía de 1958 y las imágenes municipales; no se presenta una planta métrica inequívoca.',
        'La entidad fecha la terraza en 1968 y CONTRAST relaciona las mejoras con un crédito de 1969. La guía conserva esa diferencia.',
        'La reforma iniciada en 2022 y reanudada posteriormente no se convierte en una inauguración. Las fotografías de obra de 2026 se distinguen de la documentación histórica.',
        'La vegetación y los muebles de jardín ayudan a leer los usos, con posición y escala aproximadas. No certifican el inventario o estado de todos los elementos en 2026.',
    ],
    readingLegend=[dict(id=id,label=name,color=color,note=note) for id,name,color,note in region_specs],
    confidenceLegend=[
        dict(id='documented',label='Documentado',note='La fuente respalda el dato; no certifica cada medida del modelo.'),
        dict(id='interpretive',label='Interpretación',note='Aproximación espacial o recurso visual para explicar el edificio.'),
        dict(id='disputed',label='Fuentes diferentes',note='Se conserva una diferencia documental sin resolverla con una fecha inventada.'),
    ],
    materialEvidenceLegend=[
        dict(id='conserved',label='Rasgo documentado',note='Elemento identificado en documentación histórica o visual.'),
        dict(id='rehabilitated',label='Intervención documentada',note='Tratamiento asociado a una actuación acreditada; no implica finalización de todo el edificio.'),
        dict(id='mixed',label='Lectura conjunta',note='La escena reúne rasgos históricos y aproximaciones de representación.'),
    ],
    stops=stops,regions=regions,sources=sources,timeline=timeline,
    modelRegistration=dict(status='pending',note='Pendiente de registrar los focos en la geometría final del Casino.',precision='approximate',coordinates='Provisional documentary coordinates; final integration must register model targets.',provisionalCoordinates=True),
    materialsModeLabel='Materiales',
)

assert len(stops)==20 and sum(len(s['facts']) for s in stops)==40
assert len(sources)==17 and len(regions)==5
source_ids={s['id'] for s in sources}
assert len(source_ids)==len(sources)
assert len({s['id'] for s in stops})==20
for s in stops:
    assert all(x in source_ids for x in s['sourceIds'])
    assert s['floor'] in (0,1) if s['interiorView'] else s['floor'] is None
    for f in s['facts']:
        assert f['sourceIds'] and set(f['sourceIds'])<=source_ids
OUT.write_text(json.dumps(guide,ensure_ascii=False,indent=2)+'\n')
print(f'Wrote {OUT}: 20 stops, 40 facts, 17 sources, 5 regions, 10 timeline events; coordinates provisional.')
