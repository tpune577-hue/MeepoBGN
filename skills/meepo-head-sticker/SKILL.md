---
name: meepo-head-sticker
description: Locked spec for generating BGN Meepo chibi HEAD stickers. The head template (shape + size) is FIXED and must never be redrawn by the model — the model only fills the interior face, which is then pasted into the fixed template. Used by the Gemini vision step in app/api/generate to keep every output on-spec.
version: 1
applies_to: gemini-2.5-flash (vision/prompt), imagen-4 (image)
---

# Meepo Head Sticker — Locked Generation Spec

This is the single source of truth for generating Meepo chibi **head** stickers.
The Gemini vision step reads this file at request time and must follow it exactly.
If anything below conflicts with an inline prompt, **this file wins**.

## Core principle: separate the FIXED template from the GENERATED content

A finished sticker = **fixed head template** (outline + silhouette, never changes)
+ **generated face content** (the only AI-variable part), pasted inside the template.

```
[ uploaded photo ]
        |
   Gemini vision  ──reads this spec──>  inner-face prompt (NO outline shape)
        |
     Imagen 4  ──>  flat chibi face art on plain white, at template aspect
        |
   composite (code) ──>  clip to FIXED mask  +  overlay FIXED frame outline
        |
   final sticker  (head shape + size identical every time)
```

The model is **never** allowed to draw the head outline/silhouette. The outline
always comes from the frozen `frame` asset, and the silhouette is enforced by the
frozen `mask` asset. This is what keeps the head from "drifting off-template."

## FIXED head templates (do not change these)

Assets live in `public/templates/`. They are the locked template — treat the
pixel dimensions and silhouette as immutable. Two head types only:

| id    | label (TH) | canvas px | aspect | silhouette |
|-------|-----------|-----------|--------|------------|
| human | หัวคน      | 281 × 218 | 1.289  | rounded dome |
| animal| หัวสัตว์   | 325 × 235 | 1.383  | bear-like head with ears |

Per type, two frozen layers:
- `<id>-mask.png` — opaque white silhouette (interior + outline) on transparent.
  Used to **clip** the generated face to the exact head shape.
- `<id>-frame.png` — black outline only, on transparent. **Overlaid on top** so the
  outline is pixel-identical on every sticker.

### human silhouette (locked)
Smooth wide semicircular dome top, gently flaring near-straight sides, two tiny
rounded ear nubs poking from the lower sides, flat bottom edge with two small
notch tabs near the bottom corners. No animal ears, no horns.

### animal silhouette (locked)
Wide rounded bear face; two large rounded ears rising from the top-left and
top-right corners (each with a small inward dip where it meets the head); two tiny
rounded ear nubs on the lower sides; flat bottom edge with two small notch tabs
near the bottom corners.

## What Gemini must produce

1. Analyze the FACE in the uploaded photo and extract ONLY:
   - **Hair**: exact color, length (short/medium/long), style (wavy/straight/curly/
     spiky; bangs or none)
   - **Eyes**: exact color, shape (almond/round/hooded), expression quality
     (bright/tired/sharp/gentle/slight droop)
   - **Skin**: tone in 1–2 words (e.g. "warm beige", "deep brown", "fair porcelain")
   - **Gender appearance**: male / female / androgynous
   - **1–2 most distinctive features only** (glasses, beard stubble, freckles,
     dimples, mustache). Omit the clause entirely if none.

2. Write ONE image-generation prompt for the **inner face content only**, following
   the locked structure below. It describes a chibi face that **fills** the head
   template — but it must **not** describe the outline, die-cut edge, ears, notch
   tabs, or background scenery, because those belong to the fixed template.

## Locked art style — BGN meeple (match the reference characters)

Every face MUST look like it belongs to the BGN meeple figure family
(`public/meeples/char*.png`): a soft collectible **vinyl toy / sticker** look, NOT
a glossy anime portrait. Lock these traits:

- **Proportion**: big rounded head with a **high forehead**; hair fills the top and
  drapes down both sides; the facial features are **small and grouped in the
  lower-center** of the head (face takes ~the lower 45%, not the whole head).
- **Eyes**: **medium** almond/rounded eyes, calm and simple, with **one tiny
  highlight**. NOT huge sparkly anime eyes, NOT glossy.
- **Brows/nose/mouth**: thin natural eyebrows, a tiny simple nose, a small soft
  mouth (gentle closed smile by default).
- **Skin**: smooth **matte** cream/beige, flat, with soft pink cheek blush.
- **Hair**: simple flat matte shapes, 1–2 soft highlights only.
- **Line**: **thin, even, dark-brown** outline (NOT thick heavy black).
- **Shading**: minimal soft flat cel shading; matte finish; muted, warm,
  slightly desaturated palette.
- **Forbidden style**: huge/sparkly anime eyes, glossy shine, thick black outline,
  heavy or realistic rendering, detailed skin texture, dramatic lighting/shadows,
  cluttered detail.

## Locked Imagen prompt structure (fill the brackets)

> BGN meeple chibi sticker, soft vinyl toy figure style, front view of a [gender]
> character head, [hair color] [hair style] hair as simple flat matte shapes with a
> few soft highlights covering the top of the head and draping down both sides to
> frame the face, big rounded head with a high forehead, facial features grouped in
> the lower-center, medium [eye shape] [eye color] eyes with [eye expression] and a
> tiny single highlight, thin natural eyebrows, small simple nose, small soft closed
> smile, [skin tone] smooth matte skin with soft pink cheek blush, [distinctive
> features if any], a small neck at the very bottom, thin even dark-brown outline,
> minimal soft flat cel shading, matte muted warm colors, clean simple cartoon,
> head and neck fill the frame, plain solid pure-white background, no text, no body
> no shoulders, NOT glossy, no huge anime eyes, no thick black outline

Hard rules for the generated content:
- **Background**: plain, solid, pure white only. No scenery, no gradient, no shadow
  bleeding to the edges (the mask clips edges; clean white = clean clip).
- **Framing**: the head + hair fill the frame — hair touches the top and both side
  edges, and a small neck reaches the bottom edge so the bottom corners are filled
  (this is what makes the content match the flat-bottom template silhouette). No
  large white margin, no tiny head floating in white.
- **Style**: must follow the "Locked art style — BGN meeple" section above. A glossy
  big-eyed anime portrait is WRONG.
- **Forbidden** in the generated content (these come from the fixed template, never
  from the model): die-cut sticker border, outline frame around the whole head,
  animal ears as silhouette, notch tabs, drop shadow, white sticker margin.
- Keep it to a single line, no markdown.

### Good output example
> BGN meeple chibi sticker, soft vinyl toy figure style, front view of a male
> character head, dark brown short wavy hair as simple flat matte shapes with a few
> soft highlights covering the top of the head and draping down both sides to frame
> the face, big rounded head with a high forehead, facial features grouped in the
> lower-center, medium almond brown eyes with a calm gentle look and a tiny single
> highlight, thin natural eyebrows, small simple nose, small soft closed smile, warm
> beige smooth matte skin with soft pink cheek blush, a small neck at the very
> bottom, thin even dark-brown outline, minimal soft flat cel shading, matte muted
> warm colors, clean simple cartoon, head and neck fill the frame, plain solid
> pure-white background, no text, no body no shoulders, NOT glossy, no huge anime
> eyes, no thick black outline

## Generation parameters (locked)
- Vision model: `gemini-2.5-flash`
- Image model: `imagen-4.0-fast-generate-001` (default)
- `numberOfImages: 1`, `outputMimeType: "image/png"`
- `aspectRatio: "4:3"` — closest supported ratio to both templates; the composite
  step scales to *cover* the exact template box, so minor ratio mismatch is cropped,
  never stretched.

## Composite step (enforced in code, do not skip)
1. Load the chosen template's `mask` and `frame` at their locked px size.
2. **Trim** the plain white/transparent margin off the generated image (content bbox).
3. Scale the trimmed head to **cover** the template box, **bottom-anchored** (crop
   overflow from the hair, keep the chin).
4. Paint a clean **white base fill** inside the silhouette first, then draw the head,
   so any uncovered area reads as an intentional clean white die-cut interior (never
   jagged/grey edges).
5. Clip to `mask` (everything outside the silhouette → transparent).
6. Draw `frame` on top (the locked outline).
7. Export PNG. Result head shape + size is byte-for-byte consistent every run.

## Required JSON contract from Gemini
Return ONLY valid JSON (no markdown fences):
```json
{
  "features": "1 sentence face description",
  "prompt": "the single-line inner-face image prompt"
}
```
