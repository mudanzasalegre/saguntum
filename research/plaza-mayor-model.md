# Plaça Major y Puerta del Almudín — modelo V10

> Actualización de 26 de noviembre de 2026: se completan los frentes porticados 7–8 y 9 junto a Santa María. Véase [documentación del cierre sur](plaza-mayor-south-front.md). La descripción V10 de 13 fachadas queda ampliada a 15 frentes y 22 cuerpos; se preservan las 16 paradas. El texto, los comandos y los resultados que siguen documentan la versión histórica V10; la verificación vigente está en la [revisión del conjunto](../docs/PLAZA_SANTA_MARIA.md).

## Alcance y registro

La ampliación conserva la iglesia de Santa María V9 y añade una lectura individual del frente urbano de la Plaça Major. El núcleo tiene trece fachadas documentadas y catorce cuerpos edificados: el número 17 conserva separados sus dos componentes catastrales, con el intervalo real entre ellos. No se dibuja un volumen convexo que los una. El módulo del entorno, documentado por separado, completa calles, pavimento y caserío adyacente.

El registro comparte las coordenadas y la escala métrica del atlas: x al este, z al sur, origen próximo a 39,679° N / 0,278° O. Las once plantas heredadas de OpenStreetMap se mantienen y se añaden los números 16 y 17 con geometría de Catastro. La identificación de estas fincas corrige la puerta aproximada del modelo anterior, que estaba varios inmuebles al sur.

Las plantas son cartográficas. Las alturas de fachada, luces y espesores de los soportales, pendientes de cubierta, balcones, molduras y acabados son estimaciones visuales contrastadas con las fuentes descritas a continuación. El núcleo no pretende reproducir cada división interior o cada cuerpo catastral de una vivienda privada. Sus partes catastrales y alturas de referencia quedan registradas en el informe de validación para futuras mejoras.

## Fuentes que gobiernan la forma

- **Ajuntament de Sagunt, Plan Especial de Protección, catálogo, tomo I.** [PDF municipal](https://aytosagunto.es/media/y1zhyqmy/04-95pl_tomoi_opt.pdf). Fichas 133–140 para números 17–10 del frente occidental; fichas 179–183 para números 5, 3, 2, 1 y 4 del frente oriental. El catálogo incluye fotografía, planta catastral, descripción y, en las fichas orientales, alzado conjunto. Las fotografías y anotaciones son de la documentación del plan, no una certificación del estado de cada pintura en 2026.
- **Red de Ciudades y Villas Medievales / Rutas Jaume I.** [Ficha y fotografías institucionales de la plaza](https://www.rutasjaumei.com/es/que-ver-en-sagunto/220/plaza-mayor-de-sagunto.php). Las imágenes 01 y 03 muestran la secuencia de arcos transversales; 05 identifica inequívocamente el número 17 y el portal; 07 documenta el escudo; 09, 11 y 13 permiten contrastar fachadas, pavimento y relación con Santa María. Las imágenes se consultaron como evidencia; no se incorporan como una galería fotográfica ni como texturas ajenas.
- **Catastro INSPIRE, OpenStreetMap, IGN / PNOA.** La selección y procedencia de los polígonos y las alturas del contexto están en `plaza-mayor-context.json` y `research/plaza-mayor-context.md`. Las partes catastrales sirven para identificar fincas, preservar separaciones y contrastar alturas; no atribuyen por sí solas fechas históricas a la fábrica.
- La historia, cronología y discusión de usos se documentan en `plaza-mayor-visit.json` y `research/plaza-mayor-history.md`. La información de Chabret sobre el almacén posterior de la calle Abril no se convierte en un supuesto interior del portal de la plaza.

## Fachadas diferenciadas

| Nº actual | Catálogo, página PDF | Forma representada |
|---|---:|---|
| 10 | 140 | Esquina de mayor anchura, soportes rectangulares, vanos regulares, cornisas y terraza. |
| 11 | 139 | Frente de mayor altura, balcones corridos y huecos agrupados. |
| 12 | 138 | Fachada estrecha, proporción vertical, balcones separados y cubierta de teja. |
| 13 | 137 | Dos ejes de huecos, andana ventilada y porticado adintelado. |
| 14 | 136 | Frente más bajo, balcones y pequeños huecos superiores. |
| 15 | 135 | Edificación contemporánea más alta con bandas de balcón; arco transversal relacionado con la galería contigua. |
| 16 | 134 | Frente estrecho, galería blanca y arco apuntado transversal junto al 15. |
| 17 | 133 | Finca del Almudín; revoco cálido en la galería, portón retranqueado, dovelas, escudo y número de acceso. |
| 1 | 182 | Frente oriental ancho con soportes de fundición y ritmo de balcones. |
| 2 | 181 | Dos ejes principales, fundición y remates de huecos diferenciados. |
| 3 | 180 | Galería con columna dórica y pilastras; tres huecos principales. |
| 4 | 183 | Galería con pilastras, balcones y cubierta inclinada. |
| 5 | 179 | Columnas y pilastras pétreas, huecos superiores y cubierta de teja. |

No se han repetido arcos romanos en todos los frentes. Predominan los soportales adintelados, con soportes de piedra, pilastras o fundición según ficha. Los arcos de piedra de la secuencia histórica atraviesan la galería longitudinal. Las puertas y ventanas actuales permanecen retranqueadas dentro de muros perforados: no son rectángulos superpuestos sobre una caja opaca.

## Puerta del Almudín

La ficha municipal 133 identifica la finca como **Plaça Major 17, manzana 34596, parcela 11**, con acceso de doble anchura, arco carpanel de piedra y escudo cuatribarrado en la clave. La fotografía institucional del acceso confirma el número 17, la forma rebajada del arco, las hojas envejecidas de madera, el contexto de revoco rojizo y el relieve del escudo.

El eje representado del portal está aproximadamente en **39,67966788° N / −0,27869648° E**, dentro de la pared interior de su soportal. La puerta mide 2,12 m de luz y 2,76 m de altura en la maqueta; el escudo mide aproximadamente 0,43 m. Estas tres dimensiones son estimaciones para dar una proporción coherente a la fotografía, no cotas de un levantamiento. El soportal del número 17 se representa con 3,70 m de altura libre de referencia: es igualmente una estimación visual y permite colocar la portada y el escudo bajo las viguetas, sin intersecciones entre sus mallas; la huella y la cota de cubierta se mantienen.

El arco se aproxima con una curva elíptica rebajada, dovelas individualizadas y jambas. El escudo se modela en la clave; no se coloca como un blasón flotante sobre la puerta. No se colorea como una bandera moderna. La lectura por épocas clasifica portada y escudo como fábrica **mixta**, porque la propiedad real del edificio después de la conquista no fecha por sí sola todas las piedras conservadas.

El almacén posterior de Carrer Abril tiene una historia y descripción propias. No se le trasladan a esta finca las dos naves y cuatro arcos de aquella descripción. Tampoco se inventan una sala del consejo, un horno o dependencias domésticas accesibles. Las paradas de usos desaparecidos señalan ámbitos de lectura urbana.

## Huecos, pavimento y cubiertas

Los soportales tienen soportes independientes, suelo, cara inferior del forjado, pared de fondo retranqueada y aperturas transversales reales. Los vanos altos también perforan la fábrica; cristales, contraventanas y barandillas son piezas separadas. La puerta del Almudín conserva una abertura estructural, cerrada por sus hojas de madera.

El pavimento de las galerías se apoya sobre plataformas de cimentación específicas. El pavimento exterior y las calles pertenecen al módulo de contexto y se recalculan sobre el terreno final triangulado. Los muestreos de control comprueban que ningún pavimento de soportal quede enterrado bajo el relieve definitivo.

Las cubiertas inclinadas mantienen el contorno irregular de cada planta. Se triangula primero la planta original y se divide cada triángulo en la cumbrera: así no se unen de forma incorrecta piezas desconectadas al cortar una planta no convexa. Los hastiales se subdividen también donde sus aristas cruzan la cumbrera. Esta segunda condición evita huecos triangulares en el cerramiento, aunque el faldón superior esté completo. Los canales de teja siguen segmentos contenidos en la planta, no una caja rectangular que sobresalga de ella.

## Visita, cámaras y capas

Las dieciséis paradas del dossier resuelven a puntos del modelo. Doce se relacionan con plaza, soportales, Almudín, memoria cívica y Santa María; el módulo de contexto aporta Peixateria, Cavallers, Carrer Major y Carrer del Castell. La epigrafía remite al pretil y escalera ya conservados en Santa María V9; no se crean inscripciones ficticias en columnas o portal.

Cada punto dispone de vista de conjunto y vista cercana. Los encuadres se verifican en escritorio, móvil vertical y móvil horizontal. El escudo y la puerta tienen mínimos específicos de distancia: la regla general de 20 m del atlas colocaba una cámara de detalle al otro lado de una calle estrecha. Las geometrías no se desplazan para despejar una cámara.

No se ofrece una sección de viviendas o del supuesto almacén histórico. La galería conservada ya es abierta y se puede observar de cerca. La lectura por épocas y la selección restauran los mismos materiales, texturas y geometrías al terminar; los recursos se crean por instancia para no reutilizar materiales liberados al cambiar de región.

## Validación y evidencia visual

- `research/validation-v10/validate_plaza_model.mjs`: geometría finita; correspondencia de las 16 paradas; independencia de recursos; perforaciones estructurales; pavimento respecto al terreno final; cobertura de faldones; cierre de hastiales; cámaras contra el núcleo, el caserío, Santa María y el terreno.
- `research/validation-v10/plaza-model-qa.json`: resultado, dimensiones representadas, muestras y hashes de los archivos efectivamente probados.
- `research/validation-v10/plaza-geometry.json.gz`: exportación de las mallas reales Three.js, matrices, materiales y cámaras para inspección.
- `research/validation-v10/render_plaza.py`: renders CPU de esas mallas, con Santa María, calles, caserío y ortofoto del atlas. Una iluminación de inspección hace legibles las galerías. Son renders de geometría, no capturas WebGL, fotografías ni imágenes generadas por IA.
- La validación integral de la aplicación se realiza por separado en `research/validation-v10/sagunto-regression.json`, incluidas las visitas existentes y el ciclo de liberación/reconstrucción de la región.

## Límites que se mantienen visibles

Las fuentes tienen fechas y resoluciones distintas. Un revoco, una persiana o mobiliario urbano puede haber cambiado desde la fotografía. Los perfiles de fachada y sus detalles no son una fotogrametría. Las cubiertas del núcleo son una aproximación arquitectónica de los frentes documentados; los cuerpos del contexto utilizan sus propias partes cartográficas y estimaciones de altura. Se conserva una relación espacial verificable y se distinguen los elementos documentados de la reconstrucción visual, sin atribuir exactitud de levantamiento al conjunto.
