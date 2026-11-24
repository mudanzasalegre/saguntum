# Iteración candidata: detalle y carga anticipada

Base de GitHub: 37aeb0fae32cbe8a4fde37b0792b13084b58c754. Cambios limitados a módulos territoriales, con la única extensión compartida del catálogo para precalentar datos sin cambiar las llamadas del Atlas. No se modifica el agua, la cartografía, los constructores patrimoniales ni la portada.

## Qué cambia
- Predicción acotada del desplazamiento horizontal en marcha/vuelo; mantiene prioridad sobre sectores bajo el visitante, limita carga concurrente, conserva sectores con histéresis y prepara el corredor por delante.
- Anticipación de visitas: importación de sus módulos originales y JSON requeridos (caché especulativa de 20 documentos, una tarea móvil/dos escritorio). Visitas nuevas resueltas por el registro existente.
- Ventanas de carga de patrimonio más amplias según perfil, modelo completo solicitado antes de llegar y modelo intermedio del worker visible mientras termina el nativo, sin descarte inmediato. El máximo de escenas activas y las máscaras patrimoniales no cambian.
- Detalle urbano: más alcance y presupuesto acotado de huecos, balcones y fachadas geométricas; prioridad por distancia a la huella, no al centro del edificio.
- Calles: más muestras sobre terreno en tramos urbanos, subdivisión de aceras y bordillos, pequeñas variaciones de material en asfalto. No se inventan calles ni se cambian las huellas.
- Render: ajuste adaptativo reduce escala de píxel antes de bajar detalle de mundo; cuenta también las tareas de patrimonio y fachadas. Reutilización temporal del render target de sombras de contacto.
- No se activa WebGPU: el motor existente requiere GLSL/onBeforeCompile y Water. Cambiar de backend sin portar materiales y probarlos sería una regresión.

## Verificación
`node research/test-territory-stream-policy.mjs` comprueba las funciones puras de predicción y límites. Ejecutar `node --check` sobre cada JS cambiado. Para validar integración, abrir el Site con el navegador real y comprobar los perfiles bajo/medio/alto/ultra, el recorrido a pie en casco histórico, vuelo Sagunto–Puerto–Grau Vell, teletransporte y visitas/interiores. Comparar captura desde la misma cámara en Atlas/Simulador y medir p50/p95, memoria y tiempo hasta modelo nativo. Verificar que no se crean workers recurrentemente y que la memoria se estabiliza tras varias idas y vueltas. El código generado del worker sigue siendo compatible con su constructor existente: el precalentamiento nuevo sólo se usa en el hilo principal. Si se recompila el bundle, usar el proceso documentado del proyecto.

Esta es una rama candidata: **no se ha publicado en Sites ni se ha probado con GPU real desde esta sesión**. Importarla al proyecto editable sólo después de comparar con la última versión de Sites; ejecutar pruebas y revisar una vista previa antes de desplegar.
