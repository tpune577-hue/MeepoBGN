"""
Silhouette alignment checker v5
Templates = transparent PNG, dark outline, transparent interior.
Fix: flood-fill from corner through transparent area to find OUTSIDE.
     Remaining transparent = INSIDE the shape.
"""

from PIL import Image, ImageDraw, ImageFilter
import numpy as np
from collections import deque
import os

UPLOADS = "/root/.claude/uploads/e9bd8b6e-85a2-5b33-aabb-7d91bcd646d5"
OUT_DIR = "/home/user/MeepoBGN/scripts/silhouette_check"
os.makedirs(OUT_DIR, exist_ok=True)

TEMPLATE_A = os.path.join(UPLOADS, "f38f6739-ChamMeeple_A01.png")
TEMPLATE_B = os.path.join(UPLOADS, "505100eb-ChamMeeple_B01.png")

CHARACTERS = [
    ("orange_girl",  os.path.join(UPLOADS, "639b01d0-1000267909.png"),  "A"),
    ("black_shirt",  os.path.join(UPLOADS, "96d3ddf3-1000267911.png"),  "B"),
    ("pink_pants",   os.path.join(UPLOADS, "5205f960-1000267912.png"),  "B"),
    ("bgn_squad",    os.path.join(UPLOADS, "b8f2159b-1000267910.png"),  "B"),
]

COMP = 500
PAD  = 15


# ── template fill ─────────────────────────────────────────────────────────────

def template_to_filled_mask(img: Image.Image) -> np.ndarray:
    """
    Template is a transparent PNG:
      - alpha=255  → outline (dark border)
      - alpha=0    → either background (outside) OR interior (inside)
    BFS from all four edges through transparent pixels to mark OUTSIDE.
    Everything transparent that is NOT reachable from edges = INSIDE.
    """
    rgba  = np.array(img.convert("RGBA"), dtype=np.uint8)
    alpha = rgba[:, :, 3]
    H, W  = alpha.shape

    outline     = (alpha > 30)          # visible pixels = outline
    transparent = ~outline              # both interior and exterior

    # BFS flood-fill from all border pixels that are transparent
    outside = np.zeros((H, W), dtype=bool)
    q = deque()

    def seed(r, c):
        if transparent[r, c] and not outside[r, c]:
            outside[r, c] = True
            q.append((r, c))

    for c in range(W):
        seed(0, c); seed(H-1, c)
    for r in range(H):
        seed(r, 0); seed(r, W-1)

    while q:
        r, c = q.popleft()
        for dr, dc in ((-1,0),(1,0),(0,-1),(0,1)):
            nr, nc = r+dr, c+dc
            if 0 <= nr < H and 0 <= nc < W and not outside[nr,nc] and transparent[nr,nc]:
                outside[nr,nc] = True
                q.append((nr, nc))

    inside = transparent & ~outside
    return (outline | inside).astype(np.uint8)


def char_to_mask(img: Image.Image, white_thresh=230, alpha_thresh=30) -> np.ndarray:
    """Visible non-white pixels in character artwork."""
    rgba = np.array(img.convert("RGBA"), dtype=np.uint8)
    r, g, b, a = rgba[...,0], rgba[...,1], rgba[...,2], rgba[...,3]
    white       = (r > white_thresh) & (g > white_thresh) & (b > white_thresh)
    transparent = a < alpha_thresh
    return (~white & ~transparent).astype(np.uint8)


def tight_bbox(mask: np.ndarray):
    rows = np.any(mask, axis=1)
    cols = np.any(mask, axis=0)
    y0, y1 = int(np.where(rows)[0][0]), int(np.where(rows)[0][-1])
    x0, x1 = int(np.where(cols)[0][0]), int(np.where(cols)[0][-1])
    return x0, y0, x1+1, y1+1


def largest_component_bbox(mask: np.ndarray):
    """Return bounding box of the largest connected component (ignores small labels)."""
    from scipy import ndimage as ndi
    labeled, num = ndi.label(mask)
    if num == 0:
        return tight_bbox(mask)
    sizes = ndi.sum(mask, labeled, range(1, num+1))
    largest = int(np.argmax(sizes)) + 1
    component = (labeled == largest).astype(np.uint8)
    return tight_bbox(component)


def extract_head(char_mask: np.ndarray, head_frac: float = 0.38) -> np.ndarray:
    rows = np.any(char_mask, axis=1)
    y0   = int(np.where(rows)[0][0])
    y1   = int(np.where(rows)[0][-1])
    cut  = int(y0 + (y1 - y0) * head_frac)
    m    = char_mask.copy()
    m[cut:, :] = 0
    return m


def fit_bottom_aligned(mask: np.ndarray, size: int, pad: int, use_largest=False) -> np.ndarray:
    """Crop tight (largest component), scale to fit (size-2*pad), bottom-aligned, centered X."""
    x0, y0, x1, y1 = largest_component_bbox(mask) if use_largest else tight_bbox(mask)
    crop = mask[y0:y1, x0:x1].astype(np.uint8)
    ch, cw = crop.shape
    scale  = (size - 2*pad) / max(ch, cw)
    new_h, new_w = int(ch * scale), int(cw * scale)
    crop_img = Image.fromarray(crop*255, "L").resize((new_w, new_h), Image.NEAREST)
    canvas   = np.zeros((size, size), dtype=np.uint8)
    y_start  = max(0, size - pad - new_h)
    x_start  = (size - new_w) // 2
    canvas[y_start:y_start+new_h, x_start:x_start+new_w] = np.array(crop_img)
    return (canvas > 127).astype(np.uint8)


# ── metrics ───────────────────────────────────────────────────────────────────

def iou_score(a, b):
    inter, union = int((a & b).sum()), int((a | b).sum())
    return (inter/union*100) if union else 0.0

def overflow_pct(char, tmpl):
    px = int(char.sum())
    return (int((char & ~tmpl).sum())/px*100) if px else 0.0

def underfill_pct(char, tmpl):
    px = int(tmpl.sum())
    return (int((~char & tmpl).sum())/px*100) if px else 0.0


# ── overlay panel ─────────────────────────────────────────────────────────────

def make_panel(char_img, tmpl_img, char_a, tmpl_a, name, tmpl_label,
               iou_v, ovf_v, udf_v) -> Image.Image:
    S = COMP
    panel = Image.new("RGB", (S*3+40, S+110), (230,230,230))
    draw  = ImageDraw.Draw(panel)

    # Composite on white before pasting (handles transparent PNGs)
    def on_white(img):
        bg = Image.new("RGBA", img.size, (255,255,255,255))
        bg.paste(img, mask=img.split()[3] if img.mode=="RGBA" else None)
        return bg.convert("RGB").resize((S,S), Image.LANCZOS)

    panel.paste(on_white(char_img), (0, 60))
    panel.paste(on_white(tmpl_img), (S+20, 60))

    ov = np.zeros((S, S, 4), dtype=np.uint8)
    ov[ char_a &  tmpl_a, :] = [ 50, 200,  50, 200]   # green  = inside
    ov[ char_a & ~tmpl_a, :] = [220,  40,  40, 220]   # red    = overflow
    ov[~char_a &  tmpl_a, :] = [ 80, 140, 220, 130]   # blue   = underfill

    border = np.array(Image.fromarray((tmpl_a*255).astype(np.uint8),"L").filter(ImageFilter.FIND_EDGES))
    ov[border > 50, :] = [0, 60, 255, 255]

    base = Image.new("RGBA", (S,S), (255,255,255,255))
    ov_img = Image.fromarray(ov, "RGBA")
    base.paste(ov_img, mask=ov_img)
    panel.paste(base.convert("RGB"), (S*2+40, 60))

    grade = "✅ ดี" if ovf_v < 10 else ("⚠️ พอได้" if ovf_v < 25 else "❌ ล้นมาก")
    draw.text((6,   14), f"Character: {name}",              fill=(0,0,0))
    draw.text((S+26,14), f"Template {tmpl_label}",          fill=(0,0,180))
    draw.text((S*2+46,14),
              f"IoU={iou_v:.1f}%  Overflow(ล้น)={ovf_v:.1f}%  Underfill(ว่าง)={udf_v:.1f}%  {grade}",
              fill=(140,0,0))

    ly = S + 72
    for lx, col, lbl in [(0,(50,200,50),"ใน Template"), (120,(220,40,40),"ล้นออกนอก"), (235,(80,140,220),"Template ว่าง")]:
        draw.rectangle([lx,ly,lx+14,ly+14], fill=col)
        draw.text((lx+18, ly), lbl, fill=(30,30,30))
    return panel


# ── main ──────────────────────────────────────────────────────────────────────

templates = {}
for k, path in [("A", TEMPLATE_A), ("B", TEMPLATE_B)]:
    img  = Image.open(path).convert("RGBA")
    mask = template_to_filled_mask(img)
    templates[k] = (img, mask)
    pct  = mask.sum() / mask.size * 100
    Image.fromarray(mask*255,"L").save(os.path.join(OUT_DIR, f"_debug_template{k}_filled.png"))
    print(f"Template {k}: {pct:.1f}% filled")

print()
print(f"{'Name':15s} | Tmpl | {'IoU':>7} | {'Overflow':>9} | {'Underfill':>10} | Grade")
print("-"*72)

for name, path, tmpl_label in CHARACTERS:
    char_img  = Image.open(path).convert("RGBA")
    char_mask = char_to_mask(char_img)
    head_mask = extract_head(char_mask)
    Image.fromarray(head_mask*255,"L").save(os.path.join(OUT_DIR, f"_debug_{name}_head.png"))

    char_a  = fit_bottom_aligned(head_mask, COMP, PAD, use_largest=False)
    tmpl_img_raw, tmpl_raw = templates[tmpl_label]
    tmpl_a  = fit_bottom_aligned(tmpl_raw, COMP, PAD, use_largest=True)  # ignore "A"/"B" label

    iou_v = iou_score(char_a, tmpl_a)
    ovf_v = overflow_pct(char_a, tmpl_a)
    udf_v = underfill_pct(char_a, tmpl_a)
    grade = "✅ ดี" if ovf_v < 10 else ("⚠️ พอได้" if ovf_v < 25 else "❌ ล้นมาก")

    panel = make_panel(char_img, tmpl_img_raw, char_a, tmpl_a,
                       name, tmpl_label, iou_v, ovf_v, udf_v)
    panel.save(os.path.join(OUT_DIR, f"{name}_vs_template{tmpl_label}.png"))
    print(f"{name:15s} | {tmpl_label:4s} | {iou_v:6.1f}% | {ovf_v:8.1f}% | {udf_v:9.1f}% | {grade}")

print(f"\nภาพอยู่ที่: {OUT_DIR}/")
