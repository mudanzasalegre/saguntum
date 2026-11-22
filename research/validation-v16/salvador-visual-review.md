# El Salvador · revisión visual final V16

**Resultado: cinco vistas revisadas y aprobadas para la presentación arquitectónica.** No se observan oclusiones de cámara ni defectos geométricos bloqueantes en los encuadres finales examinados. La revisión se realizó sobre las imágenes de **1440 × 1080 píxeles**, después de las correcciones de cubiertas y encuentros. No se utilizaron los borradores de 960 × 720 como evidencia final.

## Alcance y método

Son renders CPU de la geometría exportada del modelo de producción. La revisión examina encuadre, continuidad de las superficies, huecos arquitectónicos, encuentros de cubiertas y apoyo sobre el terreno. El conjunto y la nave se revisaron además por el responsable de integración.

Esta revisión **no certifica el comportamiento del renderizador WebGL, el rendimiento en navegador, el movimiento libre por todos los puntos del modelo ni una precisión de levantamiento arquitectónico**. Las proporciones, acabados interpretados y límites documentales permanecen descritos en `research/salvador-model.md` y en el cuaderno de visita. Se conserva el granulado residual del trazado CPU; las imágenes no se han retocado para ocultar geometría.

## Observación de las cinco vistas

| Vista | Observación final | Resultado |
|---|---|---|
| Plaza | Línea de visión libre desde el espacio público. Torre, capilla bautismal, nave y Comunión se apoyan en la plataforma sin separación visible respecto a zócalos y pavimento. Escalones y barandillas permanecen legibles. Desaparece el arco oscuro que antes sobresalía de la cubierta plana delante del tambor. | Aprobada. |
| Portada | Se leen dovelas, juntas radiales, impostas, hojas y herrajes; la marquesina mantiene transparencia y soportes. La ventana superior tiene un hueco real. Es un encuadre cercano de detalle: recorta la parte inferior de la puerta y no pretende abarcar toda la fachada. No hay una casa situada entre cámara y portada. | Aprobada. |
| Sección | Retirada de cubiertas y bóvedas coherente; permanecen la nave de tres tramos, dos diafragmas, cabecera, pasos laterales, pavimento y presbiterio. Las coronaciones de torre, ábside, sacristía y Comunión son continuas y han desaparecido los cuadrados negros de los solapes iniciales. El corte no abre una excavación bajo el suelo. | Aprobada. |
| Ábside | Cabecera cerrada, lanceta axial y laterales, nervios, plementos blancos y apoyos continuos. Altar y cruz no ocultan los elementos estructurales. El encuadre cercano prioriza cabecera y altar; la parte alta de la clave se observa en la parada específica de crucería. | Aprobada. |
| Comunión | La nueva transición de los arcos a la cúpula cierra los dos vacíos triangulares observados en el render anterior. Se leen los cuatro arcos, pilastras y media naranja sin aberturas al trasdós en aquellas uniones. La vista se centra en la arquitectura alta; no añade un inventario de mobiliario ni pinturas no documentadas. | Aprobada. |

## Defectos encontrados y correcciones comprobadas

1. **Coronaciones coplanares.** Las cajas independientes de las albardillas se solapaban en las esquinas, produciendo puntos negros en la terraza y en la sección. Se sustituyeron por bandas continuas a inglete, manteniendo alturas, materiales y anchuras. La prueba geométrica devuelve **0 m² de solape** entre los triángulos superiores de las cinco coronaciones comprobadas. La nueva sección y el nuevo conjunto confirman la desaparición visual del defecto.
2. **Cruce de la bóveda con la cubierta de Comunión.** Los brazos y anillos interiores sobresalían ligeramente del cierre exterior. El paño y su cornisa se elevaron **25 cm**, manteniendo el intradós y las cámaras. La separación mínima calculada sobre el anillo más alto es **0,029999 m**. La nueva vista de plaza ya no muestra la media luna oscura exterior.
3. **Pechinas incompletas.** La transición inicial empezaba demasiado alta y dejaba vacíos entre los arcos y el anillo. Se sustituyó por una superficie esférica que sigue los semicírculos y alcanza la circunferencia de la cúpula. **36 de 36 rayos** alcanzan el intradós previsto, con error máximo de **0,0000191 m**. La nueva imagen de Comunión confirma el cierre de los grandes vacíos y la continuidad de la transición.

Las correcciones se limitaron a estos encuentros, sin ampliar ornamentación, cambiar el registro del edificio ni sustituir las cámaras por una composición distinta.

## Correspondencia entre imágenes y cambios

Se regeneraron **Comunión, sección, conjunto y plaza**, porque contienen las superficies corregidas. Se conservaron **nave, ábside y portada**, cuyas superficies visibles, materiales y cámaras permanecieron idénticos tras estos ajustes. No se repitieron esas tres imágenes por rutina.

La QA arquitectónica final registra **43 de 43 comprobaciones aprobadas**, **103 mallas** y **112.568 triángulos** para el templo. La prueba integrada del atlas se conserva por separado en `integrated-scene-qa.json`.

## Huellas de los archivos revisados

| Archivo | Resolución | SHA-256 |
|---|---|---|
| `salvador-plaza.png` | 1440 × 1080 | `7a7c48c28164711025b17a5912ee40a25d27ef6cb22139b64be34d7697c01112` |
| `salvador-portada.png` | 1440 × 1080 | `ce296fba4cfb653370b2f8095e90e54f445379050faca5ceb33e6c2fa9553627` |
| `salvador-seccion.png` | 1440 × 1080 | `f7212dcec8dc48898eeb75dce50c8b8cb73b76d17a3ee3a859a8504c2c629405` |
| `salvador-abside.png` | 1440 × 1080 | `cd1d04481cdbe8e3c1396cd915f743d9538bc2437c7bd202f8ba052b8c5d70ae` |
| `salvador-comunion.png` | 1440 × 1080 | `96189f9934e3c05f6e3b9cb629e07839c67736f0b7b8c67d8904f7cc02f15b42` |

Modelo final: `d3cdf9fa5b4d62bb53fdd2104c55a1fa44496130bbf21284f401dbc42484b17f`  
Planta exportada: `071cb01e59c5a58a2d926f2bd70059daf35dd6d40eeeb3cba99b46381d6c3053`
