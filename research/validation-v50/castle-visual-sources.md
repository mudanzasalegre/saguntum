# Castillo de Sagunto — contraste visual para V50

Revisión realizada el 26 de noviembre de 2026. Este documento registra qué se ha visto, qué se puede trasladar al modelo actual y qué sigue siendo una aproximación. Las fotografías de trabajo permanecen fuera de `dist`; no se redistribuyen imágenes de terceros como texturas.

## Decisiones de geometría

| Elemento | Evidencia utilizada | Decisión y precisión |
| --- | --- | --- |
| Torre del telégrafo de la Ciudadela | Inventario IPCE, registro L2_32; fotografías cercanas del propio autor de Castillos Ricsol | Añadir el volumen conservado en longitud −0.281978, latitud 39.676237; planta documentada de 5,7 × 5,7 m. No es una reconstrucción de la desaparecida torre romana de Hércules. |
| Alzados de la torre | IPCE describe dos niveles sobre zócalo, vanos al norte y al sur, caras este y oeste macizas; fotografías `tel-sagunto-1.jpg` y `tel-sagunto-3.jpg` inspeccionadas | Mampostería irregular, ladrillo en aristas, jambas y banda entre niveles. Cubierta y coronación incompletas. Cuerpo visible estimado en 5,5–6 m sobre el arranque de puerta; zócalo sur visible de alrededor de 2 m. Estas alturas son estimaciones visuales, no cotas del inventario. |
| Silueta de Estudiantes y Ciudadela | Fotografía `sagunto-73.jpg`, vista desde el este, inspeccionada | Diferenciar paños, merlones visibles y coronaciones. La torre del telégrafo destaca en lo alto. No aplicar un almenado uniforme al conjunto del castillo. |
| Muralla norte de Estudiantes y ladera | Fotografía `sagunto-65.jpg`, inspeccionada | Muros en cremallera con adarve y remates localizados, apoyados en una ladera irregular con roca aflorante. Vegetación baja en el recinto y pinos fuera del borde norte. El MDT y la ortofoto ya representan la forma general: no añadir rocas o árboles al azar ni otra envolvente del cerro. |
| Suelo del foro y Armas | Fotografía `sagunto-33.jpg`, inspeccionada; Plan Director de 2000, hoja 80, planta y foto del foro vistas | Explanada aterrazada de tierra/grava y restos arqueológicos bajos. La revisión final nivela el polígono central existente mediante `castle-ground.js`, con cota estimada del borde sur/oriental del MDT y transición de 4 m. Se mantienen fuera las excavaciones del templo y de la basílica. El acabado es granular, sin retícula ni juntas geométricas. La documentación no aporta una cota arqueológica exacta de la plataforma. |
| Caminos | Trazas cartográficas existentes y comunicado municipal del 10 de noviembre de 2025 | Conservar las trazas ya modeladas. La obra ejecutada descrita en2025 incluye grava redondeada y marcos de tablones con forro metálico. No presentar como construido el proyecto de reparación anunciado en febrero de 2026. No se añade un segundo sistema de caminos. |
| Historia del conjunto | Plano español de 1811 y vista del fuerte, originales del SHD digitalizados por el Archivo Municipal, inspeccionados | Sirven para explicar distribución de recintos, ladera, frente de asedio y diferencias históricas. El plano combina obra antigua, construida y proyectada: no convertir todos sus edificios o líneas en estructuras actuales. |

## Fuentes primarias y referencias visuales

### 1. IPCE: torre del telégrafo conservada

- Ficha del proyecto: <https://www.cultura.gob.es/planes-nacionales/en/planes-nacionales/patrimonio-industrial/actuaciones/red-telegrafia-optica.html>.
- Documento: <https://www.cultura.gob.es/planes-nacionales/dam/jcr%3Aacb2cbc4-d388-4f43-86c7-353b0aa89a45/telegrafia-optica-esp.pdf>.
- **Estudio de la Red de Telegrafía Óptica en España**, proyecto de noviembre de 2012. Enrique Capdevila Montes, con colaboración de Paula Slepoy Benites. Encargado por el Instituto del Patrimonio Cultural de España.
- Registro **L2_32, Castillo de Muviedro**. Cronología del edificio: 1849/1850. Posición: 39.676237, −0.281978. Planta: 5,7 × 5,7 m. Describe fábrica mixta de mampostería y ladrillo, huecos de observación, diferencias de cota y pérdidas parciales de parte superior y cubierta.
- La ficha se recuperó mediante la indexación del documento oficial. La descarga del PDF devolvió HTTP 429; no se atribuye un número de página ni se afirma haber visto una lámina del PDF. Las fotos cercanas del autor independiente se inspeccionaron para contrastar los alzados.
- ID de fuente acordado con la guía: `ipce-telegrafia`.

### 2. Fotografías de Ricardo / Fortificaciones de España

- Conjunto: <https://castillosricsol.es/castillo-de-sagunto/>.
- Torre: <https://castillosricsol.es/torre-del-telegrafo-12/>.
- La página del castillo identifica al autor como **Ricardo** y fecha de publicación 6 de marzo de 2022. Algunas leyendas indican fotografías de 2000 y obras en 2016. La fecha de publicación no es la fecha de toma de todas las imágenes.
- Encuadres inspeccionados: `sagunto-33.jpg` (Armas hacia el oeste), `sagunto-65.jpg` (frente norte de Estudiantes), `sagunto-73.jpg` (Estudiantes y Ciudadela desde el este), `tel-sagunto-1.jpg` y `tel-sagunto-3.jpg` (torre cercana).
- Imágenes utilizadas como registro visual del autor. No se trasladan al modelo afirmaciones históricas generales de la página sin corroboración. No se ha encontrado una licencia libre explícita: se enlazan y consultan, sin incorporarlas al sitio ni a GitHub.

### 3. Plan Director del Castillo, 2000

- Documento municipal: <https://www.sagunto.es/media/b1qd4rn2/plan-director-del-castillo_-web.pdf>.
- Estudio técnico encargado por el Ministerio de Educación y Cultura. Equipo de INTEINCO; arquitectura: Victoria Sánchez de León Robles, con Carmen Penadés Bernal; topografía: Miguel Ángel García Barbero y Antonio Brazal; arqueología: Esther Andreu.
- Hoja80: planta arqueológica del foro y fotografía desde el ángulo nordeste de Almenara. Planta y foto inspeccionadas. Permite relaciones de posición, no medir alturas actuales desde esa reproducción.
- Hojas110–112: descripción arquitectónica de plazas y relaciones entre ellas.
- El PDF público contiene un índice de planimetría en la página 143, pero las páginas siguientes son bibliografía; los separadores del reportaje fotográfico 132–138 tampoco incluyen las fotos anunciadas. **No se han consultado plantas acotadas de cada plaza dentro de este PDF** y no se atribuyen cotas a anexos no incorporados.

### 4. Archivo Municipal / Service Historique de la Défense

- Fichas y contexto de los documentos: <https://aytosagunto.es/es/ayuntamiento/areas-y-servicios/archivo-municipal/documentos-digitalizados/intervenciones-en-el-castillo-s-xix/>.
- Plano español del fuerte: <https://aytosagunto.es/media/dxdotvx1/shdgr__gr_1_v_m_248_1__0001.pdf>.
- Vista de la ciudad y la fortaleza: <https://aytosagunto.es/media/1mbf032d/shdgr__gr_1_v_n_105_3__0001.pdf>.
- Originales del período 1810–1813, difundidos por el Ayuntamiento en febrero de 2026. Ambos archivos se descargaron y se inspeccionaron mediante renderizado del PDF.
- El plano muestra el castillo alargado sobre la cresta, el teatro en la vertiente urbana, varias plazas y edificios militares, además de obra proyectada. La vista dibujada desde la ribera muestra la elevación escalonada hacia la Ciudadela y el frente de asedio occidental. Las alturas del dibujo no son un levantamiento actual.
- Crédito indicado por el Archivo para reproducción: **© Service Historique de la Défense, Vincennes**, con signatura GR1VM248 o GR1VN105 y pieza correspondiente. Los archivos completos no se incorporan al repositorio de la app.

### 5. Fotografías históricas localizadas y contrastadas por el agente de guía

- Jean Laurent, **El castillo visto desde uno de sus patios**, 1870: <https://commons.wikimedia.org/wiki/File:1870._El_castillo_visto_desde_uno_de_sus_patios.jpg>. La ficha identifica autor y fecha, dominio público. Punto de vista catalogado 39.675848, −0.276612. La foto sirve para comparar la sucesión de recintos desde Armas; no para convertir cada edificio de 1870 en fábrica actual.
- Gómez Durán, **Castell de Sagunt — Porta**, publicada en *Ilustració Catalana*, nº 254, 12 de abril de 1908: <https://commons.wikimedia.org/wiki/File:Castell_de_Sagunt_-_1908_-_Porta.jpg>. Fuente original BNE: <https://hemerotecadigital.bne.es/issue.vm?id=0001410947&search=&lang=en>. Dominio público según ficha. La imagen muestra un portal de medio punto, pero la descripción no identifica qué puerta es: no se atribuye a Almenara o San Fernando sin prueba adicional.
- Ambas imágenes fueron descargadas e inspeccionadas por el agente de guía; están registradas en la guía de fuentes. No se confunde su fecha de digitalización con la fecha histórica.

### 6. Caminos y estado de las intervenciones recientes

- Comunicación municipal 10 de noviembre de 2025: <https://aytosagunto.es/es/actualidad/2025-11-10-el-ayuntamiento-de-sagunto-pide-que-se-finalicen-las-obras-en-el-castillo-conforme-a-lo-establecido-en-la-autorizacion-patrimonial-y-arqueologica/>.
- Comunicación municipal 24 de febrero de 2026: <https://aytosagunto.es/es/actualidad/2026-02-24-el-ministerio-de-cultura-elaborara-un-plan-director-para-la-actuacion-integral-sobre-el-teatro-romano-y-el-castillo-de-sagunto/>.
- La primera distingue pavimento proyectado y ejecutado; la segunda anuncia un proyecto para corregir recorridos. No se ha encontrado en estas fuentes una certificación visual de esa segunda obra terminada.
- La fotografía de la noticia de febrero de 2026 descargada como `restauracion-2026.jpg` muestra una comparecencia ante Santa María, **no el castillo**. Fue descartada como referencia geométrica.

## Límites de la revisión

La mejora reproduce la fábrica conservada que respaldan los planos de situación y las fotografías, con alturas interpretativas declaradas. No se ha obtenido un levantamiento fotogramétrico nuevo, ni una campaña fotográfica fechada en noviembre de 2026, ni un modelo métrico del subsuelo. El terreno conserva su fuente cartográfica y las trazas peatonales existentes, con una acomodación local de la plataforma central del foro. Atlas y Simulador comparten esa corrección; el nivel adoptado procede del MDT y se declara estimado, no arqueológico. El trabajo visual se concentra en siluetas, jerarquía de materiales, torre identificada y transición entre recinto y ladera.

## Comprobación tras la corrección final del foro

El informe `castle-geometry.json` registra 50 comprobaciones superadas y una geometría de 83.047 triángulos en 107 mallas. En los 25.315 triángulos de las superficies examinadas no se detectan centros por debajo de la malla final; su separación mínima es de aproximadamente 3,316 cm. Esta verificación comprueba la coherencia geométrica del terreno acomodado, no la exactitud de su cota respecto a un levantamiento arqueológico.
