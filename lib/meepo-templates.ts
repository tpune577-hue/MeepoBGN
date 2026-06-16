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
    description: "หูมนุษย์กลมๆ",
    shapePrompt:
      "human chibi head shape with small rounded human ears on both sides, no animal ears, no horns, round oversized face",
    viewBox: "0 0 100 120",
    outlinePath:
      "M50 14 C34 14 22 28 22 44 C22 52 24 58 28 63 C24 67 20 74 20 82 C20 90 26 96 34 96 H38 V104 C38 110 43 114 50 114 C57 114 62 110 62 104 V96 H66 C74 96 80 90 80 82 C80 74 76 67 72 63 C76 58 78 52 78 44 C78 28 66 14 50 14 Z",
  },
  animal: {
    id: "animal",
    label: "หัวสัตว์",
    description: "มีหูสัตว์",
    shapePrompt:
      "cute kawaii head with large fluffy animal ears (cat/bunny style) rising prominently from the top of the head, round chibi face below the ears",
    viewBox: "0 0 100 120",
    outlinePath:
      "M32 38 L22 10 L40 34 Z M68 38 L78 10 L60 34 Z M50 28 C36 28 26 40 26 54 C26 62 28 68 32 72 C28 76 24 82 24 90 C24 98 30 104 38 104 H42 V110 C42 115 46 118 50 118 C54 118 58 115 58 110 V104 H62 C70 104 76 98 76 90 C76 82 72 76 68 72 C72 68 74 62 74 54 C74 40 64 28 50 28 Z",
  },
};

export const DEFAULT_TEMPLATE: MeepoTemplateId = "human";

export function getTemplate(id: MeepoTemplateId): MeepoTemplate {
  return MEEPO_TEMPLATES[id];
}
