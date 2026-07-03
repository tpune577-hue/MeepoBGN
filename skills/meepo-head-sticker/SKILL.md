---
name: meepo-head-sticker
description: Locked spec for generating BGN Meepo chibi HEAD stickers. A fixed BGN head reference (ears + face structure + art style) is locked; a Gemini image-edit model redraws the uploaded person onto that reference, then the result is cut out as a die-cut sticker. Used by app/api/generate to keep every output on-spec.
version: 4
applies_to: gemini-2.5-flash-image (image edit)
---

# Meepo Head Sticker — Locked Generation Spec (v4)

Single source of truth for generating Meepo chibi **head** stickers. The API reads
this file at request time and feeds it to the Gemini image-edit model. If anything
here conflicts with an inline prompt, **this file wins**.

## Core principle: lock the structure, redraw only the person

What must stay constant (the BGN look — ears, face structure, art style) is supplied
as a **fixed reference image**, not described from scratch each time. The model's only
job is to make that reference resemble the uploaded person.

```
[ fixed BGN head reference ]  +  [ uploaded photo ]  +  this spec
                         |
              gemini-2.5-flash-image (edit)
                         |
        BGN head that looks like the person (ears + style kept)
                         |
     clip to the real Template mask + draw the Template's own outline
                         |
                   final head sticker
```

The model is **never** asked to invent the head shape, ears, or art style — those are
locked by the reference. This is what stops the output from drifting off-template.

## Fixed assets (do not change without re-locking)
- `public/refs/bgn-head-ref.png` — the locked BGN head reference (rounded head, simple
  round ears on both sides, thin dark-brown outline, matte flat shading). Image 1 in
  the request. Used only to guide the model's *art style*; it is not the shape the
  final sticker is cut to (see below).
- `public/templates/human-mask.png` + `human-frame.png`, and `public/templates/
  animal-mask.png` + `animal-frame.png` — the **real, approved die-cut Templates** (one
  per ear variant), each a matched pair: `*-mask.png` is the filled alpha silhouette
  used to clip the generated head, `*-frame.png` is the exact outline artwork (with the
  physical stencil's registration notch tabs) drawn on top. These are also what the
  pre-upload crop preview (`MeepoHeadUpload`) uses, so preview and final output are the
  same shape. **This Template Size/shape is fixed to the physical die-cut stencil and
  must never be changed** — only what's drawn inside it may change.
- The uploaded user photo is image 2.

## Locked art style — BGN meeple (must match the reference family)

Every face MUST look like it belongs to the BGN meeple figure family
(`public/meeples/char*.png`): a soft collectible **vinyl toy / sticker** look, NOT a
glossy anime portrait.

- **Proportion**: big rounded head with a **high forehead**; hair fills the top and
  drapes down both sides; facial features are **small and grouped in the lower-center**.
- **Ears**: simple **round ears sticking out on both sides**, exactly like the
  reference — mandatory, never omitted.
- **Eyes**: **medium** calm eyes with **one tiny highlight**. Not huge/sparkly.
- **Brows/nose/mouth**: thin natural eyebrows, tiny simple nose, small soft mouth.
- **Skin**: smooth **matte** tone with soft pink cheek blush.
- **Hair**: simple flat matte shapes, 1–2 soft highlights only.
- **Line**: **thin, even, dark-brown** outline (not thick black).
- **Shading**: minimal soft flat cel shading; matte; muted warm palette.
- **Forbidden**: huge/sparkly anime eyes, glossy shine, thick black outline, heavy or
  realistic rendering, detailed skin texture, dramatic shadows, any body/shoulders.

## What the model must do (the edit instruction)

ONLY the text between the two markers below is sent verbatim to the image model.
Keep it focused — do NOT let the rest of this document (frontmatter, diagrams, the
die-cut/code steps) leak into the model prompt, or the output drifts.

<!-- MODEL_INSTRUCTION_START -->
You are drawing a single BGN meeple chibi character HEAD sticker.

IMAGE 1 is the LOCKED STYLE + STRUCTURE reference. Copy its look EXACTLY:
- big rounded head with a high forehead and simple round ears sticking out on BOTH sides (the ears are mandatory and must look like image 1's ears)
- thin, even, dark-brown outline (never thick black)
- minimal soft flat cel shading, matte finish, muted warm palette
- medium calm eyes with one tiny highlight, thin natural eyebrows, small simple nose, small soft mouth, soft pink cheek blush
- small neck at the bottom, plain solid pure-white background

IMAGE 2 is a real person. Redraw THAT person as the meeple head from image 1: match their hairstyle and hair color, eye color, skin tone, gender, and any clear distinctive features (glasses, beard/stubble, etc). Keep their identity recognizable but rendered fully in the image-1 style.

Output ONLY the head and a small neck, centered, facing forward, on a plain solid pure-white background. No body, no shoulders, no text, no frame, no drop shadow. Keep the ears clearly visible.
<!-- MODEL_INSTRUCTION_END -->

### Ear variant (appended to the instruction per request)
- **human**: keep the simple round human ears from the reference.
- **animal**: additionally add two cute rounded animal ears on top of the head, drawn
  in the same BGN line + shading style; keep the small round side ears too.

## Generation parameters (locked)
- Image-edit model: `gemini-2.5-flash-image`
- `responseModalities: ["IMAGE"]`
- Inputs order: this instruction text, then image 1 (reference), then image 2 (photo).

## Clip + die-cut step (enforced in code, do not skip)
1. Trim the plain white margin around the generated head (content bounding box).
2. Scale it to **fit inside** the real selected Template's mask box (`human-mask.png`
   or `animal-mask.png`, matching the `templateId` from the request), inset by the
   print safety margin (see below), then **clip** to that silhouette — this locks the
   head shape + size to the exact approved Template on every sticker while leaving a
   bleed gap to the cut edge.
3. Draw that same Template's own outline artwork (`human-frame.png` /
   `animal-frame.png`) on top, unscaled relative to the mask — this is the exact
   physical die-cut line (registration tabs included), not a synthesized border.
4. Export a transparent PNG, same pixel size as the Template's mask/frame pair
   (× `OUT_SCALE`) — no extra padding is added around it.

### Print safety margin (bleed) — locked
Printing and die-cutting are two separate physical steps and are never perfectly
aligned, so the artwork must never touch the cut line — if it does, mismatch during
production visibly clips the art. There must be a visible **gap of ~0.5 cm** (in the
final printed sticker) between the drawn head/hair and the outer die-cut edge, on
every side.

- Implemented as `SAFETY_MARGIN_RATIO = 0.08` (8% inset on each side) in
  `app/page.tsx`'s `compositeFixedTemplate`, expressed as a **percentage of the
  Template box** rather than an absolute unit — this way the gap scales automatically
  regardless of what physical size the sticker is printed at, tuned for the current
  ~4 cm print size. If the production print size changes, retune this ratio so the
  gap still measures ~0.5 cm on the physical sticker.
- The **Template Size/shape itself is never changed** — `human-mask.png` /
  `human-frame.png` and `animal-mask.png` / `animal-frame.png` stay at their existing
  pixel dimensions (fixed to the physical die-cut stencil). Only the artwork drawn
  *inside* that fixed box is scaled down and centered to create the gap.
