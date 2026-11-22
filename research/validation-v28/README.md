# V28 · Antiguo Economato y entorno

Esta iteración añade la visita del Antiguo Economato al atlas existente. Conserva la identidad de SAGUNTUM, la portada territorial, los 31 lugares y las seis regiones. El Economato sigue siendo el lugar 20 del catálogo; su visita se suma a las 21 visitas guiadas anteriores.

## Arquitectura y documentación

La referencia principal es la configuración posterior a la reforma de 1954: tres cuerpos a dos aguas, dos pórticos adintelados entre ellos, pilares octogonales y una galería transversal. Las fotografías históricas de CONTRAST/UV y las imágenes municipales de enero de 2026 han guiado ventanas, remates, estructura interior y cuerpos bajos posteriores.

La guía reúne 20 paradas, seis puntos interiores, 40 hechos breves con referencias, 17 fuentes y diez hitos. Los interiores y detalles no medidos se declaran interpretativos. El semisótano se explica desde el exterior. Las imágenes municipales de proyectos de 2019/2022 se identifican como propuestas, sin convertir sus nuevas instalaciones en estado actual del edificio.

La sección retira las cubiertas y techos altos, conserva el forjado entre plantas y muestra el primer piso. Los anexos bajos sin una distribución interior documentada permanecen cubiertos. Los planos por planta se registran desde la geometría implementada, con las mismas paradas y metadatos de sección.

La investigación y sus límites están desarrollados en `../economato-research.md`, `../economato-model.md` y `../economato-context-research.md`.

## Entorno e integración

Se refinan siete partes catastrales vecinas de seis parcelas y se añaden ocho posiciones de arbolado contrastadas con ortofoto. Las superficies inmediatas ocupan 1.885,71 m². De ellas, 759,15 m² se reasignan desde cuatro superficies de Gerencia mediante un recorte acotado; el resto completa huecos de suelo próximos al edificio.

La corrección del cerramiento elimina exclusivamente el tramo de 54,60 m que el contexto anterior interponía ante la fachada. Las fotografías históricas muestran su relación directa con la acera. Se preservan los extremos del cerramiento, las vías, senderos, edificios, árboles y mobiliario anteriores. Los contextos de Begoña, Casino, Museo Industrial, Talleres y Horno permanecen en sus versiones anteriores.

`economato-gerencia-ownership-transfer-qa.json` registra hashes de entrada y salida y 41 comprobaciones de la transferencia. El plano serializado de Gerencia recibe el mismo recorte de cuatro superficies para mantener coherencia con la escena.

## Verificación

Los informes separados documentan los resultados de arquitectura, contexto, registro de fuentes, mapas Canvas, controladores de visita, recursos de distribución e integración del Puerto. Las vistas CPU importan la geometría real exportada desde esa integración, incluidas posiciones, normales, materiales, texturas, sombras y cámaras. Cada render conserva sus hashes de entrada.

Las comprobaciones de navegador y WebGL siguen sin verificarse: el estado de la previsualización es detenido y no se ha observado recuperación de los errores previos. Se ha respetado el diagnóstico existente, sin reintentar otra ruta de navegador. Los renders CPU permiten revisar geometría y composición, pero su iluminación aproxima la aplicación y no acreditan rendimiento GPU ni disposición de interfaz en un navegador real.

### Resultados sobre las fuentes finales

| Comprobación | Resultado |
|---|---:|
| Arquitectura, huecos, forjados, escalera y cámaras interiores | 276/276 |
| Fuente cartográfica y cobertura del entorno | 12/12 |
| Transferencia acotada desde Gerencia | 41/41 |
| Módulo de contexto y ajuste al terreno | 43/43 |
| Línea de vista posterior corregida | 4/4 |
| Cámara de la avenida: vista general y acercamiento | 8/8 |
| Registro documental, niveles y referencias | 18/18 |
| Mapas Canvas, plantas, temas y objetivos de interacción | 98 casos |
| Navegación y progreso independiente de 22 visitas | 55/55 |
| Distribución, JavaScript, módulos, JSON y referencias locales | 567/567 |
| Conservación de lugares y contextos anteriores | 15/15 |
| Escena completa del Puerto y cámaras reales de la aplicación | 782/782 |

La integración evalúa 126 combinaciones de parada, sección, acercamiento y tamaño de pantalla. Utiliza el constructor y los presets de producción, e incluye 31 lugares del atlas y nueve lugares industriales. El informe final no contiene errores y conserva los hashes de 55 fuentes de producción.

La revisión visual corrigió tres composiciones: el conjunto se observa desde una diagonal elevada, la fachada desde su acera y la avenida desde Gerencia. Los tres cuerpos y sus pórticos quedan legibles, y el acercamiento del entorno mantiene el corredor de la calzada. La cámara posterior utiliza el espacio entre dos copas. No se retiró arquitectura ni arbolado para despejar las vistas. También se corrigió el desembarco de la escalera y se verificó su altura libre de dos metros en los veinte peldaños. Un revestimiento inferior liso separa el techo de la planta principal del pavimento de la planta alta, con comprobaciones por rayos de ambos materiales y del hueco de escalera.

La revisión visual de los siete renders CPU está completada en `visual-review.json`. Se verificaron los hashes de las 55 fuentes de producción y los de cada geometría, script e imagen final. La primera inspección y sus hallazgos se conservan en `initial-visual-review.json` y `initial-renders/`.

Vistas finales: [conjunto](economato-conjunto.png), [fachada](economato-fachada.png), [nave central](economato-nave-central.png), [galería](economato-galeria.png), [primer piso](economato-planta-alta.png), [avenida](economato-entorno.png) y [sección](economato-seccion.png).
