# V30 · Antiguo Sanatorio: espacio público y contexto urbano

## Alcance y propiedad

El modelo arquitectónico conserva la propiedad de todo el recinto definido por `port-workers.json`: edificio principal, pabellones, antiguas viviendas de facultativos, jardines, fuente, cierres y accesos. El contexto exterior no modifica ninguna de sus catorce partes catastrales ni introduce pavimento, árboles o edificios dentro de ese polígono.

El contexto desarrolla la avenida de la Hispanidad, Periodista Azzati, la avenida peatonal Doctor Fleming, la zona pública contigua al oeste y los frentes edificados próximos. El polígono OSM denominado **Triángulo Umbral** incluye tanto el recinto como el parque contiguo; se sustrae el primero antes de generar el segundo. Por ello, este nombre cartográfico no se utiliza para rebautizar los jardines históricos del Sanatorio.

Los siete contextos industriales anteriores y el del Barrio Obrero conservan sus archivos, propietarios y superficies. No se transfieren partes catastrales ni se duplican las arquitecturas ya detalladas. Los elementos listados como `sharedContext` sirven exclusivamente para comprobaciones de despeje de cámaras y copas; los siguen dibujando sus propietarios anteriores o la ciudad genérica.

## Fuentes y lectura visual

1. **IGN, PNOA Máxima Actualidad.** Ortofoto georreferenciada recuperada el 21 de noviembre de 2026: [consulta WMS](https://www.ign.es/wms-inspire/pnoa-ma?service=WMS&version=1.3.0&request=GetMap&layers=OI.OrthoimageCoverage&styles=&crs=EPSG%3A4326&bbox=39.6619%2C-0.2316%2C39.6660%2C-0.2255&width=2600&height=2100&format=image%2Fjpeg). Límites: oeste −0,2316; este −0,2255; sur 39,6619; norte 39,6660. Imagen de 2.600 × 2.100 píxeles. Se conserva en `research/validation-v30/sanatorio-context-orthophoto-reference.jpg`. La fecha de consulta no es una fecha de vuelo ni acredita el estado en una visita de campo.
2. **Dirección General del Catastro, INSPIRE Buildings.** Huellas y patios conservados de `port-cartography.json`. Los valores de altura existentes mantienen su procedencia IGN; ventanas, zócalos y ritmo de fachada del contexto son una interpretación gráfica. [Información del servicio](https://www.catastro.hacienda.gob.es/webinspire/index.html).
3. **OpenStreetMap.** Ejes, nombres de calles, enlaces peatonales y polígono de parque existentes en `port-cartography.json`, bajo ODbL. [Ámbito cartográfico](https://www.openstreetmap.org/#map=18/39.66429/-0.22875). Se conservan las coordenadas originales en cada registro viario; las anchuras de representación son aproximaciones contrastadas con PNOA.
4. **CONTRAST/APIPS, Antiguo Sanatorio de AHV.** Documenta la implantación original periférica entre naranjos y la posterior absorción por la ciudad. [Artículo y fotografías](https://www.contrastapips.com/IHACM/IBP/Port/Port_patri_sana.htm). La escena exterior representa el tejido urbano contemporáneo, por lo que no se reponen esos campos históricos.
5. **DAU Arquitectos, intervención finalizada el 21 de marzo de 2025.** [Noticia del estudio](https://www.dauarquitectosvalencia.es/noticias/finalizamos-las-obras-en-el-centro-civico-antiguo-sanatorio). La breve noticia acredita una intervención en el Centro Cívico, pero no ofrece un levantamiento público completo de su entorno. No se han deducido nuevas calles, jardines o accesos de esa noticia.

La inspección de la ortofoto distingue la vía peatonal Doctor Fleming de las calzadas rodadas y permite situar la hilera de arbolado pequeño, los paseos del parque, el espacio circular pavimentado, cruces y glorietas próximas. El espacio circular se representa como una forma pública observada; no se le atribuye una función histórica no contrastada. Las especies exactas, alturas de árboles y mobiliario exterior no se presentan como un inventario municipal.

## Construcción y terreno

Las superficies se recortan contra el recinto completo, todos los edificios cercanos, los demás monumentos y los contextos anteriores. Calzada, paseos, aceras, tierra y plantación son polígonos disjuntos. Los bordillos se generan sólo en encuentros reales entre calzada y espacio peatonal o verde; no bordean los límites arbitrarios de recorte de la escena.

El parque se extiende al oeste de `x=4100`, fuera del núcleo de terreno de cinco metros. El generador utiliza por ello las celdas y diagonales reales de la malla del Puerto: **5 m dentro del núcleo y 12,5 m fuera de él**. `bindGround` reconstruye las superficies sobre el terreno definitivo, después de acomodar las cimentaciones del modelo, con un resalto gráfico de 0,041 m. El contexto no añade cimentaciones o cambios de cota propios.

Los cinco puntos de acceso propuestos por el modelo se proyectaron sobre el borde del recinto. En bandas exteriores de 1,75 m alrededor de esos puntos, el pavimento contextual cubre el 98,2–99 % del área exterior; el pequeño resto corresponde a la separación técnica de 2,5 cm junto al límite de propiedad. Los paseos del modelo deben conectar con la cota final más 0,041 m, sin prolongar sus ejes OSM originales fuera del recinto.

Los árboles tienen centros leídos en PNOA. La hilera de Doctor Fleming se apoya sobre pequeños alcorques. El volumen completo de las copas se limita mediante la distancia a las fachadas y a los patios catastrales para evitar que entre por ventanas o invada interiores. Ningún tronco exterior se coloca dentro del recinto histórico.

## Vistas y lectura del recorrido

Cinco focos se incorporan a la visita:

| ID | Lectura |
| --- | --- |
| `sanatorio-accesos-urbanos` | Continuidad entre el recinto y las aceras/paseos de la ciudad |
| `sanatorio-hispanidad` | Avenida de la Hispanidad y el frente septentrional |
| `sanatorio-fleming` | Avenida peatonal Doctor Fleming y parque contiguo |
| `sanatorio-frente-urbano` | Edificaciones residenciales de Periodista Azzati |
| `sanatorio-ciudad-factoria` | Integración del antiguo equipamiento en el tejido urbano |

Las cámaras se elevan si una posición inicial coincide con suelo, arbolado o un edificio. La vista de Azzati se revisó con rayos sobre las mallas reales: el encuadre inicial miraba a través de una manzana. Se cambió al lado del jardín para mostrar el frente residencial desde el espacio abierto.

## Verificación reproducible

```sh
python research/validation-v30/prepare_sanatorio_context.py
python research/validation-v30/plot_sanatorio_context.py
node --experimental-loader ./research/validate_loader.mjs research/validation-v30/validate_sanatorio_context.mjs
node --experimental-loader ./research/validate_loader.mjs research/validation-v30/probe_sanatorio_context_cameras.mjs
```

El generador comprueba solapes, conservación de huellas, propietarios, triangulación, troncos y hashes de los archivos previos. El validador Three.js comprueba geometría finita, ausencia de triángulos colapsados, recursos, suelo final, cámaras, copas, selección y lectura temática con la guía real. `--geometry-only` permite una revisión preliminar antes de que exista la guía y guarda un informe diferente; no sustituye la validación completa final.

Las vistas y los datos derivados son una reconstrucción cartográfica para el atlas. No equivalen a un levantamiento topográfico, un inventario botánico actual o una prueba directa de navegador/WebGL.
