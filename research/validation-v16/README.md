# Verificación V16 · Iglesia del Salvador, plaza y entorno

Fecha de revisión: 20 de noviembre de 2026. Esta iteración mantiene la identidad general de SAGUNTUM y agrega una visita detallada del Salvador al atlas existente.

## Resultado de las comprobaciones

| Área | Resultado | Evidencia |
| --- | --- | --- |
| Escena regional real y regresión | 980 comprobaciones aprobadas; 216 combinaciones de cámara | `integrated-scene-qa.json` |
| Arquitectura del Salvador | 43 comprobaciones aprobadas | `salvador-architecture-qa.json` |
| Contexto urbano y recursos | 58 comprobaciones aprobadas | `salvador-context-qa.json` |
| Pavimento y registro | 1.245 triángulos y 4.980 muestras de apoyo | `salvador-context-pavement-qa.json` |
| Continuidad de calles | 7 condiciones aprobadas; 6 continuaciones conservadas | `salvador-street-overlap-qa.json` |
| Cámaras del contexto | 4 encuadres despejados contra templo, caserío y terreno | `salvador-context-cameras-qa.json` |
| Distribución estática | 347 comprobaciones aprobadas | `static-assets-qa.json` |
| Controladores de las diez visitas | 28 comprobaciones aprobadas | `visit-controller-results.json` |
| Documentación | 11 comprobaciones aprobadas | `salvador-visit-results.json` |
| Interfaz en navegador | Navegación, plano, cronología, fuentes, temas y marca verificados | `browser-preview-qa.json` |

## Qué se ha integrado

El modelo del templo utiliza 103 mallas y 112.568 triángulos. Incluye seis cuerpos registrados, tres tramos de nave, dos diafragmas interiores, siete nervios de cabecera, tres lancetas y tres vanos de campanas. Los yugos son de madera, según la intervención documentada de 2023. La techumbre actual se conserva al entrar en las cámaras interiores. La sección oculta las cubiertas y las bóvedas del templo; el pavimento y los edificios del contexto permanecen.

El entorno añade 163 partes de 51 parcelas, tres patios, once tramos de calle, plataforma de placas, jardín y escaleras. Las 85 estimaciones de altura IGN y las 78 derivadas de plantas conservan su procedencia; dos discrepancias se revisan explícitamente. No se añaden alturas de reserva. Las huellas de los conjuntos detallados anteriores no cambian de propietario.

El cuaderno contiene 18 paradas, 40 hechos con referencias, 19 hitos cronológicos, 19 fuentes y cinco ámbitos. Plano, fuentes y recorrido son utilizables sin WebGL. Los diez controladores mantienen estado independiente, incluidos los de la Casa dels Berenguer, Diana y la Sangre.

## Escena real y cámaras

`research/validate_sagunto_v16.mjs` ejecuta el constructor regional, la carga diferida y el cálculo de cámaras extraídos de la aplicación de producción. Se sustituyen sólo las operaciones de textura que requieren un navegador. Se crea el relieve definitivo, sus cimentaciones, las calles, el caserío y los monumentos, y se comprueba la recuperación de una carga fallida sin duplicar la región.

Las 216 variantes corresponden a las 18 paradas del Salvador y las 18 de Berenguer/Diana, en tres proporciones de pantalla y dos distancias. Se comprueban coordenadas finitas, altura sobre el terreno, encuadre y líneas de visión. En los interiores del Salvador se añaden nueve rayos próximos distribuidos en el encuadre: ninguno encuentra superficies a menos de 0,8 m. Las vistas generales pueden encontrar la cubierta del propio templo; las observaciones de la torre pueden encontrar su propia pared a menos de 3 m del objetivo volumétrico. Estas superficies esperadas se registran separadamente de las oclusiones por otro edificio, que son cero.

La primera revisión detectó casas delante de las cámaras de plaza, portada y torre. Se recolocaron las cámaras en el espacio público y se revisaron sus objetivos. No se retiraron edificios para despejar los encuadres. La revisión visual detectó solapes coplanares en las esquinas de la coronación de la torre y en las cornisas del ábside, Comunión, sacristía y anexo; se sustituyeron por encuentros a inglete. Las comprobaciones específicas registran cero superficie solapada. Se elevó 25 cm el cierre exterior de los brazos de la Comunión para eliminar una pequeña penetración de la bóveda, conservando el intradós y las cámaras; quedan 3 cm de separación mínima comprobada. Las pechinas se reconstruyeron como superficies esféricas continuas entre los arcos y el anillo de la cúpula: 36 rayos comprueban su cierre con un error máximo de 0,000019 m. Los hashes del informe integrado corresponden a entradas estables durante la prueba final.

## Renders de las mallas de la aplicación

Las siete vistas exportan posiciones, normales, UV, materiales, mapas y transformaciones de las mallas de Three.js, incluidas las instancias visibles del entorno cercano. El recorte geométrico limita el contexto de inspección a los alrededores de la iglesia. Se renderizan con Blender Cycles por CPU, a 1.440 × 1.080 píxeles y un máximo de 128 muestras; el muestreo adaptativo reduce trabajo en las superficies ya convergidas. Las texturas del templo son procedurales originales.

- `salvador-conjunto.png`: iglesia y caserío.
- `salvador-plaza.png`: plataforma y encuentro urbano.
- `salvador-portada.png`: portada, dovelas y marquesina.
- `salvador-nave.png`: nave, arcos, madera y cabecera.
- `salvador-abside.png`: presbiterio, lancetas y crucería.
- `salvador-comunion.png`: disposición interior de la capilla.
- `salvador-seccion.png`: lectura del conjunto con cubiertas retiradas.

La iluminación CPU utiliza rellenos amplios para aproximar la legibilidad de la luz hemisférica de la aplicación en el interior. No representa un inventario de luminarias reales. Estos renders sirven para inspeccionar geometría, materiales y composición: no son capturas WebGL ni imágenes generadas por IA, y no se afirma igualdad píxel a píxel con el navegador.

## Navegador y límite gráfico

La prueba de escritorio se realizó a 1.363 × 936 píxeles. Se verificaron la portada genérica, el catálogo de 31 lugares, el acceso al Salvador, el inicio del recorrido, la selección de la parada de nave desde el plano, el progreso, las cinco capas, la cronología, las 19 fuentes, el cuadro bibliográfico y las apariencias clara y oscura. `browser-preview-source.jpg` documenta el cuadro de una referencia.

El navegador de comprobación devuelve `GL_VENDOR = Disabled` y `GL_RENDERER = Disabled` al crear WebGL. Por ello se verificó su alternativa documental en 2D. La validación geométrica y los renders CPU no acreditan rendimiento GPU ni sustituyen una prueba visual de WebGL en otro dispositivo. No se alteró la política gráfica del navegador.

## Límites de representación

El edificio se apoya en la descripción BIC, la planta arqueológica parcial de 1992, las fotografías institucionales y el inventario de campanas. No es un levantamiento métrico o fotogramétrico. Las dimensiones interiores menores, el mobiliario, los acabados de la Comunión, los huecos del caserío y los árboles son aproximaciones declaradas. No se reinstalan el artesonado medieval disperso, el retablo perdido ni el remate histórico de la torre, y no se inventa una excavación abierta bajo el suelo.

## Reproducir las comprobaciones principales

Desde la raíz del proyecto:

```bash
python research/validation-v16/validate_static_assets.py
node research/validation-v16/validate_visit_controllers.mjs
node research/validation-v16/validate_salvador_documentation.mjs
node --experimental-loader ./research/validate_loader.mjs research/validate_sagunto_v16.mjs --export
blender -b --python research/validation-v16/render_salvador.py -- --scene salvador-nave --samples 128
```

Los scripts geométricos utilizan Three.js vendorizado y el adaptador Canvas del entorno de validación. El sitio publicado sigue siendo estático y no necesita Blender, Python ni paquetes de validación.
