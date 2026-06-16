export type MeepoTemplateId = "human" | "animal";

export interface MeepoTemplate {
  id: MeepoTemplateId;
  label: string;
  description: string;
  /** Locked head-shape instruction for the image prompt */
  shapePrompt: string;
  /** SVG viewBox */
  viewBox: string;
  /** Outline + clip paths (same geometry) */
  outlinePath: string;
}

export const MEEPO_TEMPLATES: Record<MeepoTemplateId, MeepoTemplate> = {
  human: {
    id: "human",
    label: "หัวคน",
    description: "หูมนุษย์ยื่นข้าง",
    shapePrompt:
      "human chibi head shape, round oversized face, small rounded human ears sticking out on both sides at mid-height, no animal ears, no horns",
    viewBox: "0 0 100 100",
    outlinePath:
      "M50 8 C72 8 85 26 85 48 C91 48 93 60 84 62 C82 80 68 93 50 93 C32 93 18 80 16 62 C7 60 9 48 15 48 C15 26 28 8 50 8 Z",
  },
  animal: {
    id: "animal",
    label: "หัวสัตว์",
    description: "หูกลมใหญ่",
    shapePrompt:
      "cute kawaii animal head with two large round mouse/bear ears on the top corners of the head, round chibi face below the ears",
    viewBox: "0 0 100 100",
    outlinePath:
      "M4 28 a20 20 0 1 0 40 0 a20 20 0 1 0 -40 0 Z M56 28 a20 20 0 1 0 40 0 a20 20 0 1 0 -40 0 Z M16 58 a34 36 0 1 0 68 0 a34 36 0 1 0 -68 0 Z",
  },
};

export const DEFAULT_TEMPLATE: MeepoTemplateId = "human";

export function getTemplate(id: MeepoTemplateId): MeepoTemplate {
  return MEEPO_TEMPLATES[id];
}
