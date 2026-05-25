from __future__ import annotations

from collections import deque
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw


@dataclass
class Component:
    area: int
    min_x: int
    min_y: int
    max_x: int
    max_y: int
    pixels: np.ndarray

    @property
    def cx(self) -> float:
        return (self.min_x + self.max_x) / 2.0

    @property
    def cy(self) -> float:
        return (self.min_y + self.max_y) / 2.0


def connected_components(mask: np.ndarray) -> list[Component]:
    h, w = mask.shape
    vis = np.zeros((h, w), dtype=np.uint8)
    comps: list[Component] = []
    for y in range(h):
        for x in range(w):
            if not mask[y, x] or vis[y, x]:
                continue
            q = deque([(y, x)])
            vis[y, x] = 1
            pts = []
            min_x = max_x = x
            min_y = max_y = y
            while q:
                cy, cx = q.popleft()
                pts.append((cy, cx))
                min_x = min(min_x, cx)
                max_x = max(max_x, cx)
                min_y = min(min_y, cy)
                max_y = max(max_y, cy)
                for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
                    if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not vis[ny, nx]:
                        vis[ny, nx] = 1
                        q.append((ny, nx))
            px = np.array(pts, dtype=np.int32)
            comps.append(Component(px.shape[0], min_x, min_y, max_x, max_y, px))
    return comps


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    src = root / "assets" / "ikan-paus" / "ChatGPT Image 20 Mei 2026, 09.14.34.png"
    out_dir = root / "assets" / "fish" / "whale"
    out_dir.mkdir(parents=True, exist_ok=True)

    rgb = np.array(Image.open(src).convert("RGB"))
    h, w = rgb.shape[:2]
    max_ch = rgb.max(axis=2).astype(np.int16)
    min_ch = rgb.min(axis=2).astype(np.int16)
    chroma = max_ch - min_ch

    fg = chroma > 22
    comps = sorted(connected_components(fg), key=lambda c: c.area, reverse=True)[:8]
    if len(comps) != 8:
        raise RuntimeError(f"Expected 8 whale objects, found {len(comps)}")

    # Urutan grid 4 atas + 4 bawah
    c_sorted = sorted(comps, key=lambda c: c.cy)
    row1 = sorted(c_sorted[:4], key=lambda c: c.cx)
    row2 = sorted(c_sorted[4:], key=lambda c: c.cx)
    ordered = row1 + row2

    names = [
        "fish-up-left.png",
        "fish-up.png",
        "fish-up-right.png",
        "fish-right.png",
        "fish-left.png",
        "fish-down-left.png",
        "fish-down.png",
        "fish-down-right.png",
    ]

    alpha_soft = np.clip((chroma - 2) * 20, 0, 255).astype(np.uint8)
    pad = 20
    crops = []
    for c in ordered:
        x1 = max(0, c.min_x - pad)
        y1 = max(0, c.min_y - pad)
        x2 = min(w - 1, c.max_x + pad)
        y2 = min(h - 1, c.max_y + pad)
        crop_rgb = rgb[y1 : y2 + 1, x1 : x2 + 1]
        crop_alpha = alpha_soft[y1 : y2 + 1, x1 : x2 + 1].copy()
        solid = np.zeros_like(crop_alpha, dtype=np.uint8)
        for py, px in c.pixels:
            ly = py - y1
            lx = px - x1
            if 0 <= ly < solid.shape[0] and 0 <= lx < solid.shape[1]:
                solid[ly, lx] = 255
        crop_alpha = np.maximum(crop_alpha, solid)
        crops.append(Image.fromarray(np.dstack([crop_rgb, crop_alpha]), "RGBA"))

    max_w = max(im.width for im in crops)
    max_h = max(im.height for im in crops)
    outputs = []
    for name, im in zip(names, crops):
        canvas = Image.new("RGBA", (max_w, max_h), (0, 0, 0, 0))
        ox = (max_w - im.width) // 2
        oy = (max_h - im.height) // 2
        canvas.paste(im, (ox, oy), im)
        p = out_dir / name
        canvas.save(p)
        outputs.append(p)

    preview = Image.new("RGBA", (max_w * 4, (max_h + 24) * 2), (22, 26, 32, 255))
    draw = ImageDraw.Draw(preview)
    labels = ["up-left", "up", "up-right", "right", "left", "down-left", "down", "down-right"]
    for i, p in enumerate(outputs):
        sp = Image.open(p).convert("RGBA")
        col = i % 4
        row = i // 4
        x = col * max_w
        y = row * (max_h + 24)
        preview.alpha_composite(sp, (x, y))
        draw.text((x + 8, y + max_h + 4), labels[i], fill=(235, 240, 245, 255))
    preview_path = out_dir / "fish-contact-sheet.png"
    preview.save(preview_path)

    print(f"SOURCE: {src}")
    print("OUTPUTS:")
    for p in outputs:
        print(f"- {p}")
    print(f"PREVIEW: {preview_path}")
    print(
        "METHOD: chroma-based alpha mask removes checkerboard, connected-components detects 8 whales, padded crop prevents fin/tail clipping, centered unified RGBA canvases."
    )


if __name__ == "__main__":
    main()
