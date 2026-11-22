# Verificación V9 · Santa María y su entorno

Revisión del 19 de noviembre de 2026. Las pruebas de geometría, integración, interfaz y render se registran por separado para que sus resultados no se confundan con una medición de rendimiento GPU.

## Resultados

| Área | Resultado | Evidencia |
| --- | --- | --- |
| Integración del atlas | 1.196 comprobaciones aprobadas | `sagunto-regression.json` |
| Geometría y visita de Santa María | 392 comprobaciones aprobadas | `santa-maria-geometry.json` |
| Contexto urbano y planos Canvas | 244 comprobaciones aprobadas | `santa-maria-context-qa.json` |
| Controlador de las tres visitas | 19 comprobaciones aprobadas | `visit-controller-results.json` |
| Archivos y enlaces locales | Sin errores | `asset-checks.json` |
| Interfaz en navegador | Navegación, fuentes, cronología y adaptación verificadas en modo 2D | `browser-evidence.json` y capturas JPG |

La revisión histórica final no encontró afirmaciones materiales que requiriesen corrección. El contenido contiene 16 paradas, 49 hechos referenciados, 17 hitos y 24 fuentes. Se comprobaron las referencias y los destinos de la cronología.

## Integración y cámaras

La prueba principal ejecuta el constructor regional diferido y los encuadres extraídos de `app.js`, con los modelos reales de iglesia, contexto, edificios civiles, ciudad y terreno. Sustituye únicamente la carga de texturas en el entorno Node. Comprueba 102 variantes de cámara de Santa María y otras 102 del Teatro Romano, en escritorio de 1363 × 936, móvil vertical de 390 × 844 y horizontal de 844 × 390.

Todas las cámaras quedan sobre el suelo y los focos dentro del espacio disponible junto a los paneles. Las vistas completas contienen sus límites geométricos. Las vistas cercanas permiten recortar deliberadamente parte del conjunto. Los rayos al foco comprueban edificios, calles, cimentaciones, contexto detallado y modelos civiles. Se excluye de esa prueba el propio pretil de la parada de la escalinata, porque forma parte del objeto observado; las cubiertas vecinas siguen participando.

Las pruebas conservan los cortes arqueológicos anteriores, las 28 localizaciones patrimoniales registradas por esos módulos y la carga diferida. El catálogo completo de la interfaz sigue mostrando 31 lugares al incluir los tres paisajes. Se simula el fallo de una textura, se comprueba la retirada de la escena incompleta y se verifica que el reintento construye una sola región. Al descargar una región tras activar la lectura por épocas, sus texturas y materiales se liberan una vez, incluso cuando la lectura temporal los ha separado del material visible. Los recursos de otras regiones permanecen intactos.

El informe guarda las huellas SHA-256 de los módulos implicados. La ejecución final y la comprobación posterior coinciden con los archivos terminados; no se basa en una versión anterior de la geometría.

## Geometría y entorno

El templo contiene 87 mallas y 174.093 triángulos; el contexto inmediato añade 26 mallas y 22.265 triángulos. Hay 25 posiciones de huecos reales comprobadas por rayos, tres naves, cuatro tramos principales y componentes independientes para la sección y la lectura de épocas. Las pruebas comprueban atributos finitos, apertura de huecos, material restaurado, independencia entre instancias y encaje con el terreno.

El caserío inmediato conserva 44 partes edificadas de 16 parcelas. De sus alturas, 28 proceden de las estimaciones IGN y 16 del número de plantas; ninguna necesita la altura genérica de reserva. Se excluyen los volúmenes urbanos duplicados. Las plantas son cartográficas; los pequeños detalles de fachada y los perfiles exactos de las cubiertas son interpretativos.

La revisión visual corrigió la aproximación norte inicialmente tapada por una cubierta de Plaça Major, la vista completa de Sagrari, dos pilares que sobresalían del cierre occidental, los encuentros de cubierta y un talud artificial junto al acceso norte. La última adaptación del terreno usa ocho celdas para conservar las cotas de la calle fuera del zócalo de la iglesia. No convierte esas cotas ni los 48 peldaños del modelo en medidas arqueológicas documentadas.

Los seis casos Canvas cubren minimapa, plano grande y plano móvil en las apariencias clara y oscura. Se comprueban las 16 paradas, la separación de sus marcadores, sus áreas de interacción, el anclaje de la selección y contraste de etiquetas de al menos 4,5:1. El plano móvil usa el tamaño real de presentación del lienzo para evitar etiquetas ilegibles por reducción.

## Interfaz observada

El navegador permitió verificar la entrada directa a Santa María, el cambio de parada desde el plano, las 17 entradas cronológicas, los 24 enlaces de fuentes, la lectura por capas y los cambios entre las tres visitas. Castillo, Teatro Romano y Santa María mantienen un progreso separado. Las capturas guardadas muestran escritorio, plano móvil vertical y panel móvil horizontal.

En 390 × 844, el panel no desborda horizontalmente y el plano mide 313 × 300 píxeles tanto en pantalla como en su lienzo. En 844 × 390, el espaciado compacto deja visible el título de la parada y mantiene controles táctiles de 44 píxeles. Se comprobó la selección del reloj desde el marcador 14. El archivo temporal usado para probar estos tamaños se retiró antes de la publicación.

## Renders y límite de verificación

Los PNG del conjunto, portada norte, portada barroca, sección, campanario y ábside son **renders CPU de las mallas Three.js exportadas**, con la ortofoto y los modelos inmediatos. No son ilustraciones generadas ni capturas WebGL. Sirven para inspeccionar volúmenes, huecos, contactos y vistas; el render de inspección no carga todo el caserío lejano del atlas.

El navegador disponible informa `GL_VENDOR = Disabled` y `GL_RENDERER = Disabled`. Por eso las capturas JPG documentan el **modo 2D de compatibilidad**. La navegación y los datos se verificaron allí, y la geometría se comprobó con Node y renders CPU. No se ha acreditado el rendimiento ni la apariencia exacta de las sombras en una GPU real. La aplicación conserva su renderizador Three.js para navegadores con WebGL disponible.

## Reproducir las comprobaciones

Desde la raíz del repositorio:

```sh
node --experimental-loader ./research/validate_loader.mjs research/validate_sagunto_v9.mjs
node --experimental-loader ./research/validate_loader.mjs research/validate_santa_maria_v9.mjs
node --experimental-loader ./research/validate_loader.mjs research/validation-v9/validate_santa_maria_context.mjs
node research/validation-v9/validate_visit_controller.mjs
```

La preparación del render se documenta en `research/render_santa_maria_v9.py`. El archivo comprimido `santa-maria-geometry.json.gz` conserva la exportación de las mallas inspeccionadas.
