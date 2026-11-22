# Alto Horno nº 2 · recepción, recinto y entorno

Iteración v22 · documentación revisada el 20 de noviembre de 2026.

Esta capa conserva la identidad territorial de **SAGUNTUM · Atlas vivo**. Amplía
el entorno inmediato del alto horno en el Puerto y mantiene los modelos de
Talleres Generales, Museo Industrial y demás conjuntos bajo su propietario
anterior. No convierte sus edificios o patios en dependencias del horno.

## Qué cambia respecto a la escena anterior

La versión anterior rodeaba el horno con un pavimento circular de 20,5 m y una
valla cerrada, aunque el plano inclinado rebasaba ese círculo. El pabellón se
representaba como un volumen de cubierta plana. Además, la cartografía regional
incluye cuatro partes catastrales sobre el horno y su recepción: excluir sólo la
huella OSM del pabellón podía dejar bloques genéricos superpuestos al conjunto.

La nueva capa representa el recinto curvo occidental, su apertura hacia el plano
inclinado, la plaza exterior oriental y la recepción de **dos volúmenes
inclinados**, con sala en voladizo y corredor cubierto abierto en sus extremos.
Esta organización se apoya en la planta, sección y fotografías de los autores
publicadas por La Casa de la Arquitectura; las fotografías corresponden
aproximadamente a 2011 y se contrastan con la ortofoto PNOA. La memoria de 2008 se
utiliza como documentación del proyecto, no como prueba automática de que todos
sus detalles se ejecutaran.

Se añaden las calles y aceras inmediatas, la vía perimetral, la contención de
traviesas y el cerramiento de perfiles verticales. El recinto conserva el
carácter de un enclave industrial abierto; no se han inventado manzanas de
viviendas ni una reconstrucción de los equipos desaparecidos de la siderúrgica.

## Fuentes y alcance de la evidencia

| Fuente | Qué respalda | Límite |
|---|---|---|
| [BOE, declaración BIC de 2024](https://www.boe.es/diario_boe/txt.php?id=BOE-A-2024-9526), anexo I §3.4 y §4.2 | Pabellón de recepción, piezas industriales expuestas, vía en el perímetro de la rotonda y relación con el entorno industrial | No proporciona un levantamiento de cada bordillo, barandilla o árbol |
| [La Casa de la Arquitectura / COACV](https://lacasadelaarquitectura.es/recurso/restauracion-del-alto-horno-numero-2/309b8639-4a25-47c3-8bb1-0a6c1b5f182e), planos y fotografías de Mariela Apollonio | Dos volúmenes inclinados, voladizo, piel de placas grises, estructura vista del corredor y organización del recinto | Fotografías de la rehabilitación, aproximadamente de 2011; el plano inclinado se contrasta con evidencia posterior |
| [Memoria de rehabilitación, octubre de 2008](https://www.contrastapips.com/IHACM/IBP/Port/Memoria%20rehab%20AHn2.pdf), p.10 impresa | Fachada ventilada, apoyos de rampa y escaleras, traviesas recuperadas en el talud y cerramiento de perfiles verticales | Documento de proyecto; cotas menores no verificadas como obra actual |
| [PNOA Máxima Actualidad, IGN/CNIG](https://pnoa.ign.es/) | Trazado de suelo de la isla, recinto curvo, plaza, alineación visible de la vía y posiciones aproximadas de plantas | Consultado el 20-11-2026; no se ha verificado la fecha individual de vuelo. No se interpreta la fecha de consulta como fecha de captura |
| [OpenStreetMap, huella 733110249](https://www.openstreetmap.org/way/733110249) y ejes del atlas | Huella del pabellón y ejes de Avenida Altos Hornos, Ojos Negros y vías de servicio | Anchuras de calzada y acera interpretadas cuando no existe etiqueta de anchura |
| [Catastro INSPIRE Buildings](https://www.catastro.hacienda.gob.es/webinspire/), metadatos 21-08-2026 | Partes del pabellón/corredor y edificios industriales próximos | Producto derivado para el atlas; no información catastral oficial ni alzado actualizado |
| IGN/CNIG MDT05 y MDSnE2.5, ya incorporados al Puerto | Relieve regional y estimaciones de altura de edificios | MDT de 5 m, sin bordillos individuales; MDSnE no equivale a una altura de fachada medida |

La imagen de registro se conserva en
`research/validation-v22/horno-context-orthophoto-reference.jpg`. Su petición WMS,
extensión geográfica, tamaño, huella SHA-256 y puntos de trazado en píxeles están
en `horno-context.json`, de modo que la derivación puede revisarse y repetirse.
No se publican fotografías ajenas como texturas de fachada.

## Registro geográfico y propiedad

El eje permanece en **[-0.2203074, 39.6542918]**, la misma posición del núcleo del
horno. El contexto utiliza metros globales del atlas, sin una segunda rotación o
traslación del conjunto. El plano inclinado pertenece a `horno.js`; sus apoyos y
la valla se coordinan sin cerrar el paso con una circunferencia genérica.

La selección gráfica tiene 160 m de radio y se recorta al borde sur de la malla
de 5 m del Puerto, `z = 2900`. No representa el perímetro legal de protección del
BIC. Los edificios industriales seleccionados se conservan completos incluso
cuando un extremo de su huella rebasa el círculo de presentación.

| Propietario | Geometría |
|---|---|
| `horno.js` | Cimentación, cuerpo, torre, plataformas, puertas y pasarelas interiores, plano inclinado y equipos del horno |
| `horno-context.js` | Recepción, corredor y conexión exterior, suelo del recinto, plaza, calles, aceras, contención, valla, vía, mobiliario menor y vegetación |
| `horno-context.js` | Cinco partes industriales de dos parcelas próximas: `8432308YJ3983S` y `8535807YJ3983S` |
| Propietarios originales | Talleres, Museo Industrial, Gerencia, Casino, Begoña, Economato y demás monumentos |
| Modelo regional de ciudad | Edificios industriales que no se han seleccionado para esta ampliación |

Se excluyen del render genérico **diez IDs**: cuatro partes de la parcela
`8532501YJ3983S`, la recepción OSM `733110249` y las cinco partes industriales que
ahora modela el contexto. Sus coordenadas originales se mantienen en el archivo
de datos. La revisión de fuentes verifica que las cinco partes vecinas no han
cambiado de huella y que los pavimentos no penetran en los edificios existentes.

## Recepción y recorrido elevado

El ala oriental usa la huella OSM. La parte catastral
`cat-8532501YJ3983S_part2-0` permite prolongar el corredor occidental hasta su
conexión hacia el horno; ese tramo no estaba completo en la huella OSM del
pabellón. La volumetría sigue las inclinaciones y la organización visibles en los
planos y fotografías de los autores.

El corredor mantiene sus dos extremos abiertos, estructura de acero, piel
modular y paso central con barandillas. La prolongación hacia el horno mide
visualmente 2 m de anchura y se sitúa a **+5,70 m respecto al datum de la
cimentación**, el nivel de la plataforma de visitantes acordado con el núcleo.
Un revestimiento metálico de 3 cm separa el piso de la losa del núcleo para evitar caras coplanarias; el datum nominal sigue siendo +5,70 m. Su extremo de conexión es el desplazamiento global **[+3,83 m, −1,15 m]** desde
el eje, hacia el noreste. La geometría exterior se construye en ese mismo datum;
no vuelve a elevarse o hundirse al enlazar la malla de terreno final.

Las alturas, el reparto exacto de placas, fijaciones, apoyos, juntas y dimensiones
menores de esta recepción son interpretaciones visuales. No se presentan como
cotas medidas. El extremo alto de la sala se conserva en voladizo; no se rellena
hasta el terreno con un bloque macizo. Tampoco se inventa una exposición
museográfica dentro de la sala.

## Suelo, calles y paisaje

El círculo de pavimento anterior se sustituye por superficies diferenciadas:
recinto excavado, plaza exterior, aceras y calzadas. El suelo se apoya en
`portTerrain.meshHeightAt`, la consulta de la **malla realmente renderizada**.
Cada triángulo de pavimento queda contenido en un triángulo de la cuadrícula de
5 m del Puerto, con la misma diagonal. Esto evita que un plano de pavimento
atraviese una loma o quede suspendido entre muestras.

Las cotas del recinto cercano se acomodan mediante una cimentación local,
preservando el datum inicial del horno. La contención, el talud y los elementos
menores no se usan para fingir una topografía de precisión. Las calles mantienen
los ejes originales de OSM; sus anchuras se interpretan visualmente a partir de
PNOA. Las marcas viales son detalles de render dentro de esas calzadas, no un
inventario actualizado de señalización.

La vía sigue una traza perimetral visible y permanece abierta junto a la
recepción. Su longitud de geometría es aproximadamente 153 m. El ancho de vía y
las dimensiones de carriles y traviesas son interpretados; el valor de ancho
empleado en el modelo no se afirma como una medición del elemento conservado.
Las formas simplificadas de piezas industriales en la plaza tampoco se
identifican como máquinas concretas sin evidencia suficiente.

La vegetación se limita a trece posiciones aproximadas observadas en la ortofoto,
incluidas las palmeras de la mediana norte. Copas, altura y especie son
interpretadas. Los solares industriales mantienen su carácter abierto; no se
rellenan con arbolado aleatorio.

## Materiales, rendimiento y control de capas

La escena añade 26 mallas agrupadas y aproximadamente 61.000 triángulos, de los
cuales 7.307 corresponden a los pavimentos. Los paneles de la recepción, sus
juntas diagonales, apoyos y estructura generan sombras reales. Los pavimentos y
hormigones usan texturas procedurales discretas; no requieren imágenes externas
ni nuevas descargas en la visita.

Todos los materiales, geometrías y texturas del contexto tienen propietario
local. `bindGround()` libera las geometrías anteriores antes de reconstruir el
suelo y el detalle; `dispose()` puede llamarse dos veces sin repetir la
liberación. La lectura por capas utiliza la misma categoría **conjunto** y el
mismo color que el horno. Se incorpora únicamente el foco de visita
`horno-entorno`; no se añade una parada 21 al recorrido de veinte paradas.

## API de integración

```js
createHornoContext({ contextData, visitData, project, heightAt })
```

Devuelve `group`, `vegetation`, `patches`, `exclusions`,
`vegetationExclusions`, `excludedBuildingIds`, `excludedRoadIds`,
`collisionPolygons`, `focuses`, `bounds`, `plan`, `stats`, `qa`,
`ownedResources`, `bindGround`, `selectFocus`, `setReadingMode`, `dispose` y
`getState`. El grupo se añade como hermano del núcleo porque ya contiene
coordenadas globales.

La integración debe aplicar los IDs de edificios y vías sustituidos, y después
llamar `bindGround(portTerrain.meshHeightAt)` antes de registrar las cámaras.
`horno-entorno` proporciona un encuadre que incluye la recepción y la plaza sin
cambiar el recorrido global del atlas.

## Validación reproducible

- `prepare_horno_context.py`: genera datos y verifica huellas, propietarios,
  pavimento, ausencia de solapes y pertenencia a la malla de 5 m. **7/7 controles**.
- `validate_horno_context.mjs`: comprueba geometría finita, triángulos no
  degenerados, duplicados sustituidos, paso elevado abierto, datum, liberación
  de recursos, cámaras y lectura de materiales. **18/18 controles**.
- El pavimento se contrasta en todos sus vértices y centros de triángulo con la
  malla final construida por `buildTerrainGeometry`; el error máximo es inferior
  a 1 mm en esa prueba numérica.
- `render_horno_context_plan.py` genera el plano de registro PNOA y propiedad de
  superficies. La revisión visual confirma recepción y corredor en sus huellas,
  apertura al sureste para el plano inclinado y ausencia de manzanas inventadas.
- La integración y la comprobación final de la unión con el núcleo se realizan
  además en la validación conjunta de v22; la prueba local no sustituye esa
  comprobación.

Los scripts necesitan Shapely 2.1 o posterior, Matplotlib y el cargador Three.js
local de `research/validate_loader.mjs`. El archivo JSON almacena las huellas de
las fuentes de entrada para detectar cambios en futuras regeneraciones.
