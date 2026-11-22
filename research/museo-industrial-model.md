# V24 · Nave de Efectos y Repuestos / Museo Industrial y de la Memoria Obrera

## Registro arquitectónico

Se sustituye el modelo genérico de la nave por un edificio específico, con veinte paradas, plantas y sección. No se modifica la Casa del Mestre Penya: `museo-industrial` y `museo` son dos conjuntos distintos.

El marco mantiene la huella catastral de la parcela8335601YJ3983S, centro−0.2216385/39.65754705 y giro1.0446rad. La envolvente registrada es aproximadamente60.67×20.22m. La Fundació publica70×18m. El modelo mantiene visible esa discrepancia; no estira la cartografía para forzar la cifra bibliográfica. El anexo norte sigue las partes catastrales: unos38.5×4.33m en planta, frente a los34m de longitud descritos por la ficha. La altura estimada y los detalles menores no son un levantamiento.

El revoco exterior es claro y de grano fino, contrastado con las fotografías; la textura pétrea queda en el zócalo y los recercados. La forma responde a las fotografías municipales de2022 y2026 y al portfolio de la Fundació: cubierta única a dos aguas, mampostería/revoco claro, pilastras y arcos de ladrillo, zócalo pétreo, dos grandes ventanas en cada testero, puerta central y luneta superior. Doce ventanas se distribuyen en el frente sur; junto con las cuatro de los testeros corresponden a los dieciséis grandes ventanales descritos en el proyecto de musealización. Las dos lunetas se cuentan por separado. La modulación exacta y los espesores se proporcionan sobre las fotografías y no constituyen medidas certificadas.

## Interior y cotas

Los tres vanos se diferencian de forma explícita: un eje central libre, el ala sur con una plataforma alta y el ala norte con tres niveles de visita. El eje ferroviario está situado un metro por debajo de los antiguos andenes. La superficie actual de vidrio se representa al nivel de circulación, con bastidores visibles; debajo aparecen balasto, traviesas y carriles. La referencia didáctica identifica vías de ancho ibérico y métrico. Se muestra una composición de tres carriles con uno compartido como interpretación de ese sistema, sin atribuirla a una medición exacta del tramo conservado.

La cara superior de los andenes está a0.18m en el marco local. El lecho ferroviario está a−0.82m. La plataforma sur se coloca a5.18m: seis metros sobre el antiguo nivel de vía y cinco sobre el nivel actual de circulación. Esto permite expresar las dos cifras publicadas, aunque no certifica que ambos documentos compartan exactamente ese origen de cotas. En el ala norte se utilizan cotas0.18/2.62/5.06m y un cierre estructural a7.50m, con separaciones compatibles con los2.20m libres publicados, incorporando un espesor de forjado proporcional.

Las ventanas y puertas atraviesan físicamente los muros. Las cerchas están formadas por barras, dejando sus triángulos abiertos. Los pilares, vigas, forjados y barandillas siguen la organización visible en las fotografías. El sistema de escaleras es interpretativo: sus huecos se recortan en los forjados y en las vigas, sus tramos alternan sentido y desembocan en el nivel correspondiente. No se presenta como reproducción de un plano de circulación actual verificado.

Las estanterías representan el tipo de mobiliario antiguo conservado. Los soportes expositivos y paneles son esquemáticos, sin inscripciones falsas ni piezas concretas inventadas. La escena no afirma reproducir el inventario ni la colocación de las exposiciones inauguradas en2026. Las luminarias y luces virtuales facilitan leer el espacio; no certifican las condiciones fotométricas del museo.

## Cubierta abierta y niveles

La visita ordinaria conserva las cubiertas y forjados para que se perciba la escala del espacio. `Abrir sección` retira conjuntamente cubierta, forjados superiores, escalera, guardas y mobiliario superior. Mantiene el suelo de planta baja, el vidrio, los carriles, los soportes de hormigón, las cerchas, los muros y el mobiliario inferior. No quedan vitrinas ni barandillas suspendidas por la retirada de su forjado.

Las paradas de primera y segunda galería tienen `floor:1/2`; las interiores de planta baja usan0. Las exteriores conservan `floor:null` para mantener la lectura general de las veinte paradas. El plano devuelve polígonos de andenes, galerías, exposición esquemática, estanterías y escaleras, así como ejes de carril y una sección transversal del mismo modelo.

## Contexto y terreno

El constructor devuelve una depresión del terreno únicamente bajo la huella principal, necesaria para representar el carril bajo el vidrio. El suelo permanente y el lecho de balasto cierran el edificio; no se crea una excavación exterior. Las exclusiones abarcan el núcleo, el anexo y las dos torres contemporáneas visibles en fotografías y ortofotografía. El contexto se registra por separado para evitar duplicar los inmuebles o pavimentos.

## Contrato y validación

`createMuseoIndustrial({record,site,project,heightAt,visitData,contextData})` devuelve el mismo contrato de visitas del Puerto: grupo, foco general, `visit`, cubierta, sección, parches y exclusiones. Los recursos de geometría/material/textura tienen propietario explícito. Los modos de lectura restauran los materiales originales y el ajuste al terreno sólo modifica cámaras exteriores.

El modelo final inicial contiene54mallas y aproximadamente35miltriángulos. La suite `research/validation-v24/validate_museo_industrial_model.mjs` verifica105condiciones: dimensiones semánticas, paso por portones, dieciocho huecos de ventana, accesos al anexo, vacíos de escalera, cambios de sección, buffers y triángulos finitos, cámaras interiores en sus niveles, ausencia de colisión inmediata, plano y recursos. La integración regional, la revisión CPU y la publicación se verifican por el agente principal.

## Fuentes de arquitectura

- Fundació Patrimoni Industrial, ficha [Museo](https://www.fundacioportdesagunt.com/archivo/): dimensiones nominales, tres vanos, andenes, forjados y anexo.
- Fundació, [Portfolio de espacios2025](https://www.fundacioportdesagunt.com/wp-content/uploads/2025/01/Portfolio-espacios-Fundacio-Patrimoni-Industrial-Port-de-Sagunt-1.pdf), pp6–8: fotografías y descripción del espacio.
- Ayuntamiento, fotografías de la nave rehabilitada2022, archivos `/media/c04clhsq/c_visita.jpg`, `/media/ycfmkfjw/c_vias.jpg`, `/media/hjxc4vc3/c_posado.jpg`.
- Ayuntamiento, inauguración del museo15octubre2026, fotografías del eje central y galerías: evidencias locales `gallery2026.jpg` y `display2026.jpg`.
- CONTRAST/APIPS, [Itinerario didáctico](https://www.apips.es/assets/files/CUADERNO_TP01.pdf), nave de efectos y repuestos: sistema ferroviario histórico de dos anchos.
- Catastro INSPIRE y ortofotografía PNOA: huella, anexo y registro territorial. No sustituyen un levantamiento de interiores.

## Correcciones de integración final

La cámara exterior de ventanas se acerca al frente para evitar una obstrucción real del edificio cívico vecino. No se mueve ni oculta ese edificio para despejar el encuadre. La referencia de seis metros del forjado sur conserva un datum no especificado por la fuente; su relación con la vía se identifica como interpretación del modelo. El control se llama «Abrir sección» y explica que retira cubiertas y forjados superiores.
