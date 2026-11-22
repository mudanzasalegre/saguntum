# Iglesia del Salvador · plazas, jardín y caserío del Raval

## Alcance y registro de la intervención

El contexto V16 incorpora **163 partes catastrales de 51 parcelas**, mantiene **3 patios interiores**, y representa **11 tramos de calles** alrededor del Salvador. La selección gráfica se extiende 45 m desde la unión de las seis partes del templo; se conservan parcelas completas cuando su centro o la mayoría de su superficie entra en ese ámbito. Este criterio define la composición y la carga de la escena, no un perímetro patrimonial ni el entorno legal del BIC.

Los seis contextos anteriores —Santa María, Plaça Major, judería, Calvario, Berenguer y Sangre— conservan sus piezas, pavimentos, focos y datos. No hay transferencias de edificios entre propietarios en esta selección. `withoutSalvadorClaims` preserva el contrato de integración, pero sus listas de retiro están vacías. El control geométrico y de identidades comprueba que las nuevas piezas no duplican edificios asignados previamente.

La proyección es la del atlas: origen `[-0.278, 39.679]`, x hacia el este y z hacia el sur, en metros locales. El anclaje del templo es `[-0.27255741, 39.67679895]`. Las partes de la parcela **4056919YJ3945E** y la identidad OSM **77444950** pertenecen exclusivamente al modelo de la iglesia; el contexto reserva su huella y un umbral estrecho acordado con ese modelo. No desplaza el templo ni sustituye su parcela por un rectángulo ideal.

`excludedBuildingIds` contiene las 163 identidades catastrales de viviendas y la identidad OSM **1418994370**, que duplica una cobertura ya representada por Catastro. No se recortan ni generan porciones residuales OSM en esta iteración. `coreExcludedBuildingIds` registra por separado las seis partes del núcleo y su identidad OSM. Los datos fuente de cada parte se conservan íntegros, añadiendo únicamente el identificador de componente del contexto.

## Dos espacios públicos diferentes

El cruce de huellas catastrales, trazados OSM, ortofoto PNOA y fotografías institucionales permite distinguir dos vacíos que no deben fusionarse en una gran explanada inventada:

| Espacio representado | Evidencia y tratamiento |
| --- | --- |
| Plataforma peatonal al oeste y sur del templo | Área OSM **733188295**, de perímetro irregular, recortada contra las partes actuales del templo, las viviendas y los accesos. Su atributo `concrete:plates` orienta un pavimento de placas, con tamaño de junta y desgaste interpretados. |
| Triángulo de la Plaça del Salvador al noroeste | Ejes de **Josefa Daroqui**, **calle de Valencia** y la vía peatonal **77445072**. El borde exterior del área caminable se infiere de esos ejes; no se presenta como un levantamiento medido. |
| Jardín interior de ese triángulo | Polígono de parque OSM **77445077**, conservado separadamente del pavimento. Su superficie cartográfica es aproximadamente **278,32 m²**. |

La descripción institucional del BIC indica que la restauración de **1991–1992** eliminó casas anejas por el lado que denomina «norte», creó una plaza y construyó una sacristía. Se conserva esa información textual, pero **no se atribuye automáticamente la demolición a ninguno de los dos polígonos actuales**. El expediente no aporta aquí una huella de derribo suficientemente registrada para identificar cada vivienda desaparecida. El plano de protección del BOE tampoco se confunde con el radio de selección del render. [BOE, pp. 77–79](https://www.boe.es/boe/dias/2008/01/24/pdfs/C00001-00128.pdf).

Las fotografías de Turisme Comunitat Valenciana orientan la lectura del frente: adoquinado inclinado, desniveles, borde bajo de piedra y vegetación junto a la fachada. No indican fecha de toma y no constituyen un inventario actual de jardinería o mobiliario. Se consultan como referencias visuales; **no se incluyen fotografías nuevas en la web**. [Ficha y galería institucional](https://www.comunitatvalenciana.com/es/valencia/sagunt-sagunto/monumentos/iglesia-parroquial-de-el-salvador-5).

## Pavimento, escaleras y adaptación al relieve

Se construyen **1.529,20 m²** de pavimento continuo: **379,63 m²** corresponden a la plataforma OSM occidental y meridional, y **1.149,56 m²** a calles y paso del triángulo noroeste. La malla contiene **1.245 triángulos, 940 vértices preparados y 627 aristas de cierre exterior**. Las superficies se recortan contra todas las huellas catastrales, patios privados, núcleo y umbral del templo, jardines, escaleras y pavimentos de los contextos anteriores.

La triangulación respeta la cuadrícula y la diagonal de la malla final del terreno de **2,5 m**. También se divide en el límite exacto de la plataforma OSM, para que la transición entre placas y adoquinado no adopte una frontera dentada por clasificar triángulos según su centro. El generador conserva una sola superficie por ubicación; el cambio de material no añade un segundo plano superpuesto.

`bindGround` vuelve a apoyar pavimentos, jardín, árboles y accesos sobre `terrain.meshHeightAt` después de la construcción del terreno final. El pavimento usa una holgura gráfica de **10,5 cm** y cierra sus bordes; el jardín usa **4,5 cm**. Estas holguras evitan conflicto visual entre superficies y no representan espesores medidos de la urbanización. El contexto **no añade parches de aplanado** ni eleva de forma general las calles o las casas. Las cimentaciones interiores del templo pertenecen al modelo principal.

Se diferencian tres accesos escalonados:

| Eje OSM | Tramo representado | Tratamiento |
| --- | --- | --- |
| **733188296** | Acceso a la plataforma, longitud aproximada 6,45 m | **7 peldaños**, según `stepCount`; barandilla donde la fuente la declara. |
| **77445074** | Borde del triángulo noroeste, longitud aproximada 12,44 m | **11 peldaños**, según `stepCount`; barandilla según la fuente. |
| **163609172**, Carrer Ben Montel | Fragmento de 19,17 m dentro del ámbito | La vía completa declara **38 peldaños**. Este fragmento incorpora **16**, repartidos proporcionalmente a la longitud: es una interpretación, no un recuento observado del tramo. La continuación exterior se conserva. |

Las cotas de los peldaños se calculan a partir del terreno bajo sus extremos y ancho. No se deduce una contrahuella histórica uniforme a partir de un modelo de elevación de resolución mucho mayor. La comprobación local del suelo inicial mantiene la distancia máxima entre suelo y cara superior de cada escalón por debajo de 0,38 m; la integración debe revisar de nuevo su encuentro con el terreno final. Las anchuras, espesores y detalles de pasamanos se declaran interpretativos. Este trabajo no certifica accesibilidad física ni habilita todavía una navegación a pie.

Las **5 vías sustituidas íntegramente** se retiran por identidad. Las **6 vías parcialmente representadas** conservan sus ejes y continuaciones; se oculta su representación genérica sólo mediante máscaras de los pavimentos o escalones efectivamente reemplazados. El área OSM 733188295 también se retira del dibujo genérico. Las máscaras no usan el perímetro de 45 m como borrado masivo. El comportamiento de la ciudad genérica sigue siendo segmentario en las juntas de transición, por lo que la prueba de vías documenta muestras interiores y exteriores sin atribuirle un recorte poligonal exacto que no implementa.

## Caserío, alturas y detalle material

Las viviendas respetan los perímetros, partes y patios presentes en el conjunto cartográfico del atlas. Ese conjunto procede de **Catastro INSPIRE**, con metadatos municipales del **21 de agosto de 2026** y descarga del **19 de noviembre de 2026**. La preparación general del atlas aplicó una simplificación topológica de 0,18 m; esta iteración conserva literalmente las filas resultantes. Es un producto derivado, no información catastral oficial ni un levantamiento nuevo de fachadas.

El render añade zócalos, aleros, remates de cubierta, huecos, carpinterías, puertas y balcones en las caras expuestas. Su disposición y color son una composición doméstica plausible. No se afirma que cada ventana, balcón o puerta coincida con una fotografía de su vivienda. Las medianeras interiores no reciben automáticamente fachadas ornamentadas. Los tonos de cubierta aprovechan el muestreo PNOA ya existente en el atlas; la fecha individual del vuelo no está verificada.

El reparto de alturas de esta selección es:

| Origen del valor mostrado | Partes |
| --- | ---: |
| Estimación IGN MDSn conservada | **85** |
| Número de plantas catastrales × 3 m | **78** |
| Altura explícita medida en fuente | **0** |
| Altura de reserva sin evidencia de plantas o MDSn | **0** |

MDSn es una estimación de altura sobre el suelo, derivada de la primera cobertura PNOA-LiDAR y muestreada en una rejilla de 2,5 m. El atlas utiliza el percentil 60 de muestras positivas dentro de la huella, con requisitos mínimos de cobertura. No equivale a la altura actual medida de fachada o alero. [Documentación IGN/CNIG](https://datos.gob.es/es/catalogo/e00125901-spaignmds-normalizado).

Se revisan dos discrepancias graves sin sobrescribir sus valores originales:

| Parte | MDSn fuente | Plantas fuente | Altura visual adoptada |
| --- | ---: | ---: | ---: |
| `cat-4056813YJ3945E_part2-0` | 3,0 m | 2 | 6,0 m |
| `cat-4056921YJ3945E_part4-0` | 3,2 m | 2 | 6,0 m |

Las estimaciones inferiores a 1,75 m por planta se marcan en `heightReview`; la escena usa el indicador de plantas × 3 m como sustitución explícita. Es una decisión gráfica revisable, no una medición. La adaptación local del relieve exige una única corrección menor de cubierta, de aproximadamente **0,224 m**, para evitar hundirla en el suelo; no se convierten las casas en pedestales ni se aplana todo su entorno.

## Jardín e integración de las vistas

El jardín mantiene su polígono fuente y un borde bajo de piedra, cuyo detalle se interpreta a partir de las fotografías. Se componen **6 árboles** dentro de esa superficie: tres copas frondosas, dos cipreses y una palmera. Sus posiciones, especies y alturas de 5,8–8 m son interpretaciones visuales; no se presentan como ejemplares individualmente cartografiados. Se verifica que los centros de plantación estén contenidos en el jardín con al menos 0,4 m respecto de su borde preparado.

El grupo `vegetation` es descendiente de `context.group` y conserva coordenadas de mundo antes de su incorporación al templo. La integración puede asociarlo al interruptor existente de vegetación. Las exclusiones genéricas se limitan a edificios y superficies sustituidas; no se utiliza un gran vacío alrededor del monumento que borre la vegetación del resto del Raval.

Los dos puntos del cuaderno permanecen en espacios públicos:

| Foco | Coordenadas geográficas | Lectura |
| --- | --- | --- |
| `salvador-plaza` | `[-0.272712615, 39.676700323]` | Plataforma occidental y meridional junto al templo. |
| `salvador-entorno` | `[-0.272735958, 39.677077614]` | Plaça del Salvador, jardín y tejido del Raval. |

El marcador de cada parada no se confunde con el objetivo de la cámara. La cámara de la plataforma apunta al espacio público alrededor de x453/z254, evitando atravesar la torre para mirar al centro de la nave. Las cuatro posiciones generales y cercanas quedan fuera de huellas edificadas, con una separación horizontal mínima comprobada de **2,397 m**. Sus rayos hacia los objetivos se comprueban contra iglesia, caserío, jardín, calles y terreno. Son encuadres orbitales cercanos y generales, no una simulación de peatón con altura física fija.

## Recursos, validación y reproducción

La implementación concentra el contexto en **17 mallas y 54.783 triángulos** en la validación local. El número de mallas agrupa los materiales y componentes; no significa que cada casa esté reducida a una caja. Los recursos pertenecen a la instancia, los materiales de placas y piedra se restauran al salir del modo de lectura y `bindGround` no acumula geometrías ni materiales. La eliminación de una instancia no invalida otra escena.

Los resultados reproducibles se guardan en `research/validation-v16/`:

- `salvador-context-pavement-qa.json`: cobertura y ausencia de superposiciones con tolerancia de 0,001 m². La diferencia entre superficie preparada y triangulada queda por debajo de 0,000054 m²; patios privados: 0 m².
- `salvador-context-qa.json`: **58 comprobaciones aprobadas**, datos fuente inmutables, propiedad, alturas, materiales, recursos, peldaños y adaptación al suelo. **4.980 muestras** de caras, bordes y centros verifican el pavimento; el error máximo de apoyo es aproximadamente **0,0000031 m** respecto de su holgura declarada.
- `salvador-street-overlap-qa.json`: **7 condiciones aprobadas**; 18 muestras interiores de las 6 vías parcialmente sustituidas quedan sin calzada ni bordillo genérico duplicado, y se conserva una muestra exterior de cada una de esas seis vías.
- `salvador-context-cameras-qa.json`: las **4 vistas** de los dos focos despejan la geometría local y el terreno, con separación de fachadas superior a 2 m. La aplicación completa tiene una comprobación de integración independiente.
- `salvador-context-source-plan.png`: plano de huellas, propietarios, jardín, plataforma, escaleras y focos. El color de la plataforma sigue su límite fuente exacto.

Para reproducir la preparación se necesita Shapely 2.1 o posterior; para el plano, Matplotlib. La web publicada no carga Python. Las comprobaciones de render usan Three.js del repositorio mediante `research/validate_loader.mjs` y Canvas del entorno de trabajo.

```sh
python research/validation-v16/prepare_salvador_context.py
python research/validation-v16/render_salvador_context_plan.py
node --experimental-loader ./research/validate_loader.mjs research/validation-v16/validate_salvador_context.mjs
node --experimental-loader ./research/validate_loader.mjs research/validation-v16/validate_salvador_street_overlap.mjs
node --experimental-loader ./research/validate_loader.mjs research/validation-v16/validate_salvador_context_cameras.mjs
```

La geometría y las pruebas numéricas no sustituyen la revisión visual de la aplicación ni miden su rendimiento WebGL. El objetivo es una interpretación documentada y coherente con el suelo y las huellas disponibles, con sus inferencias identificadas.

## Fuentes y atribuciones

- [Dirección General del Catastro · INSPIRE](https://www.catastro.hacienda.gob.es/webinspire/): partes edificadas, parcelas y patios; datos derivados del conjunto del atlas.
- [OpenStreetMap · plataforma 733188295](https://www.openstreetmap.org/way/733188295), [jardín 77445077](https://www.openstreetmap.org/way/77445077), [acceso 733188296](https://www.openstreetmap.org/way/733188296), [escalera 77445074](https://www.openstreetmap.org/way/77445074) y [Carrer Ben Montel 163609172](https://www.openstreetmap.org/way/163609172): © OpenStreetMap contributors, ODbL 1.0. Se utiliza la captura previamente incorporada al atlas, sin afirmar que cada etiqueta sea una comprobación de obra actual.
- [IGN/CNIG · MDS normalizado](https://datos.gob.es/es/catalogo/e00125901-spaignmds-normalizado) y [PNOA Máxima Actualidad](https://www.ign.es/wms-inspire/pnoa-ma): relieve, estimaciones de altura y contraste de ortofoto; atribución IGN/CNIG conforme a la licencia de los datos del atlas.
- [BOE, suplemento del 24 de enero de 2008, pp. 77–79](https://www.boe.es/boe/dias/2008/01/24/pdfs/C00001-00128.pdf): descripción del templo y transformación de su entorno en 1991–1992.
- [Turisme Comunitat Valenciana · Iglesia Parroquial de El Salvador](https://www.comunitatvalenciana.com/es/valencia/sagunt-sagunto/monumentos/iglesia-parroquial-de-el-salvador-5): carácter visible del frente, pavimentos, desniveles y jardín. Fotografías consultadas como referencia, no incluidas en el producto.
