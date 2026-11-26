# Castillo v51 · Foro y Puerta de Almenara

Estas comprobaciones usan los módulos publicados de `dist/`, el terreno final del
Atlas y el constructor real del Simulador. Los informes JSON registran el resultado
de cada ejecución; este documento no sustituye a esos resultados.

## Geometría y terreno

```sh
node research/validation-v51/validate-forum-almenara.mjs
```

Produce `forum-almenara-qa.json` y devuelve un código de salida distinto de cero
cuando hay fallos. Comprueba los siguientes riesgos concretos:

- Paso de Almenara: suelo real, continuidad, gálibo de 1,8 m y rayos de cuerpo
  durante todo el recorrido declarado, incluidos ambos accesos. Cruza la
  arquitectura con los triángulos reales del terreno; no supone un suelo plano.
- Dos óculos: abertura física y espesor de la fachada, medido desde ambos lados.
- Tres saeteras orientales: abertura física mediante nueve rayos por hueco.
- Foro: superficies independientes visibles, sin enterramientos ni saltos
  interiores accidentales. Los bloques arqueológicos no se clasifican como suelo.
- Muros conservados: soporte real del terreno o del rellano elevado. Los muros de
  la curia pueden penetrar en su rellano; no se exige que descansen en el MDT.
- Conservación de los 18 identificadores del Castillo y de los datos de las otras
  31 visitas, comparados con la versión de Sites `f765f4a96948d6c045813b5f94adab39e2782f07`.

Los contratos `qa.almenara` y `qa.forum` localizan las muestras, pero las medidas
de apoyo, intersección, grosor y continuidad se realizan sobre las mallas reales.
Los fallos guardan coordenadas para distinguir un problema geométrico de un
problema de interpolación del terreno.

El espesor de los óculos se mide inmediatamente por delante y por detrás del
frontis, separándolo del parapeto y la escalera posteriores. El desembarco de la
curia se verifica con rayos sobre el rellano compartido; no necesita una segunda
tapa coplanar ni triángulos cuyos centroides estén dentro de ese pequeño sector.

## Constructor del Simulador

```sh
node research/validation-v51/validate-castle-simulator.mjs
```

Produce `castle-simulator-qa.json`. Compara los buffers de geometría y su registro
métrico con el Atlas; comprueba la máscara de pavimento, la cubierta peatonal
`publicDeck` y la consulta de colisión real con un caminante de radio 0,30 m.
También verifica las cotas diferenciadas del Foro con la entrada MDT sin graduar,
la conservación del terreno ya graduado y los sectores exteriores no modificados.
El segundo constructor recibe directamente el MDT sin graduar, como el worker
de producción: sus propios pisos, máscaras y colisiones se comprueban en el
pasaje y en ambos accesos. Los dos casos no tienen por qué producir los mismos
buffers en los bancos de excavación.

Los rayos que caen exactamente en una arista compartida y no encuentran ninguna
cara se repiten a una distancia máxima de 0,1 mm, registrando cada reintento. Esto
resuelve el redondeo de las mallas Float32 tras su registro métrico; no amplía la
tolerancia de altura de apoyo ni la de los escalones.

Las cotas centrales mantienen una tolerancia estricta. Las diferencias de los
puntos de borde frente al perfil analítico se registran aparte: el terreno del
Atlas interpola una malla de 2,5 m y el relieve del Simulador una de aproximadamente
1,25 m. La continuidad de las zonas peatonales se comprueba sobre las superficies
efectivas, independientemente de esa limitación de muestreo.

## Cámaras

```sh
node research/validation-v51/export-castle-cameras.mjs --check
```

Comprueba que las cámaras exportadas coinciden con los encuadres actuales en dos
relaciones de aspecto. **Sin `--check`, este script actualiza exclusivamente el
valor `castle` de los dos archivos de cámaras y marcos del Simulador.** Produce
`castle-cameras-qa.json` y verifica que las otras visitas permanecen intactas.

## Inspección de la geometría exportada

```sh
node research/validation-v51/export-castle-geometry.mjs --out /tmp/castle-v51.json.gz
blender -b -t 8 --python research/validation-v51/render_castle.py -- --input /tmp/castle-v51.json.gz --only castillo-foro-rasante.jpg,castillo-foro-curia.jpg,castillo-almenara-frente.jpg,castillo-almenara-reverso.jpg,castillo-almenara-paso.jpg
```

La exportación conserva los buffers Three.js y las texturas rasterizadas del
modelo. Incluye vistas de inspección y las cámaras reales del recorrido. El
renderizador genera las imágenes solicitadas y `render-inspection.json`, con
huellas de los archivos fuente e imágenes. Se deben regenerar las vistas afectadas
si cambia la geometría o una cámara utilizada.

## Vistas finales conservadas

`render-inspection.json` corresponde a los tres renders finales de esta revisión:
`castillo-foro-curia.jpg`, `castillo-almenara-frente.jpg` y
`castillo-almenara-reverso.jpg`. Sus huellas de fuente se han contrastado con el
código final. `initial-review/` conserva seis vistas exploratorias de la revisión
interrumpida y su manifiesto original; no deben confundirse con renders actuales.

La interfaz se comprobó en la vista previa: entrada territorial, apertura de
Almenara, cierre y reapertura del panel, y navegación Atlas → Simulador → Atlas
con la parada conservada. El entorno de navegador informa WebGL deshabilitado;
`preview-qa.json` distingue las comprobaciones de interfaz de las de geometría.

## Alcance

Estos procedimientos no miden el rendimiento WebGL/WebGPU ni sustituyen una
revisión de la app desplegada. Los renders de Blender sirven para inspeccionar la
geometría exportada; no son capturas del navegador. Las pruebas geométricas tampoco
convierten las dimensiones interpretadas o las restituciones históricas en un
levantamiento arqueológico medido. La documentación histórica conserva esas
distinciones en `research/castle-model.md` y `research/castle-history.md`.
