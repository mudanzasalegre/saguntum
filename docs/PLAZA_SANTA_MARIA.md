# Plaza Mayor y Santa María: revisión del conjunto urbano

26 de noviembre de 2026.

La intervención responde a dos zonas marcadas en una captura del Atlas: los soportales que faltaban en el cierre de Plaza Mayor y el terreno irregular que aparecía entre ese frente y Santa María. Se revisan las arquitecturas por separado y su integración en la misma escena. Los números globales de visita, los enlaces y las 16 paradas de cada monumento se mantienen.

## Documentación y decisiones

| Fuente contrastada | Decisión que respalda |
| --- | --- |
| [Expediente municipal de 30-09-2010](https://aytosagunto.es/media/lkunpbcv/pl100930.pdf), pp. 30–39 | Identificación de los números 7–8 y 9, sus parcelas, el frente porticado y las dos plantas superiores. La foto conjunta de p. 38 permite reconocer la fachada de la captura. |
| [Expediente municipal de 27-12-2011](https://aytosagunto.es/media/rb2mpsep/pl111227.pdf), p. 66 | Alzado de integración de dos ejes y planta de los soportales. El número 6 queda retranqueado. |
| [Galería institucional de Rutas Jaume I](https://www.rutasjaumei.com/es/que-ver-en-sagunto/220/plaza-mayor-de-sagunto.php) y [fotografía publicada en enero de 2019](https://www.gotaway.ca/spain/valencia/sagunto/) | Contraste del alzado con edificios fotografiados: frente ocre y cubierta de teja en 7–8; blanco, balcón corrido inferior y azotea en 9. |
| [Forner Palanca y Palomar Abascal, ARSE 58, 2024](https://centroarqueologicosaguntino.es/wp-content/uploads/2025/08/Arse_58-74-89.pdf), pp. 74–79 | Relación entre Cavallers y la puerta norte, pretil macizo, bloques epigráficos superpuestos y medidas publicadas de esos bloques. |
| [Turisme Comunitat Valenciana, Santa María y galería fotográfica](https://www.comunitatvalenciana.com/es/valencia/sagunt-sagunto/monumentos/iglesia-parroquial-de-la-natividad-de-nuestra-senora-2) | Contraste del perfil del pretil conservado, sus hombros, pilastras y remate, y de la relación con la plaza. |
| Cartografía Catastro, OSM y MDT IGN ya registrada en SAGUNTUM | Posición de edificios, cuerpos posteriores, calles, escalinata y relieve. Se conservan los datos fuente y sus coordenadas. |

El proyecto inicial de 2010 proponía tres ejes para 7–8. Se utiliza el alzado de dos ejes de 2011, que sí encuentra correspondencia en la fotografía de 2019. Las fotografías y documentos se interpretan según su fecha: no certifican cada acabado del estado exacto de noviembre de 2026. Se consultan como referencia; no se redistribuyen como texturas.

## Plaza Mayor

Los números 7–8 y 9 estaban incluidos como ocho cuerpos genéricos en el contexto de Santa María. Sus paredes cerraban el nivel inferior y la generación de ventanas producía una composición distinta a la documentada. Ahora sus dos frentes forman parte del constructor detallado de Plaza Mayor.

Se modelan cuatro vanos y cinco apoyos, una galería de paso continuo, paredes domésticas retrasadas, dos plantas superiores, balcones, cornisas y cubiertas diferenciadas. El apoyo en la junta es único y ambos suelos comparten una cota de referencia. Las losas llegan por debajo de la subrasante para cerrar la ranura que aparecía bajo su borde sin cambiar la altura del paso. Las dimensiones menores siguen siendo estimaciones visuales. Los seis cuerpos posteriores conservan sus polígonos originales; no se sustituyen las parcelas por cajas envolventes.

El conjunto de Plaza pasa de 13 a 15 frentes especializados, con 22 cuerpos de edificio. Los planos y las indicaciones de las paradas se actualizan desde el modelo. El portal del Almudín sigue en el número 17.

[Investigación y criterios del cierre sur](../research/plaza-mayor-south-front.md).

## Santa María y la calle

La cota del piso de la iglesia es superior a la calle norte. El modelo ya tenía una cimentación de fábrica, pero el ajuste del terreno elevaba también parte de Cavallers hasta ese piso: en los puntos diagnosticados se añadían artificialmente unos 4,4 metros. Además, dos constructores ordenaban los mismos ajustes de forma diferente.

La cimentación ahora sólo puede recortar una intrusión del terreno. Las prioridades explícitas hacen que la geometría no dependa del orden de construcción. La escalinata aplica límites por huella y rellano, evitando el rebaje profundo de toda su caja. La fábrica vertical, los peldaños y el pavimento resuelven el encuentro entre las dos cotas.

Se completa el pavimento a ambos extremos de la fachada y en el retorno del Sagrari junto al número 9. La cobertura se recorta contra edificios, iglesia, escalera y las áreas de Plaza Mayor y Cervantes; se retiran las tiras solapadas y se comparte la altura de sus juntas. Las superficies se triangulan sobre una cuadrícula común de medio metro, con una sola altura para cada vértice y cada arista compartida. La inspección detectó ocho puntos problemáticos que ahora tienen una sola superficie pavimentada sobre el terreno, incluidos los seis que antes dejaban ver únicamente la ortofoto.

El rellano se enlaza físicamente con el umbral. Las arquivoltas de las portadas quedan abiertas en su base, suprimiendo las barras que atravesaban el paso y se superponían al rellano; los marcos de las ventanas se conservan. El pretil se ajusta a las referencias fotográficas. Las dos inscripciones se mantienen como bloques de dimensiones publicadas, sin añadir letras inventadas. La fecha 1799 se refiere al pretil y no se extiende a toda la escalera.

[Investigación, geometría y límites de Santa María](../research/santa-maria-public-realm-v47.md).

## Integración en Atlas y Simulador

En el Atlas regional se declara qué ocho cuerpos de Santa María sustituye el nuevo modelo de Plaza. Los registros fuente permanecen en los datos; sólo se omite su representación genérica cuando existe el reemplazo detallado.

En el Simulador, Plaza y Santa María constituyen una sola unidad de carga local. Así se mantienen juntas incluso cuando el dispositivo permite un único conjunto patrimonial cercano. Cada monumento conserva sus paradas, selección y lectura. La sección del interior de Santa María funciona de forma independiente y no desmonta la plaza, cuya visita conserva las galerías abiertas sin ofrecer una sección doméstica. La construcción interactiva y la construcción del trabajador usan los mismos módulos, datos, superficies y ajustes de terreno. El trabajador distribuido se reconstruye desde esas fuentes.

## Verificación y alcance

Las comprobaciones reproducibles examinan las mallas reales de Three.js: coordenadas conservadas, apertura física de los nuevos vanos, continuidad del paso cubierto, suelo bajo peldaños, unión al umbral, independencia del orden de ajustes, sustitución de los ocho cuerpos y comportamiento de las 32 paradas. La construcción interactiva y la preparada para el trabajador se comparan en geometría, relieve y pavimento. Una regresión específica revisa 599 uniones de aristas de Plaza Mayor y Santa María: no quedan alturas incompatibles, incluidas las juntas entre sus superficies. También se ejecutan las pruebas de numeración y recorrido territorial de la revisión anterior.

Los renders de inspección se producen con Blender a partir de las geometrías y matrices efectivas de la aplicación. Sirven para revisar volúmenes, huecos y encuentros. Su iluminación y tratamiento de materiales son de inspección y no equivalen al render final de WebGL o WebGPU. En el navegador disponible se revisan los planos, la documentación y la navegación en modo 2D; ese entorno no dispone de WebGL. No se atribuyen a esta revisión mediciones de rendimiento GPU.

Pruebas principales:

```bash
node research/validation-plaza-sur/validate_southern_porticoes.mjs
node research/validate_santa_maria_public_realm_v47.mjs
node research/test-santa-maria-ground.mjs
node research/test-plaza-santa-maria-ensemble.mjs
```

Resultados y vistas de inspección: [suelo](../research/validation-v47/ground-qa.json), [integración y pavimentos](../research/validation-v47/ensemble-qa.json), [continuidad de las aristas](../research/validation-v47/pavement-continuity-qa.json), [soportales](../research/validation-plaza-sur/southern-porticoes-qa.json), [Santa María](../research/validation-v47/santa-maria-public-realm.json), [conjunto antes](../research/validation-v47/plaza-cierre-sur-antes.jpg), [conjunto después](../research/validation-v47/plaza-cierre-sur.jpg) y [escalinata](../research/validation-v47/santa-maria-escalinata.jpg).

Esta es una maqueta documentada, no un levantamiento topográfico o fotogramétrico nuevo. La altura de determinados paños, el número exacto de peldaños, los acabados y los detalles de los cuerpos posteriores siguen teniendo un componente interpretativo.
