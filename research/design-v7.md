# Identidad y composición · Castillo de Sagunto · V7

## Dirección visual

La identidad de SAGUNTUM evoluciona desde el petróleo y el dorado existentes. El petróleo proporciona el marco del atlas, el bronce señala las acciones, y los tonos de caliza, cobre y mar dan continuidad al patrimonio y al territorio. No se presenta como la identidad institucional del Ayuntamiento: es la identidad del propio atlas.

La aplicación incorpora dos apariencias. **Atlas oscuro** mantiene la continuidad con la maqueta; **Lectura clara** permite leer la documentación sobre superficies claras. La apariencia afecta a interfaz y mapas 2D. Los materiales de piedra, edificios, terreno y agua 3D conservan su significado y no se recolorean al cambiar el tema.

| Función | Atlas oscuro | Lectura clara |
|---|---|---|
| Fondo | `#102C34` | `#E6ECEB` |
| Superficie de lectura | `#142E35` | `#FCFCF8` |
| Texto principal | `#F4F1E9` | `#18363D` |
| Texto secundario | `#C0CBC9` | `#4F686C` |
| Acción / bronce | `#E1C18B` | `#805026` |
| Mar / época medieval | `#8AD3CA` | `#216C70` |
| Cobre / época moderna | `#F0B192` | `#974D34` |

Las claves semánticas están centralizadas en el bloque V7 de `dist/style.css`: fondo, superficies, texto, acción, borde, foco y familias cronológicas. Las variables heredadas `--ink`, `--muted`, `--gold`, `--line` y `--glass` quedan conectadas a estos papeles para mantener los componentes anteriores. La cronología usa tres familias cromáticas y un tono para estructuras mixtas o sin asignación segura; las etiquetas de texto siguen siendo necesarias.

## API del tema

`dist/js/theme.js` exporta:

- `initTheme({onChange})`: conecta el selector nativo `#appearance-select`, aplica la preferencia inicial y devuelve `{ current, set, dispose }`.
- `getTheme()`: ID estable `dark` o `light`.
- `getMapPalette(theme?)`: paleta inmutable para los mapas. Incluye `background`, `surface`, `text`, `muted`, `accent`, `accentInk`, `border`, `water`, `vegetation`, `terrainLow`, `terrainHigh`, `building`, `road`, `ancient`, `medieval`, `modern`, `unknown`, y alias de los mapas anteriores.

La clave local es `saguntum-appearance-v1`. Si el navegador deniega el almacenamiento, el cambio sigue funcionando en la sesión. El selector permite teclado y control nativo del sistema. Se sincroniza entre pestañas mediante el evento `storage`. La aplicación inicial no invoca `onChange`, evitando un repintado antes de que la cartografía esté lista. El pequeño script del encabezado aplica el atributo inicial para reducir el destello de tema incorrecto.

## Composición de la visita

El Castillo tiene una disposición propia mediante `body.castle-mode`:

- **Escritorio:** panel lateral de 380 px, a 24 px del borde izquierdo, entre 108 px y 68 px del borde superior/inferior. Incluye 24 px de margen interior. La maqueta conserva el resto de la pantalla. El plano se sitúa por encima de la barra de herramientas, sin superponerse con ella.
- **Móvil hasta 700 px:** panel inferior con altura máxima de 50dvh; encabezado de 112 px con marca, apariencia y navegación en dos filas. Los controles 3D quedan en la franja superior desde 128 px. La sombra sobre la escena se reduce a la transición inferior. La ficha mantiene un título compacto y desplazamiento propio.
- **Horizontal bajo, más de 700 px de ancho:** panel de 340 px, encabezado de 64 px y controles a la derecha. Esta excepción se comunica a la integración de la cámara.

Las pestañas **Recorrido / Cronología / Fuentes** permanecen junto al contenido. Se agrupan los recintos mediante desplegables, con paradas legibles, progreso y navegación anterior/siguiente. La vista de una parada separa introducción, hechos documentados, citas, indicaciones de observación y límites del modelo. No se duplican debajo los antiguos bloques genéricos de la ficha del Castillo.

La tipografía Manrope se conserva para lectura y controles; Cormorant queda para el nombre del lugar y títulos editoriales. El texto de lectura de la visita es de 16 px; controles y etiquetas funcionales, 14 px; metadatos secundarios, 12–13 px. Los controles principales y enlaces de cita tienen objetivos de al menos 44 px. Se respeta `prefers-reduced-motion`.

## Comprobación

Se han calculado 32 relaciones entre colores de texto y superficies semánticas, incluyendo el texto de las acciones. Todas superan 4,5:1; la menor es **5,05:1**. Los bordes de control frente a la superficie principal tienen contraste de **3,90:1** y **3,18:1**; el foco, **9,95:1** y **6,08:1**, respectivamente. Los resultados están en `research/validation-v7/design-contrast.json`.

El HTML conserva IDs existentes y presenta 106 IDs únicos, sin duplicados después de añadir apariencia y el panel. `theme.js` pasa la comprobación sintáctica de Node. La composición real en navegador y el cambio de tema se validan en la integración, no se atribuyen a estos cálculos de contraste.
