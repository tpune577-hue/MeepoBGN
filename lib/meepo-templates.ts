export type MeepoTemplateId = "human" | "animal";

export interface MeepoTemplate {
  id: MeepoTemplateId;
  label: string;
  description: string;
  /** Locked head-shape instruction for the image prompt */
  shapePrompt: string;
  /** width / height of the silhouette artwork */
  aspect: number;
  /** Alpha mask used to clip the uploaded photo to the head silhouette */
  maskSrc: string;
  /** Black outline artwork drawn on top of the photo */
  frameSrc: string;
}

export const MEEPO_TEMPLATES: Record<MeepoTemplateId, MeepoTemplate> = {
  human: {
    id: "human",
    label: "หัวคน",
    description: "ทรงโดมมน",
    shapePrompt:
      "head silhouette must exactly match a rounded dome shape: a smooth wide semicircular top, gently flaring straight-ish sides, two tiny rounded ear nubs poking out at the lower sides, and a flat bottom edge with two small notch tabs near the bottom corners; no animal ears, no horns",
    aspect: 281 / 218,
    maskSrc: "/templates/human-mask.png",
    frameSrc: "/templates/human-frame.png",
  },
  animal: {
    id: "animal",
    label: "หัวสัตว์",
    description: "หูกลมบนหัว",
    shapePrompt:
      "head silhouette must exactly match a rounded bear-like head: a wide rounded face with two large rounded ears rising from the top-left and top-right corners (each ear with a small inward dip where it meets the head), two tiny rounded ear nubs on the lower sides, and a flat bottom edge with two small notch tabs near the bottom corners",
    aspect: 325 / 235,
    maskSrc: "/templates/animal-mask.png",
    frameSrc: "/templates/animal-frame.png",
  },
};

export const DEFAULT_TEMPLATE: MeepoTemplateId = "human";

export function getTemplate(id: MeepoTemplateId): MeepoTemplate {
  return MEEPO_TEMPLATES[id];
}
