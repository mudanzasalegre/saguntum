# V31 · Auditoría de las dos visitas del pantalán

## Alcance y método

Se revisaron `app.js`, `castle-panel.js`, `coast.js`, `pantalan-map.js`,
`style.css`, `index.html` y los datos de ambas visitas. El validador ejecuta los
helpers extraídos literalmente de `app.js`, el bucle real que crea sus controles,
el controlador compartido de visitas y el dibujo Canvas real. Solo se sustituyen
el DOM, la navegación del navegador y los efectos de la escena por adaptadores
mínimos. No se afirma haber comprobado el diseño con navegador, el foco nativo ni
los movimientos WebGL de cámara.

## Defectos encontrados y corregidos por la integración

1. El paseo terrestre heredaba instrucciones y un botón de sección denominado
   «Ver el recorrido», pero el callback retiraba la superficie del agua. Se
   eliminó ese control del paseo y la conexión de `onSection` excluye
   expresamente `pantalan-paseo`. La inspección del agua pertenece a la visita
   marítima.
2. Las guías nuevas seguían recibiendo la clase `coastal-mode`. En móvil sin
   WebGL, la regla anterior `.map-mode.coastal-mode .editorial` tenía mayor
   especificidad que el límite de media pantalla de las visitas, por lo que el
   panel podía ocupar más espacio y tapar el mapa. La clase anterior queda
   restringida a los lugares costeros que conservan el panel antiguo.

## Contratos comprobados

- Identidad global del atlas, 31 lugares, seis regiones y 26 visitas detalladas.
- Veinte paradas nuevas seleccionables; los pasos que pertenecen a una época
  concreta cambian ambos tramos del pantalán de forma conjunta.
- Los botones de época limpian una parada incompatible y conservan una
  observación compartida. Los valores de época no admitidos no cambian el estado.
- Enlaces directos históricos aplicados después de la carga de cartografía,
  incluso cuando no existe WebGL ni ningún modelo 3D.
- Rutas y paradas desconocidas, códigos URI inválidos y vuelta a `#atlas`.
- Mapas reales con blancos de selección válidos a 320, 390, 700 y 1440 px;
  selección de paradas pertenecientes a la otra época; reserva del espacio
  superior para la escena o el mapa en móvil.
- Retirada del agua solo por una acción explícita en la visita marítima y
  restauración al cerrar, cambiar de parada, cambiar de época o salir de la
  visita.
- Sin WebGL, detalle e inspección desactivados; comparación de épocas, fuentes,
  cronología, navegación por teclado y planos disponibles.
- Progreso y finalización independientes para paseo terrestre y pantalán
  marítimo.
- Regresión de las 24 visitas anteriores: fuentes, capas, secciones, estados,
  progreso, finalización y modo sin WebGL.

## Resultados y reproducción

```sh
node research/validation-v31/validate-pantalan-controllers.mjs
node research/validation-v31/validate-legacy-controllers.mjs
node research/validation-v31/validate-pantalan-layers.mjs
node research/validation-v31/validate-pantalan-profile.mjs
node research/validation-v31/validate-pantalan-maps.mjs
```

La primera prueba cubre 12 escenarios amplios y escribe
`pantalan-controller-results.json`, con los hashes de los archivos empleados.
La segunda conserva las 61 comprobaciones de las 24 visitas previas y escribe
`legacy-visit-controller-results.json`; la adaptación solo cambia el destino del
informe y el contexto necesario para extraer el callback compartido actual.

La regresión final añade 21 combinaciones y transiciones de capas, con el helper
de producción ejecutado sobre una jerarquía Three equivalente y comprobación de
la visibilidad efectiva de sus padres. Apagar monumentos conserva el contexto
que depende de ciudad; las dos épocas mantienen su estado; las palmeras del
paseo no aparecen en la fase histórica; la inspección del agua no se deshace por
un cambio de capa; salir de la región oculta todos sus grupos.

La prueba del perfil dibuja con Canvas real y comprueba que cambiar la cota de
un apoyo de 4,15 a 8,15 m desplaza únicamente su encepado 12 px en la escala
vertical explicativa de 3 px/m. También confirma juegos a 8,2 m y escollera a
4,4 m en las guías y planos finales. El barrido final de mapas supera sus 704
combinaciones de visita, tamaño, tema, lectura, época y parada seleccionada.

Todas las pruebas terminaron sin errores. La revisión no encontró otros
defectos concretos pendientes en estos controles.
