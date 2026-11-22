# Alto Horno n.º 2 — investigación y criterios de la iteración v22

Fecha de consulta: 20 de noviembre de 2026. Proyecto: **SAGUNTUM · Atlas vivo**.

Esta iteración estudia el horno conservado, su adaptación patrimonial y el recinto urbano del Puerto de Sagunto. La visita contiene veinte puntos de observación y mantiene el atlas completo como entrada principal. Las vistas interiores son recursos de interpretación; no se confunden con una simulación de funcionamiento ni con un itinerario presencial.

## Fuentes y jerarquía de evidencia

Los identificadores siguientes coinciden con `dist/assets/data/horno-visit.json`.

| Identificador | Fuente y localizador | Uso en la escena |
|---|---|---|
| `ha-boe2024` | [Decreto 26/2024, BOE-A-2024-9526](https://www.boe.es/diario_boe/txt.php?id=BOE-A-2024-9526), anexo I, §§3.1–3.4 y 4.2 | Descripción oficial de la máquina, dimensiones principales, componentes conservados y desaparecidos, intervención contemporánea y entorno. |
| `ha-fundacio` | [Fundació Port de Sagunt, Horno Alto nº 2](https://www.fundacioportdesagunt.com/horno-alto-2/), historia, funcionamiento y rehabilitación | Relato de la entidad gestora y distinción entre partes conservadas y reconstruidas. |
| `ha-folleto` | [Folleto técnico de la Fundación](https://www.fundacioportdesagunt.com/wp-content/uploads/2025/12/hornoalto_no2-1.pdf), PDF pp. 2–5 | Nomenclatura del proceso, sección didáctica, carga por dos vías y cimentación parcialmente enterrada. La fecha de la carpeta web no se adopta como fecha editorial. |
| `ha-memoria2008` | [Gradolí, Sanz y Herrero, memoria de rehabilitación, julio de 2008](https://www.contrastapips.com/IHACM/IBP/Port/Memoria%20rehab%20AHn2.pdf), pp. impresas 3–10 / PDF pp. 5–12; reportaje PDF pp. 187–195 | Estado de obra, consolidación del refractario, planteamiento de accesos, plataforma de trabajo, pabellón y recinto. Se distinguen actuaciones realizadas y propuestas. |
| `ha-casa` | [La Casa de la Arquitectura, documentación aportada por COACV](https://lacasadelaarquitectura.es/recurso/restauracion-del-alto-horno-numero-2/309b8639-4a25-47c3-8bb1-0a6c1b5f182e), obra fechada 2011, galerías de imágenes y planos | Planta y sección de Gradolí & Sanz; fotografías de Mariela Apollonio. Principal contraste de volumetría, materiales e interior. |
| `ha-coacv` | [Autores de la rehabilitación, Premios COACV 2013](https://www.coacv.org/es/cultura/premios-coacv/2013/arquitectura/rehabilitacion-del-horno-alto-numero-2-de-sagunto/) | Razones de la intervención y piezas perdidas tras el desmantelamiento. |
| `ha-beso2023` | [Adrià Besó Ros, Santander. Estudios de Patrimonio 6, pp. 91–124](https://dialnet.unirioja.es/descarga/articulo/9203735.pdf), DOI 10.22429/Euc2023.sep.06.02 | Evaluación patrimonial, observaciones de estructura en pp. 101–102, historia de restauración en pp. 116–119 y fotografía interior de 2022 en fig. 11. |
| `ha-europa2012` | [European Heritage Awards / Europa Nostra, Grand Prix 2012](https://www.europeanheritageawards.eu/winners/number-2-blast-furnace/) | Confirmación primaria del premio y de las fases de intervención 1998–2000, 2007 y 2009–2011. |
| `ha-visitas` | [FCV Patrimoni Industrial i Memòria Obrera, canal oficial de reservas](https://www.eventbrite.es/e/entradas-visita-forn-alt-num-2-divendres-i-dissabtes-valencia-925675509367), condiciones consultadas en la fecha indicada | Distingue la exploración virtual de los accesos presenciales: las plataformas superiores se anuncian como no visitables. |
| `ha-patrif2014` | [Lorenzo Sevilla Hurtado / PATRIF, Sociedad de Ingeniería de Fabricación](https://sif-mes.org/patrif/2015/01/05/10-imagenes-sobre-horno-alto-numero-2-puerto-de-sagunto/), fotos de 26-12-2014, entrada de 05-01-2015 | Fotografía directa de rampa, cabina, base, tuberías y recinto. Permite contrastar la cronología de la restitución del plano inclinado. |
| `ha-osm` | [OpenStreetMap, vía 733110249](https://www.openstreetmap.org/way/733110249) y huellas próximas conservadas en el atlas | Registro horizontal del conjunto. No se utiliza como fuente del alzado ni de cada parada. |
| `ha-pnoa` | [IGN / CNIG, PNOA](https://pnoa.ign.es/) | Contraste de orientación del plano inclinado, recinto, viales y huellas de edificios. La fecha de consulta no sustituye a la fecha de vuelo. |

La descripción técnica oficial, los documentos originales de los arquitectos y el material de la institución gestora tienen prioridad para caracterizar el horno. Las imágenes históricas y los dibujos de funcionamiento no prueban que un equipo continúe en pie. Las fotografías se emplean como referencias de estudio, sin redistribuirlas como texturas en la aplicación.

## Máquina y geometría

El objeto principal es el horno reconstruido en los años sesenta y rehabilitado posteriormente. No se representa íntegro el horno de 1926 ni se repuebla el entorno con todas las instalaciones de la antigua siderurgia.

| Dato documentado | Referencia | Interpretación permitida |
|---|---|---|
| Altura exterior general: 64,20 m | BOE, anexo I §3.2; Fundación | Referencia de escala general; no resuelve por sí sola el origen de las cotas del plano de proyecto. |
| Altura interior: 24,5 m | BOE, anexo I §3.2 | Magnitud del vaso y zona de carga; se contrasta con la sección publicada. |
| Diámetro interior del crisol: 5,5 m; revestimiento de carbono aproximadamente 1 m | BOE, anexo I §3.2 | Espacio hueco y espesor legible en sección. No equivale al diámetro exterior completo. |
| Cimentación de 31 m de diámetro y 5,6 m de altura total, escalonada | BOE, anexo I §3.2 | La sección de la Fundación muestra que parte de ella está bajo el terreno. No se construye un pedestal de 5,6 m enteramente sobre la calle. |
| Doce toberas | BOE; folleto de la Fundación | Repetición de doce conexiones entre anillo y crisol. Bridas, pernos y equipos menores se aproximan. |
| 315 cajas de refrigeración en 21 filas | BOE, anexo I §3.2 | Se conserva el recuento; no se afirma haber medido individualmente cada caja. |
| Cuatro tubos de gas de 1,22 m de diámetro exterior, agrupados después en dos y uno | Besó, p. 102 | Se refiere a la conducción hacia la depuración. Las fotos muestran dos purgas verticales en la coronación, que se mantienen como componentes distintos. Curvaturas, encuentros y espesores menores son aproximados. |
| Tragante con doble campana y carga por dos vías | Folleto, PDF pp. 4–5 | Construcción legible y estática. No se simula un ciclo industrial ni se certifican dimensiones de cada mecanismo. |
| Dos plataformas de puentes grúa, descritas en torno a 42 y 51 m | BOE, anexo I §3.2 | La sección de los arquitectos añade cotas de referencia más precisas, con un origen vertical propio. |

### Cotas del proyecto y altura exterior

La sección publicada en La Casa de la Arquitectura identifica niveles de la máquina. Son **cotas del dibujo**, no mediciones nuevas desde el pavimento actual. El recorte web no define de forma inequívoca su origen topográfico y no debe imponerse una equivalencia automática con el relieve del atlas.

Lectura del alzado a la resolución pública disponible:

| Nivel / elemento | Cota rotulada en el proyecto |
|---|---:|
| Nivel 0, semisótano | +3,70 |
| Nivel 2, plataforma sobre tubo toro | +14,10 |
| Nivel 3, plataforma de la cuba | +17,00 |
| Nivel 4, plataforma de la cuba | +20,10 |
| Nivel 5, plataforma de la cuba | +23,20 |
| Nivel 6, plataforma de la cuba | +25,90 |
| Nivel 7, plataforma de la cuba | +28,60 |
| Nivel 8, plataforma del tragante | +32,10 |
| Nivel 9, tragante y skip | +36,50 |
| Nivel 10, puente grúa inferior | +42,50 |
| Nivel 11, mecanismos de campanas | +46,80 |
| Nivel 12, puente superior / soporte de tubería de gas | +51,40 |
| Nivel 12/13, acceso a válvulas | +56,10 |
| Nivel 13, antigua plataforma de válvulas | +59,20 |
| Nivel 14, plataforma actual de válvulas | +64,20 |

La cifra del nivel 1, plataforma de trabajo, resulta menos legible en la imagen pública de 670 píxeles; no se publica aquí como medición cerrada. El dibujo también muestra piezas por encima de la plataforma superior, de modo que su cota +64,20 no puede trasladarse sin explicación a cada extremo del modelo.

El registro final de la maqueta conserva las alturas de escena y las referencias documentales por separado. El alzado interactivo se deriva del modelo y emplea un origen exterior aproximado. Esta convención impide convertir una concordancia visual en una certificación topográfica.

## Interior y adaptación patrimonial

Las tres aperturas grandes de la parte baja pertenecen a la rehabilitación, según el BOE. No son las piqueras ni los accesos de operarios de un horno encendido. La fotografía de Mariela Apollonio publicada por La Casa de la Arquitectura muestra un encuentro de pasarelas de rejilla, protecciones metálicas y paredes irregulares del vaso. La imagen de 2022 publicada por Besó, fig. 11, permite reconocer ladrillos refractarios, manchas, pérdidas y cajas de refrigeración que afloran en la cara interior.

La memoria de 2008 explica la conservación y consolidación del refractario y la reutilización de piezas recuperables. También registra trabajos para permitir la visita mediante accesos, pavimento, luz y una malla protectora. Estos documentos sustentan una cavidad hueca, un revestimiento de espesor visible, una pasarela contemporánea y un sistema de protección simplificado. No sustentan una textura idéntica a cada paño ni un levantamiento milimétrico del desgaste.

El corte del atlas es reversible y didáctico: retira una parte de la envolvente para exponer crisol, etalajes y cuba. La geometría de la máquina permanece diferenciada de la plataforma nueva. Los puntos de observación elevados son cámaras virtuales. La información del organizador consultada en 2026 indica expresamente que las plataformas superiores no están abiertas a la visita; por tanto, el atlas no promete un ascenso presencial ni un ascensor en servicio.

## Qué permanece y qué se restituyó

La Fundación identifica entre los componentes conservados cimientos, crisol, cajas de refrigeración, pasarelas hacia el tragante, anillo de aire, toberas y tubos de gas. Señala como reconstrucciones el plano inclinado y los puentes grúa. El relato de los arquitectos describe pérdidas anteriores a su intervención: estufas, colector de polvo, casetón del skip, voladizos de los puentes, plano inclinado y parte de la plataforma de colada.

Las cuatro estufas históricas y sus chimeneas están desaparecidas. Sus dimensiones y función pueden explicarse, pero no se incorporan como edificios actuales al render. El pabellón, los huecos de visita, la pasarela interior y el ferrocarril del perímetro son intervenciones patrimoniales. Las piezas industriales expuestas junto al horno no deben atribuirse automáticamente a este equipo concreto: Besó, p. 102, advierte de adquisiciones posteriores al cierre.

## Recinto, pabellón y terreno

La memoria de 2008 documenta una ampliación del antiguo espacio de la rotonda y una excavación alrededor de la base. Su estado y sus propuestas incluyen el drenaje, el borde de tráfico, la modificación de la valla y el tratamiento de taludes con traviesas de hormigón recuperadas. Son datos de un momento de obra, que se contrastan con fotos de la restauración y ortofoto; el proyecto no se presenta como acta final de ejecución.

El pabellón tiene una silueta de planos inclinados, paneles grises, juntas y un corredor de acceso abierto. La planta publicada y la huella de OSM permiten situar sus cuerpos; las fotografías aportan el carácter de la envolvente. Alturas, pendientes, voladizos y escaleras menores se aproximan cuando no hay una cota legible. El entorno industrial se conserva como tal, con edificios de contexto y naves próximas; no se sustituye por un barrio histórico genérico.

## Cronología y divergencias conservadas

1. **1922–1926.** Las fuentes coinciden en la construcción durante estos años y en la entrada en producción en 1926. La Fundación fecha la primera colada el 26 de junio; Besó menciona un encendido el 14 de junio. Pueden referirse a actos distintos, por lo que no se unen bajo una fecha inventada.
2. **Interrupción de los años treinta.** Fundación y Besó discrepan entre 1930 y 1932 para el horno nº 2. La visita usa una formulación de década y mantiene la reactivación de 1941.
3. **Reconstrucción de los años sesenta.** El derribo de 1961 aparece en varias fuentes. El reencendido figura en 1963 en el folleto de la Fundación, en 1964 en Besó y en 1965 en el BOE. La cronología de la visita muestra la discrepancia.
4. **24 de marzo de 1984.** Última colada y apagado del horno nº 2. No se equipara al cierre final de la cabecera: el horno nº 3 continuó hasta octubre, según la síntesis de Besó.
5. **1998–2011 y 2012.** Europa Nostra confirma las fases de intervención 1998–2000, 2007 y 2009–2011, y el Grand Prix de 2012. El relato de las fases no presupone que todo componente exterior se ejecutara el mismo día.
6. **Rampa de carga.** Besó, p. 117, sitúa una reconstrucción del montacargas inclinado en 2016. Sin embargo, el registro PATRIF publicado en enero de 2015 ya muestra la rampa y la cabina azul en una fotografía fechada el 26 de diciembre de 2014. La imagen original descargada conserva `DateTimeOriginal=2014:12:26 13:20:48`; el campo de modificación posterior no debe confundirse con la toma. Esta evidencia impide presentar 2016 como fecha indiscutida de la primera restitución. La visita explica su carácter reconstruido y evita fijar un año único.
7. **2024.** Declaración como BIC mediante Decreto 26/2024. Es un hito de protección, distinto de la puesta en servicio o de la rehabilitación.

## Registro de la visita

La narrativa se organiza en cinco ámbitos: conjunto, interior, proceso, estructura y memoria. Cada parada dispone de hechos vinculados a fuentes, observación sugerida y nota de interpretación del modelo. La confianza documental de un hecho no certifica la precisión geométrica de su punto de cámara.

| Orden | Identificador | Foco |
|---:|---|---|
| 1 | `horno-conjunto` | Volumen y silueta |
| 2 | `horno-cimentacion` | Base escalonada y terreno |
| 3 | `horno-crisol` | Vaso inferior y salidas |
| 4 | `horno-acceso` | Tres aperturas modernas |
| 5 | `horno-interior` | Cavidad y pasarela |
| 6 | `horno-revestimiento` | Refractario |
| 7 | `horno-toberas` | Doce entradas de aire |
| 8 | `horno-anillo` | Distribución del aire |
| 9 | `horno-etalajes` | Cambio de perfil |
| 10 | `horno-cuba` | Vaso y envolvente |
| 11 | `horno-refrigeracion` | Veintiuna filas de cajas |
| 12 | `horno-plataformas` | Niveles de trabajo |
| 13 | `horno-escaleras` | Circulación de servicio |
| 14 | `horno-tragante` | Carga y doble campana |
| 15 | `horno-gases` | Conductos superiores |
| 16 | `horno-puente42` | Puente inferior restituido |
| 17 | `horno-puente51` | Puente superior restituido |
| 18 | `horno-skip` | Plano inclinado de dos vías |
| 19 | `horno-entorno` | Pabellón, plaza y naves |
| 20 | `horno-memoria` | Trabajo, conservación y ciudad |

El archivo de visita contiene el registro final de coordenadas y referencias de altura cuando se integra con el constructor de la geometría. No se modifican por esta investigación la portada global, las visitas anteriores ni los nombres del atlas.
