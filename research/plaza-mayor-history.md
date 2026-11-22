# Plaça Major y Puerta del Almudín · investigación V10

Fecha de consulta y edición: **19 de noviembre de 2026**.

## Entrega y alcance

La visita contiene **16 paradas, 48 hechos con fuente y grado de certeza, 16 hitos enlazados a paradas, 5 ámbitos y 18 referencias**. El contenido está en `dist/assets/data/plaza-mayor-visit.json`. Las 16 coordenadas coinciden con `plaza-mayor-plan.json`; son focos de cámara aproximados, no mediciones de detalle. La representación combina el espacio abierto, los frentes porticados y las calles inmediatas con Santa María ya modelada.

Se ha dado prioridad al cotejo de fichas municipales, cartografía y fotografías para la forma, y a documentación archivística o estudios con referencias para los hechos. El texto español se ha redactado para la lectura durante la exploración. Las fotografías se consultaron como referencia; no se incorporan a la aplicación ni se utilizan como texturas.

## Decisiones que cambian la representación

| Cuestión | Resolución aplicada | Evidencia |
|---|---|---|
| Localización del portal | Finca de Plaça Major 17, parcela 3459611; puerta al fondo del soportal. | `pm-pep`, página PDF 133, y placa visible en la fotografía 05 de `pm-rutas`. |
| Forma del arco | Perfil carpanel/rebajado y escudo tallado en la clave. Las medidas del modelo son estimaciones visuales. | La ficha y la fotografía coinciden; se descarta imponerle un medio punto alto por una descripción genérica. |
| Extensión del conjunto | Se incorporan las fincas 16 y 17, que faltaban en el frente heredado; se conserva la separación de los cuerpos catastrales. | Cartografía `pm-catastro` y cotejo del equipo de contexto. |
| Interior del Almudín | No se reconstruye una sala completa tras el portal. | Chabret distingue el establecimiento antiguo del edificio posterior en Abril. Su descripción de dos naves pertenece al segundo (`pm-chabret`, pp. 263–265). |
| Puerta de la Vila | Se trata como otro elemento del entorno y de la historia municipal. | `pm-chabret`, p. 357; `pm-turismo`; ubicación actual del Ayuntamiento en `pm-ayuntamiento`. |
| Venta a Múzquiz | Se adopta 1755 frente a 1775. | Rosado 2018, pp. 236–239, con referencia archivística AHNOB, Villagonzalo, C.18, D.2, ff. 6r–6v (`pm-rosado`). |
| Cronología del portal | Elemento de varias etapas, clasificado como `mixed`. | La pertenencia al patrimonio real no demuestra que toda la fábrica visible sea del siglo XIII. |
| Sección | No hay control de corte en esta versión. Se observan directamente los pasos abiertos del soportal. | El modelo no restituye interiores privados ni edificios perdidos sin planta suficiente. |

La numeración citada por Chabret corresponde a su época; no se usa como equivalencia automática de los números actuales. Tampoco se suman las diferentes descripciones de almudines para construir un único edificio imaginario.

## Registro arquitectónico consultado

El PEP es un documento escaneado. Se inspeccionaron sus imágenes además del OCR, porque este confundía números de puerta y términos arquitectónicos. La fecha de la diligencia no convierte las fotografías del catálogo en imágenes de 2026.

| Página del PDF | Referencia de finca | Uso en la investigación |
|---|---|---|
| 133 | Plaça Major 17 · 34596/11 | Portal, escudo y soportal. |
| 134 | Plaça Major 16 · 34596/12 | Continuidad de la galería. |
| 135 | Plaça Major 15 · 34596/13 | Encuentro con el tramo anterior. |
| 136–140 | Plaça Major 14–10 · 34596/14–18 | Diversidad de fachadas y alturas. |
| 179 | Plaça Major 5 · 35591/01 | Frente oriental. |
| 180 | Plaça Major 3 · 35591/02 | Referencia de alzado y apoyos. |
| 181 | Plaça Major 2 · 35591/03 | Referencia de alzado y apoyos. |
| 182 | Plaça Major 1 · 35591/04 | Referencia de alzado y apoyos. |
| 183 | Plaça Major 4 · 35591/05 | Referencia de alzado y apoyos. |
| 185 | Autonomía 2 | Identificación del edificio municipal. |

La correspondencia oriental procede de la lectura visual de las cabeceras y su cruce con las parcelas; no del orden de los resultados OCR. La maqueta evita una arcada idéntica repetida en todos los frentes y distingue piedra, pilastras y fundición.

## Paradas y criterio de geolocalización

| Orden | ID | Parada | Registro |
|---|---|---|---|
| 1 | `plaza-conjunto` | El conjunto | Foco sobre elemento o espacio cartografiado |
| 2 | `plaza-mercado` | El mercado | Ámbito de lectura, sin planta desaparecida asignada |
| 3 | `plaza-soportales` | Los soportales | Foco sobre elemento o espacio cartografiado |
| 4 | `plaza-columnas` | Los apoyos | Foco sobre elemento o espacio cartografiado |
| 5 | `plaza-epigrafia` | Las lápidas | Escalera de Santa María conservada del modelo V9 |
| 6 | `plaza-almudin` | El Almudín | Finca 17; portal contrastado con ficha y fotografía |
| 7 | `plaza-escudo` | El escudo | Finca 17; portal contrastado con ficha y fotografía |
| 8 | `plaza-abasto` | Grano y abasto | Ámbito de lectura, sin planta desaparecida asignada |
| 9 | `plaza-forn` | El antiguo horno | Ámbito de lectura, sin planta desaparecida asignada |
| 10 | `plaza-mustassaf` | Pesos y medidas | Ámbito de lectura, sin planta desaparecida asignada |
| 11 | `plaza-peixateria` | La Pescadería | Foco sobre elemento o espacio cartografiado |
| 12 | `plaza-vila` | La Vila | Ámbito de lectura, sin planta desaparecida asignada |
| 13 | `plaza-santa-maria` | La iglesia | Foco sobre elemento o espacio cartografiado |
| 14 | `plaza-cavallers` | Cavallers y el agua | Foco sobre elemento o espacio cartografiado |
| 15 | `plaza-carrer-major` | Carrer Major | Foco sobre elemento o espacio cartografiado |
| 16 | `plaza-carrer-castell` | Hacia el castillo | Foco sobre elemento o espacio cartografiado |

### El horno: límite pendiente de resolver

El estudio de Carme Rosario reproduce una fotografía del catálogo de 1985 y la identifica con el Forn de la Plaça, número 6. Esa evidencia no basta para asignar con seguridad una parcela actual al horno ni para describir su interior conservado. La parada es sectorial. Una hipótesis inicial al norte del número 5 se descartó al comparar alzados; no se ha trasladado a la geometría ni al texto público. Tampoco se alteran por esa hipótesis las casas del entorno de Santa María ya existentes en el atlas. Véanse `pm-rosario-2024`, pp. 116–117, y `pm-forns`.

### Las lápidas y las instituciones

La epigrafía se localiza en la escalera real documentada por Forner y Palomar, no en un muro nuevo de la plaza. Las atribuciones personales y la procedencia se expresan con su grado de certeza. Para las instituciones se consultaron sus propias descripciones: `pm-regantes` y el fondo archivístico `pm-caja`. Se distingue la antigüedad del riego de la constitución formal de una comunidad moderna.

## Certeza y límites del resultado

- **Documentado**: una fuente respalda el hecho o la forma descrita. No implica precisión métrica de la maqueta.
- **Interpretación**: relación funcional, volumen estimado, hipótesis académica o foco sectorial que admite revisión.
- **En debate**: categoría disponible para atribuciones sin resolución suficiente; no se utiliza para ocultar una corrección ya respaldada.

Los huecos, carpinterías, colores, cornisas y algunas cubiertas se interpretan a partir de referencias con fechas diferentes. Catastro aporta huellas y plantas; los modelos de elevación ayudan a dar volumen y relieve; las fotografías sostienen rasgos visibles. Ninguna de esas capas permite certificar por sí sola cada detalle del estado actual. El atlas presenta una maqueta documentada y explorable, con la información necesaria para identificar sus límites.

Los números de parcela sirven para el registro del modelo; no se publican nombres de titulares ni se atribuyen accesos a propiedades privadas. La cámara cercana no acredita que un recorrido físico sea accesible.

## Comprobaciones del contenido

Se verificaron IDs únicos, fuentes existentes para los 48 hechos, pertenencia de las 16 paradas a sus ámbitos, enlace de cada hito a una parada y coincidencia de las coordenadas del contenido con el plano. Se retiraron las invitaciones a activar una sección porque el modelo no la ofrece. La evaluación visual y la publicación corresponden a la integración de la aplicación.

## Fuentes consultadas

Los enlaces y localizadores también se incluyen en el JSON, junto a la nota específica de uso. Los documentos antiguos se leen como testimonios de su fecha y se contrastan con estudios posteriores.

- **pm-rutas** — Rutas Jaume I. [Plaza Mayor de Sagunto](https://www.rutasjaumei.com/es/que-ver-en-sagunto/220/plaza-mayor-de-sagunto.php) (sin fecha indicada). Texto descriptivo y galería: imágenes 01, 03, 05, 07, 09, 11 y 13.

- **pm-pep** — Ajuntament de Sagunt; Universitat Politècnica de València; Politecnico di Torino. [Plan Especial de Protección del Conjunto Histórico-Artístico de Sagunt · fichas del casco histórico](https://aytosagunto.es/media/y1zhyqmy/04-95pl_tomoi_opt.pdf) (2000). Tomo I, páginas PDF 133–140: Plaça Major 17–10, manzana 34596; 179–183: frente de la manzana 35591; 185: Palacio Municipal.

- **pm-turismo** — Delegación de Turismo de Sagunto. [Historia de Sagunto](https://saguntoturismoblog.wordpress.com/2020/06/10/historia-de-sagunto/) (2020). Apartado de reforma urbana medieval: plazas Mayor y Pescadería, calles y casas señoriales.

- **pm-chabret** — Antonio Chabret y Fraga. [Sagunto: su historia y sus monumentos · tomo II](https://archive.org/details/saguntosuhistor01chabgoog) (1888). Páginas impresas 263–265: Almudín y carnicerías; 357–358: Consejo, jurados y mustassaf.

- **pm-rosado** — Luis Miguel Rosado Calatayud / Universitat de València. [Los negocios en tierras valencianas de Miguel de Múzquiz y Goyeneche](https://revistahistoriamoderna.ua.es/article/view/2018-n36-negocios-tierras-valencianas-miguel-muzquiz-goyeneche-s) (2018). Revista de Historia Moderna 36, pp. 232–255; especialmente 236–239 y notas 20–21, 32, 38.

- **pm-rosario-2024** — Carme Rosario Torrejón. [La plaça Major de Sagunt en la història](https://lafinestramedia.es/wp-content/uploads/2024/05/llibret_vila24-114-121.pdf) (2024). Unides, units, llibret de la Falla La Vila, pp. 112–119; Forn de la Plaça en pp. 116–117; viviendas y edificios cívicos en pp. 118–119.

- **pm-forns** — Carme Rosario Torrejón. [Els forns de Sagunt i altres propietats dels Múzquiz-Goyeneche](https://carmerosariotorrejon.wordpress.com/2020/05/21/els-forns-de-sagunt-i-altres-propietats-dels-muzquiz-goyeneche/) (2020). Publicación del 21 de mayo de 2020, inventario de hornos y arrendatarios; notas 2, 4 y 5.

- **pm-lapidas** — María Forner Palanca y José Manuel Palomar Abascal / Centro Arqueológico Saguntino. [Estudio preliminar sobre las lápidas romanas de la escalera de la iglesia de Santa María de Sagunto](https://centroarqueologicosaguntino.es/wp-content/uploads/2025/08/Arse_58-74-89.pdf) (2024). ARSE 58, pp. 73–88; emplazamiento, cronología y atribución en pp. 74–76; diagnóstico y propuesta de intervención.

- **pm-regantes** — Comunidad de Regantes de Sagunto. [Historia de la Comunidad de Regantes de Sagunto](https://crsagunto.es/historia) (sin fecha indicada). Constitución en 1900 y construcción de la sede de la Plaça Major en 1971.

- **pm-caja** — Archivo Fundación Bancaja / Censo-Guía de Archivos, Ministerio de Cultura. [06. Caja de Ahorros y Socorros de Sagunto · fondo ES.46250.AFB/1](https://censoarchivos.cultura.gob.es/CensoGuia/imprimirFondo.htm?id=1752141) (sin fecha indicada). Historia institucional: fundación, primera sede y traslado de 1956.

- **pm-romano** — Turisme Comunitat Valenciana. [Sagunto romano: sigue las huellas del antiguo esplendor de la ciudad](https://www.comunitatvalenciana.com/es/mediterraneo-en-accion/sagunto-romano) (sin fecha indicada). Último apartado: fustes romanos reutilizados en la plaza porticada.

- **pm-santa-maria** — Turisme Comunitat Valenciana. [Iglesia Parroquial de la Natividad de Nuestra Señora](https://www.comunitatvalenciana.com/es/valencia/sagunt-sagunto/monumentos/iglesia-parroquial-de-la-natividad-de-nuestra-senora-2) (sin fecha indicada). Denominación, inicio de obras en 1334, organización espacial y fases del edificio.

- **pm-ayuntamiento** — Ajuntament de Sagunt. [Edificios municipales · Palacio Municipal](https://aytosagunto.es/es/ayuntamiento/edificios/) (sin fecha indicada). Palacio Municipal, C/ Autonomía 2.

- **pm-museo** — Turisme Comunitat Valenciana. [Museu Arqueològic de Sagunt](https://www.comunitatvalenciana.com/es/valencia/sagunt-sagunto/museos/museu-arqueologic-de-sagunt) (sin fecha indicada). Sede de la Casa del Mestre Peña, calle Castillo 23; evolución de la colección.

- **pm-catastro** — Dirección General del Catastro. [Cartografía catastral INSPIRE · edificios de Sagunto/Sagunt](https://www.catastro.hacienda.gob.es/webinspire/index.html) (sin fecha indicada). Buildings del municipio 46222; parcelas 34596 y 35591 y edificios del entorno.

- **pm-osm** — Colaboradores de OpenStreetMap. [OpenStreetMap · Plaça Major y calles del entorno](https://www.openstreetmap.org/way/733042234) (sin fecha indicada). Área peatonal 733042234 y huellas del frente urbano.

- **pm-terreno** — Instituto Geográfico Nacional / Centro Nacional de Información Geográfica. [Modelos de terreno MDT05 y alturas MDSnE del entorno de Sagunto](https://datos.gob.es/es/catalogo/e00125901-spaignmds-normalizado) (sin fecha indicada). Superficie MDT05 del atlas y datos MDSnE empleados por la cartografía de contexto.

- **pm-pnoa** — Instituto Geográfico Nacional / Centro Nacional de Información Geográfica. [PNOA Máxima Actualidad · ortofotografía del casco histórico](https://datos.gob.es/es/catalogo/e00125901-spaignpnoama) (sin fecha indicada). Cubiertas, ocupación del suelo y contraste del entorno.
