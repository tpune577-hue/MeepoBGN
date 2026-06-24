---
name: meepo-head-sticker
description: Locked spec for generating BGN Meepo chibi HEAD stickers. A fixed BGN head reference (ears + face structure + art style) is locked; a Gemini image-edit model redraws the uploaded person onto that reference, then the result is cut out as a die-cut sticker. Used by app/api/generate to keep every output on-spec.
version: 2
applies_to: gemini-2.5-flash-image (image edit)
---

# Meepo Head Sticker — Locked Generation Spec (v2)

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
            die-cut (remove white bg + white sticker border)
                         |
                   final head sticker
```

The model is **never** asked to invent the head shape, ears, or art style — those are
locked by the reference. This is what stops the output from drifting off-template.

## Fixed assets (do not change without re-locking)
- `public/refs/bgn-head-ref.png` — the locked BGN head reference (rounded head, simple
  round ears on both sides, thin dark-brown outline, matte flat shading). Image 1 in
  the request.
- `public/templates/bgn-head-mask.png` — the locked head+ears **silhouette** (derived
  from the reference). Every output is clipped to this exact shape + size so the sticker
  always fits the frame. Includes the ears.
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
2. Scale it to **cover** the fixed `bgn-head-mask.png` box and **clip** to that
   silhouette — this locks the head shape + size (with ears) on every sticker.
3. Add a clean **white die-cut border** + a thin dark outline by dilating the mask
   silhouette behind the head.
4. Export a transparent PNG.
