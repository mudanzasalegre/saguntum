# Verificación V25 · Gerencia y ciudad jardín

Revisión del 21 de noviembre de 2026. La visita incorpora 20 paradas y tres vistas interiores de las oficinas; la distribución mantiene los 31 lugares, seis ámbitos y 19 cuadernos independientes del atlas.

## Comprobaciones finales

| Ámbito | Resultado | Alcance |
|---|---:|---|
| Modelo arquitectónico | 526/526 | Geometría finita, huecos físicos, agrupaciones residenciales, interiores, sección y liberación de recursos |
| Fuentes del contexto | 10/10 | Huellas, calles, superficies y trazabilidad de los datos |
| Modelo del contexto | 30/30 | Suelos, edificios, vegetación, límites, modos de lectura y separación del follaje respecto a las fachadas |
| Región completa del Puerto | 762/762 | 126 combinaciones de cámara, terreno, límites, oclusiones, continuidad de los lugares anteriores y control de vegetación |
| Planos Canvas | 96/96 casos | Cuatro tamaños, dos temas, dos lecturas y seis selecciones; numeración, plantas y zonas seleccionables |
| Controladores de visita | 48/48 | 19 cuadernos, navegación y progreso independiente mediante adaptador de elementos |
| Recursos estáticos | 497/497 | 211 archivos de distribución, 91 módulos JS, 179 importaciones locales, 103 JSON y 69 peticiones iniciales |
| Coherencia documental | 16/16 | 40 hechos conservados, 17 fuentes, diez hitos, registro de los focos y distinción entre evidencia e interpretación |

La integración construye los módulos de producción, el terreno del Puerto y sus contextos. Usa las funciones de cámara y visibilidad de la aplicación y registra los hashes de 30 entradas. Los rayos comprueban despeje de terreno, vecindad y encuadres próximos en tres proporciones de pantalla. El informe conserva cada configuración y sus resultados.

El plano general muestra las veinte paradas. Al seleccionar vestíbulo, escalera o salas, se limita al edificio de oficinas de 1921 y a la planta correspondiente. Las particiones y los dos tramos de escalera se representan de acuerdo con el modelo interpretativo. Los caminos poligonales se dibujan como superficies y los ejes como líneas, evitando bordes discontinuos gruesos. Se comprobaron imágenes de escritorio y móvil en ambos temas.

## Incidencias corregidas

Se ajustaron tres posiciones de observación: oficinas, porches y vista cercana de las viviendas adosadas. La primera integración detectó nueve oclusiones, repetidas en tres tamaños de pantalla; la integración final no conserva ninguna.

La inspección del interior reveló follaje atravesando una ventana de las oficinas. Se limitaron 19 copas y los arbustos próximos a fachadas, manteniendo los 105 troncos en sus posiciones de referencia. La envolvente de cada copa se separa al menos 0,45 m de las huellas edificadas y coincide con el radio utilizado por el plano. La QA comprueba además que ningún vértice de follaje quede dentro de un edificio.

La expectativa heredada de 66 peticiones de datos se actualizó a 69, correspondientes a la incorporación de guía, plano y contexto de Gerencia. El informe documental conserva el fallo inicial y la ejecución correcta posterior como historial. El hash de la guía provisional se identifica expresamente como una reconstrucción a partir del generador original; no se presenta como un registro histórico independiente.

## Inspección visual

Las imágenes CPU usan las mallas, normales, colores, texturas, cámaras y luces exportadas de la región real. Se revisan siete encuadres: conjunto, oficinas, vestíbulo, salas, chalés centrales, paseo y sección. Cada imagen cuenta con un manifiesto de entrada que registra el hash de la geometría descomprimida, el script, la resolución y las muestras. `visual-review.json` contiene los resultados finales, los hashes de las imágenes y las limitaciones.

La inspección busca discontinuidades, intrusiones, duplicados, elementos flotantes y obstáculos en la composición. El corte conserva los muros inferiores y retira cubiertas, forjados y elementos dependientes de los niveles superiores. Las vistas interiores normales conservan sus techos. Los renders tienen iluminación aproximada para inspeccionar la geometría; no son capturas del navegador ni una medición fotométrica.

En algunos cruces exteriores aparecen pequeñas manchas oscuras en el render CPU general. Una comprobación por rayos las identifica como dos caras coplanares del pavimento OSM heredado, con el terreno intacto debajo; no pertenecen a las superficies nuevas de Gerencia. Esta observación queda registrada en el informe visual y su apariencia en WebGL permanece sin verificar. La exportación recorta el entorno lejano para la inspección; la aplicación conserva la región completa.

## Límites

La infraestructura de revisión mantiene la limitación de autorización de URL y de WebGL observada anteriormente. No se ha observado su recuperación ni se ha intentado eludirla por otra ruta. La interacción completa en navegador, la composición final de la interfaz, los FPS y la memoria GPU permanecen sin verificar. El adaptador de controladores comprueba estado y contratos de render, no el foco real del navegador. Véase `browser-limitations.json`.

Los alzados sin levantamiento, las distribuciones residenciales, las proporciones interiores, el mobiliario y las dimensiones botánicas son interpretativos. Se mantienen los distintos recuentos documentales de 21 y 22 viviendas. La apertura oriental de 2023 y la documentación de las fases posteriores se explican sin convertir anuncios o adjudicaciones en certificaciones de finalización o de acceso presencial.

## Reproducción

Los scripts se ejecutan desde la raíz del repositorio. `build-gerencia-plan.mjs` registra los focos y el plano con los constructores de producción; no debe sustituirse por el generador documental provisional después de ese registro. `validate_port_v25.mjs --export` exporta la geometría utilizada para las imágenes. `record_render_input.py` registra la entrada inmediatamente antes de cada ejecución de `render_gerencia.py` en Blender CPU.

Los informes principales son `integrated-scene-qa.json`, `gerencia-model-qa.json`, `gerencia-context-model-qa.json`, `gerencia-map-qa.json`, `visit-controller-results.json`, `static-assets-qa.json` y `gerencia-guide-source-qa.json`. Los archivos de geometría comprimida y los registros extensos de ejecución son regenerables y se excluyen del repositorio; las imágenes, sus manifiestos y los informes finales se conservan.
