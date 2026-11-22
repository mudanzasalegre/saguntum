# V25 · Arquitectura de la Gerencia y la ciudad jardín

## Base de la representación

El modelo nuevo conserva las doce estructuras registradas en `port-garden.json`: un conjunto administrativo y once agrupaciones residenciales. Las paredes siguen los contornos catastrales; las cubiertas se registran en los polígonos previamente contrastados con PNOA. Las alturas, espesores y detalles menores son proporcionales, no un levantamiento métrico. La consulta de una ortofotografía tampoco acredita el estado actual de cada inmueble.

Se distinguen las oficinas originales de 1921, en el cuerpo sureste de aproximadamente 60 m, y la ampliación de 1952, en el cuerpo noroeste de aproximadamente 31 m. La identificación se contrastó con el estudio fotográfico de CONTRAST, que distingue las fachadas urbanas y las del jardín, el revoco con despiece fingido, los marcos pétreos, los paños de ladrillo y el arco de enlace. La ubicación del arco usa los dos segmentos del cuerpo retranqueado del registro catastral. El semisótano se expresa en el basamento; no se inventa un recorrido interior por ese nivel.

Fuentes: [oficinas, CONTRAST](https://contrastapips.com/IHACM/IBP/Port/Port_patri_ofi.htm) y [conjunto, Universitat de València](https://www.uv.es/patrimoni_industrial_sagunt/bicgerencia/gerencia.html).

## Oficinas: exterior e interior

El frente de entrada incorpora el cuerpo central entre bandas de ladrillo, escalera exterior, acceso abierto con hojas de reja, ventanas superiores rectas y huecos inferiores de arco rebajado. Los marcos, impostas, basas, remates y reloj perpendicular ayudan a reconocer la fachada. Ventanas y accesos tienen huecos físicos atravesando los muros; el vidrio es un material transparente independiente.

El vestíbulo, la escalera y las salas de representación siguen la secuencia descrita por UV y fotografiada por CONTRAST. Se representan pavimentos claros con bandas ocres, zócalos verdes, escalones de mármol, balaustres torneados de madera, revestimientos de las salas y una pantalla de vidrio coloreado. El motivo del vidrio es una composición procedural original, con referencias cromáticas al paisaje industrial, sin usar la fotografía como textura ni afirmar que se haya reproducido la obra artística. Las dimensiones exactas del hueco de escalera, los tabiques y el mobiliario son interpretativos. Las tres cámaras interiores mantienen sus techos y plantas en la vista normal.

Las fotografías de contraste consultadas están registradas en `research/validation-v25/office-entry.jpg`, `office-stair.jpg`, `office-stained.jpg` y `office-link.jpg`. Son referencias de investigación; no se incorporan a la distribución web.

## Tipologías residenciales

La correspondencia con el mapa de CONTRAST distingue A1/A2 (registros 1/2), B1/B2 (3/4), el pabellón E (5), D1–D4 (6), C3–C4 (7), D5–D8 (8), F1–F2 (9), G1–G2 (10) y C1–C2 (11). El registro 9 representa una pareja y no una vivienda individual. Las dos filas se modelan con cuatro unidades cada una. Así se representa la lectura de 21 viviendas de este estudio; se conserva la discrepancia con las 22 citadas por UV, sin convertir cada cubierta en una vivienda.

Los alzados incorporan revocos, carpintería verde, contraventanas, porches, balcones, chimeneas y cubiertas inclinadas. Se diferencian los remates de A1/A2, la buhardilla y falsa sillería de B1, y los frontones curvos de las parejas y filas correspondientes. La conservación se expresa con variación tonal contenida; la maqueta no acredita una rehabilitación integral ni el acceso público a las viviendas.

Las filas de cuatro se contrastaron con las figuras 10 y 11 del TFM UPV de Hilary Quintanilla (2023), páginas PDF 19 y 20. Son dibujos del estado arquitectónico estudiado, derivados de planos anteriores; no se adoptó la propuesta de albergue de los capítulos posteriores. Las medianeras se registran proporcionalmente. No se ofrece una visita por interiores domésticos inventados.

Fuentes: [ciudad jardín I](https://contrastapips.com/IHACM/IBP/Port/Port_patri_jardi.htm), [ciudad jardín II](https://www.contrastapips.com/IHACM/IBP/Port/Port_patri_jardi2.htm), [TFM UPV](https://riunet.upv.es/server/api/core/bitstreams/06657e4e-6424-4bb1-a304-83c9dfa5c30f/content).

## Sección, plano y recursos

La sección retira todas las cubiertas, sus pieles interiores y los forjados superiores, además de las escaleras, particiones superiores, mobiliario y barandillas que dependen de ellos. Conserva las paredes perimetrales, los suelos inferiores, los apoyos de porches y las particiones de planta baja. Es una operación didáctica digital. En el plano, los componentes tienen edificio, planta y comportamiento de sección explícitos; las oficinas originales y la ampliación disponen de registros independientes para el encuadre.

El modelo aporta trece focos arquitectónicos. El contexto añade siete, bajo propiedad independiente para jardines, caminos, puerta y vallados. Los recursos de geometría, material y textura se crean por construcción, se registran y pueden liberarse sin afectar a otra visita. Las cámaras interiores no se desplazan al vincular el terreno; las exteriores corrigen únicamente la altura mínima del observador.

## Comprobación

`research/validation-v25/validate_gerencia_model.mjs` ejecuta el modelo real mediante Three.js vendorizado. Verifica las ventanas y puertas con rayos, los encuadres interiores y su proximidad a obstáculos, geometría finita sin triángulos degenerados, sección, restauración de materiales y propiedad de recursos. El informe es `gerencia-model-qa.json`. La integración con el terreno y los edificios vecinos, los renders CPU y la verificación del navegador corresponden a las comprobaciones generales de V25.
