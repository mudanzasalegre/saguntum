# SAGUNTUM · Atlas vivo

**Atlas visual 3D e interactivo del patrimonio, el paisaje y la memoria histórica de Sagunto y Puerto de Sagunto (Valencia, España).**

[**Explorar el atlas publicado**](https://saguntum-atlas-3d.monmode.chatgpt.site) · [**Proyecto en GitHub**](https://github.com/mudanzasalegre/saguntum)

> **Estado de esta copia:** repositorio documental inicial. La aplicación está publicada en Sites, pero **el código fuente de Sites todavía no se ha incorporado a este repositorio**. El README describe el proyecto existente, no certifica que este checkout se pueda ejecutar o compilar. La última versión publicada y confirmada en la conversación de desarrollo es la **v32** (21 de noviembre de 2026).

## Objetivo

SAGUNTUM propone explorar la evolución urbana, arqueológica, industrial y paisajística del término de Sagunto mediante una maqueta tridimensional navegable y visitas temáticas. Busca integrar edificios, calles, relieve, costa, monumentos y documentación en una sola experiencia, apta tanto para curiosos como para uso educativo y divulgación patrimonial.

**No es un levantamiento arqueológico o arquitectónico oficial**: combina geometría apoyada en documentación con reconstrucciones interpretativas. El atlas debe identificar explícitamente las incertidumbres, las fases históricas, lo conservado y lo hipotético.

## Ámbitos

- **Sagunto histórico y romano:** casco histórico, castillo, teatro, urbanismo y arqueología romana.
- **Memoria medieval y religiosa:** necrópolis, hipogeos y otros conjuntos históricos.
- **Puerto industrial:** siderurgia, instalaciones ferroviarias y portuarias, edificios de servicio y memoria obrera.
- **Ciudad industrial y residencial:** ciudad jardín, Gerencia, Casino, Economato y Barrio Obrero.
- **Patrimonio y servicios colectivos:** iglesia de Begoña, Alameda, antiguo Sanatorio y sus jardines.
- **Paisaje costero y portuario:** pantalán terrestre y marítimo, costa y Grau Vell.

La aplicación publicada incluye un catálogo de lugares y visitas detalladas. El catálogo completo y el inventario técnico definitivo deben extraerse del código de Sites cuando se sincronice.

## Conjuntos documentados en las iteraciones recientes

| Conjunto o visita | Elementos tratados |
| --- | --- |
| Domus dels Peixos | Restos de vivienda, estancia del estanque, pavimentos, pinturas, museo y lectura en corte |
| Puerta del Circo Romano | Puerta conservada, corredores, tribuna, recinto y trazado del circo |
| Necrópolis judía e hipogeos | Sepulturas, cavidades, puertas rupestres, ladera y lectura histórica |
| Alto Horno n.º 2 | Estructura industrial, cuba, toberas, pasarelas, pabellón y vista interior |
| Nave de Talleres Generales | Cuatro naves, cerchas, pilares, huecos, cubiertas y recinto |
| Nave de Efectos y Repuestos / Museo Industrial y de la Memoria Obrera | Antiguo almacén ferroviario, galerías, vía, niveles y museo |
| Gerencia y ciudad jardín | Oficinas, ampliación, viviendas, jardines, interiores documentados |
| Casino Recreativo y Cultural | Patio, galerías, terraza, biblioteca, salones y jardines |
| Iglesia de Nuestra Señora de Begoña y Alameda | Fachada, campanario, naves, coro, cubierta y espacio urbano |
| Antiguo Economato | Tres cuerpos, pórticos, forjados, interiores y conexiones urbanas |
| Barrio Obrero | Manzanas, tipologías residenciales, patios, corrales y viviendas de referencia |
| Antiguo Sanatorio y jardines | Fachada, vestíbulo, capilla, escalera, chalés, pabellones y jardines |
| Pantalán terrestre y mirador | Paseo, tolva, pérgolas, escollera, carril bici y mirador |
| Tramo marítimo del pantalán | Apoyos conservados, instalaciones desaparecidas y lectura histórica |
| Fortín del Grau Vell y poblado | Torre, batería, almacenes, interiores, ermita, poblado y costa |

El atlas también incorpora trabajo previo sobre el Teatro Romano, la Vía del Pòrtic y otros enclaves. Esta tabla es un resumen del historial de desarrollo, no un manifiesto generado automáticamente desde el código.

## Experiencia de usuario

Las iteraciones de la aplicación incluyen, según el conjunto:

- Navegación libre por un atlas y selección de lugares.
- Recorridos con paradas, cámara contextual y fichas explicativas.
- Planos interactivos de recintos, estancias y niveles.
- Modos de lectura **actual**, **corte/sección** e **histórica/interpretativa** cuando corresponde.
- Control de capas como cubiertas, edificios, vegetación y, en la costa, agua.
- Relación entre reconstrucciones y documentación histórica.
- Diseño pensado para distintos tamaños de pantalla.
- En escenas marítimas, agua con ondulación, reflejos moderados y transición costera.

**Advertencia:** el aspecto final en WebGL, el rendimiento GPU y la compatibilidad de dispositivos deben verificarse directamente después de cada publicación. Las revisiones realizadas con renders CPU no sustituyen una prueba real del navegador.

## Metodología patrimonial

Cada reconstrucción debe conservar una distinción clara:

1. **Conservado y observable:** restos, fábrica o edificios presentes.
2. **Documentado:** elementos respaldados por planos, excavaciones, fotografías o publicaciones fiables.
3. **Interpretativo:** geometría, mobiliario, colores o alturas sin medición suficiente.
4. **Proyectado:** intervenciones anunciadas que no deben representarse como terminadas.

Priorizar fuentes primarias, inventarios y catálogos de protección, memorias arqueológicas, documentación municipal y autonómica, archivos gráficos, bibliografía técnica y ortofotografía. Señalar fecha, autor y enlace de cada referencia; no confundir fases cronológicas.

### Fuentes de referencia habituales

- [Ajuntament de Sagunt](https://www.sagunto.es/)
- [Universitat de València](https://www.uv.es/)
- [Ministerio de Cultura](https://www.cultura.gob.es/)
- [BOE](https://www.boe.es/)
- [Valenciaport](https://www.valenciaport.com/)
- [FIWARE no forma parte necesariamente de esta aplicación](https://www.fiware.org/) — no atribuir integraciones no verificadas.

Estas entidades son puntos de partida para investigación, no una declaración de autoría, aprobación o colaboración con el proyecto.

## Estado y versiones

- **Proyecto principal:** SAGUNTUM · Atlas vivo, desarrollado y publicado con ChatGPT Sites.
- **Sitio público:** https://saguntum-atlas-3d.monmode.chatgpt.site
- **Identificador de proyecto Sites:** `appgprj_6afeb5aaef8c8191b0062318fb3a24f1`.
- **Última versión confirmada aquí:** **32**, con la visita del Fortín del Grau Vell publicada el **21/11/2026**.
- **GitHub:** este repositorio se ha creado como destino de copia y futura sincronización. **No contiene aún los fuentes de la v32.**

Los números de versión de Sites no equivalen a etiquetas de GitHub hasta que se archive y verifique el código correspondiente.

## Instalación y desarrollo

**Pendiente de sincronizar los archivos fuente de Sites.** Aún no es responsable publicar comandos como `npm install` o `npm run dev` sin comprobar antes el `package.json`, las dependencias, el motor 3D y las instrucciones de compilación reales.

Una vez exportado el proyecto:

1. Incorporar **todos los fuentes y recursos necesarios para construirlo**, no sólo la versión publicada estática.
2. Conservar los archivos de configuración y el fichero de bloqueo de dependencias, excluyendo claves y secretos.
3. Verificar la construcción limpia y las rutas profundas de las visitas.
4. Añadir comandos reales de instalación, ejecución, pruebas y despliegue.
5. Registrar el commit y la versión de Sites de la que procede la copia.

## Protocolo de copia de seguridad

1. Exportar el proyecto **SAGUNTUM · Atlas vivo** desde Sites, preferiblemente la versión guardada más reciente.
2. Comprobar que el paquete incluye los archivos fuente y los assets; validar el tamaño y la integridad del archivo.
3. Inspeccionar antes de publicar los archivos `.env`, tokens, credenciales, datos privados y posibles materiales sin derechos de redistribución.
4. Hacer commit en GitHub, idealmente con mensaje `backup: sync Sites vXX`.
5. Documentar SHA de GitHub, versión Sites, fecha, número de archivos y comandos de prueba.
6. Verificar en una carpeta limpia que se puede instalar, compilar y ejecutar una copia.

Un repositorio con sólo README, capturas o HTML renderizado **no es una copia de seguridad suficiente del proyecto editable**.

## Hoja de ruta

- [ ] Importar el código real y los recursos de la última versión de Sites.
- [ ] Añadir un manifiesto verificable de dependencias y licencia de terceros.
- [ ] Incorporar una guía reproducible para desarrollo y build.
- [ ] Validar la experiencia WebGL en equipos y móviles reales.
- [ ] Añadir capturas propias de la aplicación y pruebas de regresión.
- [ ] Mantener la trazabilidad bibliográfica y los niveles de incertidumbre.
- [ ] Automatizar copias periódicas de futuras versiones de Sites hacia GitHub.

## Créditos, propiedad y licencia

Proyecto independiente de divulgación y recreación patrimonial. Los derechos de fotografías, mapas, dibujos, textos de terceros y referencias históricas corresponden a sus respectivos titulares. **No se declara una licencia de software hasta que el titular la establezca explícitamente**. La disponibilidad pública del repositorio no supone una licencia automática para reutilizar sus contenidos.

---

**Estado de sincronización:** documentación inicial creada en GitHub; **sin código fuente de Sites incorporado todavía**.
