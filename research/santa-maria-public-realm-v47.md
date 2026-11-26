# Santa María: calle, escalinata y relación con la Plaça Major

Revisión: 26 de noviembre de 2026. Parte de la corrección conjunta de Santa María y Plaza Mayor solicitada sobre la captura del Atlas.

## Evidencia contrastada

- [Forner Palanca y Palomar Abascal, ARSE 58 (2024), pp. 73–88](https://centroarqueologicosaguntino.es/wp-content/uploads/2025/08/Arse_58-74-89.pdf). Se han revisado las fotografías de las pp. 74–75 y las dimensiones de los bloques epigráficos de la p. 79. El acceso norte salva la diferencia de nivel con Caballeros. El pretil es macizo, tiene remate central curvo y contiene dos bloques superpuestos. La fecha 1799 corresponde al pretil, no demuestra la fecha de toda la escalinata. La imagen de 1923 incluye elementos hoy desaparecidos y no se usa para restaurarlos en el estado actual.
- [Turisme Comunitat Valenciana, galería de Santa María](https://www.comunitatvalenciana.com/es/valencia/sagunt-sagunto/monumentos/iglesia-parroquial-de-la-natividad-de-nuestra-senora-2). La imagen frontal de la portada norte permite contrastar hombros, pilastras, moldura y crestón del pretil conservado; la vista desde un soportal de la plaza muestra la relación espacial entre mercado, torre y templo. La galería no aporta rasantes ni dimensiones de las molduras.
- [OSM, escalinata 733321159](https://www.openstreetmap.org/way/733321159), [Cavallers 1365045257](https://www.openstreetmap.org/way/1365045257) y [plaza Cervantes 22922651](https://www.openstreetmap.org/way/22922651): se conservan las coordenadas ya registradas en el atlas.
- [Cabrera Fombuena, ARSE 22 (1987)](https://www.centroarqueologicosaguntino.es/uploads/descargas/295_23_La_Iglesia_parroquial_de_Santa_Maria_de_Sagunto_22.pdf): se mantiene el registro del templo con el plano utilizado en V9. Esta corrección no altera las tres naves, los vanos, la torre o el corte didáctico.

Las fotografías se han inspeccionado como documentación, sin incorporarlas como texturas ni contenido redistribuido en la aplicación.

## Diagnóstico del terreno

El suelo del templo está registrado a 59,323 m como aproximación gráfica compatible con el acceso sur; no es una cota medida. Su cimiento ya es una geometría vertical maciza. El parche anterior elevaba el MDT hasta el pavimento de la iglesia incluso junto a Cavallers, cuya rasante es más baja. La interpolación del terreno formaba el talud triangular visible en la captura. Además, el ensamblaje del Atlas y el del Simulador ordenaban de forma diferente los parches del edificio y del contexto.

La banda de pavimento de V9 sólo cubría el flanco local entre z = −27,1 y −8,23 m. Dejaba un corte antes de la esquina occidental del edificio y no continuaba por el lado oriental de la escalinata. La intervención actúa sobre esos encuentros, conservando el desnivel urbano y la posición de la iglesia.

La segunda inspección visual localizó además una falta de cobertura: el paso entre el número 9 de la plaza y la torre corresponde al retorno de Sagrari hacia Cavallers. Las cintas estrechas dibujadas sobre los ejes OSM no cubrían todo ese vacío entre fachadas. Por otro lado, el apron y la cinta de Cavallers se solapaban con cotas diferentes, creando polígonos aparentes y una banda oscura de ortofoto expuesta.

## Cambios geométricos y contrato de integración

1. El parche `santa-maria-foundation` declara `mode: lower-only`, `priority: 10`: puede retirar una intrusión del terreno bajo el piso, pero no añade una loma alrededor. El cimiento existente queda visible como fábrica vertical donde la calle está más baja.
2. La calle junto al muro cubre dos tramos: z = −28,15…−8,23 m y z = 10,58…15 m, dentro del registro local existente. Sus celdas tienen como máximo 1,2 m de longitud. El subgrado, con identificadores propios, prioridad 20 y modo de recorte, limita sólo la cresta local del terreno derivado del MDT. No rebaja toda la calle al punto más bajo de su pendiente transversal. La anchura del encuentro es interpretativa y no mueve la línea de calle ni parcelas.
3. La doble escalinata conserva su trazado, cotas y dos bloques epigráficos. El rellano se prolonga físicamente hasta el umbral de la portada: se elimina la ranura abierta que dejaba la geometría anterior. El suelo se recorta por cada huella de peldaño y el rellano, en lugar de excavarse hasta el fondo de toda la cimentación. El pretil recibe un perfil con hombros y centro curvo, pilastras de encuentro, moldura continua y un pequeño zócalo de calle. Se conserva la tablilla central sin inventar texto legible. Estos detalles son una síntesis visual, no un levantamiento de cantería. Las arquivoltas de las portadas tienen base abierta: se retiran sus antiguas barras inferiores, que coincidían con el rellano y producían una franja negra por doble superficie. Los marcos de las ventanas conservan su base.
4. `createSantaMariaContext` admite `replacedContextBuildingIds`. Al existir modelos detallados de parcelas vecinas, deja de construir únicamente sus cuerpos genéricos; conserva los registros fuente y las exclusiones del caserío global. Una instancia aislada que no recibe reemplazos sigue completa.
5. Una cobertura continua de unos 861 m² sustituye el apron renderizado y las cintas de Cavallers, el retorno de Sagrari y el enlace a la escalera. Sus bordes se recortan exactamente con las parcelas, la iglesia, la escalera y las superficies de Plaza Mayor, Pescadería y Cervantes. La ampliación de cobertura se limita al flanco norte y al retorno señalado; el resto de Sagrari conserva la anchura previa. Todo el pavimento sigue una misma rasante de presentación, 10,5 cm sobre el terreno final, con una malla conforme de 0,5 m, alturas compartidas y normales continuas. No se modifica el MDT fuente ni se añaden nuevas cotas de urbanización.

La integración conjunta de Plaza Mayor sustituye ocho cuerpos catastrales genéricos: partes 1–4 de las parcelas 3558301YJ3935G y 3558302YJ3935N. Su geometría especializada pertenece a Plaza Mayor. La lista de reemplazos debe pasarse tanto al Atlas como al Simulador y a los demás ensamblajes que incluyan esos modelos.

## Límites y comprobaciones

Se conservan los 16 identificadores de parada y las coordenadas de registro. Las dimensiones publicadas de los bloques son 1,67 × 0,59 m y 1,23 × 0,63 m; la altura total de la escalera, su número de peldaños y el perfil exacto de las molduras siguen siendo aproximados. La corrección del banco artificial no debe presentarse como una nueva topografía levantada sobre el terreno.

La validación de esta revisión comprueba ambos órdenes de aplicación de parches, rasantes junto a las dos esquinas, geometría finita, continuidad de los peldaños, conservación del conjunto de paradas y sustitución explícita de los ocho cuerpos vecinos. La revisión final del conjunto se realiza con la geometría efectiva de Atlas y Simulador; los renders CPU sirven para inspeccionar las formas y no equivalen a capturas de WebGL.

### Resultado de la prueba dirigida

`node research/validate_santa_maria_public_realm_v47.mjs`: **19/19 comprobaciones aprobadas**. Incluye 432 muestras de terreno bajo los peldaños y 18 rayos sobre la unión del rellano con el umbral. Los siete sondeos de borde de calle quedan entre 0,08 y 0,33 m bajo la rasante MDT, sin crestas que sobresalgan. Las dos ordenaciones de parches producen resultados idénticos. El plano está regenerado con 73 componentes, 36 cuerpos de contexto propios, 8 sustituciones a cargo de Plaza Mayor y las 16 paradas originales.

La regresión visual del conjunto añade ocho sondeos extraídos de las imágenes: los seis que antes mostraban ortofoto ahora encuentran pavimento, y los dos encuentros con capas superpuestas ya tienen una sola superficie a la rasante prevista. El generador `prepare_santa_maria_corridors_v47.py` reproduce el recorte cartográfico; su informe registra área de intersección nula con los edificios y las superficies de las plazas.

La inspección a pie de la escalinata detectó microfisuras que no se veían en los sondeos aislados: el ajuste de cota por triángulo daba alturas diferentes a vértices coincidentes y a puntos intermedios de una arista. `conforming-paving.js` sustituye ese ajuste por recortes sobre una cuadrícula común de 0,5 m, con la misma diagonal que el terreno del Atlas. Todos los puntos de cada celda se interpolan desde sus tres alturas comunes; no se eleva cada cara por separado. La regresión de continuidad mide tanto vértices coincidentes como encuentros en T y también la frontera entre pavimentos de Santa María y Plaza Mayor.

Resultado de continuidad final del conjunto: 59.088 caras, 32.000 posiciones horizontales y 599 encuentros en T examinados; cero posiciones con cotas divergentes y cero encuentros rotos. El residuo máximo es inferior a 0,004 mm y corresponde al cálculo de coma flotante, no a una precisión topográfica. Se mantienen aprobadas las 30 comprobaciones del conjunto y las 15 de suelo y escaleras.
