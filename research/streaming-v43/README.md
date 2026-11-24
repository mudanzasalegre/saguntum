# Acercamiento a los lugares del Atlas

La cámara utiliza el movimiento del punto de observación y la variación del zoom para prever la llegada a una huella patrimonial. El sector bajo el visitante mantiene prioridad. En el destino previsto se puede preparar un modelo original con su contexto, el sector viario, los edificios cartográficos y un lote de fachadas. La preparación usa los límites de memoria y de modelos del perfil activo. La malla base sigue dibujándose hasta que su relevo está disponible.

El buscador anticipa el módulo y los datos del destino al enfocarlo con el teclado o detener el puntero sobre un resultado. La petición de un contexto carga su constructor individual. En Chrome se verificó que solicitar el contexto del Alto Horno sólo descargaba `horno-context.js` de los 23 módulos de entornos patrimoniales. La Glorieta también anticipa la cartografía de las manzanas adyacentes.

En el zoom orbital de prueba de la Glorieta se dibujó el sector a 536 m de radio y el conjunto patrimonial con sus calles y edificios a 498 m. En vuelo hacia el Alto Horno, el sector estuvo listo a 465 m del ancla, el modelo urbano con su contexto a 446 m y la escena interactiva a 285 m. Las dos aproximaciones se hicieron en WebGPU con calidad media y sin seleccionar el monumento. Los radios y distancias son observaciones de esas trayectorias. [Registro de las aproximaciones](../render-v4/aproximacion-patrimonio.json)

Las normales y la esfera de encuadre de los edificios se calculan en el trabajador que prepara la geometría. La construcción interactiva cede tiempo al navegador entre arquitectura y contexto y durante el cálculo de barreras peatonales. La prueba de colisiones compara cada coordenada con la preparación síncrona y comprueba la cancelación cuando cambia el destino. [Prueba de barreras](../test-walking-preparation.mjs)

Las luces de cada visita alimentan un conjunto reutilizable que mantiene posiciones, alcances, colores e intensidades. La distancia de la cámara y la hora regulan la sombra del sol. En WebGL, el simulador conserva hasta 6 programas gráficos inactivos en el perfil móvil y 24 en escritorio. Las geometrías y sus asociaciones de vértices se liberan al salir del sector. La prueba de WebGL verifica color, reutilización, límite y liberación al cerrar el renderizador. [Resultado de la prueba](programas.json)

En dos comparaciones del primer traslado de Sagunto al Puerto, la mayor pausa entre imágenes de WebGL 2 pasó de 4,27 a 1,43 s y de 2,72 a 0,61 s. El segundo ensayo registró 11 programas enlazados frente a 44 con la iluminación anterior. En WebGPU, el mayor intervalo entre callbacks de animación pasó de 2,13 a 1,23 s y de 3,17 a 1,05 s. Las comparaciones independientes del salón del Casino, la Glorieta nocturna y los trípodes del Pantalán dieron una diferencia media inferior a 0,001 sobre 255 niveles por canal en cada motor. [Método, límites y mediciones](../render-v4/perfil-traslado/luces-estables.md)

Se compararon los acabados del Carrer Major en la misma cámara y con la misma luz. La fachada muestra el retranqueo visual de la carpintería. La sección del bordillo mantiene el desnivel de 12 cm de la representación urbanística y añade su bisel y la junta con la acera. Esas dimensiones y los alzados sin documentación individual son aproximaciones. [Vista anterior](../render-v4/calle-proxima/antes.png) · [WebGL 2](../render-v4/calle-proxima/webgl2.png) · [WebGPU](../render-v4/calle-proxima/webgpu.png) · [Datos de la comparación](../render-v4/calle-proxima/calle.json)

## Recorrido completo

En la revisión final se abrió una parada de cada uno de los 32 lugares en una sesión WebGPU y se verificaron los 529 enlaces en el plano. También se comprobó la búsqueda, el historial y el paso del salón del Casino al Atlas y de vuelta con 0 m de desviación. [Validación de visitas](rutas.json)

En la URL pública de la versión 44 se verificaron la portada, 24 recursos de distribución y el dibujo de la Glorieta con WebGL 2 y del Pantalán con WebGPU de hardware. WebKit en Windows con perfil táctil de iPhone recuperó la parada de Romeu tras perder WebGL. La prueba en un iPhone físico queda pendiente. [Prueba pública](produccion-v44.json) · [Recuperación en WebKit](webkit-v44.json)

Se repitieron dos circuitos por los tres núcleos en Chrome 156 sobre Windows con una RTX 3090. Incluyeron caminar, correr, saltar, volar, cambiar de hora y calidad, visitar patrimonio y regresar al mismo punto. Ambos motores recuperaron la cámara del Fortín con 0 m de desviación y respetaron los límites de la caché de fachadas. WebGL 2 registró 127 reutilizaciones de programas. [Sesiones, muestras y parámetros](rendimiento.json)

| Intervalo entre fotogramas | WebGL 2 | WebGPU |
| --- | ---: | ---: |
| Mediana del circuito | 16,7 ms | 16,7 ms |
| Percentil 95 del circuito | 50,1 ms | 216,7 ms |
| Máximo del circuito | 1,35 s | 1,35 s |
| Percentil 95 en el vuelo rápido independiente | 33,3 ms | 150,1 ms |

La prueba de la versión 42 recorrió tres vueltas. En aquel vuelo independiente el percentil 95 fue de 33,4 ms en WebGL y 66,7 ms en WebGPU. En esta ejecución el vuelo rápido de WebGPU tuvo más irregularidad. Los mayores beneficios se midieron al cambiar de zona en los ensayos controlados del Alto Horno. [Mediciones de la versión anterior](../render-v4/rendimiento.md)

En la revisión posterior se repitió ese vuelo WebGPU cuatro veces con la misma cámara, ruta y hora, alternando el orden de las configuraciones. A más de 180 m/s y con un rango de detalle superior a 120 m, el simulador prepara las calles y la cartografía por delante de la cámara y reserva el constructor patrimonial para los lugares que entran efectivamente en la vista. El percentil 95 pasó de 200,0 y 183,4 ms a 100,0 y 100,1 ms. El intervalo máximo de esas cuatro ejecuciones estuvo entre 0,77 y 0,84 s. Las visitas elegidas conservan prioridad durante toda la transición a la cámara de autor, incluso cuando la primera carga dura más de 2,5 s. [Cuatro vuelos de comprobación](sobrevuelo.json)
