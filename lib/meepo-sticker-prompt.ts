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

/**
 * Extract ONLY the focused model instruction from SKILL.md (between the markers).
 * Sending the whole markdown spec (frontmatter, diagrams, the die-cut/code steps)
 * confuses the image model and makes the output drift off-style. Falls back to the
 * full text only if the markers are missing.
 */
function extractModelInstruction(skill: string): string {
  const m = skill.match(/<!--\s*MODEL_INSTRUCTION_START\s*-->([\s\S]*?)<!--\s*MODEL_INSTRUCTION_END\s*-->/);
  return (m ? m[1] : skill).trim();
}

/** Build the edit instruction sent to Gemini: focused spec + the chosen ear variant. */
export function buildEditInstruction(skill: string, templateId: MeepoTemplateId): string {
  return `${extractModelInstruction(skill)}\n\n${EAR_CLAUSE[templateId]}`;
}
