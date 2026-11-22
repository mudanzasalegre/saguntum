# Pantalán de Sierra Menera: paseo actual y reconstrucción histórica

Iteración V5 del atlas SAGUNTUM. Investigación y modelo consultados el **19 de noviembre de 2026**. Archivos propios: `dist/js/coast-pier.js` y `dist/assets/data/coast-pier.json`.

## Qué se representa

Las fichas **23, Paseo del Pantalán**, y **24, Pantalán marítimo**, comparten un único eje métrico y dos estados sincronizables. La fase actual es la opción inicial. La histórica es una interpretación del periodo **aproximado 1984–1987**: evita situar en la inauguración de 1977 las cuatro tolvas que la APV fecha en 1984.

El paseo se inauguró el **19 de julio de 2024**. Su modelo incluye siete pérgolas, 600 lamas, columnas de sección triangular achaflanada, rampa, escaleras, carril bici, mobiliario, una tolva expuesta y el mirador. Los planos del proyecto previo de FHECOR incluían nueve módulos: se ha dado prioridad a las fuentes de la obra terminada, que especifican siete.

En el tramo marítimo se muestran los apoyos aislados y la plataforma terminal. La **Memoria de Sostenibilidad APV 2025**, p. 17, documenta el desmontaje de los tableros isostáticos de los tramos 1 y 2, las pasarelas metálicas finales y las tolvas entre diciembre de 2022 y julio de 2023. Se conservaron trípodes y el tablero continuo del tramo 3. El acuerdo municipal del **3 de julio de 2026** todavía pide finalizar la integración del pantalán marítimo. Por tanto, la aplicación no presenta una rehabilitación futura como obra ejecutada ni ofrece un recorrido peatonal actual por sus restos.

## Eje y encaje cartográfico

Se ajustó una recta por mínimos cuadrados a 21 centros de apoyo de OpenStreetMap, con el paso estructural de 30 m de los planos. Tras normalizar la dirección, los residuos de ajuste están entre aproximadamente 0,3 y 1,7 m. Es georreferenciación de cartografía pública, no un levantamiento topográfico.

| Referencia | Cadena desde origen | Longitud | Latitud |
|---|---:|---:|---:|
| Inicio original reconstruido | PK 0 m | −0,2108985579 | 39,6544539009 |
| Fin del tramo 0 original | PK 360 m | −0,2073017163 | 39,6527820662 |
| Límite de las fichas 23/24 | PK 480 m | −0,2061027692 | 39,6522247880 |
| Primer apoyo actual identificado | PK 510 m | −0,2058030324 | 39,6520854685 |
| Comienzo de la transición | PK 1.170 m | −0,1992088229 | 39,6490204383 |
| Comienzo de la plataforma | PK 1.320 m | −0,1977101389 | 39,6483238406 |
| Final de la plataforma | PK 1.592 m | −0,1949925254 | 39,6470606766 |
| Extremo del eje histórico | PK 1.652 m | −0,1943930518 | 39,6467820375 |

En coordenadas del atlas, el origen es `[5748.957323, 2732.471755]` y la dirección longitudinal es `[0.85600447165, 0.51696841733]` en el plano XZ. El eje local X indica cadena; el Z local, desplazamiento a la derecha/sur al mirar hacia el mar. La plataforma tiene un desplazamiento transversal aproximado de 1,4 m hacia el sur para encajar su contorno cartográfico. La pasarela final histórica se desplaza otros 6 m desde su eje, según el estudio estructural.

**La separación de fichas en PK 480 no es la separación original de tramos 0 y 1.** El tramo 0 original medía 360 m. El estudio posterior explica que cuatro vanos que inicialmente estaban sobre el mar quedaron sobre tierra. El paseo contemporáneo, además, empieza aproximadamente 125 m al oeste del origen del antiguo tablero. Su mirador termina cerca de PK 467,3, antes de la zona marina de apoyos, y a una cota distinta. No se ha añadido una conexión inexistente entre ese mirador y los restos.

Anclajes independientes:

| Elemento actual | Coordenada OSM | Identificador |
|---|---|---|
| Mirador | −0,2062109; 39,6523078 | nodo 12074274305 |
| Tolva expuesta | −0,2079099; 39,6531477 | nodo 12074274325 |
| Juegos infantiles | −0,2087403; 39,6535287 | nodo 12074274324 |
| Recorrido peatonal | polilínea en OSM | vía 1303784876 |
| Carril bici | polilínea en OSM | vía 1303784874 |

### Restos observables

La ortofoto PNOA consultada muestra el desmontaje marítimo concluido y el paseo terrestre todavía en obras. Su fecha de descarga no se identifica con la de vuelo. Se emplea para el eje, los apoyos y la plataforma; las fotografías municipales de la inauguración sirven para la apariencia terminada del paseo.

Los 21 apoyos principales identificados forman grupos de **8 + 7 + 6**, con huecos intermedios. La escena actual respeta los puntos cartografiados y contrastados visualmente; no completa el paso ideal de 30 m donde ya no se observan encepados. Sus nodos y coordenadas se conservan en `survey.preservedSupports`. Se incorporan cinco puntos metálicos auxiliares cartografiados junto a la plataforma como pilotes esquemáticos, sin inventar sus accesorios.

La antigua línea de costa OSM 4787626 todavía dibuja el antiguo pantalán continuo como contorno terrestre. **No es una base válida para generar tierra bajo los vanos desmontados.** La integración del atlas utiliza su máscara marina independiente. Ninguna de estas dos fichas aporta parches de elevación: las plataformas, rampas y losas tienen su propia geometría.

## Jerarquía de la evidencia

| Parte | Evidencia adoptada | Qué sigue siendo interpretativo |
|---|---|---|
| Paseo actual | APV: cotas +5,60/+8,80 m, unos 600 m, rampa próxima al 4 %, siete pérgolas y unas 600 lamas de 7,5 m; apertura municipal y fotografías de 2024 | Posición exacta de cada módulo, curvatura individual, mobiliario y despiece del suelo |
| Tolva expuesta | APV: una de cinco unidades, capacidad 50 m³, traslado en 2022; fotografías y posición OSM | Dimensiones exteriores, perfil de chapa, rodamientos y detalles menores del bastidor |
| Tramos originales | Certificaciones de ejecución resumidas por la Fundació y estudio de FHECOR/ACHE | Aspecto de juntas y armaduras no documentadas; cotas únicas de visualización dentro de los rangos publicados |
| Trípodes | Diámetro y pendiente documentados; centros actuales OSM/PNOA | Corrosión superficial esquemática y profundidad visible bajo el agua |
| Plataforma terminal | Dimensiones, tres nervios y distribución de las filas de pilotes descritos por FHECOR | Detalles de amarre, degradación y acabado superficial |
| Maquinaria histórica | APV: cinta, bifurcación, cinco tolvas y cargador de alcance 27,2 m; fotografía histórica de construcción | Posición de trabajo, altura del mástil, cabina, cerchas y envolventes de transferencias |
| Estado marítimo 2026 | Informe APV 2025 y acuerdo municipal de julio de 2026 | No se modela como construido ningún proyecto posterior sin evidencia de finalización |

La fase histórica conserva **el litoral y el puerto cartográfico contemporáneos como contexto**. No es una reconstrucción territorial integral de 1977 ni una ortofoto de aquella época. Los pilotes se prolongan parcialmente bajo el agua para que la estructura se comprenda, pero no se afirma una batimetría ni una cota geotécnica de hinca. No se publican imágenes históricas ni fotografías de referencia dentro del sitio.

## Traducción estructural al modelo

| Sección original | Longitud | Solución representada |
|---|---:|---|
| 0 | 360 m | Doce vanos, cuatro vigas y apoyos de hormigón terrestres |
| 1 | 810 m | Veintisiete vanos con cuatro vigas sobre trípodes |
| 2 | 150 m | Cinco vanos, ocho vigas y apoyo lateral adicional |
| 3 | 272 m | Plataforma de 20 m con tres nervios y filas de pilotes |
| 4 | 60 m | Dos pasarelas metálicas históricas de 30 m hacia duques de alba |

Las vigas de acceso tienen 1,50 m de canto; los anchos de los tableros estrecho y de transición son 7,20 y 14,21 m. Los tubos principales tienen diámetro 762 mm y disposición inclinada 1:4. La plataforma posee losa superior de 40 cm; el modelo conserva un canto estructural total de 1,90 m en los nervios. Sus filas exteriores tienen paso de 6 m y la central utiliza parejas inclinadas cada 12 m. La geometría visible utiliza cotas próximas al extremo superior de los intervalos descritos por el estudio; el nivel del agua es una referencia gráfica aproximada.

La cinta cubierta del periodo histórico incluye apoyos a intervalos de 5 m, banda interior, perfiles y costillas. Termina en la transición y se divide mediante dos edificios de transferencia. La maquinaria, etiquetada como interpretativa, reúne el cargador, raíles, tensores, cabina, manga final y cinco tolvas. El brazo alcanza 27,2 m desde el eje de su máquina; su posición de trabajo es una elección de visualización.

El paseo incorpora la franja libre de 4,70 m indicada en el proyecto, áreas laterales, una rampa inicial y la plaza ascendente final. La accesibilidad se representa con geometría propia, sin elevar la malla del terreno hasta la cota del pavimento. Dos cámaras orbitales bajas se sitúan sobre el camino público, con los ojos a 1,65 m de su superficie. No constituyen navegación libre en primera persona ni un recorrido permitido por el pantalán marítimo.

## Contrato de integración

`createCoastPier({heightAt, project, records, data})` devuelve `group`, `sites` y `stats`. Cada ficha contiene `currentGroup`, `historicalGroup`, `point`, `views`, `focuses`, `patches` y `exclusions`. El histórico empieza oculto. Los parámetros de eje y apoyos viven dentro de `pantalan-maritimo.survey`; el eje también se incorpora en la ficha terrestre. Por tanto, `data` puede ser la cartografía general de costa, como en el resto del atlas.

Los focos específicos de fase incluyen `modes: ['current']` o `['historical']`. Las dos vistas bajas aportan `position` y `target` explícitos. Los focos generales permiten comparar ambos estados. `currentState` e `historicalNote` están preparados para ser mostrados directamente en el panel.

La ficha 23 posee las geometrías originales de cadena 0–480; la 24, de 480–1652. Solo la segunda crea el apoyo histórico de PK 480. La plataforma terminal se crea una vez por estado en la ficha marítima. Las geometrías actuales del paseo y los restos no se solapan en la transición.

## Validación propia

Prueba acotada de Node con el cargador de Three.js del repositorio, fichas convertidas en mapa y `data` con estructura de cartografía:

- 21 apoyos principales actuales recuperados por el contrato integrado.
- Siete pérgolas y 600 lamas.
- Histórico oculto por defecto en las dos fichas.
- Ningún parche de elevación bajo pavimentos o estructuras marinas.
- Atributos de posición, normal, color y UV finitos; ninguna normal nula.
- Intersección vertical de las dos cámaras bajas con el pavimento: 1,6500 y 1,6503 m.
- 36 mallas entre ambas fases, 281.176 triángulos y aproximadamente 25,34 MB de atributos e índices. En el estado actual: 23 mallas y 148.288 triángulos. Las piezas repetidas están combinadas por material.

Se renderizaron con Blender/Cycles cuatro vistas de detalle: pérgolas, tolva, cargador histórico y trípodes. La revisión detectó que una cámara alta de la tolva quedaba tapada por su pérgola; se sustituyó por una vista lateral a menor altura. Los renders de detalle se usan como verificación geométrica, no como comprobación final del contexto urbano o de la iluminación WebGL. La validación integrada de la aplicación corresponde al flujo de QA general V5.

## Fuentes primarias

1. **APV. Descripción accesible de la maqueta del paseo.** Programa, organización espacial, cotas y pérgolas. <https://www.valenciaport.com/maqueta-tiflologica-del-nuevo-paseo-maritimo-del-puerto-de-sagunto/>
2. **Ayuntamiento de Sagunto, 19-07-2024. Apertura del paseo.** Estado terminado y fotografías actuales de referencia. <https://aytosagunto.es/es/actualidad/el-nuevo-paseo-del-puerto-de-sagunto-se-ha-abierto-a-la-ciudadania/>
3. **FHECOR. Proyecto del paseo, 2021–2022.** Se consulta distinguiendo el proyecto de su ejecución posterior. <https://www.fhecor.com/multimedia/proyectos/file/000000008000/Nuevo%20paseo%20maritimo%20en%20el%20Puerto%20de%20Sagunto_8713.pdf>
4. **Rodríguez García, Alonso Medina y Martínez González, FHECOR / Congreso ACHE.** Estudio estructural e inspección de 2018. <https://www.congresoache.com/descargas2022/2362.pdf>
5. **Fundació de Patrimoni Industrial. Información previa del pantalán.** Resume documentación de ejecución; no confundir el anteproyecto de EPTISA con la solución construida. <https://fundacioportdesagunt.com/wp-content/uploads/2011/05/resumen-informacic3b3n-previa-del-pantalc3a1n.pdf>
6. **APV. El pantalán de minerales.** Cronología, función y maquinaria. <https://www.valenciaport.com/puertos/sagunto/el-pantalan-de-minerales/>
7. **APV. Tolva de la Compañía Minera de Sierra Menera.** Capacidad, fabricación de cuatro unidades en 1984, traslado y conservación. <https://www.valenciaport.com/el-origen-del-puerto-de-sagunto/tolva-del-pantalan-de-la-compania-minera-de-sierra-menera/>
8. **APV. Memoria de Sostenibilidad 2025, p. 17.** Intervención de 2022–2023 y piezas conservadas. <https://www.valenciaport.com/wp-content/uploads/SOSTENIBILIDAD-2025.pdf>
9. **Ayuntamiento de Sagunto, 03-07-2026.** Situación de integración del tramo marítimo. <https://aytosagunto.es/es/actualidad/2026-07-03-el-ayuntamiento-de-sagunto-instara-a-la-apv-que-se-finalice-la-apertura-del-muelle-norte-y-el-tramo-maritimo-del-pantalan/>
10. **IGN/CNIG, PNOA.** Ortofoto consultada el 19-11-2026; fecha de vuelo no inferida de la fecha de consulta. <https://pnoa.ign.es/>
11. **OpenStreetMap contributors.** Geometría del paseo y nodos de apoyos, con identificadores conservados en el JSON. <https://www.openstreetmap.org/way/1303784876>

Las fotografías consultadas se mantienen como referencias privadas temporales de investigación; el sitio solo contiene geometría y materiales procedurales, más su cartografía autorizada.
