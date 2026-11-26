# Revisión final de geometría · Foro y Almenara

Revisión de los archivos recuperados de la conversación interrumpida, sobre la base de Sites 50. Se inspeccionaron los renders anteriores y las fotografías originales de Ricsol (caras 19/20 de Almenara y curia 34), la foto del Foro de 2013 y la evidencia documental ya reunida en esta carpeta.

## Problemas corregidos

- **Desembarco de la curia.** El rectángulo negro del render no correspondía a una excavación: existían dos caras exactamente coplanares a la cota interpretativa 132,725. Se elimina la tapa redundante de piedra. El rellano de grava ya cubre toda esa zona y alcanza el tercer escalón; la metadata lo identifica como superficie compartida, no como una placa nueva.
- **Terraza posterior de Almenara.** El extradós de ladrillo quedaba visible como un pequeño tejado triangular y faltaba un cierre continuo sobre la cámara. Se sitúa el cuerpo bajo a 5,66 m relativos y se añade una tapa únicamente sobre el vano entre los dos muros laterales y las dos pantallas. Queda por encima de la bóveda y por debajo de ambos óculos, conserva las tres aspilleras y no duplica las caras superiores de los muros. La escalera permanece en el lado observado en las fotografías: a la izquierda al mirar la puerta desde el este. Su altura cambia con la terraza para mantener el apoyo.
- **Muros inmediatos a la puerta.** La asignación genérica de 7,2 m a la muralla cartográfica 733215258 la hacía sobrepasar el frontis. Se limita su coronación —y la del paño contiguo 733215259— cerca de la puerta, aproximadamente a 2,9 m en el flanco izquierdo y 4,1 m en el derecho, medidos respecto al umbral frontal. La transición recupera suavemente el perfil anterior entre 12 y 28 m a lo largo de los flancos. Se mantienen la planta cartográfica, el apoyo inferior y el resto del recinto.
- **Fábrica del frontis.** Se añaden hiladas parciales de ladrillo insertadas en la mampostería, como se observan en las fotografías actuales. Los parches quedan fuera de la rosca del arco, de los dos óculos y de la coronación. Se agrupan en el material de ladrillo ya existente, sin texturas fotográficas ajenas ni nuevos lotes por ladrillo.

Las alturas, los límites de las reparaciones y la terraza son aproximaciones visuales de la fábrica conservada; no son mediciones de un levantamiento. No se reconstruye una fase medieval pura ni se eleva la desaparecida arquitectura romana del Foro.

## Comprobación visual

Los renders finales se generan desde los buffers, matrices, colores y texturas del código efectivo con el exportador existente. Son imágenes de inspección CPU (Blender/Cycles), no capturas de WebGL. El registro final conserva sus hashes. Las pruebas geométricas y del adaptador del Simulador deben utilizar estos mismos archivos finales.

Se han revisado las tres vistas finales: frente y reverso de Almenara y curia. El frontis sobresale de sus flancos; el reverso tiene una terraza continua y la escalera apoyada, sin el extradós triangular expuesto; la gran banda negra del desembarco desaparece. Los tres huecos orientales y el paso son visibles. Las huellas de todos los archivos fuente incluidos en la exportación coinciden con el código final revisado. Las pequeñas sombras en juntas y los límites del terreno de resolución cartográfica no equivalen a un levantamiento fotogramétrico.
