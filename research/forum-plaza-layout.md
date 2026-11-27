# Plaza del Fórum: registro espacial y entorno actual

Fecha de investigación: 27 de noviembre de 2026. Esta visita corresponde al parque urbano del antiguo solar de Quevedo, entre Huertos/Horts, Ordóñez y Remedio/Remei. Es un lugar distinto del foro situado en el Castillo.

## Geometría que se conserva y procedencia

La huella de referencia es el polígono OpenStreetMap **660194745**, identificado como Plaça del Fòrum. Se conserva su concavidad en torno a las construcciones del lado occidental y meridional. El polígono de mapa ocupa **1.532,496 m²** calculados en la proyección métrica del atlas. La intervención municipal publicada ocupa **1.608,44 m²**; las dos cifras describen ámbitos de fuentes distintas y no se fuerza una escala para igualarlas.

El registro del modelo utiliza el vértice noroccidental `[-0.2753495, 39.6808973]` y una rotación Y de `−0.2825634446` radianes. El eje `u` recorre Huertos hacia el este; `v` entra en el parque hacia el sur. Huertos queda en `v≈0`, Ordóñez en el borde oriental `u≈44`, y Remedio en el borde occidental, desde `v≈0` hasta `v≈19`. El centroide de la huella, adecuado para el marcador del catálogo, es `[-0.275139869, 39.680681104]`.

La Puerta del Circo está al noroeste, al otro lado de Huertos, y conserva su visita independiente. No se incorpora su excavación al nuevo parque.

El documento municipal de 2015 sitúa los restos a aproximadamente **2,50 m por debajo de la calle**. Esa referencia justifica el recinto rebajado. No proporciona un levantamiento de pendientes, cotas absolutas o perfiles de cada rampa; esos detalles se representan como aproximaciones.

## Cartografía visual utilizada

Se obtuvo una imagen de la capa oficial `OI.OrthoimageCoverage` del servicio WMS PNOA de IGN/CNIG. La petición contiene 1.500 × 1.500 píxeles y los límites:

| Límite | Coordenada |
|---|---:|
| Oeste | −0.27565 |
| Este | −0.27455 |
| Sur | 39.68020 |
| Norte | 39.68105 |

Se conserva la petición completa, la huella SHA256 y las condiciones de atribución en `layout.ortho`. La consulta devuelve la ortofoto más reciente que sirve esa capa, pero no expone su fecha de vuelo. **La fecha de descarga no es la fecha de adquisición.** El servicio PNOA y los datos de relieve se atribuyen a IGN/CNIG, CC BY 4.0; la geometría OSM se atribuye a sus colaboradores, ODbL 1.0.

El parque aparece ya ejecutado en esta ortofoto. Se distinguen el recinto central claro, las bandas plantadas al norte, la zona de juegos al nordeste, la conexión de rampas oriental, el paso meridional y el depósito circular. Se cruzó esta lectura con cinco fotografías municipales publicadas en septiembre de 2018. Se consultaron también la fotografía aérea anterior a la obra y la imagen de proyecto publicadas en 2015. La imagen de proyecto no se presenta como evidencia del estado construido.

Se conservan la imagen PNOA georreferenciada y su plano local en `research/validation-v52/forum-pnoa-reference.jpg` y `forum-pnoa-local-frame.png`, junto con la petición y atribución.

Las fotos municipales se utilizaron como referencias de investigación. No se han incorporado sus originales a los recursos públicos de la aplicación porque no se verificó una licencia de redistribución.

Localizadores de las cinco fotos de 2018: `https://aytosagunto.es/media/2aeb5zqp/77c_img_0088_01.jpg`, `https://aytosagunto.es/media/rntpp0zz/77img_0090_cuerpo1.jpg`, `https://aytosagunto.es/media/a3iots1i/77img_0081_cuerpo.jpg`, `https://aytosagunto.es/media/nx4a3j1v/77img_0107_cuerpo.jpg` y `https://aytosagunto.es/media/lbbpbw3b/77img_0133_cuerpo.jpg`. La pasarela también se contrastó con una foto de visitante publicada en [Aliaventuras, 28 de marzo de 2019](https://aliaventuras.wordpress.com/2019/03/28/parque-arqueologico-via-del-portic-casa-dels-peixos-sagunt/), imagen `img_20190214_131333.jpg`; la fecha del nombre del archivo no se trata como una fecha de captura certificada.

## Rasgos registrados para el modelo

Las coordenadas siguientes están en metros dentro del marco local. Los puntos de interpretación se documentan en `dist/assets/data/forum-plaza-context.json → layout`, junto a su incertidumbre y fuente.

| Elemento | Registro orientativo | Criterio |
|---|---|---|
| Recinto visible de restos | Zona central, aproximadamente `u=1…35`, `v=15…29` | Polígono irregular trazado sobre la ortofoto; las partes que rodean la medianera se mantienen abiertas |
| Muro septentrional | `(1.1,16.1) → (30.6,16.4)` | Compatible con los 29,50 m conservados publicados; trazado visible aproximado |
| Muro oriental | Segmentos de `u≈34.5`, `v≈16…27` y retorno | La publicación documenta 21,37 m conservados; no se impone esa longitud a un segmento visible sin planta arqueológica |
| Bases bajas del pórtico | `(12.14,21.47)`, `(15.46,22.08)`, `(18.42,22.14)`, `(21.32,22.22)` | Cuatro manchas/basas cuadrangulares visibles; no justifican una columnata completa |
| Depósito circular | `(27.45,21.03)`, radio visual cercano a 1,25 m | La abertura y la rejilla moderna son visibles; la identificación exacta con una noria histórica es incierta |
| Franja ajardinada norte | `v≈1…12` | Terrazas y parterres separados por recorridos, no una pradera continua |
| Juegos infantiles | `u≈31…40`, `v≈5…12` | Pavimento verde y círculos rojizos; foto de 2018 confirma tobogán, columpio y juego de muelle |
| Rampa y recorrido oriental | `(40.8,4) → (40.5,12) → (39.5,21) → (37.8,25) → (34.4,27.3) → (30,30.5)` | Planta aproximada de recorrido; perfil vertical y ancho de unos 2,3 m estimados |
| Galería metálica elevada | Frente norte de medianeraO, `u≈−2…6`, `v≈19`, pequeño retorno hasta `(7,21)` | Pasarela negra apoyada en pilares con arco antiguo visible debajo; identificación espacial cruzada con foto2019y proyecto2015 |
| Paso sur | `u≈29`, `v≈29…41` | Recorrido pavimentado entre la medianera y los parterres orientales |
| Medianeras históricas | Borde interior de la concavidad occidental y meridional | Se mantiene la fábrica visible, los huecos cegados y sus fases; no se generan ventanas domésticas sobre estos muros |
| Jardines verticales | Norte de medianeraO `u≈−2.6…1.9`, `v≈19`, altura visual9.5m; cierreS `u≈24…32`, `v≈43`, altura visual7m | Se conservan las huellas desnudas de la medianeraE; no se fuerza la superficie visible a coincidir con los150m² del inventario de mantenimiento |

La documentación de 2016 indica que la cloaca discurre del sudoeste al nordeste, hacia Huertos/Ordóñez. El eje del JSON es una guía de orientación interpretativa, **no** una traza arqueológica levantada. La posición precisa del umbral monumental se ofrece como foco de visita con incertidumbre mayor que la de los elementos reconocibles en la ortofoto.

Las medidas de muro conservado de 2016 —29,50 m al norte y 21,37 m al este— se distinguen de las dimensiones globales de 36,5 y 27 m citadas en la noticia de 2015. Las cifras no se combinan para inventar una planta cerrada.

El pliego municipal de mantenimiento identifica aproximadamente 150 m² de jardines verticales en Plaza del Forum. Este dato respalda el carácter de las superficies verdes, pero no permite afirmar que el estado observado en 2018 sea su estado exacto en 2026.

## Entorno contemporáneo

`createForumPlazaContext` dibuja exclusivamente el exterior del parque. Reutiliza el constructor de contextos existente para preservar las huellas, patios, plantas y atributos de Catastro ya presentes en el atlas. La prioridad de altura es: altura explícita, estimación del MDS normalizado, número de plantas y, sólo en ausencia de esos datos, valor de presentación. Se registran las discrepancias entre MDS y plantas, sin reescribir los datos fuente.

El contexto incorpora **63 partes edificadas de 12 parcelas**, conserva **32 partes de edificios** en sus propietarios anteriores y añade **6 fragmentos de calles**. Las construcciones previamente gestionadas por el contexto del Circo no se dibujan otra vez. Las fachadas y cubiertas domésticas siguen siendo aproximaciones; no se afirma una reconstrucción exacta de cada vivienda.

Las medianeras que dan al parque reciben máscaras de ocupación únicamente para impedir la generación automática de ventanas. Esas máscaras no son edificios, obstáculos físicos, exclusiones catastrales ni muros arqueológicos nuevos. El modelo principal del parque dibuja las fábricas históricas y los jardines verticales que muestran las fotografías.

Las aceras y calzadas exteriores forman una malla continua que sigue los triángulos de terreno de 2,5 m del atlas. Se restan los edificios, patios privados, superficies que ya pertenecen a otros contextos y la totalidad de la nueva huella del parque. Los anchos de calzada, bordillos y pequeños detalles son aproximados.

## Corrección del encuentro con el Circo

El pavimento antiguo del contexto del Circo entraba **59,671399 m²** en la huella ahora documentada del parque, a lo largo del borde Huertos/Remedio. Se recorta únicamente ese exceso de superficies contemporáneas. Se mantienen los edificios, calles, árboles, paradas, registro y arqueología del Circo.

La modificación de `circo-context.json` se limita a `pavementMesh`, `surfaces` y `facadeOcclusion`. La explicación, polígonos retirados y huella de entrada se conservan dentro de `pavementMesh.forumBoundaryCorrection` y en `research/validation-v52/forum-previous-overlap.json`. La máscara adicional de medianeras permite que las partes del edificio occidental que ya pertenecían al Circo respeten los muros ciegos fotografiados.

## Reproducción y comprobación

El archivo `research/validation-v52/forum-plaza-layout-source.json` es la entrada de trazado manual. El proceso reproducible es:

```sh
PYTHONPATH=/workspace/scratch/53242b8b9a77/python-deps python research/validation-v52/prepare_forum_context.py
```

El script necesita Shapely 2.1 o posterior y utiliza la triangulación ya existente de `prepare_circo_context.py`, sin ejecutar su constructor. La salida del nuevo contexto contiene **1.043,20 m²** de pavimento exterior en **1.386 triángulos**. Las comprobaciones de cobertura, duplicación, invasión de edificios, patios, pavimentos previos y parque están dentro de la tolerancia de 0,001 m². El pequeño desacuerdo entre algunos bordes OSM y Catastro queda documentado en vez de modificar las huellas catastrales. La revisión específica de los muros ciegos comprueba los 15 bordes de fachada orientados al parque que podrían recibir huecos automáticos: todos quedan cubiertos por la máscara de ocupación (`forum-blank-facade-qa.json`). `node --check` valida la sintaxis del módulo del contexto; la revisión visual conjunta corresponde a la aplicación completa.

## Fuentes

1. **Ayuntamiento de Sagunto, 15 de enero de 2015.** [Intervención arqueológica del futuro parque finalizada](https://aytosagunto.es/es/actualidad/la-intervencion-arqueologica-del-futuro-parque-del-solar-de-la-calle-huertos-ya-ha-finalizado/). Superficie, nivel general, proyecto de accesos y relación de medianeras.
2. **Ayuntamiento de Sagunto, 27 de enero de 2016.** [Obras del futuro parque arqueológico](https://aytosagunto.es/es/actualidad/las-obras-del-futuro-parque-arqueologico-de-la-calle-huertos-estaran-finalizadas-este-verano/). Muros conservados, orientación de cloaca, secuencia histórica y fotografías de obra.
3. **Ayuntamiento de Sagunto, 13 de septiembre de 2018.** [Acabadas las obras del parque arqueológico](https://aytosagunto.es/es/actualidad/acabadas-las-obras-del-parque-arqueologico-de-la-calle-huertos/). Fotografías del conjunto ejecutado, rampas, restos, medianeras, jardín vertical y juegos.
4. **Ayuntamiento de Sagunto, 8 de octubre de 2015.** [Adjudicación de las obras](https://aytosagunto.es/va/actualitat/la-junta-de-gobierno-local-adjudica-el-contrato-de-obras-del-parque-arqueologico-de-la-calle-huertos-1/). Vista anterior y visualización del proyecto, diferenciadas del estado construido.
5. **Pliego de mantenimiento de zonas verdes.** [Plaza del Forum, foto 20 del anexo 1](https://contrataciondelestado.es/wps/wcm/connect/PLACE_es/Site/area/docAccCmpnt?DocumentIdParam=1379e89f-b172-4de7-9db2-7ab026dade00&cmpntname=GetDocumentsById&source=library&srv=cmpnt). Texto accesible en el índice web; la descarga directa fue rechazada y no se presupone haber visto la fotografía del anexo.
6. **OpenStreetMap.** [Way 660194745](https://www.openstreetmap.org/way/660194745), parque; calles próximas por API OSM. © Colaboradores de OpenStreetMap, ODbL 1.0.
7. **IGN/CNIG.** [PNOA máxima actualidad](https://www.ign.es/wms-inspire/pnoa-ma), ortofoto registrada; MDT05 y MDS normalizado ya incluidos en el atlas. CC BY 4.0.
8. **Dirección General del Catastro.** [INSPIRE Buildings](https://www.catastro.hacienda.gob.es/webinspire/), datos previamente incorporados al atlas con fecha 21 de agosto de 2026. Producto derivado, no información catastral oficial.

