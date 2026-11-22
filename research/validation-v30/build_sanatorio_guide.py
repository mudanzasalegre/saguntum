"""Build the documentary guide before the final scene registers its coordinates.

This file deliberately refuses to replace a registered guide. Registration belongs
to the integration pass, which has the implemented camera and model geometry.
"""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / 'dist/assets/data/sanatorio-visit.json'
if OUTPUT.exists():
    existing = json.loads(OUTPUT.read_text())
    if existing.get('modelRegistration', {}).get('status') == 'registered':
        raise SystemExit('Refusing to overwrite the registered Sanatorio guide. Edit explicitly after integration.')

DATE = '2026-11-21'
ORIGIN = [-0.2287491, 39.6642851]
SOURCES = []


def source(id, title, author, url, type, locator, note, year=None):
    SOURCES.append(dict(id=id, title=title, author=author, url=url, type=type,
                        locator=locator, year=year, note=note, accessed=DATE))


source('s-contrast', 'Antiguo Sanatorio de AHV', 'CONTRAST / APIPS',
       'https://www.contrastapips.com/IHACM/IBP/Port/Port_patri_sana.htm',
       'estudio patrimonial con fotografías y plano histórico',
       'Apartados de arquitectura, jardines, edificios auxiliares e interior; fotografías históricas y contemporáneas.',
       'Las imágenes permiten contrastar formas y transformaciones. No aportan un levantamiento métrico completo del edificio actual.')
source('s-plano', 'Fragmento de la planta baja histórica del Sanatorio', 'Archivo histórico reproducido por CONTRAST / APIPS',
       'https://www.contrastapips.com/IHACM/IBP/Port/Port_patri_sana_archivos/image044.jpg',
       'reproducción fotográfica de un plano histórico',
       'Fragmento central: hall, escalera, antecapilla, capilla, sacristía y dependencias de servicio.',
       'Se lee la organización y varios rótulos. La reproducción está recortada; no ofrece una escala legible ni la totalidad de ambas plantas.')
source('s-foto1949', 'Fachada del Sanatorio en 1949', 'Archivo histórico reproducido por CONTRAST / APIPS',
       'https://www.contrastapips.com/IHACM/IBP/Port/Port_patri_sana_archivos/image034.jpg',
       'fotografía histórica',
       'Vista frontal: accesos contiguos, pórtico lateral y remate de la terraza.',
       'La fotografía documenta una fase histórica. El remate de acceso a la terraza que aparece en ella no se restituye en el exterior actual.', 1949)
source('s-jardin', 'Fuente del jardín occidental', 'CONTRAST / APIPS',
       'https://www.contrastapips.com/IHACM/IBP/Port/Port_patri_sana_archivos/image018.jpg',
       'fotografía del conjunto',
       'Vaso oval y composición de copas, con el edificio principal al fondo.',
       'La silueta visible orienta el modelo. No se dispone de una sección acotada de la fuente.')
source('s-pabellon', 'Pabellón asistencial del recinto', 'CONTRAST / APIPS',
       'https://www.contrastapips.com/IHACM/IBP/Port/Port_patri_sana_archivos/image032.jpg',
       'fotografía arquitectónica',
       'Fachada de ladrillo, porche de acceso y remates piramidales.',
       'Documenta este pabellón concreto; no convierte todas las construcciones auxiliares en edificios idénticos.')
source('s-chalets', 'Chalet del sector oriental del Sanatorio', 'CONTRAST / APIPS',
       'https://www.contrastapips.com/IHACM/IBP/Port/Port_patri_sana_archivos/image036.jpg',
       'fotografía arquitectónica',
       'Mirador poligonal, zócalo elevado y porche cubierto; contrastado con las imágenes 037 y 038 de la misma serie.',
       'Se usa para reconocer el tipo exterior. No acredita una distribución interior actual.')
source('s-guia2022', 'Itinerario didáctico por el patrimonio industrial del Puerto de Sagunto', 'APIPS / CONTRAST',
       'https://www.apips.es/assets/files/CUADERNO_TP01.pdf',
       'guía patrimonial y plano botánico',
       'Páginas impresas y PDF 43–44: Sanatorio y plano con 37 especies vegetales.',
       'La guía de 2022 distingue edificio, tres chalets, dos puntos de asistencia ambulatoria y jardín. El plano botánico no es un inventario actualizado a 2026.', 2022)
source('s-archivo', 'Inventario fotográfico del Archivo Industrial · Placas digitalizadas', 'Ayuntamiento de Sagunto / Archivo Industrial',
       'https://aytosagunto.es/media/ek0gqher/inventario-fotografico-archivo-industrial-placas-digit.pdf',
       'inventario municipal de fotografías históricas',
       'Códigos 44, 232–244, 250–252, 393, 399–400, 407, 416, 925, 939, 959 y 975–979.',
       'Las fechas y títulos acreditan obras, terraza, rampa, pérgola, cierre y estanque. El índice no proporciona medidas ni sustituye la inspección de cada placa.')
source('s-fundacio', 'Mediateca · Sanatorio de Altos Hornos de Vizcaya', 'Fundació de la Comunitat Valenciana de Patrimoni Industrial i Memòria Obrera de Port de Sagunt',
       'https://www.fundacioportdesagunt.com/mediateca-cast/',
       'archivo patrimonial institucional',
       'Serie Sanatorio: construcción, jardín, capilla, instalaciones y espacios asistenciales.',
       'La institución sitúa el servicio sanitario entre 1949 y 1985. Las fotografías de quirófano y maternidad acreditan usos históricos, pero no una planta completa georreferenciada.')
source('s-centrocivico', 'Guía de instalaciones del Centro Cívico', 'Ayuntamiento de Sagunto',
       'https://aytosagunto.es/es/ayuntamiento/areas-y-servicios/bibliotecas/guia-de-instalaciones-del-centro-civico/',
       'información municipal del equipamiento',
       'Fichas de biblioteca, salón de actos, sala de exposiciones y otros espacios.',
       'Documenta el uso cívico contemporáneo, distinto de la distribución sanitaria histórica.')
source('s-biblioteca', 'Sala de adultos de la biblioteca del Centro Cívico', 'Ayuntamiento de Sagunto',
       'https://aytosagunto.es/es/ayuntamiento/areas-y-servicios/bibliotecas/guia-de-instalaciones-del-centro-civico/sala-adultos-biblioteca/',
       'ficha municipal de instalaciones',
       'La ficha sitúa la sala de adultos en la primera planta.',
       'Confirma la transformación de los usos interiores. No se utiliza para completar zonas ilegibles del plano histórico.')
source('s-archivo2025', 'El Centro Cívico albergará definitivamente el Archivo Industrial', 'Ayuntamiento de Sagunto',
       'https://aytosagunto.es/es/actualidad/2025-04-22-el-centro-civico-albergara-definitivamente-el-archivo-industrial/',
       'anuncio municipal',
       'Noticia de 22 de abril de 2025 sobre el destino permanente del Archivo Industrial.',
       'Es un anuncio de destino y acondicionamiento; no se presenta como prueba de apertura pública del archivo en esa fecha.', 2025)
source('s-consulta2025', 'Consulta del fondo de la Compañía Minera de Sierra Menera', 'Ayuntamiento de Sagunto',
       'https://aytosagunto.es/es/actualidad/2025-10-30-la-ciudadania-podra-consultar-el-fondo-documental-de-la-compania-minera-de-sierra-menera-a-partir-de-este-jueves/',
       'noticia municipal sobre consulta documental',
       'Noticia de 30 de octubre de 2025: consulta del fondo CMSM y estado del proyecto de adecuación.',
       'Distingue la consulta del fondo CMSM del proyecto para alojar el Archivo Industrial en el Centro Cívico.', 2025)
source('s-dau2025', 'Finalizamos las obras en el Centro Cívico Antiguo Sanatorio', 'DAU Arquitectos',
       'https://www.dauarquitectosvalencia.es/noticias/finalizamos-las-obras-en-el-centro-civico-antiguo-sanatorio',
       'documentación del equipo responsable de una intervención',
       'Publicación de 21 de marzo de 2025 sobre la recuperación de espacios del Centro Cívico.',
       'Describe una intervención contemporánea, no el proyecto de 1949 ni un levantamiento completo del antiguo hospital.', 2025)
source('s-mice2026', 'Catálogo de espacios y recursos MICE de Sagunto', 'Sagunto Turismo / Ayuntamiento de Sagunto',
       'https://www.saguntoturismo.com/sagunto/uploaded/PDFs/CATALOGOMICE.pdf',
       'catálogo municipal de equipamientos',
       'Página PDF 21: Centro Cívico, Jardines del Antiguo Sanatorio s/n.',
       'El catálogo publicado en 2026 acredita la función cultural municipal. No informa sobre la disposición clínica original.', 2026)
source('s-social2023', 'Plan estratégico zonal 2023–2026', 'Ayuntamiento de Sagunto',
       'https://aytosagunto.es/media/vnvk1uam/03-plan_estrategico_zonal_2023-2026_-_sefycu_3886743.pdf',
       'plan municipal de servicios sociales',
       'Página impresa 95: Centro Cívico, calle Doctor Fleming 2.',
       'La dirección y los servicios pertenecen al documento de planificación; no describen los accesos sanitarios de 1949.', 2023)
source('s-catastro', 'Cartografía INSPIRE de edificios de Sagunto', 'Dirección General del Catastro',
       'https://www.catastro.hacienda.gob.es/webinspire/index.html',
       'cartografía pública',
       'Conjunto municipal 46222: huellas y partes edificadas del Sanatorio y de las manzanas próximas.',
       'Las partes catastrales no equivalen a habitaciones ni a un recuento histórico de pabellones. Las alturas sin levantamiento conservan precisión aproximada.')
source('s-pnoa', 'PNOA Máxima Actualidad · Antiguo Sanatorio y entorno', 'Instituto Geográfico Nacional',
       'https://www.ign.es/wms-inspire/pnoa-ma',
       'ortofotografía',
       'Contraste de cubiertas, espacios libres, caminos y masas vegetales del recinto.',
       'Máxima Actualidad es el nombre del servicio: la fecha de consulta no es la fecha de vuelo. La imagen no permite reconocer interiores ni todas las especies vegetales.')
source('s-osm', 'Cartografía del Antiguo Sanatorio y su entorno urbano', 'Colaboradores de OpenStreetMap',
       'https://www.openstreetmap.org/#map=18/39.66429/-0.22875',
       'cartografía colaborativa',
       'Ejes y nombres viarios: avenida Hispanidad, Doctor Fleming y calles próximas.',
       'Los trazados se contrastan con PNOA y cartografía catastral. Los anchos dibujados y el mobiliario son aproximaciones para la lectura urbana.')

LAYERS = [
    dict(id='edificio', label='El conjunto asistencial', color='#d4b17c', note='Edificio principal, pórtico, pabellones y viviendas de médicos.'),
    dict(id='espacios', label='Interior histórico', color='#95bfc5', note='Un fragmento documentado de la planta baja: vestíbulo, capilla, sacristía y escalera.'),
    dict(id='construccion', label='Accesos y cubiertas', color='#c79379', note='Rampa, terraza, tejados y sección del cuerpo central.'),
    dict(id='memoria', label='Jardines y memoria', color='#b7a1ca', note='Fuente, vegetación y transformación del antiguo equipamiento industrial.'),
    dict(id='entorno', label='La ciudad alrededor', color='#91ae87', note='Calles, accesos urbanos y edificios próximos en su configuración contemporánea.'),
]
STOPS = []


def fact(text, ids, confidence='documented'):
    return dict(text=text, sourceIds=ids, confidence=confidence)


def stop(key, label, title, layer, intro, narrative, facts, look, note,
         confidence='documented', interior=False, section=False, period='mixed', extra_sources=()):
    ids = list(dict.fromkeys([source for item in facts for source in item['sourceIds']] + list(extra_sources)))
    STOPS.append(dict(
        id='sanatorio-' + key, label=label, title=title, regionId=layer, period=period,
        intro=intro, narrative=narrative, facts=facts, lookFor=look, modelNote=note,
        sourceIds=ids, confidence=confidence, coordinateConfidence='approximate',
        coordinateMethod='Coordenada provisional del conjunto; pendiente de registrar con el foco y la geometría final del modelo.',
        coordinate=ORIGIN.copy(), coordinates=ORIGIN.copy(),
        coordinateSourceIds=['s-catastro', 's-pnoa', 's-osm'], osmIds=[], readingMinutes=1,
        readingLayer=layer, floor=0 if interior or section else None,
        fabricStatus='mixed', recommendedMode='current',
        mapScope='interior' if interior or section else 'entorno' if layer == 'entorno' else 'recinto',
        requiresSection=section, interiorView=interior,
        buildingId='sanatorio-principal' if interior or section else None,
        order=len(STOPS) + 1,
    ))


stop('conjunto', 'El conjunto', 'Del Sanatorio al Centro Cívico', 'edificio',
     'Reconoce el edificio en T y los jardines que lo rodean.',
     'La vista general permite relacionar la fachada principal, el brazo oriental y los edificios menores antes de entrar en el fragmento histórico.',
     [fact('El Sanatorio entró en servicio en diciembre de 1949.', ['s-guia2022']),
      fact('La Fundació sitúa el final de su actividad sanitaria en 1985.', ['s-fundacio'])],
     'La diferencia de escala entre el cuerpo principal y las construcciones del jardín.',
     'El exterior se lee sobre cartografía contemporánea. La sección abre únicamente un fragmento histórico del cuerpo central; no recrea todo el hospital.')

stop('fachada', 'Fachada principal', 'Tres accesos y una fachada asimétrica', 'edificio',
     'Acércate al ritmo de los huecos y a la línea de cornisa.',
     'Recorre visualmente los accesos contiguos del centro y después el extremo del pórtico. La lectura frontal ayuda a reconocer la composición.',
     [fact('La fotografía de 1949 muestra tres accesos principales contiguos en el cuerpo central.', ['s-foto1949']),
      fact('La cornisa de ladrillo y los remates semicirculares de esos huecos concentran la ornamentación.', ['s-contrast'])],
     'Ventanas superiores en arco, accesos del centro y continuidad de la cornisa.',
     'El ritmo se interpreta desde las imágenes. Espesores, alturas y acabados no levantados se aproximan; no se dispersan las tres puertas por alas distintas.')

stop('portico', 'Pórtico lateral', 'El umbral cubierto', 'edificio',
     'Observa el cambio de profundidad al llegar al pórtico.',
     'La sombra del espacio cubierto hace legible la transición entre jardín y edificio. Mueve la cámara para apreciar sus soportes y el encuentro con la fachada.',
     [fact('El pórtico lateral ya aparece en la vista frontal de 1949.', ['s-foto1949']),
      fact('Las imágenes documentan soportes de ladrillo con capiteles sencillos.', ['s-contrast'])],
     'Soportes, coronación y sombra bajo la cubierta.',
     'La forma exterior sigue la evidencia fotográfica; el número de piezas, sus juntas y las medidas menores son aproximaciones visuales.')

stop('accesos', 'Rampa y entradas', 'Entrar desde el jardín', 'construccion',
     'Sigue la relación entre la cota del jardín y las puertas principales.',
     'El recorrido cercano permite entender el zócalo y la llegada a los tres accesos del bloque central.',
     [fact('El archivo municipal registra la rampa del Sanatorio en julio y agosto de 1949.', ['s-archivo']),
      fact('Las fotografías muestran el edificio sobre un zócalo elevado respecto al jardín.', ['s-contrast', 's-foto1949'])],
     'La plataforma elevada y el recorrido junto a los accesos.',
     'Pendientes y cotas se adaptan a la maqueta; no son una medición ni una certificación del itinerario accesible actual.')

stop('vestibulo', 'Vestíbulo histórico', 'El hall como distribuidor', 'espacios',
     'Entra en la lectura histórica del núcleo central.',
     'Desde el hall puedes relacionar la escalera y el paso hacia la capilla. El espacio se ofrece como una interpretación del plano conservado.',
     [fact('El fragmento de planta baja rotula un hall junto a la escalera principal.', ['s-plano']),
      fact('En su entorno aparecen administración, sala de médicos y un montacamillas.', ['s-plano'])],
     'Los pasos entre el vestíbulo, la escalera y la antecapilla.',
     'Se modela un fragmento histórico, no la distribución actual del Centro Cívico. Alturas, carpinterías interiores y mobiliario son interpretativos.',
     confidence='interpretive', interior=True, period='industrial')

stop('capilla', 'Capilla histórica', 'Un espacio de recogimiento', 'espacios',
     'Reconoce el eje de la capilla y su cabecera curva.',
     'La vista interior y la sección superior permiten leer el espacio sin completar las zonas del hospital que quedan fuera del plano disponible.',
     [fact('La planta histórica distingue antecapilla y capilla con cabecera curva.', ['s-plano']),
      fact('Las religiosas trinitarias y los pacientes compartían la capilla de la planta baja.', ['s-guia2022'])],
     'Antecapilla, nave y transición hacia la cabecera.',
     'El trazado se apoya en el plano; los detalles de alzado y el mobiliario son una interpretación histórica, no una inspección del interior actual.',
     confidence='interpretive', interior=True, period='industrial')

stop('sacristia', 'Sacristía histórica', 'La estancia tras la cabecera', 'espacios',
     'Explora la relación entre la capilla y su espacio de servicio.',
     'La escala próxima hace visible cómo una estancia pequeña se integra en el núcleo central de la planta.',
     [fact('El plano sitúa y rotula la sacristía detrás de la cabecera de la capilla.', ['s-plano']),
      fact('La reproducción consultada es un fragmento y no contiene una escala legible.', ['s-plano'])],
     'El encuentro de la estancia con la cabecera y los muros que la delimitan.',
     'La relación espacial está documentada; las dimensiones adaptadas a la huella, alturas y accesorios no son medidas históricas verificadas.',
     confidence='interpretive', interior=True, period='industrial')

stop('escalera', 'Escalera histórica', 'La conexión entre plantas', 'espacios',
     'Mira el giro de la escalera desde el vestíbulo.',
     'La maqueta traduce el trazado visible en planta a una forma tridimensional para explicar la circulación del núcleo central.',
     [fact('El dibujo histórico muestra una escalera de trazado curvo junto al hall.', ['s-plano']),
      fact('El mismo fragmento distingue montacamillas y montacomidas como instalaciones separadas.', ['s-plano'])],
     'El arranque, el giro y la conexión con el hall.',
     'No se ha localizado una sección acotada ni una fotografía específica de esta escalera. Peldaños, barandilla y desarrollo vertical son interpretativos.',
     confidence='interpretive', interior=True, period='industrial')

stop('terraza', 'Terraza', 'Una cubierta que también se habitaba', 'construccion',
     'Asciende para leer los cambios de nivel del cuerpo principal.',
     'La terraza permite comparar el perfil actual con las imágenes históricas sin superponer elementos desaparecidos.',
     [fact('El inventario municipal fecha una vista de la terraza del Sanatorio el 10 de febrero de 1949.', ['s-archivo']),
      fact('La fotografía de 1949 conserva un remate de acceso a la terraza que posteriormente desapareció.', ['s-foto1949', 's-contrast'])],
     'El plano de terraza y su encuentro con los cuerpos de cubierta inclinada.',
     'El remate histórico con pináculos se explica en la guía, pero no se añade como si siguiera presente en el exterior contemporáneo.')

stop('cubiertas', 'Cubiertas', 'La silueta del edificio en T', 'construccion',
     'Rodea el edificio desde arriba para separar sus volúmenes.',
     'La alternancia de planos de cubierta ayuda a reconocer el cuerpo longitudinal y el brazo oriental.',
     [fact('Las vistas del conjunto muestran cubiertas distintas en los cuerpos que forman la T.', ['s-contrast']),
      fact('La ortofotografía permite contrastar sus huellas y los encuentros de cubierta actuales.', ['s-pnoa'])],
     'Cumbreras, aleros, terraza y la dirección del brazo oriental.',
     'Se conservan las huellas cartográficas. Pendientes, alturas menores, tejas y bajantes sin levantamiento se aproximan.',
     extra_sources=('s-catastro',))

stop('jardin-occidental', 'Jardín occidental', 'El jardín ante la fachada', 'memoria',
     'Sigue el eje entre el edificio y la fuente.',
     'Mira los vacíos de los caminos y la relación entre árboles, parterres y fachada. El jardín se entiende mejor desde su recorrido que como una masa uniforme.',
     [fact('La fotografía histórica del jardín occidental muestra parterres de trazado geométrico.', ['s-guia2022']),
      fact('El archivo registra una pérgola del jardín el 3 de agosto de 1949.', ['s-archivo'])],
     'El eje visual, los claros del jardín y los bordes de los caminos.',
     'La referencia histórica explica el diseño; la vegetación y los caminos se contrastan con la imagen aérea contemporánea. La mención de una pérgola no acredita que toda su fábrica original sobreviva.',
     extra_sources=('s-pnoa',))

stop('fuente', 'La fuente', 'El centro del jardín occidental', 'memoria',
     'Baja hasta el vaso y observa la composición desde varios ángulos.',
     'El agua y la forma baja del vaso dejan visible la fachada detrás. La fuente funciona como referencia del recorrido por el jardín.',
     [fact('La fotografía muestra un vaso oval y una composición de tres copas de distinta presencia.', ['s-jardin']),
      fact('El archivo registra un estanque en agosto de 1949 y una fuente del estanque en junio de 1952.', ['s-archivo'])],
     'El borde oval, la copa central y la relación con la fachada.',
     'La geometría sigue la silueta fotográfica; dimensiones, funcionamiento del agua y desgaste son interpretativos. Las dos fechas no se convierten en una fecha única de terminación.')

stop('jardin-oriental', 'Jardín oriental', 'Árboles, caminos y pabellones', 'memoria',
     'Descubre el jardín situado detrás del cuerpo principal.',
     'Avanza entre los caminos para relacionar el arbolado y las construcciones menores. Las copas se representan con variedad sin atribuir una identificación botánica a cada árbol.',
     [fact('La guía botánica de 2022 localiza 37 especies vegetales en el conjunto de los jardines.', ['s-guia2022']),
      fact('Su plano sitúa los edificios auxiliares entre caminos y parterres del sector oriental.', ['s-guia2022'])],
     'Las diferencias de porte y los claros que conectan los edificios.',
     'El inventario de 2022 es una referencia histórica cercana, no un censo de árboles vivos en 2026. Posiciones y especies del modelo tienen precisión aproximada.',
     extra_sources=('s-pnoa',))

stop('pabellones', 'Pabellones', 'La atención en edificios menores', 'edificio',
     'Compara el tamaño de los pabellones con el edificio principal.',
     'Los cambios de material y cubierta hacen legible la diversidad del recinto. Rodea cada volumen para apreciar sus accesos y su relación con el jardín.',
     [fact('La guía identifica dos puntos de asistencia ambulatoria entre las construcciones del sector oriental.', ['s-guia2022']),
      fact('La fotografía de uno de ellos documenta ladrillo visto, porche y remates piramidales.', ['s-pabellon'])],
     'Porche, paños de ladrillo y remates de cubierta.',
     'La publicación de 2022 cuenta nueve construcciones auxiliares. Ese recuento no equivale al de partes catastrales, y no se extrapola el aspecto de un pabellón a todos los anexos.')

stop('chalets', 'Chalets de médicos', 'Viviendas dentro del recinto', 'edificio',
     'Acércate al extremo oriental y reconoce la escala doméstica.',
     'La diferencia entre una vivienda y un pabellón asistencial se lee en sus porches, miradores y volúmenes.',
     [fact('La guía documenta tres chalets destinados a facultativos en el sector oriental.', ['s-guia2022']),
      fact('Las fotografías muestran miradores poligonales y entradas cubiertas sobre zócalos elevados.', ['s-chalets'])],
     'Los miradores, porches y pequeños cuerpos de cubierta.',
     'Los exteriores se interpretan desde fotografías y huellas actuales; no se reconstruyen distribuciones privadas o usos interiores que las fuentes no permiten conocer.',
     extra_sources=('s-catastro', 's-pnoa'))

stop('accesos-urbanos', 'Llegar al recinto', 'Del espacio público al jardín', 'entorno',
     'Sitúa los accesos en la trama urbana actual.',
     'La vista exterior relaciona aceras, bordes del recinto y caminos interiores para que la visita no quede aislada de la ciudad.',
     [fact('El catálogo municipal identifica el Centro Cívico en Jardines del Antiguo Sanatorio s/n.', ['s-mice2026']),
      fact('El plano de 2022 sitúa el recinto entre Hispanidad, Doctor Fleming y Periodista Azzati.', ['s-guia2022'])],
     'La continuidad de los recorridos peatonales y los límites del jardín.',
     'La escena utiliza cartografía contemporánea. Posición de cámaras, anchos, mobiliario y detalle del cierre son aproximados; no reproduce automáticamente todos los accesos históricos.',
     extra_sources=('s-osm', 's-pnoa'))

stop('hispanidad', 'Avenida Hispanidad', 'El frente norte del recinto', 'entorno',
     'Observa el Sanatorio desde la avenida.',
     'La distancia de la calle permite leer juntos arbolado, fachadas y volumen principal. El contexto conserva la ciudad que hoy rodea al jardín.',
     [fact('La avenida Hispanidad figura junto al borde norte del recinto en el plano botánico.', ['s-guia2022']),
      fact('La cartografía viaria contemporánea mantiene este eje como referencia del entorno.', ['s-osm'])],
     'Aceras, bandas verdes y relación entre la avenida y el jardín.',
     'Se muestran trazados actuales. Arbolado exterior y mobiliario se ajustan a la lectura aérea; no se les asignan especies históricas sin evidencia.',
     extra_sources=('s-pnoa',))

stop('fleming', 'Doctor Fleming', 'La calle que acompaña el jardín', 'entorno',
     'Recorre el borde occidental y meridional del conjunto.',
     'Esta perspectiva permite comprobar cómo el jardín amortigua la relación entre el edificio principal y los frentes urbanos próximos.',
     [fact('El plano del jardín rotula la calle Doctor Fleming a lo largo de su borde oblicuo.', ['s-guia2022']),
      fact('El plan municipal 2023–2026 sitúa servicios del Centro Cívico en Doctor Fleming 2.', ['s-social2023'])],
     'El borde oblicuo, los cruces de caminos y la distancia entre fachadas.',
     'La dirección corresponde al equipamiento municipal contemporáneo; no identifica por sí sola una entrada clínica de 1949.',
     extra_sources=('s-osm', 's-pnoa'))

stop('frente-urbano', 'Edificios próximos', 'La ciudad frente al jardín', 'entorno',
     'Aléjate lo suficiente para comparar las manzanas y el recinto.',
     'Las alturas y fachadas vecinas ofrecen una escala urbana para entender la amplitud del jardín.',
     [fact('La cartografía catastral registra las huellas y partes de los edificios vecinos.', ['s-catastro']),
      fact('PNOA permite contrastar cubiertas, patios y vegetación visibles desde arriba.', ['s-pnoa'])],
     'Alineaciones, patios y transiciones entre las distintas alturas.',
     'Las huellas provienen de cartografía pública; ventanas, balcones, materiales y alturas no verificadas se aproximan. No son levantamientos individuales de cada fachada.',
     confidence='interpretive', extra_sources=('s-osm',))

stop('ciudad-factoria', 'Memoria y ciudad', 'Un equipamiento que cambia de uso', 'memoria',
     'Relaciona el recinto con la memoria del Puerto industrial.',
     'El antiguo servicio de empresa forma hoy parte de la vida cívica. Esta parada enlaza el edificio con sus transformaciones y con el conjunto del atlas.',
     [fact('El catálogo municipal de 2026 presenta el Centro Cívico como un espacio cultural de titularidad municipal.', ['s-mice2026']),
      fact('Desde el 30 de octubre de 2025 puede consultarse el fondo de la Compañía Minera de Sierra Menera; la adecuación del Centro Cívico seguía en proyecto.', ['s-consulta2025'])],
     'La permanencia del edificio y el jardín dentro de una ciudad transformada.',
     'La consulta del fondo se canaliza por el Archivo Municipal. Esta consulta no se convierte en prueba de apertura del Archivo Industrial en el Sanatorio. La visita no reconstruye naranjales históricos sobre calles actuales.')

stop('seccion', 'Abrir la planta histórica', 'Leer el núcleo central desde arriba', 'construccion',
     'Abre el cuerpo central para relacionar sus espacios históricos.',
     'La sección permite leer el hall, la escalera y la secuencia de la capilla antes de entrar en cada estancia. Cierra la sección para recuperar el volumen exterior.',
     [fact('El plano disponible muestra un fragmento de la planta baja, no la distribución completa del hospital.', ['s-plano']),
      fact('La información municipal actual sitúa una biblioteca en la primera planta del Centro Cívico.', ['s-biblioteca'])],
     'La continuidad entre vestíbulo, antecapilla, capilla y sacristía.',
     'Reconstrucción histórica parcial del núcleo central. La sección retira su planta alta, forjado y cubierta; conserva cerradas las alas. No representa la distribución actual ni inventa quirófanos, maternidad o salas ilegibles.',
     confidence='interpretive', section=True, period='industrial', extra_sources=('s-dau2025',))

TIMELINE = [
    ('1945', 'La decisión de construir', 'AHV decide crear un nuevo Sanatorio para atender a la población del Puerto y a su personal.', ['s-guia2022'], 'industrial', 'conjunto'),
    ('Diciembre de 1949', 'Comienza el servicio', 'El edificio entra en funcionamiento después de las obras documentadas en el archivo fotográfico.', ['s-guia2022', 's-archivo'], 'industrial', 'fachada'),
    ('1985', 'Fin de la actividad sanitaria', 'La Fundació sitúa en este año el final del servicio sanitario; el recinto tendrá después nuevos usos.', ['s-fundacio'], 'contemporary', 'ciudad-factoria'),
    ('2022', 'Leer el jardín', 'La guía de patrimonio industrial publica un plano botánico con 37 especies del conjunto.', ['s-guia2022'], 'contemporary', 'jardin-oriental'),
    ('21 de marzo de 2025', 'Una intervención contemporánea', 'DAU Arquitectos publica la finalización de obras de recuperación de espacios en el Centro Cívico.', ['s-dau2025'], 'contemporary', 'seccion'),
    ('22 de abril de 2025', 'Destino para el Archivo Industrial', 'El Ayuntamiento anuncia que el Centro Cívico alojará definitivamente el archivo.', ['s-archivo2025'], 'contemporary', 'ciudad-factoria'),
    ('30 de octubre de 2025', 'Consulta del fondo Sierra Menera', 'Se habilita la consulta del fondo CMSM mientras sigue en redacción el proyecto de adaptación del Centro Cívico.', ['s-consulta2025'], 'contemporary', 'ciudad-factoria'),
    ('2026', 'Equipamiento cultural municipal', 'El catálogo de espacios de Sagunto incluye el Centro Cívico y sus jardines.', ['s-mice2026'], 'contemporary', 'accesos-urbanos'),
]

guide = dict(
    schemaVersion=1, id='sanatorio', title='Antiguo Sanatorio y jardines',
    subtitle='Arquitectura asistencial, jardín y memoria del Puerto',
    introduction='Recorre el edificio, sus jardines y el entorno urbano. Abre un fragmento de su planta baja histórica para explorar vestíbulo, capilla, sacristía y escalera, y descubre cómo el antiguo Sanatorio se convirtió en Centro Cívico.',
    researchDate=DATE, regionsLabel='Ámbitos del Sanatorio', mapButtonLabel='Plano del recinto',
    overviewButtonLabel='Ver el conjunto', readingModeLabel='Leer el Sanatorio',
    readingModeNote='Cinco ámbitos para relacionar edificio, interior histórico, jardín y ciudad. Los colores orientan la visita; no son fases constructivas exactas.',
    timelineIntroduction='De la construcción del Sanatorio a su vida como equipamiento municipal.',
    visitAriaLabel='Visita al Antiguo Sanatorio y sus jardines', sectionOnOverview=False,
    sectionOpenLabel='Abrir la planta histórica', sectionCloseLabel='Cerrar la sección',
    sectionInstructions='Abre la sección del cuerpo central para leer el fragmento histórico de la planta baja. Elige el vestíbulo, la capilla, la sacristía o la escalera para acercarte. Las alas se conservan cerradas.',
    sectionNote='Reconstrucción histórica parcial basada en un fragmento de plano sin escala legible. No representa la distribución actual del Centro Cívico. Alturas, carpinterías y mobiliario interiores son interpretativos.',
    mapInstructions='Elige una parada en el edificio, los jardines o las calles próximas. Cambia a la planta baja histórica para relacionar sus espacios antes de entrar.',
    mapNote='Plano orientativo sobre cartografía contemporánea. La adaptación del fragmento histórico y los puntos de observación tienen precisión aproximada.',
    visitNote='Investigación revisada el 21 de noviembre de 2026. La escena distingue la memoria sanitaria del edificio y sus usos cívicos contemporáneos; el interior histórico no es una reproducción del equipamiento actual.',
    methodology=[
        'Se comparan fotografías históricas y contemporáneas, un fragmento de planta baja, el inventario fotográfico municipal, documentación del Centro Cívico y cartografía pública.',
        'Las huellas del exterior proceden de cartografía contemporánea y se contrastan con PNOA. Alturas y detalles sin medición se aproximan.',
        'El plano histórico permite identificar hall, escalera, antecapilla, capilla y sacristía. La reproducción está recortada y no ofrece escala legible; no se deduce una planta clínica completa.',
        'La sección muestra únicamente el núcleo central de la planta baja histórica. Su adaptación geométrica, alzados interiores, carpinterías y mobiliario son interpretativos.',
        'Se distingue el jardín documentado en 2022 de una inspección botánica actual. Las 37 especies de la publicación no equivalen a 37 ejemplares ni a un inventario vivo de 2026.',
        'Tres chalets y dos puntos ambulatorios son funciones documentadas. Nueve construcciones auxiliares en una publicación y las partes catastrales son recuentos de naturaleza distinta.',
        'La consulta pública del fondo CMSM desde octubre de 2025 se distingue del proyecto de instalación del Archivo Industrial en el Sanatorio, todavía en redacción en esa noticia.',
        'El tomo municipal de 217 páginas consultado para el Barrio Obrero no aporta una ficha ni un levantamiento del Sanatorio; no se le atribuyen las medidas de esta escena.',
    ],
    readingLegend=LAYERS,
    confidenceLegend=[
        dict(id='documented', label='Documentado', note='La fuente respalda el rasgo o el dato, no todas las medidas de su representación.'),
        dict(id='interpretive', label='Interpretación', note='Aproximación de forma, altura, material o uso para hacer comprensible el espacio.'),
        dict(id='disputed', label='Fuentes diferentes', note='Se mantiene visible una diferencia documental sin convertirla en una certeza.'),
    ],
    materialEvidenceLegend=[
        dict(id='conserved', label='Rasgo documentado', note='Forma reconocible en fotografías, plano o cartografía.'),
        dict(id='rehabilitated', label='Transformación documentada', note='Adaptación o cambio de uso que forma parte de la historia del edificio.'),
        dict(id='mixed', label='Lectura conjunta', note='Evidencia documental y aproximaciones de representación conviven en la maqueta.'),
    ],
    regions=[dict(id=layer['id'], name=layer['label'], aliases=[], summary=layer['note'],
                  sourceIds=list(dict.fromkeys(sid for item in STOPS if item['regionId'] == layer['id'] for sid in item['sourceIds'])),
                  stopIds=[item['id'] for item in STOPS if item['regionId'] == layer['id']], coordinate=ORIGIN.copy()) for layer in LAYERS],
    timeline=[dict(id=f's-t-{index}', date=date, title=title, text=text, sourceIds=ids,
                   period=period, confidence='documented', stopId='sanatorio-' + key)
              for index, (date, title, text, ids, period, key) in enumerate(TIMELINE, 1)],
    modelRegistration=dict(status='provisional', precision='approximate', provisionalCoordinates=True,
                           note='Pendiente de registrar los focos con la geometría final. El generador no puede sobrescribir una guía ya registrada.'),
    materialsModeLabel='Materiales', sources=SOURCES, stops=STOPS,
)
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
OUTPUT.write_text(json.dumps(guide, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(dict(stops=len(STOPS), facts=sum(len(item['facts']) for item in STOPS),
                      sources=len(SOURCES), layers=len(LAYERS), registration='provisional')))
