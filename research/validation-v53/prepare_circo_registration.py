#!/usr/bin/env python3
"""Reproduce the v53 circus registration, coordinates and review overlay.

This is a research derivation, not a topographic survey. It never edits dist/.
Inputs are the two public orthophotos and the image-registration JSON in
the v53 scratch research folder (download URLs are saved beside those inputs).
"""
import argparse
import hashlib
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--inputs", type=Path,
                        default=Path("/workspace/scratch/53242b8b9a77/circo-v53"))
    parser.add_argument("--output", type=Path, default=Path(__file__).parent)
    args = parser.parse_args()
    src, out = args.inputs, args.output
    out.mkdir(parents=True, exist_ok=True)
    fit_path = src / "fig17-image-registration.json"
    if not fit_path.exists():
        fit_path = out / "circo-image-fit.json"
    fit = json.loads(fit_path.read_text())
    matrix = np.array(fit["fittedMatrix"])
    mx, mz = 111320 * math.cos(math.radians(39.679)), 111320

    def project(coord):
        return np.array([(coord[0] + .278) * mx, (39.679 - coord[1]) * mz])

    def unproject(point):
        return [float(point[0] / mx - .278), float(39.679 - point[1] / mz)]

    def rotation(yaw):
        c, s = math.cos(yaw), math.sin(yaw)
        return np.array([[c, -s], [s, c]])  # row vectors [u,v] -> atlas [x,z]

    gate_frame = rotation(-.307)
    gate_world = project([-.275518, 39.681049]) + np.array([-4.25, 1.3]) @ gate_frame
    old_center = gate_world - np.array([80, 35]) @ gate_frame
    historic_yaw, gate_u, half_width, head_depth = -.305, 55.5, 35., 22.
    frame = rotation(historic_yaw)
    center = gate_world - np.array([gate_u, half_width]) @ frame

    def world(u, v):
        return center + np.array([u, v]) @ frame

    def feature(pixel):
        return np.array([*pixel, 1.]) @ matrix

    # Coordinates read on the extracted 443x378 figure enlarged 3x.
    pixels = {
        "eastApex": [1135, 590],
        "northTangency": [1100, 490],
        "southTangency": [1051, 670],
        "northFlankWest": [489, 304],
        "southFlankWest": [426, 498],
        "hypotheticalWesternCurve": [390, 441],
        # Fig.16 and Fig.17 have near-identical framing; transferring these
        # endpoints is included in the stated 3–5m feature-position tolerance.
        "spinaWestFig16": [643, 458],
        "spinaEastFig16": [1066, 583],
    }
    figure_features = {}
    for name, point in pixels.items():
        w = feature(point)
        figure_features[name] = {
            "enlargedPixelXY": point,
            "atlasWorldXZ": w.tolist(),
            "coordinate": unproject(w),
            "v52CircusFrameUV": ((w - old_center) @ gate_frame.T).tolist(),
            "v53CircusFrameUV": ((w - center) @ frame.T).tolist(),
        }
    outline_pixels = [
        [396,477],[390,441],[395,397],[406,359],[420,328],[438,307],
        [458,300],[488,303],[1100,490],[1116,512],[1127,542],[1134,571],
        [1135,600],[1131,628],[1118,650],[1100,670],[1074,685],
        [1053,683],[1051,670],[420,497],
    ]
    source_outline = [unproject(feature(p)) for p in outline_pixels]

    def stadium(center_world, rot, depth):
        curve = 136.5 - depth
        points = [[-136.5, -35]]
        points += [[curve + depth * math.cos(a), 35 * math.sin(a)]
                   for a in np.linspace(-math.pi/2, math.pi/2, 65)]
        points += [[-136.5, 35]]
        return [unproject(center_world + np.array(p) @ rot) for p in points]

    outline = stadium(center, frame, head_depth)
    old_outline = stadium(old_center, gate_frame, 35.)
    controls = {
        "method": "Affine raster matching to the same official ICV 2012 orthophoto, visually checked; no independent surveyed ground-control network.",
        "figure": "Melchor et al., ARSE51 (2017), p43 fig17, extracted native443x378px",
        "nativeFigurePixels": [443, 378],
        "inputCoordinatesAreEnlargedBy": 3,
        "affineEnlargedPixelToAtlasWorldXZ": matrix.tolist(),
        "imageCorrelation": fit["correlationAfter"],
        "localPatchChecks": fit["localPatchChecks"],
        "imageMatchingResidualRmsMeters": fit["patchResidualRmsM"],
        "precisionWarning": "Patch residual describes matching of two copies of the same image only. It is NOT archaeological position accuracy; retain3–5m tolerance for the traced features.",
        "initialManualFitRmsMeters": 5.11351650248757,
        "initialManualFitUsedForFinalGeometry": False,
        "initialManualFitNote": "Only an initial search seed. Road-center selection on the small printed image was superseded by exact-year raster matching.",
    }
    anchors = {
        "gate": unproject(gate_world),
        "center": unproject(center),
        "eastApex": unproject(world(136.5, 0)),
        "westClosureHypothesis": unproject(world(-136.5, 0)),
        "northTangency": unproject(world(114.5, -35)),
        "southTangency": unproject(world(114.5, 35)),
        "spinaWest": unproject(world(38 - 75.5, 3.4)),
        "spinaEast": unproject(world(38 + 75.5, 3.4)),
        "westernClosureForLength270": unproject(world(136.5 - 270, 0)),
        "westernClosureForLength290": unproject(world(136.5 - 290, 0)),
    }
    doc = {
        "schemaVersion": 1,
        "id": "circo-historical-registration-v53",
        "date": "2026-11-27",
        "baselineCommit": "7c798336b46556233de8117492be11fed15b14ab",
        "yawRadians": historic_yaw,
        "gateU": gate_u,
        "headDepthM": head_depth,
        "headShape": "elliptical-working-restitution",
        "lengthM": 273,
        "widthM": 70,
        "spinaLengthM": 151,
        "spinaCenterU": 38,
        "spinaCenterV": 3.4,
        "spinaYawOffsetRadians": 0,
        "uncertaintyMeters": 5,
        "uncertaintyNote": "Approximate3–5m feature position, ±3m eastern-head axial depth; exact western closure unknown. These are conservative visual-model tolerances, not statistical confidence intervals.",
        "headDepthUncertaintyM": 3,
        "westernLengthRangeM": [270, 290],
        "method": "Manual digitisation of the published2017 photogrammetric restitution after affine matching of its raster to the SAME ICV2012 orthophoto, then anchoring to the conserved southern gate. The rounded model is an interpretation, not an exact survey.",
        "preserveCurrentGateRegistration": {
            "coordinate": [-.275518, 39.681049],
            "yawRadians": -.307,
            "gateCenterLocalXZ": [-4.25, 1.3],
            "gateWorldXZ": gate_world.tolist(),
        },
        "historicalCenterWorldXZ": center.tolist(),
        "anchors": anchors,
        "outline": outline,
        "figureOutlineApproximate": source_outline,
        "digitisedFigureFeatures": figure_features,
        "controlFit": controls,
        "sourceURLs": [
            "https://centroarqueologicosaguntino.es/wp-content/uploads/2018/11/5.-Nuevos-apuntes-para-el-estudio-del-circo-romano-de-Sagunto.pdf",
            "https://producciocientifica.uv.es/documentos/5ebf1e6e2999524bdf79cb75",
            "https://llibres.urv.cat/index.php/purv/catalog/download/354/366/845?inline=1",
            "https://datos.gob.es/es/catalogo/a10002983-ortofoto-de-2012-pnoa-de-la-comunitat-valenciana-en-rgb-y-50-cm-de-resolucion1",
            "https://terramapas.icv.gva.es/0202_2012CVAL0050?service=WMS&request=GetCapabilities",
            (src / "icv2012-circo-url.txt").read_text().strip(),
            (src / "pnoa-circo-current-url.txt").read_text().strip(),
        ],
        "sourceLocalizers": [
            "ARSE51(2017), pp42–44, figs16–17 and table1.",
            "Tarraco Biennal2017, Melchor et al., pp155–160: p159 spina151m; p160fig5 expressly labels white boundary as possible total-length hypothesis.",
            "ICV2012 RGB orthophoto50cm, official WMS. PNOA current mosaic used only for visual comparison; mosaic flight date not specified by GetMap.",
        ],
        "sourceHashesSha256": {
            name: hashlib.sha256((src / name).read_bytes()).hexdigest()
            for name in ["melchor-arse2017.pdf", "page19-image0.jpeg", "icv2012-circo.jpg", "pnoa-circo-current.jpg"]
        },
        "cautions": [
            "Do not use the white western arc as excavated carceres: the source says the western closure cannot be located precisely.",
            "The printed graphic outline measures roughly260m in this georeferencing, whereas the text supplies270–290m and table273approx. Preserve that discrepancy and the western uncertainty, rather than treating the figure as a millimetric architectural plan.",
            "The ellipse22x35m is a deliberately rounded graphic inference, not a newly established archaeological dimension.",
            "Use151m spina from the revised2017 study. The earlier190m report belongs to a different dimensional reconstruction.",
            "Do not infer arena, roof, tribune or carceres heights from the plan. Do not use image-matching residuals as survey error.",
        ],
    }
    (out / "circo-registration.json").write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n")
    (out / "circo-image-fit.json").write_text(json.dumps(fit, ensure_ascii=False, indent=2) + "\n")

    # Evidence overlay uses the official current orthophoto; the publication's
    # raster is not included in app assets or in this review graphic.
    fig, ax = plt.subplots(figsize=(14.8, 8.8))
    ax.imshow(Image.open(src / "pnoa-circo-current.jpg"), extent=(-.2792, -.2735, 39.6805, 39.6829))
    for poly, color, label, style, width in [
        (old_outline, "#ff70d5", "v52: semicírculo, puerta u80", "--", 1.8),
        (source_outline, "#ffd75b", "Trazado aproximado de fig.17 (2017)", "-", 1.6),
        (outline, "#62fff3", "v53:273×70m, cabeza22m, puerta u55,5", "-", 2.4),
    ]:
        points = np.array(poly + [poly[0]])
        ax.plot(points[:, 0], points[:, 1], color=color, ls=style, lw=width, label=label)
    spin = np.array([anchors["spinaWest"], anchors["spinaEast"]])
    ax.plot(spin[:, 0], spin[:, 1], color="white", lw=4, label="Spina151m · posición interpretada")
    ax.scatter(*anchors["gate"], s=75, color="#ff4f3f", edgecolor="white", zorder=5)
    ax.annotate("Puerta conservada · anclaje fijo", anchors["gate"], xytext=(-.27645,39.68076),
                color="white", fontsize=10, arrowprops={"arrowstyle":"->","color":"white"},
                bbox={"facecolor":"#10252b","alpha":.9,"edgecolor":"none","pad":4})
    ax.set_xlim(-.2784,-.27395); ax.set_ylim(39.68052,39.68245)
    ax.set_aspect(1/math.cos(math.radians(39.681)))
    ax.ticklabel_format(useOffset=False, style="plain")
    ax.tick_params(labelsize=8)
    ax.set_xlabel("Longitud WGS84"); ax.set_ylabel("Latitud WGS84")
    ax.legend(loc="upper right", fontsize=9, facecolor="#10252b", edgecolor="none", labelcolor="white", framealpha=.93)
    fig.suptitle("SAGUNTUM · Registro del circo completo", x=.075, ha="left", fontsize=20, fontweight="bold")
    fig.text(.075,.925,"Comparación sobre PNOA · coordenadas interpretativas, tolerancia3–5m · cierre occidental desconocido",fontsize=10)
    fig.text(.075,.025,"Fuentes: Melchor et al., ARSE51(2017), figs16–17; ICV, ortofoto2012; IGN/PNOA, mosaico de máxima actualidad (CCBY4.0).\nLa línea amarilla deriva de la figura publicada; no acredita el cierreO. La longitud273m es una hipótesis del rango270–290m.",fontsize=8)
    fig.tight_layout(rect=(.02,.08,1,.91))
    fig.savefig(out / "circo-registration-overlay.jpg", dpi=150, pil_kwargs={"quality":92})
    plt.close(fig)
    print(json.dumps({"anchors": anchors, "matchingCorrelation": fit["correlationAfter"], "fitPatchResidualM": fit["patchResidualRmsM"]},indent=2))


if __name__ == "__main__":
    main()
