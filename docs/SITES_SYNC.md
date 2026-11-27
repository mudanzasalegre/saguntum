# Sincronización de Sites a GitHub

## Versión 53 · Puerta y circo romano completo

El 27 de noviembre de 2026 se publicó la capa histórica del Circo Romano en el Site original, conservando su acceso público. El despliegue `appgdep_6b0950a076708191bfd3d258a6e91fe2` terminó con estado `succeeded`.

| Evidencia | Valor |
| --- | --- |
| Fuente publicada en Sites | `3d3d523247d827acbec8b0debc333a1a85114019` |
| Árbol Git de la aplicación `dist/` | `04503fd37e06c5e0681d71a3d7e759ef81185a2d` |
| Archivo registrado por Sites | 1646 archivos, 267438080 bytes |
| Huella del contenido registrado | `sha256:5970c1300dcf81f794fff0c62a71501825576db6619bb67142a42218cf28c35a` |

[Circo completo publicado](https://saguntum-atlas-3d.monmode.chatgpt.site/#circo/circo-historica) · [Puerta actual](https://saguntum-atlas-3d.monmode.chatgpt.site/#circo/circo-conjunto) · [Circo en el Simulador](https://saguntum-atlas-3d.monmode.chatgpt.site/#simulador/circo/circo-historica) · [Investigación](../research/validation-v53/circo-evidence.md) · [Registro cartográfico](../research/validation-v53/circo-registration.md) · [Validación](../research/validation-v53/README.md)

El selector **Puerta actual / Circo completo** conserva la puerta meridional como ancla y permite retirar el contexto contemporáneo dentro de la huella histórica, manteniendo la ciudad exterior. El registro sobre la misma ortofoto ICV de 2012 de la publicación corrige la posición longitudinal del conjunto y aproxima su cabecera oriental achatada. La referencia es 273 × 70 m, con intervalo occidental de 270–290 m y una *spina* de 151 m. Los 237 m reconocibles en 1938 se explican como cimentación observada. El cierre de las carceres, las gradas y varios alzados siguen marcados como interpretación.

Se mantienen las **33 visitas**, su orden 17/9/7 y los 20 identificadores del Circo: 14 paradas actuales y seis históricas. Los planos históricos añaden la puerta 3 como referencia seleccionable. Los 32 registros restantes de los índices territoriales conservan sus contenidos. La guía reúne ocho fuentes y once hitos.

La validación cubre el encaje de la puerta y el trazado, ocho proyecciones del conjunto en cuatro tamaños de pantalla, 42 encuadres del Simulador, doce puntos transitables y tres ciclos de restauración de materiales. La máscara de 49 triángulos coexiste con los diez del Fórum; los shaders y las sombras se comprobaron con sus constructores reales en CPU. Cuatro renders CPU inspeccionan las mallas, texturas y recortes de la aplicación. El navegador de revisión no dispone de WebGL 2; la comprobación pública verificó rutas, modos, planos y fuentes, incluido el paso Atlas → Simulador → Atlas y el funcionamiento del modo sin GPU. No se atribuyen mediciones de rendimiento gráfico a esta revisión. [Registro público](../research/validation-v53/production-qa.json)

El paquete local final tiene 267448320 bytes expandidos y 987136 bytes de margen frente a 256 MiB. Se compactaron siete JSON sin alterar sus valores, números, claves ni cadenas; el ahorro de 927.128 bytes está documentado en el [registro de equivalencia](../research/validation-v53/distribution-json-equivalence.json).

## Versión 52 · Plaza del Fórum y parque arqueológico

El 27 de noviembre de 2026 se publicó la nueva visita a la Plaza del Fórum en el Site original, conservando su acceso público. El despliegue `appgdep_6b093f776fac8191a0256e4585f596a3` terminó con estado `succeeded`.

| Evidencia | Valor |
| --- | --- |
| Fuente publicada en Sites | `7c798336b46556233de8117492be11fed15b14ab` |
| Árbol Git de la aplicación `dist/` | `c1a55e7005b9efa6933da74749010ed6c7a2b7fb` |
| Archivo registrado por Sites | 1645 archivos, 268400640 bytes |
| Huella del contenido registrado | `sha256:a8a9601ed4672d60c95de5d756de33ea26b99b90b843b6f15aec72ac6c443d30` |

[Plaza del Fórum publicada](https://saguntum-atlas-3d.monmode.chatgpt.site/#forum-plaza) · [Accesos en el Simulador](https://saguntum-atlas-3d.monmode.chatgpt.site/#simulador/forum-plaza/forum-plaza-accesos) · [Investigación histórica](../research/forum-plaza-history.md) · [Registro cartográfico](../research/forum-plaza-layout.md) · [Validación reproducible](../research/validation-v52/README.md)

La Plaza del Fórum es la visita **12**, después de la Puerta del Circo. El catálogo contiene **33 lugares: Sagunto 1–17, Puerto 18–26 y costa y paisajes 27–33**. La nueva guía reúne diez paradas, cuatro lecturas, trece fuentes y once hitos cronológicos. Se conserva el contenido de las otras 32 visitas y sus encuadres territoriales.

El modelo sigue el contorno cóncavo del parque, las medianeras conservadas, el depósito circular, los restos bajos del recinto porticado, los paseos entre cotas, los jardines verticales y el entorno urbano. La excavación permanente deja libres los entrantes ocupados por edificios. Se preparó la cota de calle antes de retirar el terreno del parque para evitar que la malla gruesa hundiera las aceras; los pisos propios sustentan la cámara y el recorrido a pie. La contención exterior cierra los encuentros bajo las calles y su retorno sur. La identificación del edificio como segundo foro y las funciones discutidas de estructuras posteriores permanecen marcadas como hipótesis.

Se comprobaron 22 encuadres en dos proporciones de pantalla, los mapas de las diez paradas y 18 puntos de circulación en rampas, escaleras y galería mediante el adaptador real del Simulador. Las cinco vistas CPU finales inspeccionan la geometría, el contexto y las texturas exportados de la aplicación. El navegador de comprobación no dispone de WebGL 2: la revisión pública verificó el catálogo, el plano, la selección de paradas y el cambio Atlas → Simulador → Atlas conservando la parada. No se atribuye a esta revisión una prueba gráfica GPU o de rendimiento. [Registro de publicación](../research/validation-v52/production-qa.json)

El primer paquete excedió el límite de TAR expandido de Sites y no creó una versión. Se eliminaron exclusivamente espacios externos a las cadenas en los JSON de esta ampliación: se ahorraron 280399 bytes y se comprobó la igualdad de todos sus valores. El paquete local definitivo ocupa 268410880 bytes expandido, con 24576 bytes de margen respecto de 256 MiB; una ampliación posterior deberá revisar ese presupuesto. Los datos y la geometría de los renders son equivalentes a los compactados, según el [registro de hashes y equivalencia](../research/validation-v52/distribution-json-equivalence.json).

## Versión 51 · Foro y Puerta de Almenara

El 26 de noviembre de 2026 se recuperó y completó la revisión interrumpida del Foro y la Puerta de Almenara. La versión 51 quedó publicada en el Site original, conservando su acceso público. El despliegue `appgdep_6b08a7d8a1848191aaca82f2f08cbb4d` terminó con estado `succeeded`.

| Evidencia | Valor |
| --- | --- |
| Fuente publicada en Sites | `6a32c4395e716f92c30ebb0628c6e7c3204c5cae` |
| Árbol Git de la aplicación `dist/` | `dc11afa6ecb4696e32b3823903837d9545a05be9` |
| Archivo registrado por Sites | 1635 archivos, 267939840 bytes |
| Huella del contenido registrado | `sha256:21e1553e7d99ecf3361ff244064d3d7001ee5969ca764f778b2081fb227bbb77` |

[Foro publicado](https://saguntum-atlas-3d.monmode.chatgpt.site/#castle/foro) · [Puerta de Almenara](https://saguntum-atlas-3d.monmode.chatgpt.site/#castle/puerta-almenara) · [Almenara en el Simulador](https://saguntum-atlas-3d.monmode.chatgpt.site/#simulador/castle/puerta-almenara) · [Evidencia del Foro](../research/validation-v51/foro-evidence.md) · [Evidencia de Almenara](../research/validation-v51/almenara-evidence.md)

El Foro distingue los restos conservados del templo de su restitución arqueológica, los niveles excavados de la basílica, el rellano elevado de la curia y sus piezas dispersas. Almenara separa el frontis alto con arco apuntado y dos óculos trilobulados del cuerpo posterior bajo, con bóveda, arco rebajado y tres aberturas. Se ajustaron los dos tramos de muralla contiguos para recuperar la silueta documentada, los aparejos de ladrillo y piedra, las bases ataludadas, la escalera lateral y el paso. Se eliminaron las caras coincidentes de la curia y se cerró la terraza posterior de la puerta.

Las validaciones aprobaron 50 comprobaciones de geometría y terreno, 16 del constructor real del Simulador y 56 de la guía. La guía enlaza 35 fuentes y 72 hechos. Se contrastaron 40 poses en dos relaciones de aspecto, los 116 lotes de Atlas y Simulador, y 207 muestras de apoyo y colisión del paso con el MDT original. Se mantienen los 32 lugares, las 18 paradas del Castillo, los siete recintos y los datos de las otras 31 visitas. Las tres vistas CPU finales corresponden a la curia y a las dos caras de Almenara; sus huellas coinciden con el código publicado. [Validación reproducible](../research/validation-v51/README.md)

En la URL pública se verificaron los textos nuevos de Almenara y el Foro, sus enlaces directos y el cambio Atlas → Simulador → Atlas conservando la parada elegida. El navegador de comprobación no dispone de WebGL 2: se verificaron la interfaz, el plano y la documentación; no se atribuyen capturas GPU ni mediciones de FPS a esta revisión. Las cotas y detalles sin levantamiento métrico siguen marcados como interpretativos. [Registro público](../research/validation-v51/production-qa.json)


## Versión 50 · Castillo, recintos y entorno

El 26 de noviembre de 2026 se publicó la revisión documentada del Castillo de Sagunto, su relieve local y las 18 paradas de la visita. El despliegue `appgdep_6b087aaeba988191a5bde54516fbec63` terminó con estado `succeeded` en el Site original, conservando su acceso público.

| Evidencia | Valor |
| --- | --- |
| Fuente publicada en Sites | `f765f4a96948d6c045813b5f94adab39e2782f07` |
| Árbol Git de la aplicación `dist/` | `b0218207c2bdafcc2837a87738e56615d8441f21` |
| Archivo registrado por Sites | 1633 archivos, 267868160 bytes |
| Huella del contenido registrado | `sha256:28081bcf04e315f2696ff836dec8723b07ce0b36967f83f3c3f3714105ddaf49` |

[Castillo publicado](https://saguntum-atlas-3d.monmode.chatgpt.site/#castle) · [Ciudadela en el Atlas](https://saguntum-atlas-3d.monmode.chatgpt.site/#castle/ciudadela) · [La misma parada en el Simulador](https://saguntum-atlas-3d.monmode.chatgpt.site/#simulador/castle/ciudadela) · [Investigación](../research/castle-history.md) · [Memoria del modelo](../research/castle-model.md)

Las murallas distinguen fábricas, remates deteriorados y tramos con parapetos, adarves y merlones apoyados en las fotografías. Se incorporan aspilleras físicas, la torre telegráfica de Ciudadela y cubiertas inclinadas en tres grupos de edificios. El foro recibe una terraza de tierra y grava sobre una corrección local del relieve, preservando las excavaciones del templo y la basílica. Atlas y Simulador comparten la arquitectura, la acomodación del terreno y las superficies de caminos y escalones. Se mantienen las 32 visitas, el número 15 del Castillo, sus 18 identificadores y los siete grupos de recintos.

La geometría aprobó 50 comprobaciones: 25.315 triángulos de suelo examinados, 27 rayos de pasos, dos óculos y 167 aspilleras abiertos. La guía aprobó 53 comprobaciones y enlaza 29 fuentes, 72 hechos y 15 hitos. Se verificaron 40 poses mediante el cálculo real de cámaras, los 107 lotes del adaptador del Simulador, el ajuste local de la terraza y las máscaras de caminos y colisiones. Se revisaron seis renders CPU del modelo efectivo y se registraron las huellas de fuentes e imágenes. [Evidencias y reproducción](../research/validation-v50/README.md)

En la URL pública se comprobaron la portada territorial, las fuentes, la ocultación y reapertura del panel, el inicio de la visita, el plano con las 18 paradas y el enlace Atlas → Simulador → Atlas conservando Ciudadela. El navegador disponible tiene WebGL desactivado: la comprobación pública fue de interfaz y plano, sin mediciones de FPS ni validación visual GPU. El nivel de la terraza y los detalles menores siguen siendo interpretativos; no se presentan como un nuevo levantamiento arqueológico. [Registro público](../research/validation-v50/production-qa.json)

## Versión 49 · Teatro Romano y ladera

El 26 de noviembre de 2026 se publicó la revisión documentada del Teatro Romano, su entorno y las 16 paradas de la visita. El despliegue `appgdep_6b086f39ea5081919b268b9c05e89004` terminó con estado `succeeded` en el Site original.

| Evidencia | Valor |
| --- | --- |
| Fuente publicada en Sites | `7e677cfe861991e2740bc16e536e0c7867f6787c` |
| Árbol Git de la aplicación `dist/` | `3084095f9548b2101105512428cb4bcd00db0fb4` |
| Archivo registrado por Sites | 1631 archivos, 267827200 bytes |
| Huella del contenido registrado | `sha256:5524a7ee5f6f8bd08bdd2b1a461746b8c26c5a755308230eade561db2ab8bcf5` |

[Teatro Romano publicado](https://saguntum-atlas-3d.monmode.chatgpt.site/#theatre) · [Vomitorios en el Atlas](https://saguntum-atlas-3d.monmode.chatgpt.site/#theatre/teatro-vomitoria) · [La misma parada en el Simulador](https://saguntum-atlas-3d.monmode.chatgpt.site/#simulador/theatre/teatro-vomitoria) · [Investigación](../research/theatre-history.md) · [Memoria del modelo](../research/theatre-model.md)

El modelo diferencia las gradas claras de los flancos de fábrica rugosa, corrige el remate superior y rehace el cuerpo escénico con tres exedras, galerías, suelos y cubierta. La fachada posterior incorpora 14 aberturas físicas y su pasarela metálica. El entorno añade accesos, contenciones, afloramientos y 21 copas interpretadas con apoyo cartográfico. Se retiran sólo dos pinos procedurales vecinos que duplicaban esas copas. Atlas y Simulador comparten la arquitectura y conservan las 32 visitas y sus enlaces.

La geometría aprobó 146 comprobaciones, incluidos 180 rayos de aberturas y 16 muestras de cubiertas sin huecos ni caras superpuestas. La guía aprobó 286 comprobaciones y enlaza 22 fuentes, 57 hechos y 17 hitos; mantiene los 16 identificadores anteriores. Se verificaron 36 poses mediante el cálculo real de cámaras y la igualdad de los buffers arquitectónicos en el adaptador del Simulador. Los seis renders CPU de inspección conservan las huellas de las fuentes y de las imágenes. [Evidencias y reproducción](../research/validation-v49/README.md)

En la URL pública se comprobaron las 22 fuentes, la ocultación y reapertura del panel, el inicio y avance de la visita, el plano con las 16 paradas y el enlace Atlas → Simulador → Atlas conservando la parada de los vomitorios. El navegador disponible no pudo crear WebGL 2; la comprobación pública fue de interfaz y plano, y no se presentan mediciones de FPS ni validación visual GPU. [Registro público](../research/validation-v49/production-qa.json)

## Versión 48 · Santa María, interior y panel plegable

El 26 de noviembre de 2026 se publicó la revisión del entorno occidental y del Mediodía de Santa María, sus interiores y el control para ocultar y mostrar la información de las visitas. El despliegue `appgdep_6b082d51772c819199b70b81ff34c30a` terminó con estado `succeeded` en el Site original.

| Evidencia | Valor |
| --- | --- |
| Fuente publicada en Sites | `1c7be8a5fafba5118e7b4b22e3c5ba0d372574cf` |
| Árbol Git de la aplicación `dist/` | `3f3d120480d199ff9614d4171f5ff4f7df3a2090` |
| Archivo registrado por Sites | 1630 archivos, 267632640 bytes |
| Huella del contenido registrado | `sha256:dc85ddfc3cd8aedb9979b1dc378666d82fb805d9823e72e5776e582c7df53ed6` |

[Portada occidental y plaza](https://saguntum-atlas-3d.monmode.chatgpt.site/#santa-maria/santa-maria-portada-principal) · [Naves](https://saguntum-atlas-3d.monmode.chatgpt.site/#santa-maria/santa-maria-naves) · [La misma parada en el Simulador](https://saguntum-atlas-3d.monmode.chatgpt.site/#simulador/santa-maria/santa-maria-naves) · [Fuentes, decisiones y alcance](SANTA_MARIA_ENTORNO_INTERIOR.md)

La revisión incorpora las terrazas y escaleras de la Plaça dels Tarongers, el recinto de piedra y cruz del Mediodía, la fachada occidental corregida y tres vistas interiores con cubierta presente. Los paños y nervios laterales dejan de atravesar el tejado. Se retiran tapas, muros y relieves superpuestos, y Atlas y Simulador comparten un ajuste continuo de profundidad de cámara. El panel plegable conserva la parada y el punto de lectura.

La arquitectura aprobó 81 comprobaciones; la integración de Plaza Mayor y Santa María, 31. Se verificaron 36 poses de cámara después de registrar el modelo en el terreno final. El espacio público pasó 2.156 muestras de cierre de contrahuellas, 631 tramos de perímetro, 480 puntos del conector y 1.318 muestras de encuentro con las calles. El resto de pavimentos mantiene continuidad en 51.128 triángulos y 598 uniones en T. [Evidencias y renders](../research/validation-v48/README.md)

En la URL pública se comprobaron el texto y la ruta de la portada occidental, la parada de Naves, la ocultación y reapertura por teclado conservando `scrollTop=1089`, y el enlace Atlas → Simulador → Atlas manteniendo esa parada. El Simulador sirvió el mismo texto nuevo del interior. El navegador disponible no tiene WebGL 2: la comprobación pública fue de interfaz y plano; las vistas 3D se revisaron mediante las mallas reales por CPU y el diagnóstico de profundidad con Mesa/EGL. [Registro público](../research/validation-v48/production-qa.json)

## Versión 47 · Plaza Mayor y Santa María

El 26 de noviembre de 2026 se publicó la revisión documentada de los soportales del cierre sur y del entorno de Santa María. El despliegue `appgdep_6b0819a6bb6c8191914b77b67101d94e` terminó con estado `succeeded` en el Site original. La aplicación utiliza los mismos modelos y pavimentos en Atlas y Simulador, con dos visitas independientes dentro de un conjunto territorial compartido.

| Evidencia | Valor |
| --- | --- |
| Fuente publicada en Sites | `6fb4184318d00c5aa6c02ed7cdc69266bcbac962` |
| Árbol Git de la aplicación `dist/` | `be4c95e7349ed28d2856a3f98dc151a1b16d85a8` |
| Archivo registrado por Sites | 1626 archivos, 267560960 bytes |
| Huella del contenido registrado | `sha256:9547a2556ab98201572824ad0a7dc8367279c2b53a359693276ba1916b02d045` |

[Plaza Mayor publicada](https://saguntum-atlas-3d.monmode.chatgpt.site/#plaza-mayor) · [Escalinata de Santa María](https://saguntum-atlas-3d.monmode.chatgpt.site/#santa-maria/santa-maria-escalinata) · [Fuentes, decisiones y límites](PLAZA_SANTA_MARIA.md)

La revisión incorpora cuatro vanos y cinco apoyos en los números 7–8 y 9, el ajuste de las fachadas y cubiertas documentadas, una calle continua entre Plaza Mayor, Cavallers y Sagrari, el pretil de la escalinata y el cierre físico del umbral. Se retiran las ocho representaciones genéricas sustituidas por los frentes detallados. Se mantienen las 16 paradas de cada monumento, las 32 visitas globales y el recorrido territorial anterior.

Las pruebas aprobaron 34 comprobaciones de los soportales, 19 de Santa María, 15 de suelo y 30 de integración. El pavimento conjunto se revisó en 59.088 triángulos y 599 uniones en T, sin alturas incompatibles; la plaza se muestreó en 2.698 posiciones, sin huecos ni solapes interiores. Los renders de inspección se generaron con las mallas y normales efectivas de Three.js en Blender; su iluminación no representa el render del navegador.

En la URL pública se comprobaron las fuentes nuevas de Plaza Mayor, la parada y el plano de la escalinata, y el enlace de ida y vuelta al mismo destino del Simulador. El navegador de comprobación no dispone de WebGL: la inspección de interfaz fue en modo 2D y no se presentan mediciones de rendimiento GPU. [Continuidad del pavimento](../research/validation-v47/pavement-continuity-qa.json) · [Integración](../research/validation-v47/ensemble-qa.json) · [Vista final del conjunto](../research/validation-v47/plaza-cierre-sur.jpg)


## Versión 46 · Numeración territorial y recorrido guiado

El 26 de noviembre de 2026 se publicó la numeración común de las 32 visitas y el recorrido territorial con pausa, desplazamientos suaves y fundidos entre ámbitos o encuadres opuestos. El despliegue `appgdep_6b0807ee1f7881918b533db44885b1dd` terminó con estado `succeeded` en el Site original. La sincronización con GitHub incorpora también las mejoras visuales ya publicadas en Sites 45.

| Evidencia | Valor |
| --- | --- |
| Fuente publicada en Sites | `0ff907a4f1d5a3dfaa81e7d84a7052e672c14ec9` |
| Árbol Git de la aplicación `dist/` | `90e02482213aa9ca3d97b0900489fa0dba157e31` |
| Archivo registrado por Sites | 1624 archivos, 267479040 bytes |
| Huella del contenido registrado | `sha256:d50fddda196a51ca8683a38e609efe391c534f1be3f8f62c288415d277771f66` |

[Atlas publicado](https://saguntum-atlas-3d.monmode.chatgpt.site/#atlas) · [Simulador](https://saguntum-atlas-3d.monmode.chatgpt.site/#simulador) · [Comportamiento y validación](RECORRIDO_GUIADO.md)

La validación cubrió los catálogos reales del Atlas y del Simulador, 18 pruebas del motor/panel, la navegación con Three.js y OrbitControls reales y un muestreo completo de las 32 vistas en horizontal y vertical sobre el MDT. Se verificaron en navegador los grupos del catálogo y la búsqueda con número estable. El navegador disponible carecía de WebGL 2: no se atribuyen a esta revisión mediciones de FPS ni validación visual del render en hardware real.


## Base recuperada · versión 45

El 26 de noviembre de 2026 se recuperó el proyecto original de Sites, que declaraba la versión 45 como la última publicada. La fuente abierta fue `756e37ae100aa80dd08d35dee86b93281a0c7e5f`, cuyo árbol `dist/` es `878427de53e6e02c5eff1ecd04462e15f859c1ba`. GitHub seguía en la revisión documentada de la versión 44; se comprobó que su árbol `dist/` coincidía con la base `cbb24d3` de Sites antes de integrar las mejoras visuales de la 45 y el nuevo recorrido. La numeración y el recorrido se describen en [RECORRIDO_GUIADO.md](RECORRIDO_GUIADO.md).

## Versión 44 · Sobrevuelo y continuidad de las visitas

El 24 de noviembre de 2026 se publicó la revisión que conserva el monumento elegido durante el traslado de la cámara y ajusta la preparación patrimonial durante el vuelo territorial rápido en WebGPU. El despliegue `appgdep_6b05846940248191a5e1b21189c9327e` alcanzó el estado `succeeded`. La fuente de Sites `cbb24d3574d6d3786209438dce2b0431e40b01f8` y el código de GitHub `325d5be7203d72983d4af88e6f0f052060ccc684` comparten el árbol de distribución `1cdcb7e012486db9d6c33175f24ba80b1012fd43`. Sites registró 1618 archivos con huella `sha256:756e06d51ee0282691c70c010849551716bb60010df2b46c226fc0b875b52da7`. [Simulador publicado](https://saguntum-atlas-3d.monmode.chatgpt.site/#simulador) · [Comparación de los cuatro sobrevuelos](../research/streaming-v43/sobrevuelo.json) · [Prueba de las 32 visitas y los 529 enlaces](../research/streaming-v43/rutas.json)

## Versión 43 · Aproximación a los monumentos y detalle de calle

El 24 de noviembre de 2026 se publicó la nueva carga territorial en el proyecto original. El despliegue `appgdep_6b0582b619848191a7e6e7f15e4812d7` terminó con estado `succeeded`. El código de Sites `ee7dca5e47d4f5de44b4f4659e2822f89757c2fd` y el de GitHub `de37aea` tienen el mismo árbol de distribución `cadf2c1c5c62adfe7cdf226a0bc44e8ec168330a`. Sites registró 1618 archivos con huella `sha256:d081e884d5965d59cac725a0ad5ace82b819c42d07b9271ac81bebe64234e16e`. [Abrir el simulador](https://saguntum-atlas-3d.monmode.chatgpt.site/#simulador) · [Mediciones y comparaciones](../research/streaming-v43/README.md)

## Versión 42 · Simulador WebGL 2 y WebGPU

El 24 de noviembre de 2026 se publicó el simulador de doble motor en el proyecto original. La versión integra V2 y V3 y conserva la portada regional, los 32 lugares y sus enlaces. El despliegue `appgdep_6b057bacd81081919940a476a7ff666c` figura como `succeeded`. [Simulador publicado](https://saguntum-atlas-3d.monmode.chatgpt.site/#simulador) · [Arquitectura y compatibilidad](SIMULADOR_RENDER_V4.md)

| Referencia | Valor |
| --- | --- |
| Fuente de Sites | `548318f6178dbd5cfbaa00fc4bffb2affc084da7` |
| Revisión equivalente de la aplicación en GitHub | `bdca7ac2ce862fa5fd8da25d5ad584ce17a38b86` |
| Árbol Git de `dist/` en ambos repositorios | `7baa679785fbe159d983912e93e1652cc8eeda3f` |
| Archivo registrado por Sites | 1617 archivos, 267755520 bytes, `sha256:8548c316683bdfc64344817551428c8b8c4d376833e3ffbf037472966146a148` |

Sobre la URL pública, Chrome abrió la portada con el título **SAGUNTUM · Sagunto y Puerto de Sagunto**. Se compararon doce recursos servidos con la distribución local. El simulador dibujó la parada de José Romeu en WebGL 2 y la de los trípodes marítimos en WebGPU con un adaptador NVIDIA de hardware. Ambas declararon los 32 lugares y terminaron sin errores de consola o de página. [Comprobación en producción](../research/render-v4/produccion.json)

WebKit 27.2 en Windows, con emulación táctil de iPhone 13, abrió la Glorieta publicada. Al provocar la pérdida del contexto WebGL, el plano mantuvo la parada de Romeu y permitió volver a dibujarla en 3D. También se recuperó un arranque interrumpido y se completó el paso del simulador al plano, a la visita y de vuelta a 3D. La validación en Safari sobre un dispositivo Apple físico queda pendiente. [Recuperación en producción](../research/render-v4/produccion-webkit.json)

Las mediciones de dos motores, los perfiles de las pausas y las comparaciones de cámara se conservan en el repositorio. [Recorrido de tres vueltas](../research/render-v4/rendimiento.md) · [Comparativa de 60 capturas](../research/render-v4/README.md) · [Ensayo de compilación anticipada](../research/render-v4/perfil-traslado/precarga-webgl2.md)

## Versión 41 · Exploración territorial a pie y patrimonio

El 23 de noviembre de 2026, Sites publicó la versión 41 en la dirección original de SAGUNTUM. El despliegue `appgdep_6b043301be3c8191bf77e9874bea4841` alcanzó el estado `succeeded`. Se abrió primero la versión 40 del proyecto original y se verificó la igualdad de los árboles de distribución antes y después de la edición. [Simulador publicado](https://saguntum-atlas-3d.monmode.chatgpt.site/#simulador) · [Controles y alcance](EXPLORACION.md)

| Referencia | Valor |
| --- | --- |
| Commit de Sites | `d2b18cd956c6c7dfc303e1b103335088718a7218` |
| Commit de código en GitHub | `b70cf79b170a9ca2bc9c6479f1a031635119cff9` |
| Árbol Git de `dist/` en ambos repositorios | `6ff44f745dab2b5f4cdaa707611f14083c8a613e` |
| Contenido del archivo nativo de despliegue | 1.592 archivos, SHA-256 `7e68ee9036879f48b2f5e7d223d9a1f3e7a7bde90c1fd0c342442c787896214a` |

En la URL pública se contrastaron nueve recursos servidos con el código y los datos publicados en GitHub. Chrome comprobó la entrada a pie en la Plaça Major, el regreso con 0 m de desviación y el vuelo con controles reasignados hasta Puerto y Grau Vell. WebKit recuperó la parada de José Romeu de la Glorieta tras perder el contexto WebGL y volvió del plano a 3D. [Recursos publicados](../research/navegacion-v41/produccion-recursos.json) · [Recorrido en Chrome](../research/navegacion-v41/produccion-chrome.json) · [Recuperación en WebKit](../research/navegacion-v41/produccion-webkit.json)

## Versión 38 · Todos los lugares del Atlas en el simulador

El proyecto original de Sites publicó la versión 38 el 22 de noviembre de 2026. El despliegue `appgdep_6b03359912648191ad44f0f85bb8b267` alcanzó el estado `succeeded`. La revisión reúne 32 lugares y 529 paradas con enlaces compartibles entre el simulador y las visitas originales. [Simulador](https://saguntum-atlas-3d.monmode.chatgpt.site/#simulador) · [Documentación territorial](VISITAS_TERRITORIALES.md)

| Referencia | Valor |
| --- | --- |
| Commit de Sites | `3b65d446c878cc22703cd6c4fc2259448a8c2f39` |
| Commit de distribución en GitHub | `ed6eb1bc45acee0ddd7684d3e7546bf0caca7081` |
| Árbol Git de `dist/` en ambos repositorios | `7bf39e7383bef9b5b7f59baff700da8ed6dfbc48` |
| SHA-256 del contenido registrado por Sites | `cadb51f1ef4b5a2e8f71fb49753f1ab7b7faa11685be95e01a6bd0253d00e69d` |
| Archivos del paquete | 1582 |

En el sitio público se comprobaron la portada global y sus seis ámbitos, y se verificó por contenido la publicación de once archivos del simulador. La prueba de WebKit en Windows, con el perfil de un iPhone 13, recuperó la parada de José Romeu después de una pérdida de contexto y de un arranque interrumpido. [Identidad y ámbitos](../research/visitas-territoriales/produccion/portada.json) · [Integridad de recursos](../research/visitas-territoriales/produccion/recursos.json) · [Recuperación WebGL](../research/visitas-territoriales/produccion/recuperacion-webkit.json)

En Chrome sobre la URL publicada se abrieron las 529 rutas en plano y se cargó una parada tridimensional en cada uno de los 32 lugares. La prueba recorrió la búsqueda, el mapa numerado, las capas y el historial. Entró en la visita del Casino y regresó al simulador con una diferencia de cámara de 0,000 m. También cambió de parada desde el Atlas en el Palancia y abrió esa parada en el simulador. El registro de errores de página, consola y recursos quedó vacío. [Resultados en producción](../research/visitas-territoriales/produccion/chrome/rutas.json)

## Versión 37 · Glorieta móvil y render territorial

Sites publicó la versión 37 el 22 de noviembre de 2026. La distribución tiene 1.525 archivos y conserva el mismo árbol de aplicación en los dos repositorios. El despliegue público es `appgdep_6b030dcbec648191875bed1231b68144`. [Glorieta](https://saguntum-atlas-3d.monmode.chatgpt.site/#glorieta) · [Simulador](https://saguntum-atlas-3d.monmode.chatgpt.site/#simulador)

| Referencia | Valor |
| --- | --- |
| Commit de Sites | `a1b5f60157e72d479cbc2abc2fd83ac868b6a6c0` |
| Commit de la distribución en GitHub | `01ee65c100b09447dda8c70fbf1eee41d4b4ca23` |
| Árbol Git de `dist/` | `4fcdf4ac2f6e247bcbae8fb4180735ba10e1b363` |
| SHA-256 del contenido registrado por Sites | `4c428cefba4ff5649b38ef783411c82b6ec0adbdbc0d2201ba685792614fa41d` |

Las dos ortofotos originales de preparación pueden consultarse en `research/territory/originales/`. Sites sirve las variantes que el visor utiliza en cada dispositivo. En seis documentos de planos y contextos se retiraron espacios de formato y se verificó la igualdad de los datos antes de publicar. [Pruebas de la Glorieta](../research/glorieta-memoria/visita-movil.md) · [Comparación de fachadas](../research/realismo-urbano/README.md) · [Comparación de paisaje](../research/validation-v37-landscape/README.md)

En la URL pública se forzó la pérdida del contexto gráfico, se abrió el plano en la parada de José Romeu y se volvió al 3D. La prueba cubrió también la recuperación de un arranque interrumpido y el recorrido simulador → plano → visita → simulador. En la prueba de ida y vuelta en 3D se midió una diferencia de cámara de 0,000 m. Los perfiles táctiles se ejecutaron en Windows. [WebKit](../research/glorieta-memoria/produccion/webkit.json) · [Chrome](../research/glorieta-memoria/produccion/chrome.json) · [Cámara](../research/glorieta-memoria/produccion/visita/resultados.json) · [Comprobación de recursos publicados](../research/glorieta-memoria/produccion/recursos.json)

## Versión 36 · La Glorieta de Sagunto

El proyecto original publicó la Glorieta el 22 de noviembre de 2026. El despliegue `appgdep_6b0304878d988191b9b7d34893fe01a9` alcanzó el estado `succeeded`. El paquete registrado contiene 1273 archivos. [Visita publicada](https://saguntum-atlas-3d.monmode.chatgpt.site/#glorieta) · [Verificación en producción](../research/glorieta-validacion/produccion/resultados.json)

| Referencia | Valor |
| --- | --- |
| Commit de origen en Sites | `4205b8ae70c71a5e4b99eaa96a73ef9c2e0b4498` |
| Commit de implementación en GitHub | `854eba0dff3ebe47f105ccb16dc6add66543e27e` |
| Árbol Git idéntico de `dist/` | `cdf4dfec042f9ba208525d9898f07efff5a2cf32` |
| SHA-256 del archivo registrado en Sites | `eecb5334ca41273659e18d4bcf468cc041de3f7359bd483e27baec4a88c02b70` |

## Versión 35 · Acabado patrimonial del simulador

Sites publicó la versión 35 el 22 de noviembre de 2026 en el proyecto original. El despliegue `appgdep_6b02fef76c30819187908e75ab4e3193` terminó con estado `succeeded`. En producción se abrieron los soportales, se cambiaron la iluminación y el terreno y se entró en la parada del Atlas. Al volver, la diferencia de posición de cámara fue de 0,000 m. También se comprobó el enlace a Gerencia y la descarga íntegra de los módulos de escena, el worker patrimonial, los encuadres, las copas y el relieve de Sagunto. [Abrir el simulador en los soportales](https://saguntum-atlas-3d.monmode.chatgpt.site/#simulador/plaza-mayor/plaza-soportales) · [Resultado en la URL pública](../research/validation-atlas-parity/produccion.json)

| Referencia | Valor |
| --- | --- |
| Commit de origen en Sites | `eaed495ea389b2a594772dddfcf4c2abb67c0ca8` |
| Commit de implementación en GitHub | `cc21aae5dfaf157f157a0a988cde1b42eb8997a4` |
| Árbol Git idéntico de `dist/` | `0977fa265aa7963aed7e82274c90379485e96009` |
| SHA-256 del archivo registrado por Sites | `6679a248d7ce078d0420c053fd32f59633e0848cad9513a410635bc66e4a5acb` |
| Archivos en el paquete registrado | 1.260 |

## Revisión gráfica · versión 34

Sites publicó la revisión gráfica del Simulador el 22 de noviembre de 2026. El despliegue `appgdep_6b02f12722d48191a46d72049b11f1ef` terminó con estado `succeeded`. [Simulador publicado](https://saguntum-atlas-3d.monmode.chatgpt.site/#simulador) · [Comparación entre las versiones 33 y 34](../research/validation-visual/README.md)

| Referencia | Valor |
| --- | --- |
| Commit de origen en Sites | `1058c0fd7d3a9c44e9680346099837829a291257` |
| Commit de implementación en GitHub | `f56359f93021f50d4b8eb07669d320be314f95c7` |
| Árbol Git idéntico de `dist/` | `56de53b6f53d9b51e9b2b50d843180c537576495` |
| Archivo de distribución registrado por Sites, SHA-256 | `11d6c239975f06f6603ef1d640b12759e735db4f4e5dfb9337d9bb33b1c6bce9` |
| Archivos en el paquete registrado | 1.220 |

## Publicación territorial · versión 33

El 22 de noviembre de 2026, Sites publicó el [Simulador 3D](https://saguntum-atlas-3d.monmode.chatgpt.site/#simulador) en el proyecto original. El despliegue terminó con estado `succeeded`.

| Referencia | Valor |
| --- | --- |
| Commit de origen en Sites | `f03ddbec199b5d2fd77d187b6db20061316590fb` |
| Commit de implementación en GitHub | `1d364d07c512f7c996b54a82b45239b855864f2c` |
| Árbol Git idéntico de `dist/` en ambos commits | `5d42f610ccc4acd8e63f5dec478a7952d034bfeb` |
| Archivo de distribución registrado por Sites, SHA-256 | `53cdd5f90ebca057fc40a4a5dbea0f5cc19c027f94d6b3b977afde26511f0bc8` |

El paquete desplegado contiene 915 archivos, incluido el manifiesto. Las fuentes editables, recetas cartográficas y pruebas se encuentran en este repositorio. [Documentación del simulador](SIMULADOR.md)

## Copia local de Sites v32

- Proyecto Sites: `appgprj_6afeb5aaef8c8191b0062318fb3a24f1`.
- Web publicada: https://saguntum-atlas-3d.monmode.chatgpt.site
- Versión **32**, la última guardada en Sites al exportar el 22 de noviembre de 2026.
- Commit de origen `568bb3627fa6ed0c21c123e7b89a14aa50415cd7`.
- Árbol Git de origen `522ee2b27452e2c702f6f8f239f88ab3245cfe4c`.
- Se copiaron **2.233 archivos** (777.320.824 bytes). Se verificó el contenido de cada archivo contra su blob de origen. Ninguna ruta exportada coincide con las reglas de exclusión de Git.
- `dist/` contiene el código editable de la aplicación, la cartografía y los recursos, incluido Three.js r180. `research/` contiene la documentación, los scripts y las evidencias de validación que estaban en el commit.

## Ejecución y validación

Desde la raíz, sirve la aplicación con `python -m http.server 8000 --bind 127.0.0.1 --directory dist` y abre `http://127.0.0.1:8000/#atlas`. La aplicación estática funciona sin compilación ni instalación de dependencias.

En una copia temporal se ejecutaron 703 comprobaciones de distribución, 1.354 de la geometría y las cámaras costeras y 69 de los controladores de visita. Chrome abrió la portada y el enlace directo `#grau-vell/grau-sala-torre` con WebGL por software, sin errores de página, fallos HTTP ni peticiones externas.

La prueba de distribución se ejecutó con `python -X utf8 research/validation-v32/validate_static_assets.py`, Node 22 y ripgrep. Las pruebas de geometría y controladores utilizaron `three@0.180.0` y `@napi-rs/canvas@1.2.0` instalados en la copia temporal. Algunos scripts de investigación necesitan datos o herramientas externas para regenerar sus resultados.

## Antes del primer push del código

1. Revisar si el paquete contiene credenciales, tokens, claves, información privada o archivos `.env`.
2. Confirmar derechos de distribución de fotografías, cartografía y texturas.
3. Inspeccionar `package.json` y gestor de paquetes antes de inventar instrucciones de ejecución.
4. Conservar el lockfile y registrar SHA-256 del paquete exportado.
5. Conservar `dist/` porque en este proyecto contiene el código fuente de la aplicación estática. Excluir las dependencias descargadas para las pruebas locales.
6. Servir una copia limpia y comprobar rutas, componentes 3D y navegación de escenas.
7. Subir los fuentes a GitHub y anotar el SHA del commit y la versión de Sites.

La exportación se hizo localmente. El repositorio de Sites y la publicación web no recibieron cambios durante la copia.
