# Santa María: entorno, interior y controles de lectura

Revisión del 26 de noviembre de 2026. La geometría compartida se utiliza en el Atlas y en el Simulador; la visita conserva sus 16 paradas y sus enlaces.

## Qué cambia

El panel de las visitas incorpora **Ocultar información**. **Mostrar información** queda accesible sobre la escena para recuperarlo. Se conservan la parada, la pestaña, el desplazamiento del texto y la posición de cámara. La preferencia se mantiene durante la sesión, también al cambiar de monumento. Los controles funcionan con teclado y el panel oculto deja de recibir el foco. En móvil se repliega el panel inferior.

La fachada occidental de Santa María recupera el gran paño central con remate horizontal y las alas escalonadas. La portada tiene dos cuerpos, un nicho cóncavo con concha, el ventanal superior cegado y hojas de apariencia metálica. Las molduras se representan con geometría simplificada. La revisión corrige también huecos en testeros y tapas redundantes en los umbrales.

La **Plaça dels Tarongers, antigua plaza de Cervantes**, deja de ser una superficie inclinada uniforme. Su contorno cartográfico se divide en terrazas conectadas por escaleras, con un acceso corto frente a la portada, barandillas y bancos. El pavimento se recorta y se construye una sola vez; las diferencias de cota tienen contrahuellas y cierres laterales. Las cotas relativas, los pequeños elementos de mobiliario y los encuentros con la calle son una interpretación de la documentación disponible, no una medición topográfica nueva.

Ante la portada del Mediodía se incorpora el recinto poligonal de piedra visible en las fotografías: plataforma, asiento/murete, pasos laterales, cruz sobre pedestal y bolardos. El recinto se integra con el pavimento de Sagrari. Su tapa no se superpone al umbral del templo ni a la calle.

Las paradas de **naves, bóvedas y capillas** sitúan al visitante dentro del edificio con la cubierta presente. Se ajustan los acabados claros de las bóvedas, sus bandas y claves, los encuentros entre tramos y la cabecera. El perfil transversal de las bóvedas laterales se adapta al espacio disponible bajo los faldones existentes; paños y nervios comparten ese perfil y dejan de atravesar el tejado. **Corte** continúa disponible para una lectura estructural voluntaria. El mobiliario interior es esquemático y no reconstruye un inventario actual ni retablos desaparecidos.

## Estabilidad al mover la cámara

La grabación aportada permitió localizar una competencia de profundidad entre superficies muy próximas. Se retiran cilindros de tejas casi tangentes al faldón, paños duplicados y coberturas superpuestas de nave y ábside. También se eliminan las tapas de los huecos que coincidían con el pavimento y producían barras oscuras en las puertas.

Atlas y Simulador comparten ahora un ajuste continuo del plano cercano de cámara. Mantiene los 12 cm anteriores en interiores, vistas próximas y exploración a pie, y mejora la precisión al alejarse. No cambia el encuadre ni la posición. El diagnóstico con buffers reales y profundidad de 24 bits está en [Orbit stability](../research/validation-v48/orbit-glitch-diagnosis.md).

## Fuentes y criterio de fidelidad

Se han contrastado las fotografías facilitadas con la planta publicada por **José María Cabrera en ARSE 22 (1987)**, la planta, sección y axonometría de **Arturo Zaragozá (2000)**, el estudio de **Alberto Serrano Monferrer (2018)**, la documentación parroquial, la galería de Rutas Jaume I y fotografías originales de Joanbanjo de 2011. La [nota arquitectónica](../research/santa-maria-v48/architecture-sources.md) identifica los localizadores, las discrepancias entre fuentes y las decisiones del modelo.

Para el espacio público se conserva la huella de OSM de la plaza y sus cuatro ejes de escaleras, contrastados con las fotografías de la fachada occidental y el plano publicado. El callejero municipal acredita la equivalencia Tarongers/Cervantes. Los datos cartográficos originales y el MDT permanecen como base; los ajustes locales pertenecen a la maqueta.

Referencias principales del entorno:

- [Fachada occidental y plaza, fotografía original de Joanbanjo](https://commons.wikimedia.org/wiki/File:Fa%C3%A7ana_dels_peus_de_l'esgl%C3%A9sia_de_santa_Maria_de_Sagunt.JPG).
- [Cruz y portada sur, fotografía original de Joanbanjo](https://commons.wikimedia.org/wiki/File:Creu_i_portada_sud_de_l'esgl%C3%A9sia_de_santa_Maria_de_Sagunt.JPG).
- [Callejero municipal: Plaça dels Tarongers, antigua plaza de Cervantes](https://aytosagunto.es/media/cg1g0qqh/2021_ordfiscal-iae.pdf).

Las fotografías se emplean como referencia y no se distribuyen como texturas. Las tomas de 2011 no acreditan por sí solas el estado exacto de 2026. Los detalles sin escala o documentación suficiente se presentan como interpretativos en las fuentes y notas de las paradas.

## Integración y verificación

La visita, el contexto, el plano 2D, el índice de paradas, los encuadres territoriales y el worker patrimonial se actualizan juntos. Las cámaras interiores del Simulador conservan los mismos ojos, objetivos y campos de visión que los focos del Atlas, sin ajuste automático a los límites exteriores del edificio. Se mantienen las mejoras anteriores de Plaza Mayor y la numeración y recorrido territorial.

Evidencias reproducibles:

- [Arquitectura: aperturas, cubiertas, umbrales, líneas de visión y Corte](../research/santa-maria-v48/architecture-qa.json).
- [Terrazas, contrahuellas, perímetros y propiedad del pavimento](../research/validation-v48/public-realm-qa.json).
- [Continuidad entre Cavallers, Sagrari y Plaza Mayor](../research/validation-v48/pavement-continuity-qa.json). Las discontinuidades intencionadas de las terrazas se comprueban en la prueba anterior.
- [Integración de ambas visitas y sus 32 paradas](../research/validation-v48/plaza-santa-maria-ensemble.json).
- [Terreno, escalinata norte y conservación del anclaje](../research/validation-v48/santa-maria-ground.json).
- [Controles del panel, teclado y tamaños móviles](../research/editorial-panel-visibility.md).
- [Concordancia de los encuadres del Atlas y del Simulador](../research/validation-v48/santa-maria-cameras-qa.md).
- [Profundidad de cámara](../research/validation-v48/camera-depth-qa.json) y [rasterización de diagnóstico](../research/validation-v48/depth-raster-qa.json).

Los renders de inspección se generan con las posiciones, normales y transformaciones de las mallas efectivas de Three.js. Su iluminación y materiales son aproximados; el relleno interior sólo permite examinar la geometría y no representa luminarias físicas. El navegador disponible permite comprobar interfaz y plano, pero no dispone de WebGL. Por ello esta revisión no atribuye al navegador de pruebas una validación visual GPU ni mediciones de fluidez en el dispositivo del usuario.
