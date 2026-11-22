# V13 · Identidad y navegación generales

Se conserva la marca SAGUNTUM · Atlas vivo. La raíz y #atlas abren la portada de Sagunto y Puerto de Sagunto. La escena de inicio sigue siendo la vista regional del casco histórico, identificada en el pie del mapa.

## Verificación

- `node --check dist/js/app.js`: correcto.
- `git diff --check`: correcto.
- Revisión independiente de los cambios de estado, rutas y CTA: sin incidencias.
- Navegador: la raíz abre #atlas con el título global y el encabezado «Sagunto y su puerto».
- «Explorar el atlas» abre el mapa territorial y sus seis destinos.
- Seleccionar Puerto abre #puerto con su descripción y recorrido regional.
- El logotipo vuelve desde el Puerto al inicio #atlas.
- #calvario/calvario-fachada conserva la parada «El color recuperado bajo la cal».
- «Vista general» desde la parada devuelve a #sagunto; «Explorar» devuelve a #atlas.
- El título de la pestaña permanece «SAGUNTUM · Sagunto y Puerto de Sagunto» en esos estados.

La captura `atlas-home.jpg` documenta la portada en el modo cartográfico 2D del navegador de comprobación, que no dispone de WebGL. Esta revisión modifica identidad, textos y navegación; no modifica geometrías ni materiales de los monumentos.
