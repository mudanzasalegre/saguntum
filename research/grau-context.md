# Grau Vell · contexto del poblado, V32

## Alcance y reparto

El módulo `dist/js/grau-context.js` sustituye exclusivamente el contexto de poblado que V31 construía dentro de `coast-grau.js`. Las referencias catastrales **6910216YJ3961S** y **6910203YJ3961S**, el patio del fortín, su pozo, el foso y los ocho árboles de ese núcleo siguen perteneciendo al módulo del monumento. El contexto mantiene **51 partes catastrales** y **6 envolventes auxiliares de OSM**, la ermita y su plaza, el Carrer de Llevant y parte del acceso litoral.

Las 57 huellas se copian literalmente, sin regularizar esquinas ni unir parcelas. No son 57 viviendas: varias son dependencias, azoteas, restos o parcelas abiertas. `6910205YJ3961S_part1`, al sur del fortín, es una nave del contexto actual. No se le atribuye el interior de un lagar o una sala museística.

La API es `createGrauContext({contextData,project,heightAt})`. Devuelve los grupos `buildings`, `surfaces`, `details` y `vegetation`, exclusiones por huella/identificador, `roadReplacements`, `bindGround`, recursos propios y `dispose`. `applyCoastalVegetationMask(coastEnvironment.vegetation)` compacta únicamente las instancias de matorral litoral excluidas por la franja de playa observada; mantiene intactos el código y los recursos del agua de V31. `patches` está vacío. El enlazado final al terreno reconstruye conjuntamente arquitectura, suelo y vegetación, y libera toda la geometría previa. Los materiales y las texturas no se comparten entre instancias.

## Evidencia consultada

1. **Catastro INSPIRE**, partes conservadas en `coast-grau.json`; adquisición previa 21-08-2026. [Servicio oficial](https://www.catastro.hacienda.gob.es/webinspire/index.html). Se conservan polígonos y número de plantas, sin interpretar la fecha de adquisición como fecha de obra o levantamiento.
2. **OpenStreetMap**, consulta previa 19-11-2026. [Carrer de Llevant, way399621371](https://www.openstreetmap.org/way/399621371). Huellas auxiliares, ejes viarios y polígono de la plaza; atribución OpenStreetMap/ODbL ya presente en el atlas.
3. **IGN/CNIG, PNOA máxima actualidad**, nuevo GetMap consultado 21-11-2026. Bbox W−0.24165, S39.63345, E−0.2390, N39.63610; 2200×2700 px. La imagen de contraste está en `validation-v32/grau-context-orthophoto-reference.jpg`; el índice de huellas está en `grau-context-orthophoto-index.jpg`. La URL completa queda registrada en el JSON. **La fecha del vuelo no se conoce**: no se presenta la consulta como una fotografía de noviembre de 2026. La huella catastral prevalece sobre el desplazamiento aparente de los píxeles de tejado.
4. **BOE-A-2010-14557**, art. 7 y anexo I. [Texto oficial](https://www.boe.es/diario_boe/txt.php?id=BOE-A-2010-14557). Fundamenta el interés de las alineaciones, las fachadas tradicionales, la iglesia y el colegio, y describe la tipología de enjalbegados, huecos verticales y teja. Sus límites normativos **no se usan como una medición de las alturas actuales**.
5. **Berta26, 25-05-2016**, fotografía propia [Iglesia del Grau Vell](https://commons.wikimedia.org/wiki/File:Isglesia_del_Grau_Vell.jpg), CC BY-SA 4.0. Consultada directamente como referencia de la fachada encalada, puerta adintelada, parapeto escalonado, espadaña con una campana y crucifijo. El panel cerámico se reconoce mediante un marco neutro; no se inventa su imagen. No se redistribuye la fotografía en la aplicación.
6. **Berta26, 25-05-2016**, fotografía propia [Colegi del Grau Vell](https://commons.wikimedia.org/wiki/File:Colegi_del_Grau_Vell.jpg), CC BY-SA 4.0. Consultada directamente como referencia de las seis ventanas altas estrechas, los huecos pequeños inferiores, la cornisa, el acceso lateral y el testero de ladrillo. Se trata de evidencia fechada, no de una certificación del uso ni del acabado actual.

## Qué se ha corregido

La lectura conjunta de plano y ortofoto sustituye diez perfiles de cubierta catastrales interpretados de V31. Incluye la cubierta plana y remate de la ermita, varias azoteas claras y una cubierta ligera clara que antes se trataban todas como tejados a dos aguas. Cuatro envolventes auxiliares OSM reciben también un perfil plano o de poca pendiente observado en la ortofoto. La nave meridional conserva su huella con un perfil de escasa pendiente.

Las partes `6910101YJ3961S_part1` y `6910208YJ3961S_part1` muestran suelo abierto/vegetación en la referencia y quedan **sin tejado ni pavimento interior nuevo**. Esto no establece una fecha de demolición ni un uso legal. Las dos partes que V31 ya interpretaba como `open-remains` mantienen esa lectura, sin sembrar escombros arbitrarios.

Las cubiertas inclinadas se triangulan sobre la huella original y se cortan por la cumbrera. Este proceso respeta contornos cóncavos y posibles huecos; no se colocan cajas rectangulares sobre las parcelas. La textura de teja sigue el eje de cada tejado. Los remates de cumbrera sólo aparecen dentro de la huella. Las azoteas tienen peto bajo; no se añaden chimeneas aleatorias.

Las fachadas distinguen el frente expuesto a la calle y las medianeras. Las aberturas son huecos reales en el paño, con jambas, dinteles y carpinterías retranqueadas. Las dimensiones genéricas de casas, puertas, ventanas, cornisas, cubiertas y árboles siguen siendo **interpretaciones visuales**, identificadas en los datos. La ermita y el colegio tienen composiciones específicas según las fotografías fechadas. No se reconstruyen interiores privados.

## Suelo y vegetación

Las vías `399621371`, `290568977` y `78613678` conservan sus ejes OSM. Se sustituye la parte de Llevant hasta latitud 39.63615 y la entrada sur desde latitud 39.63345; los remanentes exteriores conservan los nodos y metadatos originales a través de `roadReplacements`. El tramo de Llevant continúa por delante del fortín y el almacén para que la unión con el vial genérico quede fuera de las celdas afectadas por cimentaciones. El ancho vuelve a 4,5 m después del giro del fortín y en los empalmes. No hay coincidencia entre estos IDs y los reemplazos del contexto del pantalán. La suma de longitudes de los tramos propios y remanentes coincide con la longitud original.

El asfalto, el acceso de grava y el pavimento de la plaza se subdividen y se ajustan al muestreador definitivo del terreno. Además de limitar la longitud de los triángulos, se comprueba el error de interpolación en sus centros y puntos medios: una subdivisión adaptativa evita que atraviesen las diagonales de la malla de terreno y queden parcialmente enterrados. Sus triángulos se recortan contra las huellas exactas de edificios, parcelas y núcleo del fortín. No se añade una plataforma horizontal al poblado ni se pavimentan patios privados. Los anchos viarios son estimaciones visuales contra PNOA, no una medición de campo.

Se digitalizan **16 copas concretas** de la ortofoto: nueve árboles y siete arbustos visibles. El JSON conserva el píxel de referencia de cada copa. Posición observable; altura, tamaño de copa y especie interpretados. No se generan árboles con distribución aleatoria. Los ocho árboles del fortín conservan su único propietario en el modelo central. Una exclusión específica de vegetación, delimitada por la franja de playa desnuda observada, suprime la hilera de árboles genéricos que se producía junto al agua; la exclusión no altera ninguna superficie o límite del mar.

## Agua y límites

Este módulo no contiene agua, playa nueva, costa, humedal, máscara litoral ni cambios en los niveles del mar. La envolvente del terreno global y todos los recursos del agua de V31 quedan bajo la verificación de integridad de la integración. La vista de contexto debe comprobarse junto al agua real del atlas; los renders CPU de la revisión geométrica no sustituyen una captura WebGL.

## Verificación reproducible

```sh
python research/build_grau_context_v32.py
node --experimental-loader ./research/validate_loader.mjs research/validation-v32/validate-grau-context.mjs
node --experimental-loader ./research/validate_loader.mjs research/validation-v32/validate-grau-context-clearance.mjs
```

`grau-context-qa.json` registra 20 comprobaciones de las 57 huellas, reparto del núcleo, partición íntegra de vías, geometría finita y sin degeneraciones, cobertura proyectada de cubiertas, cotas sobre el terreno, ausencia de árboles dentro de edificios cerrados, fachada específica del colegio, cubierta plana de la ermita, compactado de vegetación litoral y ciclo de reconstrucción/liberación de recursos. `grau-context-clearance-qa.json` comprueba diez puntos baricéntricos por triángulo contra el terreno exacto exportado de producción, con hashes de los archivos comprobados. La revisión visual del conjunto y la ermita se realiza además sobre los renders CPU de los meshes exportados de la integración V32.
