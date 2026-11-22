# Talleres Generales · entorno cartográfico, v23

## Alcance y decisión visual

La Nave de Talleres Generales ocupa un recinto industrial abierto. El modelo de
contexto mantiene la explanada al suroeste, el frente pavimentado del sureste,
los viales perimetrales, las rotondas y el solar del noreste. Las viviendas
aparecen en su posición real al otro lado de la calle del Sindicalista Juan
Torres Casado; no se aproxima una trama residencial ficticia a la nave.

El ámbito gráfico tiene un radio de 195 m, recortado por la ortofoto de referencia
y por el contexto del Alto Horno, que conserva su propietario y recibe un margen
de separación de 0,7 m. Este ámbito de dibujo no representa un límite legal de
protección patrimonial.

## Evidencia utilizada

- [IGN/CNIG · PNOA Máxima Actualidad](https://pnoa.ign.es/). Se descargó el WMS
  `OI.OrthoimageCoverage` el 20 de noviembre de 2026. La referencia georreferenciada
  se conserva en `validation-v23/talleres-context-orthophoto-reference.jpg`.
  Su encuadre es oeste −0,22060, este −0,21600, sur 39,65480, norte 39,65785;
  resolución de consulta 1800 × 1600 píxeles. La fecha de descarga no equivale a
  la fecha de vuelo, que no se ha comprobado.
- [Dirección General del Catastro · INSPIRE Buildings](https://www.catastro.hacienda.gob.es/webinspire/).
  Se reutiliza la cartografía del atlas descargada el 19 de noviembre de 2026,
  con metadatos de 21 de agosto de 2026. Se conservan las coordenadas y los patios
  de cada parte, sin rectificar los edificios para adaptarlos a una composición.
- [OpenStreetMap](https://www.openstreetmap.org/way/154001633). Los ejes de calles
  proceden de la cartografía regional existente. Las anchuras de los viales sin
  etiqueta se estiman visualmente sobre PNOA y se identifican como interpretadas.
- [IGN/CNIG · MDT05](https://datos.gob.es/es/catalogo/e00125901-spaignmdt).
  El terreno es el de Puerto de Sagunto ya integrado en el atlas. Los pavimentos
  siguen sus triángulos de 5 m.
- [IGN/CNIG · MDSnE normalizado](https://datos.gob.es/es/catalogo/e00125901-spaignmds-normalizado).
  Las alturas de cubierta vecinas reutilizan las estimaciones raster presentes
  en la cartografía. No son alzados medidos ni certifican el estado actual.
- [BOE · Decreto 26/2024, anexos sobre patrimonio y entorno industrial](https://www.boe.es/diario_boe/txt.php?id=BOE-A-2024-9526).
  Aporta el marco histórico del conjunto; la forma de los espacios actuales se
  obtiene de la cartografía y la ortofoto, no de una reconstrucción industrial
  histórica añadida al presente.

Las condiciones de uso de las fuentes se conservan en el JSON de contexto,
incluidas la [licencia IGN](https://www.ign.es/resources/licencia/Condiciones_licenciaUso_IGN.pdf)
y la [atribución OpenStreetMap](https://www.openstreetmap.org/copyright).

## Geometría y propietarios

`talleres.js` es el propietario exclusivo de las cuatro naves y sus anexos. Las
trece partes de la parcela catastral `8437307YJ3983S` y la envolvente OSM
`154001633` se excluyen de los bloques regionales genéricos. La orientación de
los cuatro ejes de cubierta noroeste–sureste es coherente con `yaw = π/3` en las
coordenadas del atlas; no se han intercambiado los testeros y los laterales.

`talleres-context.js` añade 31 partes en cuatro parcelas residenciales reales:

| Parcela | Partes | Tratamiento |
|---|---:|---|
| `8736201YJ3983N` | 6 | Frente construido de la esquina noroeste |
| `8836301YJ3983N` | 12 | Bloque longitudinal al norte de Juan Torres Casado |
| `8836601YJ3983N` | 6 | Bloque del frente noreste, con patios conservados |
| `8836602YJ3983N` | 7 | Continuación del frente noreste |

Los registros de altura indican qué valor procede del raster, de la mediana de
otras partes del mismo inmueble o del número de plantas. En las piezas pequeñas
de cubierta con pocos píxeles útiles, la mediana del edificio evita representar
una supuesta caseta baja aislada dentro de una cubierta de varias plantas.

Los vanos, antepechos, cornisas y pequeñas diferencias de material son recursos
visuales de contexto. No se presentan como un inventario de las fachadas reales.
Las cubiertas conservan la planta y las perforaciones cartográficas; no se afirma
que su pendiente o detalle constructivo estén levantados topográficamente.

El Alto Horno, el Museo Industrial y los demás elementos patrimoniales mantienen
su implementación existente. Los edificios regionales no seleccionados se
recortan fuera de las máscaras del nuevo contexto para que sigan visibles.

## Suelo y vegetación

Se reconstruyen 60 fragmentos de viales y 57.627,31 m² de superficies. El trazado
incluye el acceso norte, las calles que rodean la nave, las isletas, las
explanadas de material distinto y las juntas curvas visibles frente al testero
sureste. Los puntos digitalizados de la ortofoto están almacenados expresamente
en el generador y en la procedencia del JSON.

Los pavimentos se intersecan con la cuadrícula y la diagonal reales de los
triángulos de terreno. `bindGround()` vuelve a situarlos sobre la malla final
regional, con una separación de 3,5 cm para evitar coincidencias de superficie.
El datum de la nave, calculado al crear el módulo, permanece fijo.

Se sitúan 49 árboles y palmeras en posiciones observadas en PNOA y diez farolas
aproximadas. Las copas, especies y alturas son interpretaciones. Los solares
mantienen su carácter abierto. No se añade una playa ferroviaria exterior porque
no se ha confirmado su trazado actual; el contenido sobre ferrocarril interior
corresponde al modelo principal y a su visita documentada.

## Integración

El módulo exporta `createTalleresContext({contextData, visitData, project,
heightAt})` y devuelve grupos, recursos propios, exclusiones, colisiones, planos,
estadísticas, `bindGround()`, selección y lectura de materiales o ámbitos.

Su única parada es `talleres-entorno`, integrada en las veinte paradas de la nave.
La cámara del entorno mira desde el sureste, reúne los cuatro testeros y permite
leer el frente residencial más allá de la nave. La escena conserva el nombre,
la navegación y las vistas regionales de SAGUNTUM.

## Verificación

- `validation-v23/prepare_talleres_context.py`: genera el JSON y diez controles
  de geometría de fuente. Los diez pasan: plantas preservadas, propietarios
  exclusivos, cobertura sin solapes y suelo fuera de edificios y del contexto
  del Alto Horno.
- `validation-v23/validate_talleres_context.mjs`: diecinueve controles del módulo.
  Los diecinueve pasan: coordenadas finitas, triangulación de patios, exclusiones,
  cámaras, lectura temática, adaptación al terreno y liberación de recursos.
- En la prueba regional, el error máximo de un vértice del pavimento respecto al
  terreno más su separación visual fue de 0,000034 m; en el centro de un
  triángulo, 0,000024 m. Estos errores numéricos no expresan la precisión
  topográfica de las fuentes.
- Un fragmento diminuto creado por intersecciones cartográficas se colapsa al
  convertirse a Float32. El módulo lo descarta; no conserva triángulos degenerados.
- El contexto se agrupa en 17 mallas. La geometría inicial comprende unas 77.700
  caras triangulares; la cifra exacta está en el informe JSON de validación.
- `validation-v23/talleres-context-source-plan.png` superpone las superficies y
  propietarios sobre la referencia PNOA. Se ha inspeccionado para comprobar el
  trazado y el mantenimiento del vacío industrial. Es un control cartográfico,
  no una captura de WebGL ni una fotografía del estado del edificio en 2026.

Los informes completos son `talleres-context-source-qa.json` y
`talleres-context-model-qa.json`, ambos en `validation-v23/`.

### Reproducción

Con Shapely 2.1 o superior y Pillow disponibles:

```sh
python research/validation-v23/prepare_talleres_context.py
python research/validation-v23/plot_talleres_context.py
node --experimental-loader ./research/validate_loader.mjs research/validation-v23/validate_talleres_context.mjs
```

El ensayo Node utiliza el cargador Three.js existente y `@napi-rs/canvas` del
runtime para las texturas procedurales. La validación integrada de la aplicación,
el modelo principal y la publicación se documentan por separado en esta versión.
