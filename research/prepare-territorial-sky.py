"""Deriva la capa fotográfica de nubes. Requiere FFmpeg, Pillow y NumPy."""
import argparse
import hashlib
import subprocess
import tempfile
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image

SOURCE = 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/kloofendal_48d_partly_cloudy_puresky_2k.hdr'
CHECKSUM = '5244534e9cf5b606f2ff513aa00ddb161b0a4826ffd88a0d3bd03ac29247d198'
parser = argparse.ArgumentParser()
parser.add_argument('--input', type=Path, help='Copia local opcional del HDRI original')
args = parser.parse_args()
with tempfile.TemporaryDirectory() as tmp:
    src = args.input or Path(tmp)/'source.hdr'
    if not args.input: urllib.request.urlretrieve(SOURCE, src)
    if hashlib.sha256(src.read_bytes()).hexdigest() != CHECKSUM: raise ValueError('HDRI inesperado')
    raw = subprocess.check_output(['ffmpeg','-v','error','-i',str(src),'-f','rawvideo','-pix_fmt','gbrpf32le','-'])
rgb = np.frombuffer(raw, '<f4').reshape(3,1024,2048)[[2,0,1],:512].transpose(1,2,0)
# Separate the less saturated clouds from blue sky. Compress radiance so the
# sun and its halo can be relit at the hour and bearing of the simulator.
red,green,blue = rgb.transpose(2,0,1)
coverage = np.clip((red/(blue+.001)-.36)/.57,0,1)
brightness = np.sqrt(np.clip(green/(green+.72),0,1))
pixels = np.stack((coverage,brightness,brightness),axis=-1)
out = Path(__file__).resolve().parent.parent/'dist/assets/materials/sky/clouds.webp'
out.parent.mkdir(parents=True,exist_ok=True)
Image.fromarray(np.uint8(pixels*255+.5)).save(out,quality=94,method=6)
