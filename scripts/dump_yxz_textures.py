"""Save the base-colour atlas of a YXZ asset as a PNG.

Several of the lines that read as "scratches" on the character are painted
into the base-colour atlas rather than modelled, so they have to be
looked at in the atlas itself.  The atlas is a single 2D image, and the
lines are thin strokes in it, which makes them obvious there and easy to
repair.

Usage:
  blender -b -P scripts/dump_yxz_textures.py -- \
    --glb <glb> --out <dir> [--prefix atlas]
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import bpy


def value_after(name: str, default=None):
    if name not in sys.argv:
        return default
    return sys.argv[sys.argv.index(name) + 1]


def main() -> None:
    glb = value_after("--glb")
    out = Path(value_after("--out"))
    prefix = value_after("--prefix", "atlas")
    out.mkdir(parents=True, exist_ok=True)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=glb)

    report = []
    for index, image in enumerate(bpy.data.images):
        if image.name in {"Render Result", "Viewer Node"}:
            continue
        report.append({
            "index": index,
            "name": image.name,
            "size": list(image.size),
            "packed": bool(image.packed_file),
        })

    # Which material uses which image, and which mesh uses which material.
    usage = []
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH":
            continue
        for slot in obj.material_slots:
            material = slot.material
            if not material:
                continue
            images = []
            if material.use_nodes:
                for node in material.node_tree.nodes:
                    if node.type == "TEX_IMAGE" and node.image:
                        images.append(node.image.name)
            usage.append({
                "mesh": obj.name,
                "material": material.name,
                "images": images,
            })

    for index, image in enumerate(bpy.data.images):
        if image.name in {"Render Result", "Viewer Node"}:
            continue
        target = out / ("%s-%d-%s.png" % (prefix, index, image.name.replace(" ", "_")))
        image.file_format = "PNG"
        image.save(filepath=str(target))
        report[report.index(next(r for r in report if r["name"] == image.name))]["saved"] = str(target)

    print("YXZ_TEXTURES " + json.dumps(report, indent=1))
    print("YXZ_TEXTURE_USAGE " + json.dumps(usage, indent=1))


if __name__ == "__main__":
    main()
