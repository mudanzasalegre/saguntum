# V16 · Iglesia del Salvador: investigación y criterios de representación

Fecha de consulta: **20 de noviembre de 2026**. Este cuaderno acompaña al recorrido de **18 paradas, 40 hechos, 19 hitos y 19 referencias** de `dist/assets/data/salvador-visit.json`. Se mantiene la identidad general de SAGUNTUM, los lugares existentes y las visitas anteriores.

## Alcance de la investigación

La escena busca reconocer un edificio concreto: su nave, la cabecera, los cuerpos añadidos y dos espacios públicos diferentes. Se han cruzado una descripción patrimonial oficial, la publicación de la excavación, estudios históricos, un inventario especializado de campanas, fotografías institucionales y cartografía. Ninguna de esas fuentes, por separado, equivale a un levantamiento actual completo del templo.

El resultado distingue tres niveles. **Documentado** indica que una referencia respalda el hecho descrito. **Interpretación** identifica una lectura visual, una hipótesis razonada o una forma aproximada. **En debate** reserva las identificaciones o cronologías que la evidencia no resuelve. Estas categorías valoran los textos; una afirmación histórica documentada no convierte las cotas del modelo en mediciones certificadas.

## Base espacial y registro

El núcleo se corresponde con la parcela catastral **4056919YJ3945E**, descompuesta en seis cuerpos, y la huella [OSM 77444950](https://www.openstreetmap.org/way/77444950). La entrada se orienta hacia el oeste, la cabecera hacia el este y la capilla de la Comunión se adosa al lado sur. La rotación y los focos interiores se comparten con `salvador-plan.json`; el cuaderno no almacena una segunda geometría independiente.

La publicación arqueológica ofrece una **planta de la excavación**, no un plano actual de todos los espacios. Se ha inspeccionado la lámina de la página 51, página 8 del PDF. Su dibujo permite relacionar la nave y el ábside con los hallazgos, pero la ausencia de una capilla en esa lámina no acredita su inexistencia. La planta no sustituye las huellas catastrales de los anexos ni proporciona alturas interiores actuales. [Hortelano, 1992](https://www.centroarqueologicosaguntino.es/uploads/descargas/444_43_Excavaciones_arqueologicas_en_27.pdf).

La cartografía diferencia la [plataforma peatonal al suroeste, OSM 733188295](https://www.openstreetmap.org/way/733188295), del [jardín triangular al noroeste, OSM 77445077](https://www.openstreetmap.org/way/77445077), próximo a la vía denominada Plaça del Salvador. El modelo contextual conserva esta diferencia. La malla de relieve aporta la pendiente general; umbrales, peldaños y transiciones de pavimento se ajustan para la visualización y siguen siendo aproximados.

## Arquitectura que guía el modelo

La ficha oficial identifica una nave única de tres tramos, arcos diafragma y cubierta de madera; una cabecera de cinco lados con crucería; la capilla bautismal junto al acceso al campanario; y la Comunión, de cruz griega y media naranja. La torre tiene dos cuerpos y escalera de caracol. Esta organización impide tratar el edificio como una iglesia genérica con tres naves, una gran cúpula central o una bóveda continua sobre todo el templo. [BIC, descripción en p. 77](https://www.boe.es/boe/dias/2008/01/24/pdfs/C00001-00128.pdf).

Las [fotografías de Turisme Comunitat Valenciana](https://www.comunitatvalenciana.com/es/valencia/sagunt-sagunto/monumentos/iglesia-parroquial-de-el-salvador-5) permiten contrastar visualmente el acceso, la marquesina ligera, la diferencia de tono entre fábricas, los paños blancos, el óculo y la relación de madera, arcos y cabecera. No llevan fecha de toma. Se usan como referencia visual consultada en 2026, sin afirmar que sean un registro de ese año y sin introducirlas en la aplicación como galería o textura.

| Elemento | Decisión para la escena | Precisión que no se atribuye |
| --- | --- | --- |
| Portada y fábrica | Dovelas, imposta, ventana superior, contrafuerte y marquesina diferenciados | Despiece piedra a piedra, erosión o dimensiones menores medidas |
| Nave | Espacio interior abierto, tramos y apoyos legibles | Reconstrucción de un proyecto medieval hipotético |
| Techumbre | Madera sobria según las referencias visuales | Conservación in situ del antiguo techo pintado |
| Cabecera | Geometría poligonal, nervios, paños claros y luz axial | Reproducción facsimilar de la clave, letras o antiguas pinturas |
| Bautismo | Ámbito reconocible y pila neutra | Identidad comprobada con la pieza descrita en 1924 |
| Comunión | Tipología y relación con la nave | Planta interior actual medida, programa ornamental o mobiliario inventariado |
| Cúpula de la Comunión | Volumen lateral pequeño y acabado neutro | Color exterior determinado con certeza o identificación con otras cúpulas del atlas |
| Sacristía | Anexo de servicio relacionado con el conjunto | Distribución exacta, armarios, ajuar o accesibilidad actual |
| Contexto | Huellas, cuerpos, patios y pendientes cartografiados | Alzados de todas las casas obtenidos por fotogrametría |

## Techo visible, artesonado disperso y retablo perdido

Esta distinción afecta directamente al render. El estudio de restauración de un casetón trata una pieza separada del templo, no una intervención que haya repuesto allí la cubierta antigua. Se evita generar una armadura policromada completa a partir de un fragmento: no se conocen en esta investigación todas sus piezas, secuencia decorativa ni disposición original. La parada del artesonado se mantiene junto a la observación de la cubierta para explicar esa ausencia. [Vela Giménez, ARSE 58, 2024](https://centroarqueologicosaguntino.es/wp-content/uploads/2025/08/Arse_58-90-97.pdf).

El estudio de Gómez Verdeguer recupera fotografías y observaciones de Mateu y Llopis. Es útil para distinguir objetos y acabados anteriores, pero no autoriza a trasladarlos automáticamente al presente. La visita no repone el retablo histórico, el púlpito, un antiguo ángel ni el remate de campanario desaparecido. Tampoco fija como permanente la imaginería procesional visible en una fotografía sin conocer la ocasión de la toma. [Gómez Verdeguer, Braçal 53, 2016](https://www.academia.edu/35387994/Aproximaci%C3%B3n_a_La_iglesia_del_Salvador_en_el_arrabal_de_Sagunto_).

## Cronología: qué se conserva abierto

La fecha de 1248 aparece en divulgación municipal, mientras la ficha BIC sitúa la fábrica principal a finales del siglo XIII. El estudio histórico advierte que el documento de 1248 se refiere al arrabal y no nombra todavía San Salvador. La visita presenta el contraste; no convierte una fecha tradicional en acta de inicio de obra. El calendario usa «mediados del siglo XIV» para el episodio bélico porque las publicaciones consultadas no ofrecen una narración cronológica uniforme. No se repite la fecha 1354 de la ficha divulgativa. [Ayuntamiento, Xiuxiueig](https://aytosagunto.es/es/ayuntamiento/areas-y-servicios/cultura-y-educacion/campus-abierto-a-la-ciudadania/proyecto-xiuxiueig/esglesia-del-salvador-i-el-raval-de-sagunt/) y [Gómez Verdeguer](https://www.academia.edu/35387994/Aproximaci%C3%B3n_a_La_iglesia_del_Salvador_en_el_arrabal_de_Sagunto_).

El cambio de categoría parroquial se fecha con la documentación de archivo en **29 de diciembre de 1953**. La referencia contiene un inventario histórico, que no se usa para fijar el número actual de campanas o el estado presente de las obras. Se consultó el texto indexado de la página 130: la descarga directa del PDF no estuvo disponible y esta limitación queda registrada. [Monumenta Archivorum Valentina 19, ficha 135](https://www.arxparrvalencia.org/pdf/Mon_Ar_Val_19_corregido.pdf).

## Arqueología: explicación sin excavación ficticia

La memoria de 1992 distingue estructuras anteriores, rellenos y niveles romanos. El espacio representado sobre el suelo se mantiene cerrado. No se ha generado una iglesia completa bajo el edificio actual, una galería excavada ni una cripta intacta a partir de materiales removidos. La relación con la iglesia de San Juan vinculada al Cid se clasifica como hipótesis, de acuerdo con la cautela de la memoria y la descripción del consorcio público. [Hortelano](https://www.centroarqueologicosaguntino.es/uploads/descargas/444_43_Excavaciones_arqueologicas_en_27.pdf); [Camino del Cid](https://www.caminodelcid.org/servicios/iglesia-del-salvador-de-sagunto-1822824).

La noticia municipal de 2015 corresponde a zanjas de la calle Valencia. Es un segundo contexto arqueológico: sus hallazgos no se trasladan bajo la nave ni se convierten en estructuras visibles del espacio público actual. La posible función pública del edificio islámico se conserva como interpretación. [Ayuntamiento, 3 de julio de 2015](https://aytosagunto.es/es/actualidad/el-ayuntamiento-de-sagunto-trabaja-para-la-proteccion-de-los-restos-arqueologicos-de-la-calle-valencia-y-para-evitar-que-retrasen-las-obras/).

## Campanas y estado de referencia

La ficha de [Campaners, campanario 375](https://campaners.com/php/campanar.php?numer=375), actualizada en agosto de 2025, documenta tres huecos abiertos y el oriental cegado. Su noticia de restauración en 2023 permite optar por yugos de madera. Las fichas de [Trinitat, 1721](https://campaners.com/php/campana1.php?numer=1721) y [Remei, 1722](https://campaners.com/php/campana1.php?numer=1722) ofrecen las proporciones de las dos campanas grandes.

Existe una discrepancia interna entre la tabla general y la descripción sobre el autor y la fecha de fundición de la menor. Se conserva esa incertidumbre, en lugar de presentar una inscripción añadida como evidencia suficiente de fabricación. La síntesis no reproduce su epigrafía ni inventa una sonoridad histórica.

## La restauración y las dos plazas

El texto BIC describe la eliminación de casas adosadas por el «lado norte», una nueva plaza y una sacristía en la intervención de 1991–1992. La situación actual de las huellas no basta para deducir exactamente qué parcelas desaparecieron. Se mantiene la referencia documental en la fuente, pero la narración pública habla de transformación del espacio inmediato y no asigna un polígono de derribo sin disponer de planos comparables. [BIC, p. 77](https://www.boe.es/boe/dias/2008/01/24/pdfs/C00001-00128.pdf).

El contorno gráfico del contexto selecciona edificios próximos para componer la escena. **No representa la delimitación legal del entorno protegido**, que se describe y dibuja en las páginas 78–79 del documento BIC. Las dos cosas se conservan separadas en el modelo y en sus notas.

## Contrato del recorrido

| Ámbito | Paradas |
| --- | --- |
| `llegada` | conjunto, plaza, entorno |
| `fachada` | portada, torre, campanas |
| `nave` | nave, arcos, techumbre |
| `cabecera` | ábside, crucería, bautismo, Comunión, cúpula |
| `memoria` | sacristía, arqueología, artesonado, conservación |

Los identificadores llevan el prefijo `salvador-` y se comparten entre cuaderno, plano y modelo. Las cinco capas temáticas son `exterior`, `architecture`, `chapels`, `memory` y `context`. No son fases históricas: la cúpula y el ábside pueden pertenecer a la misma capa de lectura sin atribuirles una fecha común.

Los focos exteriores de plaza y entorno proceden del módulo contextual. Los demás se copian de las cámaras del modelo. La comprobación documental exige que las coordenadas coincidan, que cada hecho resuelva a una referencia y que los 18 puntos pertenezcan a un único ámbito. La comprobación de imágenes y cámaras corresponde a la validación geométrica y visual separada.

## Fuentes y trazabilidad

La bibliografía completa con autor, fecha, URL, localizador y límites está en el JSON y se presenta en la pestaña **Fuentes**. Son 13 referencias históricas, patrimoniales, arqueológicas, visuales o de inventario y seis cartográficas: las tres huellas OSM, Catastro, relieve IGN y PNOA.

Los PDF descargados se leyeron directamente; la memoria de 1992 requirió OCR por ser una digitalización. Las láminas se inspeccionaron como imágenes para no inferir la planta sólo del reconocimiento de texto. Se contrastaron cuatro fotografías de la galería institucional. Las fuentes de Campaners se verificaron a través de sus contenidos indexados cuando la apertura directa falló. Ninguno de esos errores de descarga se presenta como lectura exitosa del recurso completo.

Para una siguiente mejora métrica harían falta una planta actual de Comunión y dependencias, secciones acotadas, fotografías fechadas del exterior de la pequeña cúpula y un levantamiento de mobiliario. Esta edición no presupone que esos documentos existan públicamente. Lo que ya está respaldado se representa; lo no resuelto se limita y se explica.

## Verificación documental

`research/validation-v16/validate_salvador_documentation.mjs` comprueba el esquema, las referencias, los ámbitos, las capas, los focos compartidos y las cautelas de las afirmaciones. También contabiliza las síntesis breves por fuente. El resultado se guarda en `salvador-visit-results.json`. Esa comprobación no certifica accesibilidad física, precisión de alzados ni estado de conservación actual.
