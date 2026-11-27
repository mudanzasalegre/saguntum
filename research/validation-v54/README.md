# V54 · Recinto oriental del Castillo de Sagunto

## Alcance

Plaza de Almenara/Saluquia y su apoyo en la ladera oriental. Se conservan la puerta v51, el Foro y las otras visitas del Atlas. Los cuatro focos nuevos se insertan después de Almenara: batería norte, depósitos, baluarte y dependencias. El Castillo pasa de 18 a 22 paradas; el catálogo permanece en 33 lugares y suma 543 entradas de visita.

## Evidencia y decisiones

- [Investigación](east-evidence.md): Plan Director de 2000, inventario de cisternas de Civera, fotografías originales, archivo militar y límites de identificación.
- [Planta actual](east-layout.md), [contrato](east-layout.json) y [registro sobre PNOA](east-layout-overlay.jpg): 20 rasgos planimétricos, con tolerancia de registro explícita.
- [Roca y vegetación](east-layout-rock.md): fragmentos bajos, discontinuos, parcialmente incrustados; laderas externas sin nuevas explanaciones.

Las plataformas, coronaciones, aparejos, depósitos y ruinas representan el estado conservado con alzados estimados. No se reconstruyen cubiertas, un alcázar desconocido ni una muralla antigua continua en la ladera. El inventario hidráulico no permite equiparar automáticamente cada medida publicada a una caja OSM. Las fotos de terceros se enlazan en la guía; no se empaquetan como texturas de la aplicación.

## Implementación compartida

`castle-east-layout.js` contiene el registro, `castle-east-ground.js` los niveles relativos, `castle-east.js` las estructuras y suelos, y `castle-east-rock.js` el relieve de detalle. Atlas y Simulador construyen los mismos elementos. El depósito tiene un recorte permanente sólo del terreno, su fondo y caras revestidas, y permanece abierto al cambiar de parada.

Los caminos tienen una pequeña unión de grava al terreno. El extremo occidental del circuito se ajusta para llegar al eje central por el lado libre de la puerta; no se altera el paso conservado. Las cuatro paradas nuevas y Almenara incorporan cámaras de detalle próximas al suelo. La del depósito mira hacia el fondo desde fuera del vaso.

## Comprobaciones

- [Terreno](east-ground-qa.json): 17.441 puntos; operación idempotente y reconocimiento correcto de la malla final, sin segunda graduación.
- [Atlas y Simulador](castle-simulator-qa.json): construcción real con dos entradas de altura, buffers y registro coincidentes; paso de Almenara y rutas orientales sin bloqueo; hueco del depósito presente en ambos motores.
- [Cámaras](castle-cameras-qa.json): 48 encuadres generales y 10 cercanos en escritorio y vertical, con controles de terreno, encuadre y cuerpo.
- [Plano](east-map-qa.json): plano general y oriental, selección de paradas, retorno al conjunto y variantes de escritorio/móvil.
- [Navegador](browser-qa.json): navegación efectiva por las cuatro paradas, plano seleccionable, documentación y enlaces de estado. El navegador de este entorno carece de WebGL; no se presenta como prueba de GPU ni de rendimiento.
- [Índices](east-catalogue-qa.json): se comprueba la conservación de los otros 32 lugares mediante hashes de sus registros.
- Las imágenes de inspección se generan con Cycles a partir de los buffers, UV, materiales y texturas reales exportados. Su iluminación y sombreado son los de Cycles; no son capturas WebGL ni una recreación gráfica independiente.

Los resultados y el informe de publicación describen la revisión concreta. Las cotas locales no sustituyen una medición del monumento y el itinerario virtual no certifica la accesibilidad física del lugar.
