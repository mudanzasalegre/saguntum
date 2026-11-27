# Implementación acotada de afloramientos orientales · v54

`dist/js/castle-east-rock.js` exporta `buildEastRock({THREE,batch,keyFor,project,heightAt,detail,qa,features=EAST_PLAN_FEATURES})`. Sólo construye los tres `rockAreas` y las dos trazas `exposed-rock-and-low-remains` del contrato. Las otras seis trazas y todas las estructuras pertenecen al constructor oriental principal.

La roca se forma con anillos poligonales irregulares y dos resaltes de estratificación en detalle completo. El anillo basal se incrusta 0,14 m en la cota suministrada; cada vértice consulta el terreno, también en el borde inferior de la ladera. No se cambia el MDT ni se aplica una malla sólida al polígono completo. Hay huecos deliberados entre fragmentos. Los parámetros de bloques, vegetación y estratificación son interpretativos.

Cada candidato se rechaza si su radio conservador alcanza un recorrido existente (mitad del ancho de representación más 0,65 m), una plataforma/ruina (margen de 0,75 m), o alguna de las seis trazas estructurales (mitad de anchura más 0,40 m). En las áreas, el círculo completo permanece dentro de su límite. Las agrupaciones próximas tienen una separación propia que evita acumulación de fragmentos sobre ambas trazas y el área central.

La vegetación consiste en matas bajas de 0,22–0,50 m y grupos de hierba seca de 0,18–0,36 m. No hay árboles. Los grupos de material llevan región `almenara`, componente igual al ID del rasgo, periodo `unknown`, y materiales `east-rock`, `east-scrub` o `dry-grass`.

## Verificación y coste

El comprobador `east-layout-rock-check.mjs` ejercita los dos niveles de detalle sobre un terreno sintético inclinado y ondulado. Comprueba valores finitos, triángulos completos, cinco componentes correctos, agrupación de materiales y límites de relieve respecto al propio terreno. No certifica la integración de cámaras o el ajuste final del MDT.

| Detalle | Roca | Resaltes | Matorral | Hierba | Triángulos | Grupos de material |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Completo | 155 | 310 | 13 | 23 | 6.045 | 11 |
| Reducido | 96 | 96 | 10 | 11 | 1.706 | 10 |

En detalle completo el máximo relieve comprobado es 1,148 m sobre el terreno y la base mínima −0,14 m. Las piezas de la explanada central quedan por debajo de 0,72 m; la amplitud mayor se reserva para roca exterior de ladera.

El retorno del constructor es el informe completo de contadores, cinco rasgos y huellas de colocación. También queda en `qa.eastRock`. `east-layout-rock-summary.json` contiene los resultados; `east-layout-rock-full.json` y `east-layout-rock-light.json` conservan huellas y resumen, sin duplicar toda la malla. `east-layout-rock-distribution.jpg` permite revisar la distribución sobre PNOA.
