# Casa dels Berenguer y Diana · entorno colindante

## Alcance y procedencia

El contexto incorpora **23 partes de 9 parcelas catastrales** situadas al oeste y suroeste del conjunto. Conserva sus plantas, subdivisiones, alturas y atributos de procedencia. Doce partes utilizan estimaciones del MDS normalizado del IGN y once utilizan el número de plantas de Catastro. No hay alturas domésticas de reserva ni correcciones de cubierta en esta selección.

El resto de los edificios inmediatos ya pertenece a los modelos detallados de Santa María, Plaça Major, la judería y el Calvario. Se conserva ese trabajo; no se vuelven a dibujar las mismas viviendas. La selección de 38 m alrededor de la casa y del anexo es un límite de carga y composición, no un perímetro histórico.

Los huecos, carpinterías, balcones, revocos y formas menores de cubierta de las casas de contexto son interpretativos. Sus plantas y alturas de referencia permanecen registradas. Las texturas de teja y piedra añaden relieve superficial; no se presentan como fotografías de las fachadas.

Fuentes cartográficas: [Catastro INSPIRE](https://www.catastro.hacienda.gob.es/webinspire/), [OpenStreetMap](https://www.openstreetmap.org/way/733321157), [IGN MDS normalizado](https://datos.gob.es/es/catalogo/e00125901-spaignmds-normalizado) y [PNOA](https://www.ign.es/wms-inspire/pnoa-ma). Se reutilizan las capturas y atribuciones del atlas, sin afirmar un levantamiento nuevo de todas las fachadas.

## Propiedad de las geometrías

El modelo principal toma los cuatro cuerpos de la parcela `3558202YJ3935G` y los dos de la parcela occidental `3558201YJ3935G`, cuya identificación con el anexo se infiere de la posición descrita por el Ayuntamiento y de las plantas colindantes; no es una certificación independiente de su dirección catastral. Las seis filas se conservan literalmente en `coreBuildings`, con alturas y procedencia originales. La pieza baja de la parcela `3558249YJ3935G`, dentro de la prolongación meridional del recinto OSM, se incluye como `associatedBuildings` para que el núcleo la interprete sin confundirla con una vivienda exterior.

| Propietario anterior | Parte que se transfiere | Nuevo responsable |
| --- | --- | --- |
| Santa María | `cat-3558201YJ3935G_part1-0` | Núcleo Berenguer, anexo occidental |
| Santa María | `cat-3558201YJ3935G_part2-0` | Núcleo Berenguer, anexo occidental |
| Judería | `cat-3558202YJ3935G_part4-0` | Núcleo Berenguer, casa principal |

La función `withoutBerenguerClaims(contextData, berenguerContextData)` devuelve una copia con esas tres partes retiradas del propietario anterior. No modifica los JSON originales. Los pavimentos, calles y focos de las visitas anteriores conservan sus objetos y coordenadas. Plaça Major y Calvario no ceden ninguna parte.

El estado de estos volúmenes merece atención: el Ayuntamiento documenta la **demolición parcial, estabilización e investigación arqueológica del anexo en agosto de 2025**. El expediente de servicios de junio de 2026 no demuestra que su consolidación física estuviera terminada. El modelo del núcleo debe explicar su representación aproximada y no devolver al anexo una cubierta íntegra como si esa fuera su situación comprobada. Fuentes: [nota municipal de 4 de agosto de 2025](https://aytosagunto.es/es/actualidad/2025-08-04-concluye-la-primera-fase-de-las-obras-en-el-inmueble-anexo-a-la-casa-dels-berenguer/) y [Junta de Gobierno de 12 de junio de 2026, punto 20](https://aytosagunto.es/media/gehdg0d1/extracto-web-jgl260612.pdf).

## Calles y relieve

Se añaden cuatro tramos exteriores procedentes de OSM: calle de la Escuela, Penya Esvaradora y el acceso oriental de Sagrari. Los segmentos se recortan contra los edificios, los patios privados, la casa, el anexo, los accesos internos y los pavimentos de propietarios anteriores. Las partes ya detalladas de Sagrari y del camino al Teatro permanecen en sus modelos existentes.

No se elimina ninguna calle completa: `excludedRoadIds` queda vacío. Los fragmentos de nueva superficie no rompen las continuaciones cartografiadas. Las vías internas `1419209842` a `1419209846` pertenecen al núcleo Berenguer; la vía `1419209841` sólo aporta el tramo exterior que queda fuera de ese núcleo.

El nuevo pavimento cubre aproximadamente **342,7 m²**. Sus 396 triángulos comparten los cortes de la malla final del terreno de 2,5 m, en lugar de atravesar sus cambios de plano. Se coloca a 10,5 cm de la superficie para su lectura gráfica y cierra los bordes contra el suelo. El contexto no introduce plataformas que aplanen el MDT.

La plaza de Diana pertenece al modelo principal. Su pavimento y relación con los restos deben contrastarse con el [proyecto de urbanización de SKRQ](https://skrq.es/es/diana.html), que documenta piedra de Ulldecona, dolomita blanca, bancos orientados al muro, cierre perimetral y vegetación. No se extiende ese acabado a todas las calles del entorno como si estuviera medido.

## Integración

1. Pasar `berenguerContextData` a la fábrica de patrimonio sagrado y a la de patrimonio civil.
2. Antes de crear los contextos de Santa María y la judería, pasar sus datos por `withoutBerenguerClaims`.
3. Crear `createBerenguerContext({data, landmarks, project, heightAt, contextData, visitData})` y añadir su grupo al conjunto Berenguer. `visitData` sincroniza el color de la capa `context` con la leyenda de la visita.
4. Incorporar `excludedBuildingIds` del contexto y `coreExcludedBuildingIds` al filtro de ciudad genérica, además de las exclusiones del modelo principal.
5. Llamar a `bindGround(terrain.meshHeightAt)` una vez construido el relieve definitivo. El método sustituye y libera sus recursos anteriores.
6. Si el modelo principal afina el contorno de la plaza, guardarlo en `berenguer-plan.json` bajo `contextOwnership.dianaForecourt` y regenerar los datos del contexto. Esto recalcula únicamente los recortes exteriores.

## Verificación

`validate_berenguer_context.mjs` comprueba la inmutabilidad de los datos, las transferencias exactas, la ausencia de duplicación de partes, las alturas documentadas, la adaptación al suelo, la restauración de materiales y la independencia y liberación de recursos.

La primera comprobación pasa **151 controles**. El contexto produce **8 mallas y 10.365 triángulos**. Las 1.584 muestras sobre vértices intermedios y caras de pavimento se mantienen a la distancia prevista del relieve, con una desviación máxima de aproximadamente **0,000004 m** por precisión numérica. El recorte no deja huecos ni solapes significativos: todos quedan por debajo de 0,001 m² en las pruebas geométricas.

```sh
python research/validation-v14/prepare_berenguer_context.py
node --experimental-loader ./research/validate_loader.mjs research/validation-v14/validate_berenguer_context.mjs
```

Informes: `research/validation-v14/berenguer-context-qa.json` y `berenguer-context-pavement-qa.json`. El plano de propiedad de trabajo `berenguer-context-ownership.png` permite revisar qué volumen conserva cada escena.
