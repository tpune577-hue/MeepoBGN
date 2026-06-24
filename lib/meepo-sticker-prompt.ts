import fs from "node:fs";
import path from "node:path";

/** Default style suffix appended to every Imagen prompt (UI style config is hidden). */
export const DEFAULT_STYLE_PROMPT = "";

/** Locked Imagen aspect ratio — closest supported ratio to both head templates. */
export const LOCKED_ASPECT_RATIO = "4:3";

/**
 * The Meepo head-sticker spec lives in skills/meepo-head-sticker/SKILL.md and is
 * the single source of truth for generation. We load it at request time and feed
 * it to Gemini so output never drifts off-template. Cached after first read.
 */
let skillCache: string | null = null;
export function loadSkill(): string {
  if (skillCache) return skillCache;
  const file = path.join(process.cwd(), "skills", "meepo-head-sticker", "SKILL.md");
  skillCache = fs.readFileSync(file, "utf8");
  return skillCache;
}

export const VISION_PROMPT = (
  skill: string,
  stylePrompt: string,
  headSilhouettePrompt: string,
) => `
You are the Meepo head-sticker art director. Follow the locked spec below EXACTLY.
The spec wins over any habit or assumption. The head outline/silhouette is FIXED by
a template asset and is added later by code — so you must describe ONLY the inner
face content that fills the template, never the outline, ears, die-cut edge, notch
tabs, or background scenery.

===== LOCKED SPEC (skills/meepo-head-sticker/SKILL.md) =====
${skill}
===== END SPEC =====

The user picked this fixed head template. Make the face FILL this silhouette so it
covers the shape after clipping (but do NOT draw the outline yourself):
${headSilhouettePrompt}

Now analyze the FACE in the attached photo and produce the JSON contract defined in
the spec: a 1-sentence "features" description and a single-line inner-face "prompt"
built from the locked Imagen prompt structure.${stylePrompt ? `\nAppend this style to the prompt: ${stylePrompt}` : ""}

Return ONLY valid JSON, no markdown fences.
`.trim();
