# Validación V6 · paisajes explorables y entorno de agua

## Resultado

La comprobación integrada de los tres paisajes supera **146 de 146 verificaciones CPU**, sin errores ni avisos de geometría. El catálogo conserva **31 lugares y 31 paradas únicas** en el recorrido general. Los tres ámbitos nuevos ofrecen **21 puntos de observación**: ocho en Marjal, seis en Almardà–Almenara y siete en Palancia.

La revisión adicional del nuevo ciclo de vida del agua de Costa supera **11 de 11 comprobaciones**: el destino del reflejo se captura y libera una sola vez, el estado del renderizador se restaura después de un error y una costa descargada deja de animarse o reflejarse.

Resultados completos, de tamaño reducido y sin datos de geometría codificados: `research/validation-v6/landscapes.json` y `research/validation-v6/coast-dispose.json`. El primer archivo incluye huellas SHA-256 de los datos y módulos utilizados.

## Integración que se ha reproducido

La prueba utiliza el mismo orden de construcción de la aplicación:

1. Carga cartografía, elevación y polígonos de agua de cada ámbito.
2. Crea la máscara de agua a partir de las superficies explícitas y sus cotas individuales.
3. Excluye de las calles genéricas las pasarelas y puentes detallados identificados por `landscapeRoadExclusions`.
4. Construye `createUrbanSurface` con muestreo longitudinal de calles de 5 m.
5. Genera la **malla real** con `buildTerrainGeometry`, la elipse y la resolución de visualización de `landscape-regions.json`.
6. Pasa su `meshHeightAt` a `createLandscapeHeritage`, de modo que plantas, apoyos y cámaras se calculan sobre la superficie visible.
7. Crea el agua de paisaje y comprueba coordenadas, máscaras, capas, cámaras, geometría y estado de los reflejos.

Los renders CPU incluyen esa malla real, los modelos naturales, las superficies de agua y la base expositiva. Los edificios y calles de contexto se verifican en la comprobación urbana independiente. La ortofotografía utilizada en estas pruebas procede de PNOA, IGN/CNIG; su fecha de descarga no identifica la fecha de vuelo.

## Geometría integrada

| Ámbito | Focos | Vértices del terreno | Triángulos del terreno | Triángulos del paisaje | Total del render de prueba | Polígonos de agua |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| marjal | 8 | 236,603 | 471,186 | 1,521,246 | 1,998,197 | 17 |
| almarda | 6 | 366,025 | 729,459 | 1,754,788 | 2,490,595 | 3 |
| palancia | 7 | 435,035 | 867,043 | 908,737 | 1,782,837 | 13 |

El total incluye terreno, base y agua, además de todas las instancias del modelo natural; la ciudad de contexto se mide por separado. Estas cifras describen el trabajo geométrico, no un rendimiento garantizado de la GPU.

Se comprueban todos los atributos de geometría, índices y matrices de instancia. La versión final no contiene valores no finitos, índices inválidos ni triángulos degenerados en los elementos comprobados. Los huecos de las islas se mantienen abiertos. La triangulación de cada superficie de agua coincide con su área exterior menos huecos, con una desviación relativa máxima inferior al 0,1 %.

## Cámaras bajas

Las cámaras se comprueban mediante la altura de la malla y una intersección vertical contra los elementos visibles. La altura sobre un tablero es distinta de la distancia al terreno que queda debajo de la pasarela.

| Encuadre | Altura sobre superficie visible | Superficie bajo la cámara | Distancia al objetivo |
| --- | ---: | --- | ---: |
| marjal · pasarela | 1.65 m | Carpintería y detalles del humedal · wood | 10.55 m |
| almarda · pasarela | 1.61 m | Pasarelas cartografiadas · tablones | 29.57 m |
| almarda · barron | 1.66 m | Pasarelas cartografiadas · tablones | 21.19 m |
| almarda · microrreserva | 1.75 m | terrain | 92.64 m |
| almarda · casablanca | 1.75 m | terrain | 73.93 m |
| palancia · a-pie | 1.65 m | terrain | 35.54 m |

Los dos encuadres de Marjal y Palancia quedan a 1,65 m sobre su superficie de apoyo. Los de dunas conservan la altura de observación aproximada diseñada para leer el tablero y la vegetación. Todas las cámaras bajas están fuera del agua abierta, dentro de su elipse y a más de 4 m del objetivo; por tanto, el mínimo orbital de la aplicación no desplaza el encuadre inicial.

Los 21 focos tienen vectores finitos y ubicaciones dentro de sus terrenos. Cada foco 3D tiene un identificador correspondiente en `observationPoints`, utilizado por el mapa y los controles. Son puntos orbitales a baja altura; esta iteración no añade locomoción peatonal continua ni certifica el estado físico de los accesos.

## Agua, zonas secas e islas

La máscara sólo utiliza `surfaces` de los archivos de agua. No convierte ejes de ríos ni límites de humedal en superficies inundadas. El fondo de visualización baja únicamente cuando el punto pertenece a un polígono de agua y no pertenece a uno de sus huecos; conserva la altura original fuera de ellos y nunca la eleva.

La gran superficie intermitente de Marjal identificada por OSM 14371582 mantiene su lectura en la ortofotografía y el terreno. No se llena de agua permanente ni se inventan charcos parciales dentro de ella. En Palancia, los focos urbano, puentes, aluvial y Canet permanecen secos; la lámina del brazo sur del delta conserva su contorno específico.

El entorno permite **dos reflejos planares como máximo**: el mar a una misma cota se agrupa en un reflejo y la mayor superficie interior recibe el segundo. Las láminas restantes conservan sus niveles individuales y emplean materiales físicos; en móvil se emplea material estándar para esas superficies pequeñas.

Los reflejos se actualizan con intervalos mínimos de 66/100 ms en escritorio y 135/210 ms en móvil. Durante una pasada se ocultan los otros objetos Water y se bloquea la recursión. El ensayo simula un fallo de renderizado y verifica la restauración del destino de dibujo, XR, sombras, visibilidad y método del renderizador. El movimiento reducido congela la ondulación y el desplazamiento de las normales, manteniendo la posibilidad de actualizar los reflejos al cambiar la cámara o la luz.

Las cotas de agua y las depresiones del fondo son aproximaciones para la visualización, no medidas hidrológicas en directo ni batimetría.

### Límite de los estanques pequeños

La consulta analítica de agua y su geometría respetan los contornos, pero la malla de terreno regular puede interpolar una orilla por encima de una superficie muy pequeña. Se conserva esta limitación de resolución para evitar deformar terreno fuera del polígono o atribuir precisión no disponible.

El muestreo por centroides de triángulo detecta partes de orilla ocultas en cinco pequeñas superficies de Marjal, aproximadamente entre el 3 % y el 10,5 % de su área representada. En Palancia, dos estanques interiores ajenos a los focos principales, de unos 65 y 47 m², quedan aproximadamente un 49 % y un 100 % tapados por la interpolación del terreno. Sus identificadores OSM son 361639208 y 361639209. Este cálculo es una estimación geométrica por muestras, no un porcentaje medido píxel a píxel.

Las principales lagunas, las dos golas, el mar y la lámina del brazo sur del delta se mantienen visibles. La decisión de mantener las pequeñas superficies infrarresueltas queda registrada y no altera el alcance de los controles ni los recorridos principales.

## Capas de vegetación

`createLandscapeHeritage` mantiene `vegetation` como grupo independiente de `currentGroup`. La prueba oculta estructuras y confirma que las plantas continúan visibles; después oculta plantas y confirma que los elementos de observación permanecen visibles. Así, las opciones de vegetación y patrimonio funcionan de forma independiente.

Las posiciones individuales son interpretativas. Se respetan las máscaras de hábitat, agua y caminos de cada modelo; la escena no presenta las plantas como un inventario de ejemplares actuales.

## Revisión visual y correcciones

Se generaron y revisaron cuatro imágenes de 1500 × 1000 píxeles con Blender y CPU:

- **Marjal, conjunto:** relación entre humedal, parcelas, lagunas y litoral; preservación de las zonas estacionales.
- **Marjal, pasarela:** continuidad del tablero y barandillas en las curvas, altura de observación y separación entre vegetación y recorrido.
- **Almardà, pasarela baja:** apoyo de la madera, detalle de tornillería, vegetación baja, arena y continuidad hacia el mar.
- **Palancia, delta:** cauce seco, brazos del delta, lámina del brazo sur y distribución irregular de la vegetación sobre la barra.

La revisión corrigió los huecos entre tramos de la pasarela de Marjal mediante encuentros a inglete. Se eliminaron 50 triángulos de área nula de las puntas de las plantillas vegetales de dunas, conservando su silueta. El muestreo de matorral del delta pasó a distribuirse por superficie con semilla fija, evitando una lectura visual en filas de cultivo.

Las imágenes finales se encuentran en `research/validation-v6/`:

- `marjal-overview.png`
- `marjal-pasarela.png`
- `almarda-pasarela.png`
- `palancia-delta.png`

La vegetación y los elementos constructivos usan la geometría exportada de Three.js. El agua de Blender utiliza un material de reflexión para inspección geométrica; los renders CPU no compilan el shader WebGL de la aplicación ni prueban sus controles. La comprobación en navegador y la comprobación urbana se completan por separado.

## Reproducción

Desde la raíz del repositorio:

```bash
node --experimental-loader ./research/validate_loader.mjs research/validate_landscapes_v6.mjs
node --experimental-loader ./research/validate_loader.mjs research/validate_coast_dispose_v6.mjs
```

Para exportar la geometría y repetir las cuatro vistas en una carpeta temporal:

```bash
node --experimental-loader ./research/validate_loader.mjs research/validate_landscapes_v6.mjs --export /tmp/saguntum-landscapes-v6
blender -b -t 6 --python research/render_landscapes_v6.py -- /tmp/saguntum-landscapes-v6
```

Se puede añadir `marjal`, `almarda` o `palancia` después de la carpeta en el comando de Blender para regenerar sólo ese ámbito. Los grandes archivos de geometría comprimida permanecen en la carpeta temporal y no forman parte del sitio publicado.

## Contexto, interfaz y regresiones

La edificación de las seis regiones supera las comprobaciones de geometría, cubiertas frente al agua, exclusiones patrimoniales y encaje con la malla visible. El desglose y la procedencia de alturas están en `validation-v6/city-summary.md`. Los resultados no equivalen a un recuento de edificios únicos: son partes y los ámbitos se solapan.

Los mapas 2D superan 226 comprobaciones de canvas. La caché regional supera 12 comprobaciones de reutilización, límite de una región en móvil/dos en escritorio, redimensionado, cancelación de cargas obsoletas, reintento y liberación de recursos. La sintaxis de los 31 módulos de la aplicación es válida.

En Chrome de prueba se han comprobado el catálogo de 31 lugares, el filtro de tres paisajes, los recorridos de 8, 6 y 7 puntos, las fichas documentales, el mapa territorial con seis ámbitos, el cambio a Sagunto y el avance del recorrido general de 31 lugares. Captura: `validation-v6/browser-landscapes.jpg`. Alcance exacto: `validation-v6/browser-checks.json`.

El navegador informa WebGL deshabilitado. Los ensayos CPU y renders geométricos no acreditan rendimiento GPU, apariencia final de shaders ni interacción 3D en móvil. La aplicación mantiene la vista alternativa 2D.

La regresión final de Sagunto supera **222 comprobaciones**, incluidas 40 vistas en corte o histórica sin oclusión de contexto en escritorio y móvil. Se elevó de 50 a 55 m el componente vertical del encuadre general del corte de la Domus para salvar una cubierta catastral, manteniendo todos los restos en pantalla. La cornisa que detectaba el rayo de contexto en Diana queda detrás de la cara del muro visible y no requirió cambiar el modelo. La regresión del Puerto supera 44 comprobaciones y la de Costa 131.
