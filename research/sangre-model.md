# Ermita de la Sangre: modelo arquitectónico V15

## Alcance y registro

Esta iteración desarrolla la ermita, la escalera de su fachada, su nave y capillas, el crucero, la cúpula, el presbiterio y las dependencias de la Cofradía. Conserva el atlas general **SAGUNTUM · Atlas vivo**, sus monumentos anteriores y su cartografía. La plaza, calles y caserío colindante pertenecen al módulo independiente `sangre-context.js`.

El modelo combina las huellas de OSM y las nueve partes de la parcela catastral **3657314YJ3935H** con la planta, cubiertas, secciones y alzados publicados por Francisco J. Ribelles Villar y su equipo en el libro de la Cofradía de 2001. Las láminas se inspeccionaron visualmente, junto con fotografías oficiales de fachada, cubierta e interior. La geometría es una interpretación documentada: no se presenta como fotogrametría, escaneado, levantamiento métrico ni reconstrucción arqueológica certificada.

La fábrica se registra al sistema local del atlas: origen geográfico −0,278°, 39,679°, metros en X/Z, eje vertical Y. El ancla de la ermita es −0,27730776°, 39,67818601°, correspondiente a X=59,3081 m, Z=90,6134 m. La rotación local es 1,23 radianes, ajustada a las aristas cartográficas existentes. La cúpula se sitúa sobre la parte catastral 6, no en el centro de todo el conjunto o del anexo.

## Evidencia utilizada

| Fuente primaria | Inspección y aplicación |
| --- | --- |
| [Cofradía, «Ermita de la Sangre»](https://semanasantasagunto.com/ermita-de-la-sangre/) | Historia de la construcción, mobiliario del presbiterio y fotografías oficiales. Se observaron las imágenes `ermita00` (aérea), `ermita01` (fachada), `ermita02` (interior) y `ermita03` (retablo y textiles). |
| [Libro de la Cofradía 2001](https://semanasantasagunto.com/wp-content/libros/llibre_2001_opt.pdf), informe de intervención, p.128 y siguientes | Descripción de cruz latina, dos tramos de capillas, bóveda de cañón con lunetos, testero interior y exterior, cúpula sin linterna, portada y espadaña. |
| Mismo libro, Francisco J. Ribelles Villar y equipo, pp.166–170 | Planta y cubiertas; cuatro secciones; alzados. Se inspeccionaron los dibujos a 2400 px, correspondientes a las páginas PDF165–169. Informan la proporción y disposición de los espacios; no se extrajeron de estas reproducciones medidas que no fueran legibles. |
| Mismo libro, Valentín Cabrera Fombuena, pp.175–190 | Dos escaleras diferentes de siete peldaños; sacristía y archivo; capillas; ampliación de almacén y museo; decoración e historia material. |
| [Ayuntamiento, proyecto Xiuxiueig](https://aytosagunto.es/es/ayuntamiento/areas-y-servicios/cultura-y-educacion/campus-abierto-a-la-ciudadania/proyecto-xiuxiueig/ermita-de-la-purissima-sang/) | Portada y edículo, fábrica exterior, escalera de rodeno y relación con la ladera. Se observó la fotografía municipal de la fachada y plaza `81-ermita-sangre_c.jpg`. |
| [Ayuntamiento, iluminación y sonido, 12-12-2023](https://aytosagunto.es/es/actualidad/finaliza-la-adecuacion-de-la-iluminacion-y-sonido-del-interior-de-la-ermita-de-la-sang/) | Se observaron fotografías del presbiterio, colores del retablo, proporciones de pilastras, escalera y barandilla. La fecha precede a la intervención de 2024. |
| [Ignasi Corresa i Marín, detalle de la clave, 26-09-2024](https://commons.wikimedia.org/wiki/File:Detall_de_la_clau_de_la_c%C3%BApula_de_l%27ermita_de_la_Sang_de_Sagunt.jpg) | Fotografía del autor observada: intradós blanco/gris frío, ocho cartelas, dieciséis lóbulos, rosetas doradas y clave del cáliz. Se usa como referencia visual, no como textura. |
| [Ignasi Corresa i Marín, «La clau de la Sang», 2025](https://www.academia.edu/129476628/La_clau_de_la_Sang) | Documentación de la restauración de 2024: recuperación de grises, tratamientos de superficies y nueva clave; retirada de la lámpara central anterior. |
| [Campaners, campana Salvador](https://campaners.com/php/campana1.php?numer=2833) | Campana de 1950 y diámetro de 28 cm: se modela una campana pequeña dentro de la espadaña. |
| Cartografía local preservada: OSM, Catastro, MDT y MDSn/IGN | Registro geográfico, huellas y relieve. Los datos fuente no se sobrescriben. Las pequeñas correcciones de cimentación son de presentación geométrica. |

Las fotografías y páginas de referencia no se incorporan como una galería ni se proyectan sobre las superficies. Las texturas de cal, piedra, ladrillo, mármol, madera y cerámica son originales, generadas mediante Canvas y ruido determinista.

## Qué se representa

### Exterior

La fachada es una silueta de geometría continua con remate curvo y cornisa de ladrillo. Tiene un zócalo pétreo, sillares encadenados en las esquinas, pilastras y cornisas de la portada, pináculos, edículo de ladrillo con óvalo y busto esquemático, frontón partido, ventanal y espadaña. El portal y el ventanal son huecos reales del muro; las hojas metálicas se colocan retrasadas respecto a la portada. Los motivos de las hojas y el busto son esquemáticos, sin afirmar reproducción escultórica exacta.

La escalera exterior tiene siete peldaños de piedra rojiza. Su planta redondea las esquinas delanteras, como muestran el plano de 2001 y la vista aérea. La campana, de tamaño contenido, se aloja en una abertura arqueada real.

La cubierta incluye las piezas de la nave, capillas, brazos del crucero, presbiterio y anexo. Las tejas tienen canales volumétricos, juntas y variación de tono. La cúpula exterior se modela con tambor octogonal bajo, revestimiento azul y remate de cruz; carece de linterna.

### Interior

La nave longitudinal contiene dos tramos de capillas a cada lado. Los cuatro arcos de acceso son huecos reales y permiten ver el volumen de las capillas. Se añaden pilastras estriadas, zócalos, molduras, capiteles simplificados, arcos fajones, bóveda de cañón, intersecciones de lunetos y ventanas fingidas. La bóveda principal y las de los brazos no son cajas que bloqueen el espacio interior.

Cuatro arcos torales soportan la transición del crucero. Las pechinas ocupan su posición estructural entre el cuadrado y el círculo. Sus superficies pictóricas se indican mediante color neutro; no se fabrican escenas narrativas ni retratos. La visita textual identifica y explica el patrimonio pictórico con sus fuentes y cautelas de atribución.

El intradós de la cúpula utiliza el aspecto documentado después de la restauración de 2024: blanco y grises fríos, anillo con dentículos, ocho cartelas radiales y clave con dieciséis lóbulos y rosetas doradas. Un pequeño cáliz y volúmenes de alas marcan la nueva clave de forma esquemática. No se conserva en esta vista la lámpara central anterior.

El presbiterio se eleva sobre siete peldaños de mármol. La plataforma tiene una abertura en U que deja visibles todos los peldaños y un zócalo cerrado hasta el suelo. Se representa el testero exterior recto y la terminación interior poligonal, retablo con dos pares de columnas y frontón, molduras, relieves vegetales, sagrario, mesa de altar, barandilla y estandartes. La figura del Ecce Homo se interpreta con una silueta corporal, cabeza y cabello, brazos recogidos, pies y paño con pliegues; no reproduce el rostro ni la talla de manera exacta. Las pinturas poseen marcos y superficies neutras.

La Vera Cruz se sitúa en la segunda capilla del lado del Evangelio siguiendo la documentación y las láminas. Las otras andas se sugieren mediante tarimas y textiles; no se inventan esculturas o posiciones exactas de una exposición cambiante.

La sacristía se dispone a la izquierda mirando hacia el altar y el archivo al otro lado, en las piezas que corresponden a la planta publicada. La sacristía conserva la lectura de bóveda vaída. Los volúmenes del almacén y el museo siguen las piezas catastrales del anexo suroeste. Las vitrinas del piso superior son tipológicas y vacías: no pretenden fijar el inventario ni la distribución actual de la colección.

## Relieve, propiedad y límites de la sección

El MDT bruto varía aproximadamente de 64 a 68,7 m a través de la huella; la documentación explica que la ermita se encajó en la roca de la ladera. Se adopta una cota interior interpretativa de **65,28 m**. El presbiterio queda a **66,54 m**, después de siete contrahuellas de 0,18 m. Estas cifras son decisiones del modelo, no mediciones publicadas de la ermita.

La cimentación adapta solamente el interior del contorno y los anexos. La plaza mantiene el relieve. Una pequeña corrección separada, limitada a la planta de la escalera, evita que el MDT de resolución más gruesa oculte los primeros peldaños. El módulo de contexto excluye esa envolvente del pavimento de la plaza. No se dibuja una segunda plaza horizontal ni se duplican edificios o caminos.

Las nueve partes catastrales del núcleo y las dos huellas OSM sustituidas se excluyen de los volúmenes genéricos de la ciudad. Los edificios colindantes se gestionan mediante el contrato de propiedad del contexto.

La sección es **arquitectónica**: retira cubiertas, bóvedas y el forjado del anexo cuando corresponde. No abre una excavación ni inventa restos bajo la ermita. En las paradas de la cúpula, pechinas y conservación se mantiene visible su intradós para observarlo desde abajo, mientras la envolvente exterior está retirada. La parada del museo mantiene el único forjado del nivel superior. Cerrar la sección restaura la visibilidad original.

## Contrato con la aplicación

`createSangre({record, project, heightAt, visitData, contextData})` devuelve `group`, `point`, `exclusions`, `patches`, `view`, `roof`, `setSection`, `visit`, `excludedBuildingIds` y `excludedRoadIds`.

`visit` expone dieciséis focos, plano, límites, estadísticas, datos de comprobación, selección, lectura por materiales o capas, sección y actualización de alturas exteriores. Los recursos propios se registran en `group.userData.ownedResources` para su liberación. La función del plano es `drawSangreMap`.

Las posiciones geográficas de las paradas se conservan aparte de los objetivos visuales de cámara. Las ocho vistas normales de nave, capillas, crucero, cúpula, pechinas, presbiterio, Vera Cruz y conservación usan `interiorView:true`: se observan dentro del edificio completo, con las bóvedas presentes. La apertura de sección sigue siendo opcional. Sacristía y museo usan `requiresSection:true` para facilitar su lectura. Todas estas cámaras conservan `fitBounds:false`, `closeScale:false` y campos de visión propios. Así, la adaptación al móvil no desplaza la cámara a través de los muros. El módulo de contexto aporta los focos finales de plaza y entorno y sus componentes al plano serializado.

| Parada | Campo de visión del modelo | Lectura |
| --- | --- | --- |
| Conjunto | 38° | Vista exterior general; ajuste al volumen permitido |
| Portada | 43° | Fachada y acceso |
| Nave | 64° | Cámara dentro de la nave |
| Capillas | 65° | Arco y capilla desde el espacio de la nave |
| Crucero | 65° | Arcos y pechinas |
| Cúpula | 66° | Intradós desde abajo |
| Presbiterio | 58° | Escalera, retablo y altar |
| Vera Cruz | 56° | Segunda capilla del Evangelio |
| Sacristía | 70° | Estancia estrecha |
| Museo | 67° | Piso del anexo |

## Comprobación

`research/validation-v15/validate-sangre-model.mjs` verifica geometría finita, triángulos completos, propiedad de las partes sustituidas, los dieciséis identificadores de visita, nueve rayos a través del portal y doce a través de las cuatro capillas, dos escaleras de siete peldaños, visibilidad individual de las huellas del presbiterio, apertura y cierre de sección, recuperación de materiales y selección cartográfica en tamaños de escritorio, móvil y minimapa. La ornamentación de la cúpula se adapta al intradós curvo; una comprobación de todos sus vértices garantiza que ninguna cartela o roseta atraviesa la envolvente azul. Veinticuatro rayos desde la cámara interior comprueban que las rosetas doradas queden visibles delante de las placas grises, que se subdividen antes de curvar. Otra comprobación mantiene el hastial y las tejas de la nave detrás de la fachada barroca, evitando que dibujen un frontón ficticio sobre ella.

El plano está disponible sin WebGL mediante `dist/assets/data/sangre-plan.json`. Se genera con el contexto mediante `research/validation-v15/build-sangre-plan.mjs`; no se mantiene una segunda geometría cartográfica divergente.

La validación aislada se complementa con la comprobación integrada de cámaras, relieve, pavimento y ciudad del equipo principal, y con renders de las mallas reales. Los renders de inspección no son capturas WebGL del navegador ni imágenes generadas. La presencia de referencias visuales y de una planta histórica no elimina la incertidumbre de las alturas, detalles pequeños, estado exacto de objetos y distribución vigente del museo.
