"""Inspect the southern source-registered geometry with the existing CPU renderer.

node research/validation-plaza-sur/render_southern_porticoes.mjs
blender -b --python research/validation-plaza-sur/render_southern_porticoes.py -- --draft

This is an isolated geometry render, not a screenshot of the application.
"""
from pathlib import Path

root = Path(__file__).resolve().parents[2]
renderer = root / 'research/validation-v10/render_plaza.py'
source = renderer.read_text()
source = source.replace("root=Path(__file__).resolve().parents[2]", f"root=Path({str(root)!r})")
source = source.replace("out=root/'research/validation-v10'", "out=root/'research/validation-plaza-sur'")
source = source.replace("gzip.open(out/'plaza-geometry.json.gz','rt')", "gzip.open('/tmp/saguntum-plaza-ref/southern-geometry.json.gz','rt')")
source = source.replace("location=(0,0,-35)", "location=(0,0,.01)")
source = source.replace("mat.diffuse_color=(.11,.15,.14,1)", "mat.diffuse_color=(.43,.40,.32,1)")
exec(compile(source, str(renderer), 'exec'))
