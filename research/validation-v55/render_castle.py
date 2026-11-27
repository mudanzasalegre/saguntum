"""Run the shared CPU buffer renderer with the v55 inspection camera set.

Usage: blender -b -t 8 --python research/validation-v55/render_castle.py --
       --input /path/to/model.json.gz --output /path/to/inspection --samples 24
"""
from pathlib import Path
import runpy,sys
if '--output' not in sys.argv:
    sys.argv.extend(['--output',str(Path(__file__).resolve().parent)])
runpy.run_path(str(Path(__file__).resolve().parents[1]/'validation-v54'/'render_castle.py'),run_name='__main__')
