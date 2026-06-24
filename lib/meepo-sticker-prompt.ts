import fs from "node:fs";
import path from "node:path";
import { MeepoTemplateId } from "@/lib/meepo-templates";

/**
 * The Meepo head-sticker spec lives in skills/meepo-head-sticker/SKILL.md and is the
 * single source of truth for generation. We load it at request time and feed it to the
 * Gemini image-edit model so output never drifts off-template. Cached after first read.
 */
let skillCache: string | null = null;
export function loadSkill(): string {
  if (skillCache) return skillCache;
  const file = path.join(process.cwd(), "skills", "meepo-head-sticker", "SKILL.md");
  skillCache = fs.readFileSync(file, "utf8");
  return skillCache;
}

/** The locked BGN head reference image (image 1 in the edit request). */
let refCache: string | null = null;
export function loadHeadRef(): string {
  if (refCache) return refCache;
  const p = path.join(process.cwd(), "public", "refs", "bgn-head-ref.png");
  refCache = fs.readFileSync(p).toString("base64");
  return refCache;
}

const EAR_CLAUSE: Record<MeepoTemplateId, string> = {
  human: "Ear style: keep the simple round human ears from the reference on both sides.",
  animal:
    "Ear style: in addition to the small round side ears, add two cute rounded animal ears on top of the head, drawn in the same BGN line and flat-shading style.",
};

/** Build the full edit instruction: the locked spec + the chosen ear variant. */
export function buildEditInstruction(skill: string, templateId: MeepoTemplateId): string {
  return `${skill}

=== THIS REQUEST ===
${EAR_CLAUSE[templateId]}
Follow the locked spec above exactly. Image 1 is the fixed BGN head reference. Image 2
is the person to redraw. Output ONLY the head + small neck on a plain pure-white
background, ears clearly visible, no body, no text, no border.`;
}
