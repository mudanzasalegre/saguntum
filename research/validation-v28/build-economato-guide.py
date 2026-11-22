"""V28 editorial source. Run before final model registration, never afterwards.

The registered guide is the production artifact. This generator deliberately refuses
to replace it once the geometry owner has installed measured model focus coordinates.
"""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'dist/assets/data/economato-visit.json'
DATE = '2026-11-21'
ORIGIN = [-0.2218007, 39.6588829]

if OUT.exists():
    old = json.loads(OUT.read_text())
    if old.get('modelRegistration', {}).get('status') == 'registered':
        raise SystemExit('Guide already registered: edit the JSON deliberately instead of overwriting registered coordinates.')


def source(id, title, author, url, type, locator, year=None, note=''):
    return dict(id=id, title=title, author=author, url=url, type=type, year=year,
                locator=locator, note=note, accessed=DATE)


sources = [
    source('e-uv', 'Economato o Cooperativa de Productores · Gerencia y entorno',
           'Universitat de València',
           'https://www.uv.es/patrimoni_industrial_sagunt/bicgerencia/gerencia.html',
           'documentación patrimonial universitaria',
           'Apartado 3: tres naves, galería transversal, planta principal elevada y primer piso.',
           note='La ficha es histórica y no acredita el estado de las obras de 2026. Sitúa el uso cooperativo hacia 1928; otras fuentes distinguen una adaptación anterior y la denominación adoptada en 1928.'),
    source('e-contrast', 'El Economato de AHV (1954)',
           'CONTRAST · Joan Costa Sanz, Antonio Ortiz López y José María Prats Escriche',
           'https://www.contrastapips.com/IHACM/IBP/Port/Port_patri_Eco.htm',
           'investigación patrimonial y archivo fotográfico',
           'Pórticos, pilares octogonales, ampliación de 1954 y fotografías de 1912, 1950, 1954 y 1959.',
           note='Las imágenes representan fechas distintas. El estado de abandono descrito por el texto no sustituye los partes de obra actuales.'),
    source('e-guia2022', 'Patrimonio industrial de Puerto de Sagunto. Itinerario didáctico multidisciplinar',
           'CONTRAST / Asociación de Patrimonio Industrial de Puerto Sagunto (APIPS)',
           'https://www.apips.es/assets/files/CUADERNO_TP01.pdf',
           'guía de investigación patrimonial',
           'Página 34, apartado 8a: cooperativa, superficie construida y relación con avenida y ciudad jardín.', 2022,
           'Los 2.309 m² se refieren al total construido histórico de almacén y superficies comerciales; no son una medición obtenida del modelo.'),
    source('e-cuaderno2017', 'Cuaderno del estudiante · Patrimonio industrial de Puerto de Sagunto',
           'Ayuntamiento de Sagunto',
           'https://aytosagunto.es/media/qwub41a1/01_cuaderno_estudiante_cast.pdf',
           'documentación patrimonial municipal',
           'Economato de productores: Casa del Marino, alojamiento de tripulaciones y transformación para el consumo.', 2017,
           'Atribuye la adaptación a 1917. La documentación museográfica utiliza 1918; la guía conserva la diferencia.'),
    source('e-pleno2011', 'Acta del pleno municipal de 28 de abril de 2011',
           'Ayuntamiento de Sagunto',
           'https://aytosagunto.es/media/hihhjuwf/pl110428.pdf',
           'documento municipal histórico',
           'Páginas 89–90: antecedentes del Economato y uso popular del nombre Cope.', 2011,
           'El texto está incluido en una proposición política retirada; no acredita la ejecución de los usos propuestos en aquella sesión.'),
    source('e-museografia', 'Proyecto museográfico del Museo Industrial y de la Memoria Obrera',
           'Fundació Comunitat Valenciana Patrimoni Industrial i Memòria Obrera Port de Sagunt',
           'https://contrataciondelestado.es/FileSystem/servlet/GetDocumentByIdServlet?DocumentIdParam=HlncCamdSZpi4cmnbfNEm4HWooiq9NJHIPl%2BSO7zBVaVrSee5clgAWOqvsn%2BBBKGNyPbezTM6gtwuZrEp2ALa%2F0U14IVyvn6xA9gNl263rI%2F%2Fq7NB2iMZvNyf0xrJmjt&cifrado=QUC1GjXXSiLkydRHJBmbpw%3D%3D',
           'documentación museográfica institucional',
           'Contenido narrativo, páginas 23–24: Casa del Marino, mercado y economato.',
           note='El relato fecha la conversión en 1918, frente a 1917 en CONTRAST y el cuaderno municipal. No se utiliza como plano del Economato ni como inventario de sus salas.'),
    source('e-proyecto2019', 'Presentación de la memoria del futuro CEAM y centro de día del Economato',
           'Ayuntamiento de Sagunto',
           'https://aytosagunto.es/es/actualidad/monica-oltra-presenta-la-memoria-del-futuro-centro-especializado-de-atencion-al-mayor-y-centro-de-dia-del-economato/',
           'comunicación municipal con fotografías y recreaciones de proyecto',
           '12 de marzo: pavimento hidráulico conservado y primeras propuestas de rehabilitación.', 2019,
           'Las vistas cenitales y los interiores amueblados publicados son recreaciones de una propuesta, sin escala ni cotas; no son fotografías del edificio ni planos del estado histórico.'),
    source('e-proyecto2022', 'El Ayuntamiento finaliza el proyecto de rehabilitación del Economato',
           'Ayuntamiento de Sagunto · proyecto de Vetges Tu i Mediterrània SLP',
           'https://aytosagunto.es/es/actualidad/el-ayuntamiento-finaliza-el-proyecto-de-rehabilitacion-del-economato-para-ceam-y-centro-de-dia/',
           'descripción municipal del proyecto de rehabilitación',
           '18 de noviembre: dos plantas sobre rasante, semisótano y programa de usos previsto.', 2022,
           'Las nuevas rampas, patios, ascensor, salas y particiones se describen como proyecto. Sus imágenes son renders de propuesta, no un registro del estado ejecutado.'),
    source('e-adjudicacion2025', 'Adjudicadas las obras de rehabilitación del Antiguo Economato de AHM',
           'Ayuntamiento de Sagunto',
           'https://aytosagunto.es/es/actualidad/2025-08-22-adjudicadas-las-obras-para-la-rehabilitacion-del-antiguo-economato-de-ahm-como-ceam/',
           'comunicación municipal de contratación',
           '22 de agosto: remodelación, accesos diferenciados y dos patios centrales cubiertos previstos.', 2025,
           'La adjudicación no demuestra que el centro esté abierto. Diferencia centro de día en planta baja y CEAM en primera.'),
    source('e-obras2026', 'Progresan los trabajos de rehabilitación del antiguo Economato',
           'Ayuntamiento de Sagunto',
           'https://aytosagunto.es/es/actualidad/2026-01-20-progresan-los-trabajos-de-rehabilitacion-del-antiguo-economato-de-ahm-para-convertirlo-en-ceam-y-centro-de-dia/',
           'comunicación municipal y fotografías de obra',
           '20 de enero: obras iniciadas en diciembre de 2025 y finalización prevista en 2027.', 2026,
           'Fecha de comprobación de la obra, no fecha de apertura. La descripción periodística de plantas es ambigua; se conserva la distinción baja/primera de 2022 y 2025.'),
    source('e-fachada1959', 'Economato en servicio, fachada de 1959',
           'Archivo reproducido por CONTRAST; referencia bibliográfica Girona y Vila (1991)',
           'https://www.contrastapips.com/IHACM/IBP/Port/Port_patri_Eco_archivos/image012.gif',
           'fotografía histórica',
           'Tres frontones, paños retranqueados, pórticos, ventanas y calle.', 1959,
           'Fecha y atribución según el pie de CONTRAST. Fotografía de observación, sin escala métrica; no se redistribuye en la escena.'),
    source('e-interior2026', 'Interior del Economato durante las obras',
           'Ayuntamiento de Sagunto',
           'https://aytosagunto.es/media/s5fpappk/c3_img_6616.jpg',
           'fotografía de obra',
           'Sala con techo plano, viga longitudinal, soportes cilíndricos y carpintería de retícula.', 2026,
           'Publicada el 20 de enero. Permite reconocer elementos, no localizar con exactitud todas las salas ni reconstruir la distribución completa.'),
    source('e-trasera2026', 'Exterior posterior del Economato durante las obras',
           'Ayuntamiento de Sagunto',
           'https://aytosagunto.es/media/ncfdzzwj/c1_mini_img_6600_recort.jpg',
           'fotografía de obra',
           'Crujía baja posterior, parapeto horizontal, huecos y encuentro con nave de dos alturas.', 2026,
           'Fotografía de enero de 2026. Los escombros y las demoliciones son un estado transitorio, no la forma histórica que explica la maqueta.'),
    source('e-visita2026', 'Visita a la antigua ciudad industrial de Sagunto Puerto',
           'Felipe Garduño · crónica de una visita publicada en Titeresante',
           'https://titeresante.es/2026/11/ii-congreso-de-unima-federacion-espana-2026-sagunto-visita-a-la-antigua-ciudad-industrial-de-sagunto-puerto-por-felipe-garduno/',
           'crónica presencial de comprobación reciente',
           'Publicación de 18 de noviembre: continúa la rehabilitación del Casino y del Economato.', 2026,
           'Comprobación secundaria atribuida al visitante; no sustituye documentación técnica, actas de recepción ni un inventario contemporáneo.'),
    source('e-catastro', 'Cartografía INSPIRE de edificios de Sagunto',
           'Dirección General del Catastro',
           'https://www.catastro.hacienda.gob.es/webinspire/index.html',
           'cartografía pública',
           'Referencia 8338804YJ3983N: huellas y partes edificadas; conjunto municipal 46222.',
           note='La base cartográfica del atlas registra una actualización del conjunto el 21 de agosto de 2026. Esto no equivale a fecha de levantamiento de todos los edificios ni del interior.'),
    source('e-pnoa', 'PNOA Máxima Actualidad',
           'Instituto Geográfico Nacional',
           'https://www.ign.es/wms-inspire/pnoa-ma',
           'ortofotografía',
           'Cubiertas, parcela, jardín y relaciones con la avenida.',
           note='Se reutiliza la referencia del sector conservada en la investigación del atlas. Máxima Actualidad es el nombre del servicio, no una garantía de captura en noviembre de 2026.'),
    source('e-osm', 'Cartografía del entorno del Economato',
           'Colaboradores de OpenStreetMap',
           'https://www.openstreetmap.org/copyright',
           'cartografía colaborativa',
           'Trazado de calles y contexto urbano, contrastado con Catastro y ortofoto.',
           note='Sirve de base espacial del atlas; no define habitaciones ni certifica el acceso físico al edificio.')
]


def fact(text, *source_ids, confidence='documented'):
    return dict(text=text, sourceIds=list(source_ids), confidence=confidence)


def stop(key, label, title, region, intro, narrative, facts, look, note,
         floor=None, building='economato-edificio', section=False, interior=False):
    ids = list(dict.fromkeys(i for f in facts for i in f['sourceIds']))
    return dict(id='economato-' + key, title=title, label=label, regionId=region, period='mixed',
                intro=intro, narrative=narrative, facts=facts, lookFor=look, modelNote=note,
                sourceIds=ids, confidence='documented' if any(f['confidence'] == 'documented' for f in facts) else 'interpretive',
                coordinateConfidence='approximate',
                coordinateMethod='Posición provisional hasta el registro de los focos de la geometría final.',
                coordinate=ORIGIN.copy(), coordinates=ORIGIN.copy(),
                coordinateSourceIds=['e-catastro', 'e-pnoa', 'e-osm'], osmIds=[], readingMinutes=1,
                readingLayer=region, floor=floor, fabricStatus='mixed', recommendedMode='current',
                mapScope='interior' if floor is not None else 'recinto', requiresSection=section,
                interiorView=interior, buildingId=building)


stops = [
    stop('conjunto', 'El conjunto', 'La Cope, en el frente de la ciudad industrial', 'edificio',
         'Empieza por las tres siluetas de teja que miran a la avenida.',
         'Gira alrededor del edificio para relacionar su frente comercial con la parte posterior y el jardín.',
         [fact('La configuración principal corresponde a la ampliación de 1954.', 'e-guia2022'),
          fact('Tres naves se enlazan mediante una galería transversal.', 'e-uv')],
         'Tres frontones, dos retranqueos porticados y una trasera más baja.',
         'La maqueta explica el volumen patrimonial. No representa como acabado el CEAM proyectado ni reproduce cada fase de las obras.'),
    stop('fachada', 'Fachada', 'Un ritmo de tres frontones y dos porches', 'edificio',
         'Mira el edificio desde la acera opuesta y compara los paños que avanzan y retroceden.',
         'La luz sobre los aleros y las jambas permite reconocer la profundidad de una composición muy sobria.',
         [fact('La fotografía de 1959 documenta el frente de tres cuerpos tras la ampliación.', 'e-fachada1959'),
          fact('Sus huecos principales son rectangulares y se repiten en dos niveles.', 'e-fachada1959')],
         'La secuencia de frontón, porche, frontón, porche y frontón.',
         'Color, envejecimiento y espesores se interpretan; las fotografías históricas no ofrecen cotas.'),
    stop('portico-norte', 'Pórtico norte', 'El paso protegido entre las naves', 'edificio',
         'Acércate al porche situado hacia el Casino.',
         'Busca la sombra bajo el dintel y recorre visualmente el soporte desde el suelo hasta la cubierta.',
         [fact('Los dos pórticos ocupan los intervalos entre los tres cuerpos salientes.', 'e-contrast'),
          fact('Sus pilares presentan sección octogonal.', 'e-contrast')],
         'El fuste de ocho caras y el retranqueo del muro.',
         'La posición se ajusta a la composición documentada; alturas y distancias entre piezas son aproximadas.'),
    stop('portico-sur', 'Pórtico sur', 'Pilares sencillos para una arquitectura de servicio', 'edificio',
         'Observa el porche situado hacia Begoña.',
         'Compara su apoyo con el del otro porche y sigue la pequeña cubierta adosada al frente retranqueado.',
         [fact('CONTRAST describe pedestales octogonales con dos molduras.', 'e-contrast'),
          fact('Los capiteles tienen ocho facetas lisas y una moldura de transición.', 'e-contrast')],
         'Pedestal, fuste, capitel y dintel.',
         'El detalle se sintetiza para leerlo a escala del atlas; no es una reproducción de cantería medida.'),
    stop('nave-central', 'Nave central', 'El espacio principal de la cooperativa', 'espacios',
         'Entra en la lectura interior de la nave central.',
         'Alterna esta perspectiva con la planta alta para entender la superposición de los dos niveles.',
         [fact('La documentación universitaria describe un interior comercial comunicado.', 'e-uv'),
          fact('La fotografía de obra de 2026 muestra techo plano y una viga longitudinal.', 'e-interior2026')],
         'Continuidad espacial, soportes y luz de las ventanas.',
         'La organización interior es una aproximación didáctica. No se asigna a esta sala una sección comercial exacta sin plano histórico.',
         floor=0, interior=True),
    stop('nave-norte', 'Nave norte', 'Una de las alas del frente comercial', 'espacios',
         'Desplázate al ala próxima al Casino para comparar su anchura con la nave central.',
         'Mira desde el interior hacia la avenida y después vuelve a la fachada.',
         [fact('La fachada histórica repite ventanas rectangulares en las alas.', 'e-fachada1959'),
          fact('Los productos se organizaban por secciones dentro del edificio.', 'e-uv')],
         'La relación entre huecos exteriores y espacio interior.',
         'No se conoce con esta documentación qué productos ocupaban cada ala en cada fecha; el mobiliario y la circulación son interpretativos.',
         floor=0, interior=True),
    stop('nave-sur', 'Nave sur', 'El ala que se aproxima a Begoña', 'espacios',
         'Cruza la lectura interior hasta el extremo del edificio próximo a la iglesia.',
         'La repetición de naves ayuda a comparar el frente público y la profundidad de la parcela.',
         [fact('La cooperativa se sitúa entre el Casino y el conjunto de Begoña.', 'e-uv'),
          fact('La documentación de 2022 distingue dos plantas sobre rasante y un semisótano.', 'e-proyecto2022')],
         'La última nave, el costado y su encuentro con las dependencias posteriores.',
         'Las particiones y cotas no publicadas se simplifican. No se traslada aquí la distribución asistencial del proyecto futuro.',
         floor=0, interior=True),
    stop('galeria', 'Galería', 'El enlace transversal entre las naves', 'espacios',
         'Gira la mirada para descubrir cómo se conectan los cuerpos del edificio.',
         'Esta parada explica la continuidad del espacio y su relación con la parte posterior.',
         [fact('La galería transversal unifica las tres naves, según la ficha universitaria.', 'e-uv'),
          fact('La fotografía interior de 2026 permite reconocer soportes cilíndricos y un forjado plano.', 'e-interior2026')],
         'El cambio de dirección de la circulación y la secuencia de apoyos.',
         'La fotografía no identifica la posición de cada soporte en planta. Su disposición en la maqueta es aproximada; no se inventan cerchas vistas.',
         floor=0, interior=True),
    stop('planta-alta', 'Planta alta', 'El segundo nivel del espacio comercial', 'espacios',
         'Sube con la cámara al nivel superior.',
         'Compara la extensión del piso con la de la planta principal y las construcciones bajas de la trasera.',
         [fact('La ficha de la UV distingue una planta principal sobreelevada y un primer piso.', 'e-uv'),
          fact('El proyecto municipal describe una planta primera de menor superficie que la baja.', 'e-proyecto2022')],
         'La superposición de niveles y la relación con los huecos altos.',
         'El interior alto es una lectura espacial interpretativa. No se representa un CEAM terminado ni se afirma un recorrido real de acceso.',
         floor=1, interior=True),
    stop('cubiertas', 'Cubiertas', 'Teja inclinada y volúmenes bajos posteriores', 'construccion',
         'Eleva la vista para reconocer los tejados y la diferencia de alturas.',
         'Sigue cada cumbrera y compara la silueta principal con la crujía posterior.',
         [fact('Las tres naves del frente se cubren a dos aguas.', 'e-uv'),
          fact('La foto posterior de enero de 2026 documenta un cuerpo bajo con remate horizontal.', 'e-trasera2026')],
         'Cumbreras, aleros, cubiertas de porche y terraza o cubierta baja posterior.',
         'Pendientes y encuentros se ajustan a imágenes y cartografía. No se atribuye a la cubierta una armadura interior que no se ha documentado.'),
    stop('carpinterias', 'Carpinterías', 'Los huecos que iluminan la cooperativa', 'edificio',
         'Acércate a una ventana para reconocer el espesor del muro y la división del paño.',
         'Mira la retícula desde fuera y desde dentro para entender cómo entra la luz.',
         [fact('La fotografía interior de 2026 conserva carpinterías con montantes y travesaños.', 'e-interior2026'),
          fact('La fachada de 1959 muestra alféizares continuos en el ancho de cada hueco.', 'e-fachada1959')],
         'Retícula, dinteles y sombra de las jambas.',
         'El despiece y el color de cada carpintería se aproximan. Se evita presentar una ventana de proyecto como una pieza ya restaurada.'),
    stop('almacenes', 'Almacenes', 'La parte de servicio del Economato', 'espacios',
         'Rodea el edificio hacia las dependencias bajas.',
         'Observa la diferencia entre el frente de venta y los volúmenes vinculados al almacenamiento.',
         [fact('La guía patrimonial incluye almacén y superficies comerciales en el conjunto construido.', 'e-guia2022'),
          fact('El semisótano forma parte del edificio descrito por el proyecto municipal de 2022.', 'e-proyecto2022')],
         'Cuerpos bajos, huecos de servicio y encuentro con la plataforma posterior.',
         'El semisótano se explica desde el exterior: no se inventa una visita subterránea, un trazado exacto ni su equipamiento histórico.'),
    stop('patio', 'Espacio posterior', 'La trasera abierta hacia la Gerencia', 'entorno',
         'Sal de la lectura interior y observa el espacio libre posterior.',
         'Compara el borde construido con el jardín que prolonga la parcela.',
         [fact('La fotografía municipal de 2026 muestra el espacio exterior ante la crujía baja.', 'e-trasera2026'),
          fact('La adjudicación de 2025 prevé nuevos patios centrales cubiertos para la rehabilitación.', 'e-adjudicacion2025')],
         'La plataforma exterior, los huecos posteriores y la transición al jardín.',
         'Esta parada mira la trasera del edificio. Los patios del nuevo proyecto no se presentan como elementos históricos ni como obra finalizada.'),
    stop('cooperativa', 'La Cope', 'Un edificio para la compra cotidiana', 'memoria',
         'Vuelve al espacio comercial y piensa en su uso por las familias del Puerto.',
         'La amplitud de las salas y la repetición de huecos explican una arquitectura pensada para el abastecimiento.',
         [fact('El nombre popular Cope aparece en la documentación municipal.', 'e-pleno2011'),
          fact('El Ayuntamiento identificó pavimento de mosaico hidráulico en la presentación de 2019.', 'e-proyecto2019')],
         'Salas, pavimento y conexión entre las secciones comerciales.',
         'El dibujo de pavimento y los objetos que dan escala son interpretativos. No existe aquí un inventario completo de mostradores, mercancías o colores originales.',
         floor=0, interior=True),
    stop('seccion', 'Abrir el edificio', 'Dos plantas y una lectura por capas', 'construccion',
         'Abre la sección para relacionar la planta principal con el piso y las cubiertas.',
         'Cierra el corte para recuperar la silueta y comparar ambas formas de mirar.',
         [fact('La documentación registra dos niveles sobre rasante y un semisótano.', 'e-proyecto2022'),
          fact('En enero de 2026 la rehabilitación estaba en ejecución, con final prevista en 2027.', 'e-obras2026')],
         'Forjado entre plantas, vacíos y continuidad de los volúmenes.',
         'El corte digital es interpretativo y no equivale al estado de una demolición. Retira cubiertas y techos altos, manteniendo el forjado que separa ambas plantas.',
         floor=1, section=True),
    stop('acceso', 'Acceso y acera', 'La avenida ante los dos pórticos', 'entorno',
         'Sitúate en el paso peatonal que acompaña la fachada.',
         'La vista cercana relaciona el edificio con la altura de una persona y la anchura de la calle.',
         [fact('La planta principal se describe como sobreelevada respecto al entorno.', 'e-uv'),
          fact('El proyecto de 2022 prevé rampas y accesos adaptados al nuevo uso.', 'e-proyecto2022')],
         'Acera, zócalo, porches y cambios de nivel.',
         'La visita virtual no certifica el acceso físico durante las obras. Rampas y niveles no medidos se tratan como interpretación.',
         building=None),
    stop('entorno', 'Avenida 9 d’Octubre', 'Un frente compartido con la Gerencia', 'entorno',
         'Aléjate lo justo para leer el Economato dentro de la avenida.',
         'Observa las alineaciones y los pasos que enlazan sus edificios vecinos.',
         [fact('La cooperativa se alinea con Casino y Oficinas en la avenida Nueve de Octubre.', 'e-guia2022'),
          fact('Las calles del atlas se apoyan en cartografía contrastada con ortofotografía.', 'e-osm', 'e-pnoa', confidence='interpretive')],
         'Continuidad de aceras, frente edificado y relación con los equipamientos.',
         'Anchuras finas, mobiliario y señalización se representan de forma aproximada; la ortofoto no fecha el estado de obra de hoy.',
         building=None),
    stop('arbolado', 'Jardín posterior', 'La vegetación junto a la cooperativa', 'entorno',
         'Mira desde la trasera hacia el recinto ajardinado de la Gerencia.',
         'Compara el espacio abierto, las copas y las construcciones próximas para leer su escala.',
         [fact('La guía de 2022 sitúa detrás del Economato el extremo oriental de la ciudad jardín y los chalets G1 y G2.', 'e-guia2022'),
          fact('La agrupación del arbolado se interpreta a partir de la referencia ortofotográfica del sector.', 'e-pnoa', confidence='interpretive')],
         'Sombras, masas de copa y borde de los edificios.',
         'Especies, porte y posición individual no se presentan como inventario botánico. Se evita colocar vegetación sobre los accesos y las cubiertas.',
         building=None),
    stop('frente-urbano', 'Viviendas de la avenida', 'La escala cotidiana del entorno', 'entorno',
         'Gira hacia las viviendas situadas al otro lado de la calle.',
         'La comparación de alturas permite reconocer la singularidad del Economato sin aislarlo del barrio.',
         [fact('Las huellas y partes edificadas del contexto proceden de la cartografía de Catastro.', 'e-catastro'),
          fact('La ortofotografía ayuda a contrastar cubiertas y vacíos entre construcciones.', 'e-pnoa')],
         'Frentes continuos, cambios de altura, balcones y terrazas.',
         'Las viviendas se representan como contexto exterior. Fachadas, comercios y objetos menores sin documentación suficiente son aproximados.',
         building=None),
    stop('ciudad-factoria', 'Ciudad factoría', 'Abastecimiento, ocio y vida urbana', 'memoria',
         'Termina relacionando el Economato con Casino, Begoña y Gerencia.',
         'Cada edificio explica una parte de la vida que acompañaba a la siderurgia.',
         [fact('La Casa del Marino alojaba a tripulaciones antes de su transformación.', 'e-cuaderno2017'),
          fact('El economato ofrecía bienes básicos a la población trabajadora vinculada a las compañías.', 'e-museografia')],
         'La proximidad entre cooperativa, recinto residencial y equipamientos colectivos.',
         'El recorrido reúne edificios conservados de distintas fases. No convierte toda la escena en una restitución de un único año histórico.',
         building=None)
]

for i, s in enumerate(stops, 1):
    s['order'] = i

region_specs = [
    ('edificio', 'Fachada y pórticos', '#d4b17c', 'La composición del frente y sus detalles.'),
    ('espacios', 'Naves y dependencias', '#95bfc5', 'Lectura del interior y sus dos niveles.'),
    ('construccion', 'Cubiertas y sección', '#c79379', 'Forma del edificio y lectura por capas.'),
    ('memoria', 'Cooperativa y ciudad', '#b7a1ca', 'Abastecimiento y vida de la ciudad industrial.'),
    ('entorno', 'Avenida y jardín', '#91ae87', 'Accesos, vegetación y edificios vecinos.')
]
regions = []
for id, name, color, summary in region_specs:
    selected = [s for s in stops if s['regionId'] == id]
    regions.append(dict(id=id, name=name, aliases=[], summary=summary,
                        sourceIds=list(dict.fromkeys(i for s in selected for i in s['sourceIds'])),
                        stopIds=[s['id'] for s in selected], coordinate=ORIGIN.copy()))


def event(date, title, text, source_ids, stop_id, contemporary=False, confidence='documented'):
    return dict(id='e-t-' + str(len(timeline) + 1), date=date, title=title, text=text,
                sourceIds=source_ids, period='contemporary' if contemporary else 'industrial',
                confidence=confidence, stopId='economato-' + stop_id)


timeline = []
timeline.append(event('1912', 'La Casa del Marino', 'Una fotografía conserva su aspecto anterior a la cooperativa.', ['e-contrast'], 'conjunto'))
timeline.append(event('1917–1918', 'La adaptación como economato', 'CONTRAST y el cuaderno municipal señalan 1917; el relato museográfico utiliza 1918.', ['e-cuaderno2017', 'e-museografia'], 'ciudad-factoria', confidence='disputed'))
timeline.append(event('1928', 'La denominación de la cooperativa', 'Se adopta el nombre que reúne a empleados y obreros de las compañías siderúrgica, minera y naviera.', ['e-contrast', 'e-pleno2011'], 'cooperativa'))
timeline.append(event('1954', 'La gran ampliación', 'La reforma de AHV define la composición principal que hoy permite reconocer el edificio.', ['e-guia2022'], 'fachada'))
timeline.append(event('1990', 'Final de la actividad comercial', 'Cierra la cooperativa después de décadas de abastecimiento.', ['e-guia2022', 'e-uv'], 'cooperativa'))
timeline.append(event('2019', 'Un nuevo uso propuesto', 'Se presenta una memoria para CEAM y centro de día, con recreaciones de la intervención.', ['e-proyecto2019'], 'seccion', True))
timeline.append(event('2022', 'Proyecto de rehabilitación', 'El Ayuntamiento anuncia la finalización del proyecto arquitectónico.', ['e-proyecto2022'], 'seccion', True))
timeline.append(event('2025', 'Adjudicación e inicio de obras', 'La obra se adjudica en agosto; el comunicado posterior sitúa su inicio en diciembre.', ['e-adjudicacion2025', 'e-obras2026'], 'patio', True))
timeline.append(event('2026', 'Rehabilitación en curso', 'La información municipal de enero documenta las obras. Una crónica de visita publicada en noviembre indica que continúan.', ['e-obras2026', 'e-visita2026'], 'conjunto', True))
timeline.append(event('2027 · previsión', 'Horizonte anunciado', 'El Ayuntamiento prevé para 2027 el final de la rehabilitación. Es una previsión, no una fecha de apertura confirmada.', ['e-obras2026'], 'conjunto', True))

data = dict(
    schemaVersion=1, id='economato', title='Antiguo Economato y entorno',
    subtitle='La Cope: arquitectura, abastecimiento y ciudad industrial',
    introduction='Recorre los tres frentes y sus pórticos, entra en una lectura de las naves y compara sus plantas antes de salir a la avenida y al jardín. La maqueta combina rasgos documentados con proporciones interpretadas; no representa como terminado el nuevo CEAM.',
    researchDate=DATE, regionsLabel='Ámbitos del Economato', mapButtonLabel='Plano del Economato',
    overviewButtonLabel='Ver el conjunto', readingModeLabel='Leer el conjunto',
    readingModeNote='Cinco ámbitos de visita. Los colores orientan la lectura y no representan fases constructivas exactas.',
    timelineIntroduction='De la Casa del Marino a la rehabilitación del Economato. Las previsiones se distinguen de los hechos documentados.',
    visitAriaLabel='Visita al Antiguo Economato y su entorno', sectionOnOverview=True,
    sectionOpenLabel='Abrir sección', sectionCloseLabel='Cerrar sección',
    sectionInstructions='Abre las cubiertas y los techos altos para leer el piso superior. El forjado entre plantas permanece; recorre el nivel principal desde sus vistas interiores. Cierra la sección para recuperar la silueta exterior.',
    sectionNote='Corte digital interpretativo. Alturas, espesores y posición de soportes no proceden de un levantamiento completo; el semisótano se explica desde fuera.',
    mapInstructions='Elige una parada en las naves, el frente porticado o el entorno. Las plantas distinguen nivel principal y piso superior.',
    mapNote='Plano orientativo sobre cartografía contemporánea. La distribución interior y los focos de observación tienen precisión aproximada.',
    visitNote='Investigación revisada el 21 de noviembre de 2026. Las obras están documentadas por el Ayuntamiento en enero y una crónica presencial publicada en noviembre las describe todavía en curso. La visita virtual no acredita apertura del CEAM ni acceso físico al edificio.',
    methodology=[
        'Se contrastan documentos municipales, investigación patrimonial, fotografías fechadas, Catastro, OpenStreetMap y ortofotografía. Las dimensiones no publicadas se aproximan.',
        'El modelo sigue la composición patrimonial consolidada en 1954. Las fotografías de 1912 y 1950 explican la evolución, sin trasladar la antigua Casa del Marino al edificio posterior.',
        'Las imágenes municipales de 2019 y 2022 incluyen renders y vistas de modelos del proyecto. Se identifican como propuestas y no se confunden con fotografías del inmueble.',
        'Las fotografías reales de enero de 2026 sustentan la lectura de la crujía posterior, los forjados planos, los soportes y las carpinterías. No localizan todas las piezas ni fijan la distribución completa de las salas.',
        'Se distingue la adaptación como economato, situada en 1917 o 1918 según la fuente, de la denominación cooperativa de 1928 y de la ampliación de 1954.',
        'Los patios, rampas y salas asistenciales previstos por la rehabilitación no se presentan como ejecutados. La comprobación reciente de noviembre es una crónica de visita atribuida, no un acta de recepción.',
        'El entorno conserva las huellas y alturas cartográficas. Jardinería, pavimentos, mobiliario y fachadas sin documentación métrica se muestran como interpretación.'
    ],
    readingLegend=[dict(id=id, label=name, color=color, note=summary) for id, name, color, summary in region_specs],
    confidenceLegend=[
        dict(id='documented', label='Documentado', note='La fuente respalda el rasgo o el dato; no certifica cada medida del modelo.'),
        dict(id='interpretive', label='Interpretación', note='Aproximación de forma, dimensión, color o posición para explicar el espacio.'),
        dict(id='disputed', label='Fuentes diferentes', note='Se conserva una diferencia documental sin sustituirla por una precisión inventada.')
    ],
    materialEvidenceLegend=[
        dict(id='conserved', label='Rasgo documentado', note='Elemento reconocido en fuentes o fotografías fechadas.'),
        dict(id='rehabilitated', label='Transformación documentada', note='Cambio histórico acreditado, diferenciado del proyecto todavía en ejecución.'),
        dict(id='mixed', label='Lectura conjunta', note='Rasgos documentados y aproximaciones de representación conviven en la maqueta.')
    ],
    regions=regions, stops=stops, sources=sources, timeline=timeline,
    modelRegistration=dict(status='pending', note='Pendiente del registro con la geometría final.', precision='approximate', provisionalCoordinates=True),
    materialsModeLabel='Materiales'
)

source_ids = {s['id'] for s in sources}
stop_ids = {s['id'] for s in stops}
assert len(stops) == len(stop_ids) == 20
assert len(sources) == len(source_ids)
assert sum(len(r['stopIds']) for r in regions) == 20
for s in stops:
    assert s['floor'] in (None, 0, 1)
    assert len(s['facts']) == 2
    assert set(s['sourceIds']) <= source_ids
    assert all(set(f['sourceIds']) <= source_ids for f in s['facts'])
    assert s['requiresSection'] == (s['id'] == 'economato-seccion')
for r in regions:
    assert set(r['sourceIds']) <= source_ids and set(r['stopIds']) <= stop_ids
for t in timeline:
    assert set(t['sourceIds']) <= source_ids and t['stopId'] in stop_ids

OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
print(f'Wrote {OUT}: {len(stops)} stops, {sum(len(s["facts"]) for s in stops)} facts, {len(sources)} sources.')
