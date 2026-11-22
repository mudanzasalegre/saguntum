# Teatro romano de Sagunto — modelo V8

## Estado representado

La escena principal muestra el teatro conservado y rehabilitado, con la cávea revestida de caliza, el cuerpo escénico contemporáneo, su cubierta inclinada y el encuentro con fábricas arqueológicas. No se presenta un alzado romano completo como si se conservara. La interpretación arqueológica del frente con varios órdenes pertenece a las explicaciones históricas, no a una fachada inventada en la escena actual.

El módulo está en `dist/js/theatre.js`; `dist/js/monuments.js` integra el teatro y mantiene la construcción diferida del Castillo. La estructura, materiales y recursos del Castillo no se han modificado en esta tarea.

## Fuentes y decisiones

Las entradas completas, enlaces, fechas y notas de cada fuente están en `dist/assets/data/theatre-visit.json` y `research/theatre-history.md`. Para la geometría se utilizan:

| Fuente | Aplicación al modelo | Límite |
|---|---|---|
| Hernández, López, Pascual y Aranegui, *El teatro romano de Sagunto*, CAR 2, 1993, pp. 25–42 — [PDF](https://revistas.um.es/car/article/download/68181/65651/283861) | Proporciones de orchestra/cávea, órdenes de gradas, accesos, escenario, foso del telón y cloaca. | Las restituciones publicadas no equivalen a un levantamiento del estado actual. |
| Hernández, *Sistema constructivo del cuerpo escénico*, 1986 — [PDF](https://roderic.uv.es/rest/api/core/bitstreams/9cf42415-05d5-45ff-8e2c-966cf613200f/content) | Distinción entre el muro exterior del cuerpo escénico y el frente de escenario. | Las cotas de fábrica antigua no permiten fijar toda la superficie y altura de la escena original. |
| Portaceli, *La rehabilitación del teatro romano de Sagunto*, CAR 2, 1993, pp. 43–45 — [PDF](https://revistas.um.es/car/article/download/68281/65731/284251) | Lectura de la concha contemporánea superpuesta y de las partes nuevas frente a los restos. | El modelo no reconstruye cada fragmento arqueológico. |
| Grassi / Portaceli, proyecto 1990–1993 — [Arquitectura Viva](https://arquitecturaviva.com/obras/teatro-romano-sagunto) | Cubierta inclinada, nueva escena, masas laterales, pasarela del foso y carácter del edificio rehabilitado. | Perfiles, juntas, alturas y detalles de acabado son una aproximación visual. |
| Cartografía OSM incluida en `cartography.json`, contrastada con la ortofoto IGN PNOA incluida en la aplicación | Huella actual, posición del centro, dirección del cuerpo escénico y registro con el terreno. | Exactitud cartográfica de las fuentes; no se declara un nuevo levantamiento topográfico. |

### Proporciones

La orchestra libre ocupa un diámetro de **16 m**; las dos gradas senatoriales amplían el conjunto a **22 m**. Los límites modulares de los tres órdenes de la cávea son **34, 49 y 67 m**, con un módulo total de **79 m** para el pórtico superior en el estudio arqueológico. Se construyen los **6, 8 y 9** niveles de asiento descritos para ima, media y summa cavea, con sus escaleras y pasillos. La terminación superficial y los escalones adicionales del remate actual se identifican como rehabilitación y no como asientos romanos intactos. Fuente: Hernández et al., 1993, pp. 28–30.

El escenario tiene **44 m de frente** y **6,4 m de profundidad** en el esquema arqueológico. Se distingue de los **52,75 m** del muro exterior estudiado en 1986. La altura del escenario contemporáneo es una decisión visual del modelo; no se atribuye a una cota antigua conservada. Fuentes: Hernández et al., 1993, pp. 31–32; Hernández, 1986.

El anillo exterior actual no se confunde con el diámetro modular de 79 m. Sus flancos se representan alrededor del trazado cartográfico, con un radio aproximado de 42,7 m y la interrupción central visible en la huella. La pared de remate de la cávea actual se aproxima a la línea de la ortofoto y del contorno OSM. No se fabrica una columnata antigua completa en el pórtico superior.

## Registro cartográfico y terreno

- Centro de referencia del modelo: longitud **−0,27795671425**, latitud **39,67686986465**.
- Rotación en Three.js alrededor de Y: **−0,5027 rad**. El eje del cuerpo escénico sigue aproximadamente la dirección noroeste–sureste y la cávea abre hacia el noreste.
- El centro deriva de un ajuste circular a 20 vértices de la parte central de la huella OSM. Ese arco tiene radio ajustado aproximado de 38,48 m y residuo radial de unos 0,09 m; este residuo describe sólo el ajuste al dibujo, no la precisión real del monumento.
- La orientación sigue el tramo recto de la escena en OSM y se comprobó contra la ortofoto PNOA ya utilizada por el proyecto.
- La base vertical parte del muestreador de elevación de la aplicación y se ajusta 0,65 m para acomodar el suelo de la orchestra. Las alturas arquitectónicas son relativas a esa base; no se anuncian como nuevas cotas absolutas medidas.

`surfaceHeight(x,z,raw)` baja la superficie de visualización exclusivamente bajo el teatro: orchestra, gradas y cuerpo escénico. El corte bajo la escena permite mostrar el esquema del foso sin que la interpolación del terreno lo tape. La función también se aplica antes de construir el terreno de contexto del Palancia. `bindGround(meshHeightAt)` actualiza la seguridad de las cámaras con el muestreador del terreno finalmente dibujado.

Se excluyen de los edificios genéricos el antiguo identificador OSM del teatro y las dos piezas catastrales que duplican el conjunto y la escena: `203140142`, `cat-3556901YJ3935N_part1-0`, `cat-3556901YJ3935N_part2-0`. Se excluyen además 27 vías interiores OSM que, de lo contrario, se superpondrían a gradas y pasillos. Las calles de aproximación exteriores se mantienen.

## Huecos, sección y capas

Los aditus, cuatro pasos de vomitorios y tres puertas del frente escénico están construidos con sólidos separados y bóvedas abiertas. No son rectángulos oscuros pegados a un muro. Los rayos de comprobación atraviesan todo su espesor y comprueban también la ausencia de terreno dentro de esos pasos.

La sección didáctica **retira la cubierta y el tablado contemporáneos**. No pretende ser un desmonte real ni un estado histórico del edificio. Permite reconocer un esquema del foso del escenario, la pasarela moderna y la cloaca. El aulaeum mantiene el dato documental de un canal de **1,42 m**, **17 tabiques** y **16 huecos**; la distribución individual, el contorno de los restos y su alzado son aproximados. El artículo describe anchuras variables y una disposición que no es perfectamente simétrica; por ello no se genera una maquinaria de telón completa ni se afirma que cada pozo esté levantado con precisión. Fuente: Hernández et al., 1993, pp. 31–32.

Los cruces de los tabiques con la cloaca dejan pasar la bóveda. No hay un bloque macizo ocultando la conducción. La extensión bajo la orchestra permanece cubierta y no se ofrece como recorrido peatonal.

| Capa de lectura | Color | Tratamiento |
|---|---|---|
| `ancient` | `#d6bd8b` | Restos romanos identificables, de extensión conservadora. |
| `contemporary` | `#77b8c7` | Revestimiento de gradas, escena, cubierta y elementos de la rehabilitación. |
| `mixed` | `#be98d6` | Fábricas conservadas que han recibido consolidaciones y restituciones. |
| `interpretation` | `#929ba0` | Esquema del subsuelo y fragmentos genéricos que no se presentan como piezas exactas. |

En lectura de materiales, los muros usan textura procedural de fábrica, las gradas caliza clara, la cubierta metal mate y el tablado madera. La lectura por épocas cambia los colores sin reemplazar definitivamente los materiales. La selección sólo ilumina los componentes relacionados con la parada.

## Contrato para la aplicación

```js
const theatre = createTheatre({ heightAt, project, data, visitData });
const visit = theatre.userData.visit;
visit.focuses[stopId]; // target Vector3, bounds Box3, offset, closeOffset…
visit.selectFocus(stopId); // null para limpiar selección
visit.setReadingMode('materials'); // o 'periods'
visit.setSection(true); // devuelve boolean; false repone cubierta y tablado
visit.bindGround(finalMeshHeightAt);
visit.getState(); // { selected, readingMode, sectionOpen }
```

`visit.plan` se deriva de la misma transformación geográfica del modelo e incluye el contorno y 21 componentes. Se exporta a `dist/assets/data/theatre-plan.json` para que el plano siga disponible cuando WebGL no pueda arrancar. Las 16 paradas comparten IDs con la documentación; los focos del foso y cloaca incluyen `requiresSection: true`.

Todos los materiales y texturas pertenecen a cada instancia mediante `userData.ownedResources`. El teatro de Sagunto y su presencia en el contexto del Palancia no comparten una caché de recursos que pueda eliminarse al cambiar de región.

## Verificación reproducible

```sh
node --experimental-loader ./research/validate_loader.mjs research/validate_theatre_v8.mjs --export
blender -b -t 8 --python research/render_theatre_v8.py
```

La comprobación CPU usa la geometría real y el terreno final, incluidas las superficies urbanas y cimentaciones vecinas. Revisa atributos finitos, identificación de las 16 paradas, dimensiones y órdenes documentados, huecos físicos, conducción bajo el foso, superficies sobre el terreno, cámaras, materiales, visibilidad y propiedad de recursos. Los resultados legibles están en `research/validation-v8/theatre-geometry.json`.

Los renders `teatro-conjunto.png`, `teatro-orchestra.png` y `teatro-corte.png` se obtienen con Cycles a partir de las mallas exportadas por Three.js. Son inspecciones de geometría, **no capturas de WebGL**. Conservan posiciones, matrices, terreno y ortofoto; aproximan los materiales, por lo que no sustituyen las comprobaciones del navegador. El encuadre responsive y la integración de las dos regiones se comprueban por separado en la validación V8 de la aplicación.

## Límites explícitos

Este modelo es una interpretación arquitectónica documentada, no una fotogrametría ni un gemelo de conservación. No valida accesibilidad física, rutas autorizadas, dimensiones de seguridad ni navegación real en primera persona. Las tres puertas, los pasillos y las galerías visibles permiten comprender la estructura; las posiciones precisas de irregularidades, piezas decorativas y marcas de cantería requerirían levantamientos e imágenes adicionales. Se conserva la diferencia entre lo documentado, lo rehabilitado y lo esquemático durante toda la visita.
