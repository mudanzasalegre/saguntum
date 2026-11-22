# Simulador 3D territorial

La entrada es [Simulador 3D — Explora Sagunto](https://saguntum-atlas-3d.monmode.chatgpt.site/#simulador). La portada se abre en [Atlas vivo](https://saguntum-atlas-3d.monmode.chatgpt.site/#atlas).

## Ver un lugar con el acabado del Atlas

Al elegir un lugar en el buscador, el simulador adopta el encuadre general de su visita. En 26 destinos se puede pulsar el nombre de una parada exterior para acercarse. **Visita patrimonial** lleva a la misma parada del Atlas. **Volver al simulador** recupera la cámara, la luz y la presentación del terreno. Se puede compartir una parada con un enlace directo. [Soportales de la Plaça Major](https://saguntum-atlas-3d.monmode.chatgpt.site/#simulador/plaza-mayor/plaza-soportales)

**Capas y luz** permite elegir la luz dorada o la diurna del Atlas, o mover la hora solar para recorrer un ciclo de día y noche. **Natural del Atlas** aplica el tratamiento de la fotografía que emplea la visita. **Ortofotografía PNOA** permite leer el vuelo de referencia. Las 23 fábricas de entorno cargan las manzanas, los pavimentos y los jardines propios de cada visita y ceden su sitio a la cartografía territorial al alejarse. [Integración de las geometrías originales](../research/contextos-nativos-simulador.md) · [Pruebas comparadas en WebGL](../research/validation-atlas-parity/README.md)

### Datos que aportan detalle a las calles y al paisaje

| Capa | Evidencia y precisión |
| --- | --- |
| Fachadas y cubiertas | Las relaciones entre las 44.838 partes de edificios permiten distinguir frentes expuestos, patios y medianeras. Se han ajustado 152 cubiertas inclinadas con el MDSnE de edificios. Los huecos, colores y carpinterías del tejido ordinario son interpretaciones tipológicas. [Método, umbrales y vistas a pie de calle](../research/paridad-arquitectura/README.md) |
| Relieve regional | Los seis MDT del Atlas se reproyectan a la malla territorial de 2 m en Sagunto y 5 m en los otros ámbitos. La malla 3D próxima alcanza un espaciado de 4 m en estas zonas. Los bordes se funden con el relieve territorial. En 81 puntos interiores por ámbito, el error de remuestreo en el percentil 95 varió entre 0,076 y 0,119 m respecto al MDT de la visita. La precisión geográfica sigue dependiendo del levantamiento de origen. [Índice, fuentes y mallas](../dist/assets/territory/atlas-relief/index.json) |
| Arbolado | Se localizaron 58.628 agrupaciones candidatas a copa en el corredor estudiado con el MDSnV del IGN y la fotografía PNOA. Se filtran las huellas de edificios, la red de transporte y los árboles ya cartografiados. Una agrupación puede reunir varios árboles. La altura aproxima la superficie vegetal detectada, mientras la forma y la especie son interpretativas. [Consultas, extensiones y huellas digitales](../dist/assets/territory/canopy/index.json) · [Política de datos del IGN](https://www.ign.es/web/ign/portal/politica-datos) |

La medición de escritorio con Chrome, una RTX 3090 y una ventana de 1440 × 900 registró 16,7 ms de mediana y 16,8 ms en el percentil 95 en seis vistas estabilizadas. La panorámica empleó 155 llamadas de dibujo. El ensayo táctil en ventanas de 390 × 844 y 820 × 1180 comprobó la visibilidad de los tres núcleos y el desplazamiento en vuelo. Queda pendiente la medición en Safari sobre iPhone o iPad físicos. [Mediciones por vista](../research/validation-atlas-parity/rendimiento/mediciones.json) · [Recorridos en escritorio, móvil emulado y alternativa 2D](../research/validation-atlas-parity/flujo.json)

Para reproducir la preparación se requieren Python, NumPy, SciPy, pyproj, Shapely, Pillow, requests y tifffile. La exportación de encuadres y el recorrido de comprobación usan Playwright con Chrome. Desde la raíz del repositorio, con `dist/` servido en el puerto 8317, la preparación y las comprobaciones se reproducen con los siguientes comandos.

```powershell
python research/prepare-atlas-relief.py
node research/check-atlas-elevation.mjs
python research/prepare-atlas-canopy.py
python research/export-atlas-framing.py --base http://127.0.0.1:8317/
python research/check-atlas-presentation.py --base http://127.0.0.1:8317/ --out recorrido.json
```

La revisión gráfica posterior a la primera publicación sustituye el panorama inicial de 1.990 partes por un nivel progresivo de 15.862, incorpora fotografía de terreno y cubiertas, y actualiza la representación de arquitectura, calles, arbolado, cielo y mar. [Implementación y procedencia de los materiales](GRAFICOS.md) · [Capturas comparables y validación WebGL](../research/validation-visual/README.md)

## Punto de partida

Se abrió el repositorio original de Sites en su versión 32, commit `568bb3627fa6ed0c21c123e7b89a14aa50415cd7`. Los árboles Git de `dist/` y `research/` coincidían con los de la copia de GitHub. Se revisaron el enrutamiento por fragmento, las fábricas de patrimonio, los controladores de visita y sus fuentes, la carga y retirada de regiones, la alternativa 2D, los materiales de costa y el muestreo de las mallas.

La versión 32 usa una proyección local centrada en 39,679° N y 0,278° O y carga maquetas regionales recortadas, cada una con límites de cámara. Presenta 31 lugares en seis ámbitos y 27 fichas con visita guiada detallada. Diana y Berenguer comparten arquitectura, al igual que las dos visitas al pantalán. El simulador relaciona sus dibujos locales con el nuevo terreno mediante transformaciones calculadas en cada anclaje. La portada, las vistas regionales y las paradas siguen usando el enrutador original.

## Explorar

- **Vista aérea** permite girar, desplazar y acercar con el ratón o con dos dedos. **Panorámica** encuadra los núcleos histórico, portuario y del Grau Vell.
- **Vuelo libre** usa WASD, arrastre para mirar y E/Q para ganar o perder altura. Mayúsculas acelera. En pantalla táctil se usan la palanca, el arrastre sobre la escena y los botones de altura.
- **A pie** busca un camino público cercano, mantiene la cámara a altura humana y comprueba los sólidos catastrales, los patios, el mar y las ventanas arqueológicas. Los puentes utilizan una cota estimada entre estribos. El mapa y el buscador permiten salir de cualquier emplazamiento.
- **Recorrido territorial** sigue una polilínea de 9,682 km formada por 172 aristas entre Plaça Major, Alto Horno y Fortín. El mapa muestra la ruta, la cámara y su orientación. **Ver municipio** amplía la cobertura al término completo.
- **Visita patrimonial** abre la ficha original. **Volver al simulador** recupera posición, orientación, modo de cámara, hora, capas y calidad de la misma pestaña. Al entrar en el simulador se libera el contexto WebGL anterior.
- **Capas y luz** incluye hora solar, densidad gráfica, edificios, vías, vegetación, patrimonio, rótulos y actividad. En el navegador sin WebGL se muestra la ortofoto con mapa navegable, buscador y accesos a las visitas y sus planos.

## Construcción del mundo

| Componente | Implementación |
| --- | --- |
| Entrada y coordinación | `dist/js/entry.js` y `territory.js` seleccionan el modo, conservan el estado y coordinan cámara, carga, reloj y telemetría. Un solo renderizador está activo por documento. |
| Georreferenciación | `territory-coordinates.js` proyecta a ETRS89 / UTM 30N. Origen en E 730000 y N 4395000. X hacia el este, Z hacia el sur, Y en metros de altitud ortométrica. |
| Suelo | `territory-ground.js` combina MDT25 y MDT05 remuestreado a 10 m en el corredor. Agrupa las mallas lejanas y refina las próximas, conserva el contacto entre niveles y adapta el suelo al mar y a los yacimientos. `territory-ortho.js` carga recortes PNOA de las ortofotos regionales originales al aproximarse. |
| Edificios | `territory-stream.js` activa celdas de 500 m. Un trabajador triangula cubiertas con patios y fachadas. El panorama emplea 1.990 partes simplificadas y ortofoto. Los sectores próximos conservan los anillos completos. Se ocultan los intervalos de índices de partes sustituidas por patrimonio. Los materiales usan color de cubierta PNOA cuando existe. Las cubiertas a dos aguas de plantas rectangulares industriales, agrícolas o bajas con teja son una interpretación tipológica. `territory-facades.js` instancia detalles sobre fachadas residenciales expuestas. |
| Movilidad y paisaje | `territory-network.js` carga 196 celdas viarias de 1 km. Dibuja líneas, aceras etiquetadas, cruces orientados, recintos y objetos. Las aristas dirigidas conservan sus nodos y restricciones simples de giro. Coches y peatones comparten geometría instanciada. La semilla sólo afecta a la actividad. |
| Patrimonio y mar | Los módulos `territory-heritage*` reutilizan los constructores del Atlas y los preparan por proximidad. Se conservan sus fuentes, fases y anclajes. `territory-sea.js` extiende el sistema de agua del pantalán al polígono marítimo continuo con huecos. |
| Cámara y luz | `territory-camera.js` comparte OrbitControls con el Atlas y añade peatón, vuelo y recorrido. `territory-atmosphere.js` da una trayectoria solar equinoccial a la latitud de Sagunto, con cielo, bruma, luz rasante, noche y sombras próximas. |
| Interfaz | `simulator.html`, `territory.css` y `territory-map.js` ofrecen controles en español y mapa ortorrectificado. Las descargas de la experiencia pública se sirven desde el propio sitio. |

Los trabajadores, la caché espacial, la geometría agrupada y la liberación de sectores limitan el trabajo del hilo principal. La modalidad automática ajusta radio de detalle, número de sectores, píxeles, sombras y actores según el dispositivo y el tiempo de fotograma observado. Al optimizar la carga del Atlas original se indexaron geográficamente sus polígonos de exclusión de edificios, calles y arbolado. Los predicados finales y la geometría patrimonial de las visitas se conservan.

## Precisión y lectura histórica

Las huellas, patios, ejes, límites, líneas costeras y MDT tienen procedencia cartográfica. El marco contiene el término municipal del ICV, de 134,058 km², y un margen de continuidad paisajística. El grafo parte de la delimitación OSM y conserva el borde del delta. El Palancia se representa como corredor mediterráneo de lecho habitualmente seco hasta la desembocadura junto a Canet. [Documentación de la red y del río](../research/network.md)

De las 44.838 geometrías urbanas, 22.659 usan una altura estimada con el modelo normalizado de superficie, 22.053 emplean plantas, dos usan un atributo OSM y 124 usan una hipótesis tipológica. Son partes o volúmenes, con 12.666 edificios padre en Catastro. Las alturas individuales, acabados, huecos, balcones, anchuras sin etiqueta, tableros de puente y alumbrado visual tienen el grado de precisión de su método. La ortofoto conserva sombras de la fecha de vuelo. La capa dinámica representa actividad simulada. El detalle de accesibilidad, semáforos y restricciones condicionales depende de la información disponible. [Cartografía, licencias y reproducción](../research/territory/README.md)

El estado inicial es contemporáneo. Las opciones históricas se ofrecen por lugar con su periodo y documentación. Las reconstrucciones que necesitan secciones o cortes se abren en la parada original. [Anclajes, sustituciones y épocas](../research/territorial-heritage.md)

## Reproducción y verificación

Servir `dist/` desde HTTP con `python -m http.server 8000 --bind 127.0.0.1 --directory dist`. Abrir `http://127.0.0.1:8000/#simulador`. Los recursos derivados y el trabajador patrimonial compilado ya están incluidos. Las recetas de adquisición conservan caché, procedencia, fecha, licencia y suma de los originales. Usar las instrucciones de cartografía y red anteriores para actualizar una fuente.

```sh
node research/territorial-coordinates.mjs
python research/territory/validate.py --report research/territory/validation.json
python research/network_validate.py
node research/validate-territory-heritage.mjs
python -m pip install playwright
python research/territorial-browser.py --base http://127.0.0.1:8000/ --out research/validation-territory/rtx3090
python research/territorial-browser.py --base http://127.0.0.1:8000/ --mobile --out research/validation-territory/movil
python research/territorial-browser.py --base http://127.0.0.1:8000/ --mobile --fallback --out research/validation-territory/sin-webgl
python research/territorial-metrics.py --base http://127.0.0.1:8000/ --out research/validation-territory/rendimiento
```

Las pruebas con Playwright utilizan Chrome instalado. Se comprobaron nueve posiciones UTM, seis distancias, 71.962 pares de huellas y las costuras del MDT. El máximo solape geométrico residual es 0,000004884 m² y el salto máximo entre mallas es 4 cm. La validación del grafo comprobó extremos, continuidad de ruta, conflictos con edificios y 796 árboles. Las pruebas de patrimonio renderizaron las 29 construcciones y el agua en WebGL. Las pruebas de interfaz cubrieron la vuelta a la visita y restauración de cámara, el recorrido, las capas, la noche, el vuelo, el mapa, el cambio de época y la alternativa 2D.

Las capturas proceden del navegador. Las mediciones incluyen seis vistas a 1440 × 900 en la RTX 3090, con mediana y percentil 95 de 119 intervalos entre fotogramas, sectores, triángulos, llamadas de dibujo y memoria disponible. La memoria JS registrada depende de las estimaciones de Chromium y excluye la memoria de vídeo. Las pruebas de interfaz móvil utilizan un viewport de 390 × 844 en Chrome de escritorio. Se verificaron además los tres anclajes visibles y el vuelo con gestos táctiles a 390 × 844 y 820 × 1180. Queda pendiente la medición con Safari en iPhone y iPad físicos. [Mediciones por vista](../research/validation-territory/rendimiento/mediciones.json) · [Capturas y resultados](../research/validation-territory/)
