"""V27 editorial source. Run before final model registration, never afterwards."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'dist/assets/data/begona-visit.json'
DATE = '2026-11-21'
ORIGIN = [-0.221225, 39.658587]

def source(id, title, author, url, type, locator, year=None, note=''):
    return dict(id=id, title=title, author=author, url=url, type=type, year=year,
                locator=locator, note=note, accessed=DATE)

sources = [
    source('b-xiuxiueig', 'Església de la Mare de Déu de Begonya', 'Ajuntament de Sagunt · proyecto Xiuxiueig',
           'https://aytosagunto.es/es/ayuntamiento/areas-y-servicios/cultura-y-educacion/campus-abierto-a-la-ciudadania/proyecto-xiuxiueig/esglesia-de-begonya/',
           'documentación patrimonial municipal', 'Proyecto, solicitud de permiso, inauguración, mobiliario litúrgico y coro.',
           note='El 21 de abril de 1928 corresponde a la solicitud de permiso; no se identifica como fecha de concesión. La página no fecha sus afirmaciones sobre conservación del órgano.'),
    source('b-contrast', 'Iglesia de Nuestra Señora de Begoña', 'CONTRAST · Joan Costa Sanz, Antonio Ortiz López y José María Prats Escriche',
           'https://www.contrastapips.com/IHACM/IBP/Port/Port_patri_NSB.htm',
           'investigación patrimonial y observación de campo', 'Arquitectura, restauración y Casa Abadía.', 2022,
           'Distingue fotografías del edificio, referencias de otras iglesias y una maqueta de madera a escala 1:40. Esta última no es un levantamiento del edificio.'),
    source('b-guia2022', 'Patrimonio industrial de Puerto de Sagunto. Itinerario didáctico multidisciplinar',
           'CONTRAST / Asociación de Patrimonio Industrial de Puerto Sagunto (APIPS)',
           'https://www.apips.es/assets/files/CUADERNO_TP01.pdf',
           'guía de investigación patrimonial', 'Páginas 32–33: fachada, cubierta, materiales y fotografías interiores.', 2022,
           'Publica imágenes de diferentes épocas. La guía no se usa como certificación del estado material en 2026.'),
    source('b-guia2002', 'El Centenari del Port de Sagunt a l’escola. Itinerari didàctic per a l’ESO',
           'CONTRAST · edición alojada por el Ayuntamiento de Sagunto',
           'https://aytosagunto.es/media/uiwbnv5e/02_ud_quad_itinerario-did%C3%A1ctico-para-la-eso.pdf',
           'documentación arquitectónica histórica', 'Páginas 11–12: exterior e interior.', 2002,
           'Describe una fase anterior de restauración. Su diagnóstico de fachada de 2002 no se presenta como actual.'),
    source('b-uv', 'Conjunt Històric Industrial de Sagunt · Gerencia y entorno', 'Universitat de València',
           'https://www.uv.es/patrimoni_industrial_sagunt/bicgerencia/gerencia.html',
           'ficha patrimonial universitaria', 'Apartados 1–3: iglesia y relación con los equipamientos de la ciudad industrial.',
           note='La datación de inicio en 1927 difiere del relato municipal más específico, que separa proyecto de 1927 y obras de 1928–1929. No se usa su presente histórico como estado actual.'),
    source('b-organo', 'Los órganos de Santa María de Sagunto y el mundo musical de su entorno',
           'Josep Antoni Lluesma i Espanya · Cabanilles, n.º 33 / ACAO; archivo AVAMUS',
           'https://avamus.org/wp-content/uploads/2021/03/Cabanilles-033-033-1990-01-a-1990-03-Los-Organos-de-Santa-Maria-de-Sagunto-Valencia-y-el-mundo-musical-de-su-entorno.pdf',
           'investigación organológica y fotografías', 'Órgano de Begoña: autoría O.E.S.A., disposición de registros, consola y frente de tubos; páginas finales.', 1990,
           'El autor no localizó el contrato del instrumento. Las fotografías documentan su forma histórica; no acreditan su funcionamiento en 2026.'),
    source('b-alameda', 'La Alameda', 'Ajuntament de Sagunt · proyecto Xiuxiueig',
           'https://www.sagunto.es/va/ajuntament/arees-i-serveis/cultura-i-educacio/campus-obert-a-la-ciutadania/xiuxiueig/la-alameda/',
           'memoria oral publicada por el Ayuntamiento', 'Paseo, sociabilidad y relación con los turnos de fábrica.',
           note='Es un relato de recuerdos de las décadas de 1960 y 1970, no un inventario urbano contemporáneo.'),
    source('b-rutas2023', 'Rutas de la memoria obrera · Puerto de Sagunto (1939/1982)',
           'Sonia Garcés Romero y Buenaventura Navarro Herraiz · FEIS / CCOO, coordinación de Pere Beneyto, Josep Durbán y Alberto Gómez',
           'https://www.relatsiberoamerica.com/documentos/Beneyto/2023Beneytocoord.Rutas2.pdf',
           'investigación histórica con documentación de archivo', 'Páginas 51–52: iglesia, salón parroquial y Alameda.', 2023,
           'La imagen del monumento de la Alameda está fechada el 21 de octubre de 2022.'),
    source('b-memoria2025', 'Homenaje a las personas fallecidas en AHM y CMSM', 'Ayuntamiento de Sagunto',
           'https://aytosagunto.es/es/actualidad/2025-08-12-acto-de-homenaje-a-las-personas-fallecidas-en-altos-hornos-del-mediterraneo-y-en-la-compania-minera-sierra-menera/',
           'comunicación municipal y fotografías', 'Monumento de la Alameda y remodelación con nuevos nombres.', 2025),
    source('b-esculturas2026', 'Licitación de dos esculturas sobre la Escuela de Aprendices', 'Ayuntamiento de Sagunto',
           'https://aytosagunto.es/es/actualidad/2026-03-13-sale-a-licitacion-la-construccion-de-dos-esculturas-que-evocan-la-formacion-profesional-de-la-antigua-fabrica-siderurgica/',
           'comunicación municipal', 'Ubicación del antiguo edificio y patrimonio expuesto en el entorno de la Alameda.', 2026,
           'La licitación no demuestra instalación. Las esculturas previstas para diciembre de 2026 no se incorporan como construidas.'),
    source('b-frente', 'Fachada restaurada de la iglesia de Begoña', 'Joanbanjo · fotografía propia en Wikimedia Commons, reproducida por CONTRAST',
           'https://commons.wikimedia.org/w/index.php?curid=37236506',
           'fotografía arquitectónica', 'Frente principal, remates, óculos y espacio de acceso.',
           note='CC BY-SA 4.0 según la atribución de CONTRAST. Referencia de observación; no se redistribuye la fotografía en la escena.'),
    source('b-interior2004', 'Interior de Nuestra Señora de Begoña', 'CONTRAST',
           'https://www.contrastapips.com/IHACM/IBP/Port/Port_patri_NSB_archivos/image009.jpg',
           'fotografía de documentación de campo', 'Columnas, arcadas, cubierta, retablo y disposición general.', 2004,
           'No representa por sí sola el color o estado del templo en 2026.'),
    source('b-catastro', 'Cartografía INSPIRE de edificios', 'Dirección General del Catastro',
           'https://www.catastro.hacienda.gob.es/webinspire/index.html',
           'cartografía pública', 'Huella y partes edificadas; referencia 8338803YJ3983N.',
           note='La huella exterior no determina el reparto interior de habitaciones ni las cotas de sus elementos.'),
    source('b-pnoa', 'PNOA Máxima Actualidad', 'Instituto Geográfico Nacional',
           'https://www.ign.es/wms-inspire/pnoa-ma',
           'ortofotografía', 'Implantación, cubiertas y contexto urbano.',
           note='Máxima Actualidad es el nombre del servicio; no significa que la imagen fuese tomada en la fecha de consulta.'),
    source('b-osm', 'Cartografía de Begoña y su entorno', 'Colaboradores de OpenStreetMap',
           'https://www.openstreetmap.org/way/443618470',
           'cartografía colaborativa', 'Huella del templo y relación con el callejero.',
           note='Base espacial contrastada con Catastro y ortofoto; no es un levantamiento arquitectónico.')
]

def fact(text, *ids, confidence='documented'):
    return dict(text=text, sourceIds=list(ids), confidence=confidence)

def stop(key, label, title, region, intro, narrative, facts, look, note,
         floor=None, building='begona-templo', section=False, interior=False):
    ids = list(dict.fromkeys(i for f in facts for i in f['sourceIds']))
    return dict(id='begona-'+key, title=title, label=label, regionId=region, period='mixed',
                intro=intro, narrative=narrative, facts=facts, lookFor=look, modelNote=note,
                sourceIds=ids, confidence='documented' if any(f['confidence']=='documented' for f in facts) else 'interpretive', coordinateConfidence='approximate',
                coordinateMethod='Posición provisional hasta el registro de los focos de la geometría final.',
                coordinate=ORIGIN.copy(), coordinates=ORIGIN.copy(),
                coordinateSourceIds=['b-catastro','b-pnoa','b-osm'], osmIds=[], readingMinutes=1,
                readingLayer=region, floor=floor, fabricStatus='mixed', recommendedMode='current',
                mapScope='interior' if floor is not None else 'recinto', requiresSection=section,
                interiorView=interior, buildingId=building)

stops = [
 stop('conjunto','El conjunto','Begoña, frente a la Alameda','edificio',
      'Empieza con una vista del templo y del espacio que se abre ante él.',
      'Alterna la vista exterior con la sección y vuelve al paseo para relacionar las distintas escalas.',
      [fact('Ricardo de Bastida proyectó el templo; las obras se desarrollaron en 1928–1929.','b-xiuxiueig'),
       fact('La inauguración se celebró el 5 de junio de 1929.','b-xiuxiueig')],
      'La torre, las tres naves y el vacío de la Alameda.',
      'Maqueta interpretativa: combina cartografía, fotografías y descripciones; las medidas interiores no están levantadas.'),
 stop('fachada','Fachada','Una fachada que asciende hacia el centro','edificio',
      'Sitúate delante del edificio y sigue su silueta de un extremo al otro.',
      'Compara el ancho de las alas con el cuerpo que sobresale en el centro.',
      [fact('La composición piramidal concentra la torre sobre el eje de la entrada.','b-uv'),
       fact('Cada ala de la fachada contiene tres ventanas ovaladas.','b-guia2022')],
      'Seis óculos bajos, curvas laterales y remate central.',
      'La apariencia exterior toma como referencia fotografías de la fachada restaurada; el detalle ornamental se simplifica.'),
 stop('portada','Portada','Columnas, volutas y un gran óvalo','edificio',
      'Acércate a la puerta para reconocer el relieve de las molduras.',
      'Mira cómo cada pieza genera sombra y ayuda a distinguir las dos alturas de la portada.',
      [fact('Dos parejas de columnas jónicas enmarcan la entrada de medio punto.','b-guia2002'),
       fact('Sobre ella, un óculo ovalado queda encuadrado por columnas estriadas y una cornisa curva.','b-guia2002')],
      'Puerta, columnas pareadas, volutas y hueco superior.',
      'Perfiles y profundidades aproximados; no se atribuye precisión escultórica a las molduras.'),
 stop('campanario','Campanario','La torre sobre el coro','edificio',
      'Sube con la cámara hasta la parte alta de la fachada.',
      'Observa el vacío entre soportes y la sucesión de balconada, balaustrada y cúpula.',
      [fact('La torre integra un balcón convexo y una cúpula de perfil parabólico.','b-contrast'),
       fact('Las pequeñas torrecillas laterales completan la silueta del cuerpo central.','b-contrast')],
      'Vanos abiertos, balcón curvo y remates.',
      'La parada muestra su arquitectura exterior. No reproduce un itinerario real de subida ni una inspección de las campanas.'),
 stop('lateral','Lateral','La iglesia junto a la avenida','edificio',
      'Rodea la esquina para leer la longitud del templo.',
      'Busca el ritmo de los apoyos y el cambio de altura entre la nave mayor y las laterales.',
      [fact('Los contrafuertes son visibles en el costado norte del edificio.','b-guia2022'),
       fact('Las ventanas rectangulares iluminan las naves laterales.','b-guia2022')],
      'Contrafuertes, ventanas y aleros.',
      'Las separaciones y alturas se ajustan visualmente a la huella y a las referencias, con precisión aproximada.'),
 stop('nave','Nave central','Una perspectiva hacia la cabecera','naves',
      'Entra en la nave y dirige la mirada hacia el altar.',
      'Compara esta vista a la altura de una persona con la planta abierta desde arriba.',
      [fact('El espacio se organiza en tres naves longitudinales.','b-guia2022'),
       fact('La nave central supera en altura y anchura a las dos laterales.','b-guia2022')],
      'Pasillo central, secuencia de soportes y cabecera.',
      'Bancos, lámparas y recorridos interiores se representan para dar escala, sin inventario métrico.',floor=0,interior=True),
 stop('arcadas','Arcadas','Columnas y arcos entre las naves','naves',
      'Mira de forma oblicua para ver los huecos entre columnas.',
      'Elige un apoyo y sigue su relación con los arcos contiguos.',
      [fact('Columnas toscanas sostienen arcadas de medio punto.','b-guia2002'),
       fact('El acabado de las columnas imita mármol sobre hormigón.','b-guia2002')],
      'Fustes rosados, capiteles y continuidad de las arcadas.',
      'La policromía y el veteado se aproximan a fotografías de distintas fechas; no se certifica una fase cromática única.',floor=0,interior=True),
 stop('cubierta','Cubierta','Arcos diafragma bajo el tejado','naves',
      'Eleva la mirada y reconoce cada tramo de la estructura.',
      'Desde el interior, sigue los arcos transversales y los planos inclinados que cierran la nave. La sección opcional permite relacionarlos después con el tejado exterior.',
      [fact('Arcos diafragma de medio punto sostienen paneles planos inclinados de hormigón.','b-contrast'),
       fact('Los techos de las naves laterales son planos.','b-contrast')],
      'Arcos transversales y planos inclinados, visibles entre ellos.',
      'Los espesores y encuentros constructivos son interpretativos; la geometría conserva el sistema descrito.',floor=0,interior=True),
 stop('presbiterio','Presbiterio','La cabecera y el retablo','liturgia',
      'Acércate al extremo de la nave sin perder de vista su arco de acceso.',
      'Observa la profundidad del espacio que queda detrás del altar.',
      [fact('Un arco semicircular sobre ménsulas escalonadas precede al ábside.','b-guia2022'),
       fact('La imagen de Begoña del retablo mayor fue entronizada en 1966.','b-xiuxiueig')],
      'Arco de cabecera, altar y retablo dorado.',
      'Retablo e imágenes se abstraen por volumen y color; no son copias digitales de las tallas.',floor=0,interior=True),
 stop('capillas','Capillas','Los espacios junto al altar','liturgia',
      'Desplaza la mirada hacia los lados de la cabecera.',
      'Relaciona cada espacio con la nave lateral que permite aproximarse a él.',
      [fact('La descripción municipal identifica los retablos de los Desamparados y del Sagrado Corazón.','b-xiuxiueig'),
       fact('La fotografía de 2004 muestra retablos laterales flanqueando el ámbito central.','b-interior2004')],
      'El paso lateral y las composiciones a ambos lados.',
      'Las advocaciones proceden de la fuente; formas, mobiliario y proporciones sin planos se interpretan.',floor=0,interior=True),
 stop('coro','Coro','Mirar la nave desde sus pies','liturgia',
      'Vuelve hacia la entrada y observa el espacio elevado.',
      'La vista inversa permite entender la nave desde otro extremo.',
      [fact('El coro se sitúa sobre la entrada, bajo la torre.','b-xiuxiueig'),
       fact('La fotografía organológica conserva el detalle de su barandilla metálica.','b-organo')],
      'La galería elevada y su relación con la ventana frontal.',
      'Cota del coro, acceso secundario y detalles de la barandilla son aproximados.',floor=1,interior=True),
 stop('organo','Órgano','Un instrumento documentado','liturgia',
      'Acércate al frente de tubos del coro.',
      'Compara las distintas alturas y observa la consola que organiza su interpretación.',
      [fact('Cabanilles documentó en 1990 un órgano de Organería Española S. A., posterior a 1936.','b-organo'),
       fact('Sus fotografías muestran tubos descubiertos y una consola de dos teclados.','b-organo')],
      'Tubos, consola y antepecho del coro.',
      'Referencia histórica simplificada. No se afirma que el instrumento pueda tocarse hoy ni se simula su sonido.',floor=1,interior=True),
 stop('abadia','Casa Abadía','El bloque situado tras la cabecera','anexos',
      'Rodea la parte posterior del templo para reconocer el volumen anexo.',
      'La planta ayuda a distinguir qué pertenece al espacio de culto y qué queda detrás.',
      [fact('La Casa Abadía cierra el extremo occidental detrás del ábside; no es un transepto interior.','b-contrast'),
       fact('El salón parroquial adosado al sur se inauguró en 1946.','b-xiuxiueig')],
      'El cuerpo transversal y su relación con los anexos.',
      'Se interpreta el volumen exterior. No se inventa un interior visitable de las viviendas o del salón parroquial.',building='begona-abadia'),
 stop('materiales','Materiales','Color, estructura y revestimiento','naves',
      'Acércate a los encuentros entre suelo, columna y pared.',
      'Distingue el material de soporte del acabado que percibe quien recorre el edificio.',
      [fact('La ornamentación interior emplea estuco y la fábrica de los muros, ladrillo macizo.','b-guia2022'),
       fact('El texto municipal describe zócalos negros y pavimento de mármol blanco.','b-xiuxiueig')],
      'Pavimento claro, zócalo oscuro y soportes coloreados.',
      'Texturas, brillo y desgaste son recursos de representación basados en referencias, sin análisis material in situ.',floor=0,interior=True),
 stop('seccion','Sección','Leer el edificio desde arriba','edificio',
      'Abre las cubiertas del templo y relaciona esta vista con las paradas interiores.',
      'Usa el plano para localizar cada ámbito antes de volver al exterior.',
      [fact('La sección digital reúne las naves, las arcadas y la cabecera en una sola lectura.','b-catastro',confidence='interpretive'),
       fact('La huella cartográfica aporta el contorno exterior, no una planta de distribución interior.','b-catastro',confidence='interpretive')],
      'Naves, columnas, arcadas y cabecera; compáralas después con la vista desde el coro.',
      'Apertura digital interpretativa: el coro se consulta en su propia parada. Casa Abadía y dependencias permanecen cubiertas porque sus interiores no se han reconstruido.',section=True),
 stop('atrio','Plaza de acceso','Entre la puerta y el paseo','alameda',
      'Sal de nuevo a la explanada y mira hacia la fachada.',
      'Busca una distancia que permita reconocer el edificio completo y después acércate a sus detalles.',
      [fact('La fotografía de la fachada restaurada muestra una amplia superficie pavimentada delante del templo.','b-frente'),
       fact('Ese espacio relaciona el acceso con la Alameda.','b-rutas2023')],
      'Continuidad del pavimento y vistas hacia la portada.',
      'Juntas, bordes y mobiliario se aproximan a la escala del atlas.',building=None),
 stop('alameda','Alameda','El paseo de la vida cotidiana','alameda',
      'Avanza por el paseo y vuelve la vista hacia el campanario.',
      'Observa cómo cambian las perspectivas entre los árboles.',
      [fact('El relato municipal recuerda la Alameda como lugar de paseo y encuentro juvenil.','b-alameda'),
       fact('Sus recuerdos de los años sesenta y setenta relacionan la vuelta a casa con la sirena de fábrica.','b-alameda')],
      'El eje del paseo y la torre al fondo.',
      'La memoria oral explica usos históricos; la escena se apoya en cartografía contemporánea.',building=None),
 stop('arbolado','Arbolado','La sombra como parte del espacio','alameda',
      'Mira el paseo desde un lado para leer sus claros y grupos de árboles.',
      'Activa y desactiva la vegetación para comparar su papel en la composición.',
      [fact('La Alameda se documenta como paseo arbolado frente a la iglesia.','b-rutas2023'),
       fact('Las copas visibles en ortofoto ayudan a aproximar el reparto de la vegetación.','b-pnoa',confidence='interpretive')],
      'Copas, sombra, espacios de estancia y corredores de visión.',
      'No es un inventario botánico. Especies, alturas y formas de copa sin medición se interpretan.',building=None),
 stop('frente-urbano','Casas y calles','El templo dentro del barrio','alameda',
      'Amplía la vista para relacionar fachadas, esquinas y calles.',
      'Compara el tamaño del templo con las construcciones que lo acompañan.',
      [fact('La iglesia y sus dependencias forman parte del frente de la avenida 9 d’Octubre.','b-uv'),
       fact('El atlas utiliza huellas de edificios y callejero para situar el contexto.','b-catastro','b-osm',confidence='interpretive')],
      'Alineaciones, alturas relativas y continuidad de las aceras.',
      'Los volúmenes del entorno conservan su posición cartográfica; fachadas, cubiertas y pequeños detalles son aproximados.',building=None),
 stop('ciudad-factoria','Ciudad y memoria','Un paisaje de trabajo y vida social','anexos',
      'Relaciona esta parada con la Gerencia, el Economato y los demás hitos del Puerto.',
      'La visita continúa más allá del edificio: puedes recorrer el atlas siguiendo sus conexiones urbanas.',
      [fact('El Ayuntamiento documentó en 2025 la renovación del monumento de la Alameda dedicado a víctimas de accidentes laborales.','b-memoria2025'),
       fact('La información municipal de marzo de 2026 identifica una embarcación y una locomotora ya expuestas en este entorno.','b-esculturas2026')],
      'La relación entre espacios públicos, edificios sociales y memoria industrial.',
      'Las piezas del entorno se leen como una composición interpretativa. Una licitación de nuevas esculturas no equivale a su instalación.',building=None)
]
for i,s in enumerate(stops,1): s['order']=i

region_specs = [
 ('edificio','Fachada y volumen','#d4b17c','El exterior y la lectura general del templo.'),
 ('naves','Naves y estructura','#95bfc5','Soportes, cubiertas, luz y materiales.'),
 ('liturgia','Cabecera y coro','#c79379','Espacios de culto y patrimonio musical.'),
 ('anexos','Anexos y ciudad factoría','#b7a1ca','El edificio y las relaciones con su entorno industrial.'),
 ('alameda','Alameda y barrio','#91ae87','Acceso, paseo, vegetación y contexto urbano.')
]
regions=[]
for id,name,color,summary in region_specs:
    members=[s for s in stops if s['regionId']==id]
    regions.append(dict(id=id,name=name,aliases=[],summary=summary,
                        sourceIds=list(dict.fromkeys(i for s in members for i in s['sourceIds'])),
                        stopIds=[s['id'] for s in members],coordinate=ORIGIN.copy()))

def event(date,title,text,ids,stop,confidence='documented'):
    return dict(id='b-t-'+str(len(timeline)+1),date=date,title=title,text=text,
                sourceIds=ids,period='industrial' if date[:2]=='19' else 'contemporary',
                confidence=confidence,stopId='begona-'+stop)
timeline=[]
timeline.append(event('1927','El proyecto de Bastida','La ficha municipal distingue el proyecto de las obras posteriores.',['b-xiuxiueig'],'conjunto'))
timeline.append(event('1928','Solicitud de construcción','Francisco de Arana solicita permiso el 21 de abril.',['b-xiuxiueig'],'conjunto'))
timeline.append(event('1929','Apertura del templo','Inauguración el 5 de junio.',['b-xiuxiueig'],'fachada'))
timeline.append(event('1946','Salón parroquial','Se amplían los espacios destinados a actividades de la parroquia.',['b-contrast'],'abadia'))
timeline.append(event('1966','Imagen del altar mayor','La talla de Begoña es entronizada el 8 de diciembre.',['b-xiuxiueig'],'presbiterio'))
timeline.append(event('1967','Cesión al Arzobispado','AHV cede el templo en diciembre.',['b-contrast'],'ciudad-factoria'))
timeline.append(event('1983','Retirada de ornamentos','El deterioro obliga a retirar elementos de la fachada por seguridad.',['b-guia2022'],'fachada'))
timeline.append(event('1990','Documentación del órgano','Cabanilles publica fotografías y la disposición de sus registros.',['b-organo'],'organo'))
timeline.append(event('Siglo XXI','Recuperación de la fachada','CONTRAST documenta restauración y posteriores actuaciones en el interior.',['b-contrast'],'materiales'))
timeline.append(event('2017','Memoria del trabajo','El monumento de la Alameda se inaugura el 17 de diciembre.',['b-rutas2023'],'ciudad-factoria'))
timeline.append(event('2025','Ampliación del recuerdo','El Ayuntamiento informa de nuevos nombres en el monumento.',['b-memoria2025'],'ciudad-factoria'))

data = dict(schemaVersion=1,id='begona',title='Iglesia de Nuestra Señora de Begoña y Alameda',
            subtitle='El templo, sus naves y el paseo de la ciudad industrial',
            introduction='Recorre la fachada y el campanario, entra en las naves y descubre su cubierta antes de salir a la Alameda. Esta maqueta reúne rasgos documentados y proporciones interpretadas; las fotografías de referencia corresponden a distintas fechas.',
            researchDate=DATE, regionsLabel='Ámbitos de Begoña',mapButtonLabel='Plano de Begoña',
            overviewButtonLabel='Ver el conjunto', readingModeLabel='Leer el conjunto',
            readingModeNote='Cinco ámbitos de visita; sus colores ayudan a orientarse y no representan fases constructivas exactas.',
            timelineIntroduction='De la construcción del templo a la conservación de su memoria. Cada hito conserva su fuente.',
            visitAriaLabel='Visita a Nuestra Señora de Begoña y la Alameda',sectionOnOverview=True,
            sectionOpenLabel='Abrir sección',sectionCloseLabel='Cerrar sección',
            sectionInstructions='Abre las cubiertas del templo para leer sus naves y soportes. El coro y las lámparas se retiran con ellas; Casa Abadía y dependencias conservan su cubierta.',
            sectionNote='Sección digital interpretativa. La forma de la estructura se apoya en documentación; sus cotas y espesores no proceden de un levantamiento.',
            mapInstructions='Elige una parada en la iglesia o en la Alameda. Usa las plantas para localizar nave y coro.',
            mapNote='Plano orientativo sobre cartografía contemporánea. Distribución interior, alturas y objetos sin medición son aproximados.',
            visitNote='Investigación revisada el 21 de noviembre de 2026. La visita virtual no certifica el estado de cada objeto, el funcionamiento del órgano ni el acceso físico a dependencias.',
            methodology=[
                'Se cruzan documentos municipales, investigación patrimonial, organología, fotografías, Catastro, OpenStreetMap y ortofoto. Las cotas no publicadas se aproximan.',
                'La fecha de proyecto de 1927 se distingue de la solicitud de permiso de abril de 1928 y de las obras de 1928–1929. Se prioriza el relato municipal específico frente a la cronología resumida de la ficha universitaria.',
                'La escena sigue la organización documentada y una lectura de la fachada restaurada. Imágenes históricas, policromías y mobiliario no se presentan como un registro completo del estado en 2026.',
                'La fotografía de la maqueta de madera sirve solo de apoyo visual. No sustituye planos ni mediciones, y no se confunde con fotografías del edificio.',
                'La Casa Abadía se diferencia del espacio litúrgico. Las viviendas y dependencias sin documentación interior suficiente se muestran mediante sus volúmenes exteriores.',
                'La licitación de esculturas anunciada en marzo de 2026 no prueba que estén instaladas. La escena no convierte proyectos futuros en patrimonio ya construido.'
            ],
            readingLegend=[dict(id=id,label=name,color=color,note=summary) for id,name,color,summary in region_specs],
            confidenceLegend=[dict(id='documented',label='Documentado',note='La fuente respalda el rasgo o el dato; no certifica cada medida del modelo.'),
                              dict(id='interpretive',label='Interpretación',note='Aproximación de forma, dimensión, color o posición para explicar el espacio.'),
                              dict(id='disputed',label='Fuentes diferentes',note='Se mantiene visible una diferencia documental sin resolverla con una precisión inventada.')],
            materialEvidenceLegend=[dict(id='conserved',label='Rasgo documentado',note='Elemento reconocido en documentación o fotografías.'),
                                    dict(id='rehabilitated',label='Restauración documentada',note='Transformación acreditada, diferenciada de los materiales originales.'),
                                    dict(id='mixed',label='Lectura conjunta',note='Rasgos documentados y aproximaciones de representación conviven en la maqueta.')],
            regions=regions,stops=stops,sources=sources,timeline=timeline,
            modelRegistration=dict(status='pending',note='Pendiente del registro con la geometría final.',precision='approximate',provisionalCoordinates=True),
            materialsModeLabel='Materiales')

if OUT.exists():
    old=json.loads(OUT.read_text())
    if old.get('modelRegistration',{}).get('status')=='registered':
        raise SystemExit('Guide already registered: edit the JSON deliberately instead of overwriting registered coordinates.')
OUT.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print(f'Wrote {OUT}: {len(stops)} stops, {sum(len(s["facts"]) for s in stops)} facts, {len(sources)} sources.')
