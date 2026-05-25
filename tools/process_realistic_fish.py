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
    visited = np.zeros((h, w), dtype=np.uint8)
    result: list[Component] = []
    for y in range(h):
        for x in range(w):
            if not mask[y, x] or visited[y, x]:
                continue
            q = deque([(y, x)])
            visited[y, x] = 1
            px = []
            min_x = max_x = x
            min_y = max_y = y
            while q:
                cy, cx = q.popleft()
                px.append((cy, cx))
                if cx < min_x:
                    min_x = cx
                if cx > max_x:
                    max_x = cx
                if cy < min_y:
                    min_y = cy
                if cy > max_y:
                    max_y = cy
                for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
                    if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not visited[ny, nx]:
                        visited[ny, nx] = 1
                        q.append((ny, nx))
            pixels = np.array(px, dtype=np.int32)
            result.append(
                Component(
                    area=pixels.shape[0],
                    min_x=min_x,
                    min_y=min_y,
                    max_x=max_x,
                    max_y=max_y,
                    pixels=pixels,
                )
            )
    return result


def build_alpha(rgb: np.ndarray) -> np.ndarray:
    # Checkerboard punya channel hampir sama; ikan punya chroma kuat.
    max_ch = rgb.max(axis=2).astype(np.int16)
    min_ch = rgb.min(axis=2).astype(np.int16)
    chroma = max_ch - min_ch
    # Soft alpha dari chroma agar tepian ikan tetap halus.
    alpha_soft = np.clip((chroma - 3) * 18, 0, 255).astype(np.uint8)
    return alpha_soft


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    src = root / "assets" / "ikan-muzair" / "ChatGPT Image 20 Mei 2026, 08.27.58.png"
    out_dir = root / "assets" / "fish" / "realistic"
    out_dir.mkdir(parents=True, exist_ok=True)

    img = Image.open(src).convert("RGB")
    rgb = np.array(img)
    h, w, _ = rgb.shape

    max_ch = rgb.max(axis=2).astype(np.int16)
    min_ch = rgb.min(axis=2).astype(np.int16)
    chroma = max_ch - min_ch

    # Mask awal foreground dari saturasi/chroma.
    mask = chroma > 26
    comps = connected_components(mask)
    comps = sorted(comps, key=lambda c: c.area, reverse=True)
    top8 = comps[:8]
    if len(top8) != 8:
        raise RuntimeError(f"Expected 8 fish objects, found {len(top8)}")

    # Urutkan 2 baris x 4 kolom.
    top8_sorted = sorted(top8, key=lambda c: c.cy)
    row1 = sorted(top8_sorted[:4], key=lambda c: c.cx)
    row2 = sorted(top8_sorted[4:], key=lambda c: c.cx)
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

    alpha_soft = build_alpha(rgb)
    pad = 14
    crops = []
    for comp in ordered:
        x1 = max(0, comp.min_x - pad)
        y1 = max(0, comp.min_y - pad)
        x2 = min(w - 1, comp.max_x + pad)
        y2 = min(h - 1, comp.max_y + pad)

        crop_rgb = rgb[y1 : y2 + 1, x1 : x2 + 1]
        crop_alpha = alpha_soft[y1 : y2 + 1, x1 : x2 + 1].copy()

        # Jaga agar tubuh ikan tidak berlubang: isi area komponen utama solid.
        local_mask = np.zeros_like(crop_alpha, dtype=np.uint8)
        for py, px in comp.pixels:
            ly = py - y1
            lx = px - x1
            if 0 <= ly < local_mask.shape[0] and 0 <= lx < local_mask.shape[1]:
                local_mask[ly, lx] = 255
        crop_alpha = np.maximum(crop_alpha, local_mask)

        rgba = np.dstack([crop_rgb, crop_alpha])
        crops.append(Image.fromarray(rgba, mode="RGBA"))

    max_w = max(im.width for im in crops)
    max_h = max(im.height for im in crops)

    output_paths: list[Path] = []
    for name, fish_img in zip(names, crops):
        canvas = Image.new("RGBA", (max_w, max_h), (0, 0, 0, 0))
        ox = (max_w - fish_img.width) // 2
        oy = (max_h - fish_img.height) // 2
        canvas.paste(fish_img, (ox, oy), fish_img)
        out_path = out_dir / name
        canvas.save(out_path)
        output_paths.append(out_path)

    # Preview contact sheet 4x2.
    cell_w, cell_h = max_w, max_h + 24
    preview = Image.new("RGBA", (cell_w * 4, cell_h * 2), (22, 26, 30, 255))
    draw = ImageDraw.Draw(preview)
    labels = [
        "up-left",
        "up",
        "up-right",
        "right",
        "left",
        "down-left",
        "down",
        "down-right",
    ]
    for i, out_path in enumerate(output_paths):
        sprite = Image.open(out_path).convert("RGBA")
        col = i % 4
        row = i // 4
        x = col * cell_w
        y = row * cell_h
        preview.alpha_composite(sprite, (x + (cell_w - max_w) // 2, y))
        draw.text((x + 8, y + max_h + 4), labels[i], fill=(230, 235, 240, 255))

    preview_path = out_dir / "fish-contact-sheet.png"
    preview.save(preview_path)

    print(f"SOURCE: {src}")
    print("OUTPUTS:")
    for p in output_paths:
        print(f"- {p}")
    print(f"PREVIEW: {preview_path}")
    print("METHOD: foreground mask via chroma threshold + connected-components top-8 + padded crop + centered unified canvas + RGBA alpha from chroma.")


if __name__ == "__main__":
    main()
