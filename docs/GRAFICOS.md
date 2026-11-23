# Gráficos y texturas del Simulador 3D

## Revisión 41

En **Capas y luz** se puede elegir la fecha de Sagunto, mover la hora solar aparente y saltar al amanecer, mediodía, atardecer o noche. La luz diurna y la dorada del Atlas siguen disponibles para comparar una visita con su escenario territorial. El reloj solar señala su mediodía a las 12 durante todo el año. [Cálculo de la declinación, NOAA](https://gml.noaa.gov/grad/solcalc/solareqns.PDF)

La rugosidad y el reflejo del cinc, las barandillas pintadas, el vidrio y los remates de hormigón responden al cielo y a la luz. Las laderas cercanas proyectan sombras que respetan las excavaciones. El arbolado conserva sus centros medidos y ajusta su radio al espacio disponible frente a edificios y calzadas. [Fuentes, capturas con la misma cámara y rendimiento](../research/graficos-v41/README.md)

El perfil automático considera las capacidades WebGL 2, la carga de píxeles y el coste de los fotogramas recientes. **Ultra** utiliza una sombra de hasta 4096 × 4096 y un mapa de entorno de mayor resolución en equipos compatibles. Los detalles de **Cartografía y rendimiento** muestran el motor utilizado, el perfil efectivo y el tiempo observado.

## Revisión 38

Los tramos urbanos de 44 sectores incorporan aceras, bordillos y márgenes entre la calzada y las fachadas. Las alineaciones proceden de los límites de parcela de Catastro y de la red de OpenStreetMap. La separación entre acera y margen, el acabado y las juntas se estiman. Las zonas verdes, parcelas y superficies identificadas en el viario se excluyen del cálculo.

Las calles y las cubiertas reciben luz de cielo en función de las alturas de los edificios próximos. El modelo de superficie normalizado del IGN también interviene en las sombras lejanas y en el reflejo de los cristales. El pavimento recoge el tono local de la ortofotografía PNOA. [Fuentes, precisión y pruebas](../research/paisaje-urbano-v38/README.md) · [Carrer de Barcelona](../research/paisaje-urbano-v38/barcelona-comparacion.jpg) · [Manzanas del Puerto](../research/paisaje-urbano-v38/manzanas-comparacion.jpg)

## Revisión 37

Las cubiertas y el suelo utilizan la misma fotografía georreferenciada para mantener la continuidad entre los patios, las manzanas y sus calles. En el Carrer Major, el modelo del entorno interviene en la luz que llega a la base de cada fachada. Para revisar los cambios a nivel de peatón y a unos 200 m de altura se guardaron cuatro pares de capturas con la misma cámara. [Fuentes, mediciones y comparación](../research/realismo-urbano/README.md)

Cuando la cámara orbita a baja altura y mira hacia un punto lejano, la carga de sectores, relieve, copas y patrimonio toma en cuenta el terreno que aparece en primer plano. Esto permite mirar desde el Castillo hacia las sierras y mantener visibles las murallas detalladas. Las dos distancias figuran como `range` y `detailRange` en `territoryStatus`. [Vista desde el Castillo](../research/validation-v37-landscape/sierra-despues.jpg) · [Panorámica del corredor litoral](../research/validation-v37-landscape/panorama-despues.jpg)

La revisión parte de la versión 33 del proyecto original de Sites. En el Simulador, una calle puede combinar la posición de una fachada tomada de Catastro, el color de su cubierta observado desde el aire y una persiana de diseño representativo. Cada una de esas decisiones tiene un alcance distinto.

| Elemento | Qué se representa y con qué precisión |
| --- | --- |
| Terreno y fotografía | El relieve procede del MDT del IGN. Sobre él se proyectan las ortofotografías PNOA en EPSG:25830. Las 115 hojas locales de 512 m incluyen imágenes a 0,25 y 0,50 m por píxel, con carga alrededor de la cámara. El manifiesto registra los bloques de origen y la resolución. La imagen de referencia de menor resolución sigue dando continuidad al resto del municipio. |
| Suelo y cubiertas | Una máscara derivada de las huellas separa cubiertas y suelo. Las cubiertas planas compatibles conservan detalles fotografiados. La superficie oculta bajo una construcción se aproxima con píxeles del entorno al mostrar edificios en 3D. Las zonas de arena, grava de cauce y suelo agrícola tienen microrelieve representativo. |
| Edificios | Los edificios mantienen las huellas catastrales de la edición anterior. Se emplean las alturas disponibles y sus métodos ya registrados. La vista aérea carga 1.990 siluetas dominantes y otros tres paquetes del casco, Puerto y municipio hasta 15.862 partes reales. El detalle urbano sigue leyendo sus sectores catastrales. El revoco, la fábrica, la chapa, las puertas, las persianas y el ritmo de huecos son decisiones tipológicas salvo documentación específica. |
| Calles y actividad | Los pavimentos parten de la etiqueta de superficie OSM cuando existe. La escala del árido, despiece de losas y rugosidad provienen de muestras de material. Cuando falta la etiqueta se emplea una terminación compatible con la clase de vía. Los árboles, vehículos, peatones y muebles son modelos representativos. |
| Patrimonio | El trabajador conserva materiales, normales, mapas, escala de normales y propiedades físicas de los constructores del Atlas. En superficies identificadas como piedra, mortero, hormigón, ladrillo o metal oxidado se añade porosidad a distancias cortas. El detalle se obtiene de la banda de alta frecuencia del escaneo y conserva el aparejo, los colores y las fases del modelo original. |
| Luz y costa | La hora controla una trayectoria solar equinoccial en la latitud local. Una capa de nubes procedente de una fotografía HDR ilumina el cielo, el metal y el vidrio. El cielo visible se filtra en un mapa de entorno para los materiales rugosos. El mar usa el shader costero del Atlas, las normales previas y su cámara de reflexión. El simulador resuelve olas capilares, destellos y espuma de contacto y prolonga visualmente el mar en los bordes oceánicos del recorte. El oleaje, el cielo y el color aparente del agua son interpretativos. |

El shader costero activa los cambios territoriales mediante `TERRITORIAL_COAST`. La máscara marítima, el cauce del Palancia y la posición de la costa siguen procediendo de la cartografía. La prolongación visual mar adentro sólo afecta a los triángulos de agua. El visor patrimonial utiliza su configuración de costa anterior.

Las sombras se ajustan a la escala de observación. En calidad alta de escritorio, un pase de profundidad refuerza los contactos en el arranque de los muros y los huecos próximos. Los dispositivos táctiles adaptan su resolución a los píxeles disponibles y al tiempo de fotograma. Las texturas, las teselas y el cielo se sirven desde la aplicación.

## Procedencia y reproducción

- Las ortofotos incluyen su origen, condiciones de uso, resolución y metadatos del vuelo. El script de preparación genera las hojas, las máscaras y las versiones compactas con caché local. [Manifiesto fotográfico](../dist/assets/territory/surface-photo/index.json) · [Preparación](../research/terrain-visual.py) · [Política de datos IGN](https://www.ign.es/web/ign/portal/politica-datos)
- La arquitectura y los pavimentos incorporan escaneos CC0. Las recetas convierten los originales en atlas locales y registran su procedencia. El árbol a media distancia emplea vistas del modelo original. [Arquitectura](../dist/assets/materials/architecture/CREDITS.md) · [Calles](../dist/assets/materials/streets/credits.json) · [Arbolado](../dist/assets/materials/streets/tree-credits.json) · [Licencia de los recursos](https://polyhaven.com/license)
- La capa celeste utiliza *Kloofendal 48d Partly Cloudy (Pure Sky)* de Greg Zaal y Jarod Guest. El procedimiento extrae la cobertura y luminancia de las nubes de la mitad superior y verifica el SHA-256 del HDRI. El disco solar se dibuja según la hora seleccionada. [Fotografía original](https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky) · [Preparación con FFmpeg, NumPy y Pillow](../research/prepare-territorial-sky.py)
- El material de detalle patrimonial extrae poros y picaduras de cuatro muestras CC0 y los aplica según el material identificado por el constructor. [Receta y nombres de los originales](../research/prepare-heritage-grain.py)
- Los paquetes de panorámica se regeneran desde los datos de edificios de la distribución. [Preparación de la panorámica](../research/territory-aerial-buildings.py)

Para abrir la aplicación se sirve `dist/` con un servidor HTTP estático. Los recursos gráficos distribuidos ya están preparados. La reproducción de las pruebas, las cámaras de comparación y las limitaciones de hardware figuran en el informe. [Verificación de la revisión gráfica](../research/validation-visual/README.md)
