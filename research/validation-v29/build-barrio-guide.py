"""V29 documentary guide. Generate before registering the model's focus points.

The production JSON owns its final geometric registration. This source deliberately
refuses to replace registered coordinates, building associations or camera targets.
"""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'dist/assets/data/barrio-visit.json'
DATE = '2026-11-21'
ORIGIN = [-0.2254082, 39.661704]

if OUT.exists():
    previous = json.loads(OUT.read_text())
    if previous.get('modelRegistration', {}).get('status') == 'registered':
        raise SystemExit('Guide already registered: edit the JSON deliberately instead of overwriting registered coordinates.')


def source(id, title, author, url, kind, locator, year=None, note=''):
    return dict(id=id, title=title, author=author, url=url, type=kind,
                locator=locator, year=year, note=note, accessed=DATE)


sources = [
    source('b-catalogo', 'Catálogo de protección del patrimonio arquitectónico y urbanístico de Sagunto · Puerto de Sagunto',
           'Ayuntamiento de Sagunto',
           'https://aytosagunto.es/media/u1ip2u2f/03-97_catalogo_proteccion_patrimonio_puerto_sagunto_2-de-9_opt.pdf',
           'inventario municipal con plantas, alzados y secciones',
           'Páginas PDF 77–96: Barrio Obrero. P. 82: secciones urbanas acotadas; p. 86: bloques; pp. 87–91: tipos I–V; pp. 92–95: construcción; p. 96: ficha normativa.',
           note='Se inspeccionan visualmente los planos escaneados. Las cotas históricas no certifican todas las reformas actuales. Los recuentos del inventario y de otras publicaciones no son idénticos; la autoría también tiene atribuciones distintas.'),
    source('b-contrast', 'El Barrio Obrero de la CSM o Casas de la Compañía',
           'CONTRAST · Joan Costa Sanz, Antonio Ortiz López y José María Prats Escriche; dibujos de Ciriaco Galán López',
           'https://www.contrastapips.com/IHACM/IBP/Port/Port_patri_barri.htm',
           'investigación patrimonial y archivo visual',
           'Trazado, jardín, corral de 2,5 m, ventilación, huecos escarzanos y fotografías fechadas.',
           note='Describe una vivienda tipo, no todas las viviendas actuales. La atribución a Luis Cendoya se formula como probabilidad. La afirmación de conservación casi íntegra se matiza con las transformaciones del catálogo.'),
    source('b-guia2022', 'Patrimonio industrial de Puerto de Sagunto · Itinerario didáctico multidisciplinar',
           'CONTRAST / Asociación de Patrimonio Industrial de Puerto Sagunto',
           'https://www.apips.es/assets/files/CUADERNO_TP01.pdf',
           'guía de investigación patrimonial',
           'Página impresa 41, apartado 9: Casas de la Compañía; evolución del frente de la avenida y referencias a las viviendas.',
           2022, 'El texto digital puede perder la coma de 2,5 m y mostrar 25 m; se contrasta con la página original de CONTRAST. No se adopta como universal el total de viviendas.'),
    source('b-estudio2014', 'El barrio obrero de Puerto de Sagunto: análisis tipológico de viviendas',
           'Diana Sánchez Mustieles',
           'https://patrindustrialquitectonico.blogspot.com/2014/06/mi-presentacion-en-el-seminario-de.html',
           'presentación de investigación de la autora',
           'Publicación de 23 de junio: estudio de tipologías, levantamientos redibujados, visitas a interiores y testimonios familiares.',
           2014, 'La autora explica su trabajo de campo y la base municipal de los dibujos. No permite trasladar una distribución privada concreta a cualquier parcela.'),
    source('b-uv', 'La siderurgia de Puerto de Sagunto',
           'Carme Piqueras Sanchis y Juan Piqueras Haba · Departament de Geografia, Universitat de València',
           'https://paisajesturisticosvalencianos.com/paisajes/la-siderurgia-puerto-sagunto/',
           'investigación universitaria del paisaje industrial',
           'Barrio Obrero, viviendas blancas con patios y relación de los equipamientos residenciales con la empresa.',
           note='Contextualiza vivienda, servicios y comunidad industrial. Sus referencias a conservación describen el momento del estudio, no una inspección de cada casa en 2026.'),
    source('b-foto1925', 'Jardines y viviendas del Barrio Obrero, 1925',
           'Archivo FPPHIS, reproducido por CONTRAST',
           'https://www.contrastapips.com/IHACM/IBP/Port/Port_patri_barri_archivos/image018.jpg',
           'fotografía histórica',
           'Vegetación y relación entre casas, jardines y calle; fecha según el pie de CONTRAST.',
           1925, 'Referencia visual histórica sin escala métrica. No acredita especies ni emplazamiento actual de los árboles; no se redistribuye como textura.'),
    source('b-dibujo1995', 'Casa del Barrio Obrero: fachada, alero y jardín',
           'Ciriaco Galán López · CONTRAST',
           'https://www.contrastapips.com/IHACM/IBP/Port/Port_patri_barri_archivos/image016.gif',
           'dibujo de observación',
           'Alero, ménsulas, cerco delantero, puerta y ventanas.',
           1995, 'Dibujo sin cotas, utilizado para reconocer detalles; no sustituye las plantas y secciones del catálogo.'),
    source('b-fiestas', 'Fiestas de barrio',
           'Ayuntamiento de Sagunto',
           'https://aytosagunto.es/es/el-municipio/fiestas/fiestas-de-barrio/',
           'información municipal de cultura vecinal',
           'Apartado Barrio Obrero: fiestas de agosto y concurso de pintura sobre asfalto en torno a la calle Libertad.',
           note='La decoración es una práctica festiva renovable; la escena no fija un mural concreto como pavimento histórico permanente.'),
    source('b-falla2026', 'La Falla Luis Cendoya recibirá la Medalla de la Ciudad',
           'Ayuntamiento de Sagunto',
           'https://aytosagunto.es/es/actualidad/2026-09-04-la-falla-luis-cendoya-margarita-pin-y-paqui-rondan-recibiran-la-medalla-de-la-ciudad/',
           'comunicación municipal con antecedentes históricos',
           '4 de septiembre: acuerdo de concesión; primer monumento documentado de la comisión en 1927, calle Poeta Llombart.',
           2026, 'El comunicado acredita el acuerdo y su trayectoria. No se infiere que el acto de entrega ya hubiera tenido lugar en la fecha de publicación.'),
    source('b-catastro', 'Cartografía INSPIRE de edificios de Sagunto',
           'Dirección General del Catastro',
           'https://www.catastro.hacienda.gob.es/webinspire/index.html',
           'cartografía pública',
           'Conjunto municipal 46222: huellas, partes edificadas y alturas de referencia del sector del Barrio Obrero.',
           note='La cartografía actual registra partes y parcelas, no un recuento de casas originales ni habitaciones. Las dos muestras interiores se sitúan sobre huellas cartográficas; no son inspecciones de domicilios.'),
    source('b-pnoa', 'PNOA Máxima Actualidad',
           'Instituto Geográfico Nacional',
           'https://www.ign.es/wms-inspire/pnoa-ma',
           'ortofotografía',
           'Contraste del parcelario, las cubiertas y los espacios libres del sector.',
           note='Máxima Actualidad es el nombre del servicio; no implica que cada imagen se haya tomado en noviembre de 2026. No permite conocer el interior de las viviendas.'),
    source('b-osm', 'Cartografía de las calles del Barrio Obrero',
           'Colaboradores de OpenStreetMap',
           'https://www.openstreetmap.org/copyright',
           'cartografía colaborativa',
           'Nombres y trazados viarios, contrastados con el catálogo municipal y la cartografía pública.',
           note='La trama exterior orienta la visita. No acredita el acceso público a casas, jardines ni corrales.')
]


def fact(text, *ids, confidence='documented'):
    return dict(text=text, sourceIds=list(ids), confidence=confidence)


def stop(key, label, title, region, intro, narrative, facts, look, note,
         building=None, floor=None, section=False, interior=False, confidence=None):
    ids = list(dict.fromkeys(source_id for item in facts for source_id in item['sourceIds']))
    return dict(id='barrio-' + key, label=label, title=title, regionId=region,
                period='mixed', intro=intro, narrative=narrative, facts=facts,
                lookFor=look, modelNote=note, sourceIds=ids,
                confidence=confidence or ('interpretive' if interior else 'documented'),
                coordinateConfidence='approximate',
                coordinateMethod='Foco provisional del conjunto, pendiente de registrar con la geometría final.',
                coordinate=ORIGIN.copy(), coordinates=ORIGIN.copy(),
                coordinateSourceIds=['b-catastro', 'b-pnoa', 'b-osm'], osmIds=[],
                readingMinutes=1, readingLayer=region, floor=floor, fabricStatus='mixed',
                recommendedMode='current', mapScope='interior' if floor is not None else 'recinto',
                requiresSection=section, interiorView=interior, buildingId=building)


stops = [
    stop('conjunto', 'El conjunto', 'Las Casas de la Compañía', 'edificio',
         'Empieza por la escala de las casas y la continuidad de los tejados.',
         'Acércate desde el conjunto hasta una vivienda para relacionar ciudad, calle y vida doméstica.',
         [fact('El conjunto se construyó entre 1917 y 1921.', 'b-catalogo', 'b-uv'),
          fact('La empresa siderúrgica promovió estas viviendas para su población trabajadora.', 'b-uv')],
         'Casas bajas, cuerpos de dos alturas y espacios entre la puerta y la calle.',
         'La visita reúne arquitectura histórica y trama contemporánea. Los dos interiores son tipologías documentadas, no el estado privado actual de viviendas concretas.'),
    stop('trazado', 'Trazado histórico', 'Calles que organizan una comunidad', 'edificio',
         'Sigue los ejes de las calles y el encuentro entre las hileras.',
         'Compara la trama actual con el relato de su plaza histórica, transformada con el tiempo.',
         [fact('CONTRAST describe dos calles paralelas cruzadas por una transversal.', 'b-contrast'),
          fact('La plaza tuvo una fuente central para abastecer al vecindario.', 'b-contrast')],
         'La trama regular y los espacios que articulan los bloques.',
         'La plaza histórica y su fuente son antecedentes, no una plaza intacta de 1920. No se confunden con la actual plaza de la Independencia, situada en otro punto.'),
    stop('hileras', 'Hileras', 'La repetición y sus variaciones', 'edificio',
         'Recorre visualmente una alineación de fachadas.',
         'Compara puertas, ventanas, tapias y el cambio de altura al terminar algunos bloques.',
         [fact('El inventario municipal organiza el conjunto en siete bloques.', 'b-catalogo'),
          fact('Predominan las viviendas adosadas de una planta.', 'b-contrast')],
         'Medianeras compartidas y secuencias de huecos que cambian entre tipos.',
         'No se multiplica una casa idéntica por todo el barrio: las huellas actuales conservan sustituciones y ampliaciones.'),
    stop('vivienda-baja', 'Casa de una planta', 'Una vivienda del tipo III', 'edificio',
         'Acércate a la casa baja elegida para explicar la organización doméstica.',
         'Después puedes abrir su sección y visitar los espacios interiores.',
         [fact('La ficha del tipo III corresponde a los bloques C, D, E y F.', 'b-catalogo'),
          fact('El jardín delantero y el corral acompañan al cuerpo de vivienda.', 'b-contrast')],
         'La secuencia jardín, entrada, habitaciones y patio posterior.',
         'Se adapta una tipología histórica a una huella representativa del bloque D. Las funciones de cada habitación y el mobiliario son interpretativos.',
         building='barrio-casa-baja'),
    stop('vivienda-esquina', 'Casa de dos plantas', 'El extremo que sube de altura', 'edificio',
         'Compara esta pieza con la hilera baja de su bloque.',
         'La segunda planta añade viviendas y modifica el ritmo de la fachada.',
         [fact('El tipo IV ocupa extremos de los bloques D y F.', 'b-catalogo'),
          fact('Su plano muestra viviendas junto a una escalera central compartida.', 'b-catalogo')],
         'Dos órdenes de ventanas y el acceso a la escalera.',
         'La muestra corresponde al tipo histórico de dos alturas, ajustado a una huella actual. No documenta la distribución privada de ese inmueble hoy.',
         building='barrio-casa-alta'),
    stop('jardin', 'Jardín delantero', 'Un umbral entre casa y calle', 'espacios',
         'Detente ante el pequeño recinto que precede a la puerta.',
         'El cerco, el paso y la vegetación dan profundidad al frente de la hilera.',
         [fact('La sección municipal S1 acota jardines delanteros de 3,50 m.', 'b-catalogo'),
          fact('La fotografía de 1925 documenta vegetación en estos espacios.', 'b-foto1925')],
         'La distancia entre el cierre de parcela y la fachada.',
         'La dimensión procede de una sección histórica. Plantas, especies, cierres y mantenimiento actuales varían entre viviendas.',
         building='barrio-casa-baja'),
    stop('sala', 'Sala doméstica', 'La vida tras la fachada', 'espacios',
         'Entra en la lectura de la vivienda baja.',
         'Observa cómo un paso comunica las pequeñas estancias con el exterior posterior.',
         [fact('El plano tipo reparte habitaciones a ambos lados de un paso.', 'b-catalogo'),
          fact('Las secciones describen pavimento hidráulico.', 'b-catalogo')],
         'La escala de los huecos, el suelo y la continuidad del recorrido.',
         'Sala y muebles ilustran un uso doméstico posible. El plano municipal no asigna una función a cada habitación ni describe una casa privada actual.',
         building='barrio-casa-baja', floor=0, interior=True),
    stop('cocina', 'Cocina y servicio', 'El trabajo cotidiano de la casa', 'espacios',
         'Mira la zona doméstica próxima al patio.',
         'Relaciona la estancia con el espacio abierto y los pequeños cuerpos posteriores.',
         [fact('El inventario distingue estancias, servicios y espacios libres privados.', 'b-catalogo'),
          fact('Sus secciones documentan tabiques de ladrillo y enlucido de yeso.', 'b-catalogo')],
         'La relación entre espacio de servicio, paso y corral.',
         'La cocina es una interpretación de uso: su equipamiento y posición concreta no están acreditados por una planta histórica rotulada.',
         building='barrio-casa-baja', floor=0, interior=True),
    stop('dormitorios', 'Habitaciones', 'Luz desde la calle y el corral', 'espacios',
         'Compara las habitaciones del frente con las que miran hacia atrás.',
         'Busca los huecos por los que entraban luz y aire.',
         [fact('CONTRAST describe dormitorios ventilados al frente y al corral.', 'b-contrast'),
          fact('Esa descripción sitúa habitaciones habituales entre 6 y 8 m².', 'b-contrast')],
         'Ventanas, particiones y la escala compacta de los cuartos.',
         'La descripción corresponde a una vivienda tipo. Número, dimensiones y uso de habitaciones pueden variar; las camas son recursos de escala.',
         building='barrio-casa-baja', floor=0, interior=True),
    stop('corral', 'Patio posterior', 'El espacio abierto detrás de la casa', 'espacios',
         'Sal de la lectura interior hacia la trasera.',
         'Compara este ámbito de servicio con el jardín que mira a la calle.',
         [fact('CONTRAST describe un corral posterior de 2,5 m de profundidad.', 'b-contrast'),
          fact('Los planos muestran pequeños cuerpos de servicio junto a los patios.', 'b-catalogo')],
         'Tapias, puertas traseras y la franja abierta entre viviendas.',
         'Los corrales han podido transformarse. La escena explica su papel tipológico y no presupone acceso público a los patios privados.',
         building='barrio-casa-baja'),
    stop('planta-alta', 'Vivienda superior', 'Otro hogar sobre la planta baja', 'espacios',
         'Sube con la cámara a la muestra de dos plantas.',
         'Compara su acceso y sus ventanas con la casa baja que acabas de recorrer.',
         [fact('El tipo IV incorpora viviendas en una planta superior.', 'b-catalogo'),
          fact('El forjado descrito combina viguetas de madera y revoltón de ladrillo.', 'b-catalogo')],
         'Desembarco, forjado entre niveles y huecos del piso alto.',
         'Es una lectura tipológica histórica; escalera, estancias y muebles se ajustan de forma aproximada. No reproduce el interior privado actual.',
         building='barrio-casa-alta', floor=1, interior=True),
    stop('cubiertas', 'Tejados', 'La silueta doméstica del barrio', 'construccion',
         'Eleva la mirada sobre una hilera.',
         'Busca la continuidad de las cumbreras y la sombra de los aleros.',
         [fact('La cubierta documentada utiliza teja árabe sobre estructura de madera.', 'b-catalogo'),
          fact('El dibujo de 1995 recoge pequeñas ménsulas bajo un alero.', 'b-dibujo1995')],
         'Dos aguas, bordes de teja y cambios de altura.',
         'El catálogo documenta el sistema histórico. Color, desgaste y piezas menores se interpretan, respetando las cubiertas contemporáneas registradas.'),
    stop('carpinterias', 'Puertas y ventanas', 'Detalles que ordenan la fachada', 'construccion',
         'Acércate a un hueco sin perder de vista la secuencia de la hilera.',
         'La sencillez del muro hace visibles los recercados y las hojas de carpintería.',
         [fact('Las fichas constructivas describen puertas y ventanas de madera.', 'b-catalogo'),
          fact('Parte de las fachadas presenta huecos con arco escarzano.', 'b-contrast')],
         'Recercados, proporciones verticales y carpinterías.',
         'Los arcos escarzanos no se generalizan a todos los tipos. Colores y sustituciones actuales difieren entre casas.'),
    stop('transformaciones', 'Cambios del barrio', 'Una arquitectura que ha seguido habitándose', 'memoria',
         'Busca las diferencias que interrumpen la repetición.',
         'Los cambios de altura y los frentes comerciales ayudan a leer el paso del tiempo.',
         [fact('El catálogo registra sustituciones de viviendas y alteraciones del espacio central.', 'b-catalogo'),
          fact('La guía patrimonial describe comercios en casas del frente de la avenida.', 'b-guia2022')],
         'Volúmenes añadidos, jardines transformados y fachadas adaptadas.',
         'La cartografía actual se conserva como base. La lectura histórica no devuelve de forma automática todas las parcelas a una apariencia original.'),
    stop('seccion', 'Abrir la casa', 'Del jardín al tejado', 'construccion',
         'Abre la sección para relacionar los espacios de la casa baja.',
         'Después cambia a la vivienda superior para comparar las dos tipologías.',
         [fact('La sección S1 acota aleros históricos de 3,70 y 7,30 m.', 'b-catalogo'),
          fact('Las fichas muestran falso techo de cañizo bajo el tejado.', 'b-catalogo')],
         'Muros, particiones, techo y el vacío de los patios.',
         'Corte digital de una tipología. Las cotas citadas son referencias del catálogo; espesores, detalles y adaptación a la parcela se aproximan.',
         building='barrio-casa-baja', floor=0, section=True, confidence='interpretive'),
    stop('accesos', 'Accesos', 'Entrar desde la ciudad del Puerto', 'entorno',
         'Sitúa el barrio entre sus calles y el tejido urbano que lo rodea.',
         'Sigue el paso desde una calle exterior hasta las hileras.',
         [fact('El inventario sitúa el ámbito entre la avenida 9 d’Octubre y Fornas.', 'b-catalogo'),
          fact('Luis Cendoya, Poeta Llombart y Libertad forman parte de su trama.', 'b-catalogo', 'b-osm')],
         'Encuentros de calles, pasos y cambios de anchura.',
         'Los puntos orientan una visita virtual. No identifican entradas públicas a viviendas ni establecen itinerarios accesibles certificados.'),
    stop('calles', 'Calles y vida vecinal', 'Un espacio compartido', 'entorno',
         'Baja a la escala de la calle y compara su anchura con las fachadas.',
         'Imagina la relación diaria entre las puertas, los jardines y el espacio común.',
         [fact('La sección S1 representa un viario de 7 m entre jardines.', 'b-catalogo'),
          fact('El concurso de pintura sobre asfalto se celebra en torno a Libertad.', 'b-fiestas')],
         'La proximidad de las casas y las superficies de encuentro.',
         'La sección histórica no certifica toda la movilidad actual. Las pinturas festivas son efímeras y no se convierten en decoración permanente inventada.'),
    stop('arbolado', 'Vegetación', 'El verde a la escala de una casa', 'entorno',
         'Compara la vegetación de los pequeños jardines con la de las calles próximas.',
         'Observa cómo las sombras suavizan el contacto entre cercos, aceras y fachadas.',
         [fact('Las imágenes históricas documentan plantas en jardines delanteros.', 'b-foto1925'),
          fact('La propuesta residencial incorporaba patio y vegetación como mejora doméstica.', 'b-contrast', 'b-uv')],
         'Pequeños recintos verdes y su relación con los accesos.',
         'La disposición se contrasta con cartografía y ortofoto. Especies, copas y densidad son aproximaciones visuales, no un inventario botánico.'),
    stop('frente-urbano', 'Edificios vecinos', 'El barrio dentro de una ciudad que crece', 'entorno',
         'Aléjate de la hilera para leer el encuentro con las edificaciones próximas.',
         'La diferencia de escala ayuda a reconocer el trazado residencial histórico.',
         [fact('El catálogo relaciona algunos bloques con el tejido de Ciudad Dormida.', 'b-catalogo'),
          fact('La cartografía registra partes edificadas con distintas alturas.', 'b-catastro')],
         'Medianeras, frentes a la avenida y cambios de volumen.',
         'Las huellas proceden de la base cartográfica; los detalles de fachadas vecinas sin levantamiento son interpretativos.'),
    stop('ciudad-factoria', 'Memoria obrera', 'Vivienda, trabajo y comunidad', 'memoria',
         'Termina relacionando el barrio con los demás lugares de la ciudad industrial.',
         'La vivienda completa el relato de fábricas, servicios y asociaciones del Puerto.',
         [fact('La empresa vinculó vivienda y otros servicios a la vida de su plantilla.', 'b-uv'),
          fact('La Falla Luis Cendoya está documentada en Poeta Llombart desde 1927.', 'b-falla2026')],
         'La relación del barrio con el conjunto de equipamientos industriales.',
         'La lectura reúne épocas distintas. El pasado industrial convive con una comunidad actual; no se representa el barrio como un recinto deshabitado.')
]

for order, item in enumerate(stops, 1):
    item['order'] = order

reading = [
    ('edificio', 'Casas y trazado', '#d4b17c', 'Hileras, tipos de vivienda y forma del conjunto.'),
    ('espacios', 'La vida doméstica', '#95bfc5', 'Jardín, habitaciones y patio en dos tipologías históricas.'),
    ('construccion', 'Cómo se construye', '#c79379', 'Cubiertas, carpinterías y sección de las viviendas.'),
    ('memoria', 'Barrio y comunidad', '#b7a1ca', 'Transformaciones y vida compartida en la ciudad industrial.'),
    ('entorno', 'Calles y alrededores', '#91ae87', 'Trama urbana, vegetación y edificios próximos.')
]


def event(id, date, title, text, ids, stop_id, period='industrial'):
    return dict(id=id, date=date, title=title, text=text, sourceIds=ids,
                period=period, confidence='documented', stopId=stop_id)


guide = dict(
    schemaVersion=1, id='barrio-obrero', title='Barrio Obrero y entorno',
    subtitle='Las Casas de la Compañía: vivienda, calles y memoria',
    introduction='Recorre las hileras y sus jardines, abre una casa baja y compara su organización con una vivienda de dos plantas. La visita enlaza la arquitectura doméstica con las calles y la comunidad del Puerto.',
    researchDate=DATE, regionsLabel='Ámbitos del Barrio Obrero',
    mapButtonLabel='Plano del barrio', overviewButtonLabel='Ver el conjunto',
    readingModeLabel='Leer el barrio',
    readingModeNote='Cinco ámbitos para explorar el barrio. Los colores orientan la visita y no indican fases constructivas exactas.',
    timelineIntroduction='La formación del barrio y algunos testimonios de su vida compartida.',
    visitAriaLabel='Visita al Barrio Obrero y sus alrededores',
    sectionOnOverview=False, sectionOpenLabel='Abrir las casas', sectionCloseLabel='Cerrar las casas',
    sectionInstructions='Abre las cubiertas de las viviendas de muestra para leer sus habitaciones. Cambia entre la casa baja y el piso superior; cierra la sección para recuperar la silueta de los tejados.',
    sectionNote='Dos interiores tipológicos históricos, basados en planos municipales. No representan el estado privado actual de viviendas concretas. Muebles y asignación de usos son interpretativos.',
    mapInstructions='Elige una parada en las hileras o el entorno. En las viviendas de muestra, cambia de edificio y de planta para explorar su organización.',
    mapNote='Plano orientativo sobre cartografía contemporánea. Los focos de observación y la adaptación de los interiores históricos tienen precisión aproximada.',
    visitNote='Investigación revisada el 21 de noviembre de 2026. El barrio mantiene su carácter residencial; la visita digital no supone acceso público a casas, jardines o patios privados.',
    methodology=[
        'Las plantas, alzados y secciones del catálogo municipal se han inspeccionado visualmente, junto con fotografías históricas, investigación tipológica, cartografía y ortofotografía.',
        'Los tipos III y IV sirven para explicar una casa baja y un cuerpo de dos alturas. Su adaptación a dos huellas representativas es aproximada y no documenta interiores privados actuales.',
        'Las cotas de 3,70 y 7,30 m de alero y el jardín de 3,50 m proceden de la sección S1. No se aplican como medidas universales a ampliaciones o edificios sustituidos.',
        'El catálogo no rotula el uso de todas las habitaciones. Sala, cocina, dormitorios y mobiliario se presentan como interpretación doméstica.',
        'Se conservan las transformaciones registradas en la trama contemporánea. Las referencias a jardines y plazas originales no equivalen a una restitución de todo el barrio en 1920.',
        'Las fuentes difieren en el total de viviendas y en la atribución de autoría. La guía evita convertir 112 o 115 viviendas, o un único proyectista, en certezas sin matiz.',
        'La vegetación, el desgaste de materiales y el detalle de edificios vecinos se aproximan. La pintura sobre asfalto se explica como actividad festiva renovable.'
    ],
    readingLegend=[dict(id=id, label=label, color=color, note=note) for id,label,color,note in reading],
    confidenceLegend=[
        dict(id='documented', label='Documentado', note='La fuente respalda el rasgo o el dato; no certifica cada medida del modelo.'),
        dict(id='interpretive', label='Interpretación', note='Aproximación de forma, dimensión o uso para explicar el espacio.'),
        dict(id='disputed', label='Fuentes diferentes', note='Se reconoce una diferencia documental sin sustituirla por una certeza inventada.')
    ],
    materialEvidenceLegend=[
        dict(id='conserved', label='Rasgo documentado', note='Elemento reconocido en planos o imágenes fechadas.'),
        dict(id='rehabilitated', label='Transformación documentada', note='Cambio del edificio o del tejido que forma parte de su evolución.'),
        dict(id='mixed', label='Lectura conjunta', note='Arquitectura documentada y aproximaciones de representación conviven en la maqueta.')
    ],
    regions=[dict(id=id, name=label, aliases=[], summary=note,
                  sourceIds=list(dict.fromkeys(source_id for item in stops if item['regionId']==id for source_id in item['sourceIds'])),
                  stopIds=[item['id'] for item in stops if item['regionId']==id], coordinate=ORIGIN.copy())
             for id,label,color,note in reading],
    stops=stops, sources=sources,
    timeline=[
        event('b-t-1', '1917–1921', 'Construcción del barrio', 'La compañía siderúrgica promueve las viviendas que forman el conjunto histórico.', ['b-catalogo', 'b-uv'], 'barrio-conjunto'),
        event('b-t-2', '1925', 'Un testimonio de los jardines', 'Una fotografía de archivo documenta la relación de casas, vegetación y calle.', ['b-foto1925'], 'barrio-jardin'),
        event('b-t-3', '1927', 'La primera falla documentada', 'Los antecedentes municipales sitúan el monumento de la comisión Luis Cendoya en Poeta Llombart.', ['b-falla2026'], 'barrio-ciudad-factoria'),
        event('b-t-4', '1995', 'Dibujar la arquitectura cotidiana', 'Ciriaco Galán registra el alero, los huecos y el jardín de una casa del barrio.', ['b-dibujo1995'], 'barrio-carpinterias', 'contemporary'),
        event('b-t-5', '2014', 'Estudiar las tipologías', 'Diana Sánchez Mustieles presenta una investigación que combina planos, visitas y memoria familiar.', ['b-estudio2014'], 'barrio-seccion', 'contemporary'),
        event('b-t-6', '2026', 'Reconocimiento a la vida asociativa', 'El Ayuntamiento acuerda conceder la Medalla de la Ciudad a la Falla Luis Cendoya por su trayectoria.', ['b-falla2026'], 'barrio-ciudad-factoria', 'contemporary')
    ],
    modelRegistration=dict(status='provisional', precision='approximate', provisionalCoordinates=True,
                           note='Las coordenadas iniciales corresponden al conjunto. Registrar los 20 focos con la geometría definitiva antes de publicar.'),
    materialsModeLabel='Materiales'
)

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(guide, ensure_ascii=False, indent=2) + '\n')
print(f'{OUT}: {len(stops)} stops, {sum(len(item["facts"]) for item in stops)} facts, {len(sources)} sources; registration provisional')
