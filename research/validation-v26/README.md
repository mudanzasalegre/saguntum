# Verificación V26 · Casino Recreativo y Cultural

Revisión del 21 de noviembre de 2026. El Casino incorpora veinte paradas, siete vistas interiores, cinco ámbitos, diez hitos y diecisiete fuentes. El atlas conserva sus 31 lugares, seis ámbitos territoriales y veinte visitas detalladas independientes.

## Comprobaciones

| Ámbito | Resultado | Alcance |
|---|---:|---|
| Arquitectura | 187/187 | Huecos físicos, plantas, cámaras interiores, techos, sección y liberación de recursos |
| Fuentes del contexto | 9/9 | Trazado, superficies, posiciones de referencia y separación de los conjuntos vecinos |
| Modelo del contexto | 55/55 | Malla de suelo, copas, cámaras, capas de lectura y recursos |
| Transferencia del jardín | 15/15 | Recorte preciso del suelo compartido y conservación de edificios, calles y elementos anteriores |
| Cobertura del jardín anterior | 14/14 | Suelos compartidos, reserva precedente y continuidad del contexto |
| Región completa del Puerto | 769/769 | 126 combinaciones de cámara, terreno, encuadres, vecinos, continuidad y vegetación |
| Planos Canvas | 96/96 casos | Cuatro tamaños, dos temas, dos lecturas, plantas y selección de paradas |
| Controladores | 51/51 | Veinte cuadernos, navegación, estado independiente, sección y presentación de la evidencia |
| Recursos estáticos | 529/529 | 217 archivos, 94 módulos JS, 186 importaciones, 106 JSON y 72 peticiones iniciales |
| Coherencia documental | 14/14 | Cuarenta hechos, referencias, discrepancia temporal, plantas y registro de coordenadas |

La integración construye los módulos de producción, el terreno del Puerto y todos sus contextos. Registra los hashes de 36 entradas. La región integrada contiene 719 mallas y 4.074.956 triángulos; estos valores describen geometría y no constituyen una medición de rendimiento GPU. El edificio del Casino aporta 66.451 triángulos y su contexto 34.602.

Las 126 configuraciones combinan veinte paradas y una vista de sección general con tres tamaños de pantalla y dos distancias. Las comprobaciones incluyen el terreno final, todos los contextos del Puerto y los restantes modelos patrimoniales cercanos. La capa Vegetación se comprueba sobre los cinco contextos detallados y el grupo genérico de la ciudad. La integración no detecta oclusiones centrales en las vistas arquitectónicas, cámaras enterradas ni geometría inmediata atravesada por los siete puntos interiores.

## Integración y revisión

El jardín se dibuja a partir de ortofoto y fotografías. Una transferencia limitada retira las superficies compartidas de Gerencia allí donde las pasa a representar Casino. Conserva exactamente 143 partes de edificios, 24 fragmentos de calles, 105 árboles y todos los puntos anteriores; solo se recorta un tramo de cierre. Se actualiza también el plano de Gerencia utilizado cuando no hay 3D. Los informes V25 se conservan como registro de aquella versión.

Las copas nuevas se comprueban contra fachadas y terrazas. Una se ajusta para mantener esa separación; no se suprimen troncos. El escenario y la taquilla se interpretan a partir de las referencias, sin presentar sus medidas como un levantamiento.

El plano muestra las veinte paradas en la vista general. La planta principal reúne cinco focos interiores y la alta dos. La terraza se representa mediante sus polígonos reales; el anillo de cubierta y el edificio conservan el vacío del patio. Las dos escaleras usan los segmentos del propio modelo. Se revisan planos de escritorio y móvil, incluidos los dos temas.

La introducción de la visita explica de forma visible su carácter histórico e interpretativo y la noticia de obras en octubre de 2026. El mapa grande y el minimapa anuncian la planta seleccionada. Se mantienen las rutas directas a Casino y sus paradas, el progreso independiente, la portada y la identidad general del atlas.

## Correcciones surgidas de la inspección

La primera inspección identificó un rectángulo negro en el encuentro entre terraza y escalera. Procedía de losas coplanares superpuestas. Se sustituyeron por una sola losa cóncava ajustada a la fachada, comprobando con seis rayos que los encuentros contienen una única superficie transitable. La terraza conserva la continuidad con la esquina curva. Los renders iniciales de conjunto y fachada se retienen con el sufijo `-initial` como evidencia del hallazgo.

El perfil inicial de las ventanas parecía apuntado desde la fachada. Se corrigió con un segmento circular escarzano de 32 subdivisiones. El encuadre del patio se orientó hacia arriba desde una altura de 1,9 m sobre su pavimento para hacer legibles ambos niveles. La geometría de esos huecos y las cámaras se volvieron a validar en la integración final.

El escenario elige ahora su borde frontal por proximidad a la pista, evitando depender del orden de vértices de la geometría fuente. Sus estrellas y el descenso se orientan hacia el espacio de baile. Los planos interiores omiten las terrazas exteriores para que sus contornos no se confundan con tabiques; el plano general las conserva.

Una revisión adicional compara 43.803 vértices de follaje con la huella y las terrazas definitivas: ninguno queda dentro de ellas. Las doce copas mantienen una separación mínima de 0,45 m. El pequeño remate exterior que cambia con la nueva losa se apoya sobre terreno regional continuo, sin agujero topológico; la comparación de perímetros y el informe de copas documentan su alcance.

## Inspección visual

Los renders de inspección se obtienen de las mallas, normales, colores, texturas, luces y cámaras exportados de la región real. Se revisan y aceptan siete encuadres: conjunto, fachada, patio, galería, biblioteca, jardín y sección. Cada uno cuenta con un manifiesto que registra los hashes de geometría y script, la resolución y las muestras. El resultado de la revisión directa queda en `visual-review.json`.

La iluminación CPU aproxima la de la aplicación y la exportación recorta el entorno lejano. Estas imágenes no son capturas de navegador ni imágenes generativas. Las vistas interiores normales conservan sus techos, salvo el patio deliberadamente abierto. La sección retira cubiertas, forjado superior, arcadas altas, escalera y mobiliario dependiente.

## Límites

La infraestructura de revisión mantiene la limitación de autorización de URL y de WebGL observada en las versiones previas. No se ha observado su recuperación ni se ha intentado eludirla por otra ruta. La interacción completa en navegador, la composición final de la interfaz, los FPS y la memoria GPU permanecen sin verificar. Los controladores comprueban estado y contratos de render mediante adaptador de elementos; no certifican el foco real del navegador. Véase `browser-limitations.json`.

Las proporciones y particiones interiores, los alzados sin levantamiento, la escalera y el mobiliario son interpretativos. La huella y el patio son cartográficos; los materiales, usos y rasgos arquitectónicos se contrastan con documentación. La terraza y la escalinata se atribuyen a 1968 según la entidad, mientras CONTRAST las relaciona con mejoras de 1969. No se inventa un semisótano visitable ni se afirma que el vidrio proyectado o la rehabilitación estén terminados.

## Reproducción

Ejecutar desde la raíz del repositorio. Los scripts geométricos utilizan el módulo Three.js vendorizado mediante `--experimental-loader ./research/validate_loader.mjs`.

`transfer_casino_garden_ownership.py` escribe primero un candidato e informe; `--apply` aplica el recorte documentado. `refresh-gerencia-plan.mjs` actualiza el plano anterior sin reescribir sus informes V25. `build-casino-plan.mjs` registra guía y plano a partir de los constructores de producción. No debe reejecutarse después el generador documental provisional `build-casino-guide.py`.

`validate_casino_documentation.py` comprueba las referencias y las coordenadas registradas.

`validate_port_v26.mjs --export` comprueba la integración y exporta siete escenas si no hay errores. `render-casino-scenes.py` registra cada entrada y ejecuta como máximo dos procesos Blender CPU, con cuatro hilos cada uno. Las geometrías comprimidas y los registros extensos se excluyen de Git por ser regenerables; las imágenes, manifiestos e informes finales se conservan.
