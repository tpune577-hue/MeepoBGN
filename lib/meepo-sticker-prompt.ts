/** Default style suffix appended to every Imagen prompt (UI style config is hidden). */
export const DEFAULT_STYLE_PROMPT = "";

export const VISION_PROMPT = (stylePrompt: string) => `
You are an anime art director creating chibi Meepo head stickers.

Analyze the FACE in this photo and extract ONLY these details:
- Hair: exact color name (e.g. "dark brown", "platinum blonde"), length (short/medium/long), style (wavy/straight/curly/spiky, bangs or no bangs)
- Eyes: exact color, shape (almond/round/hooded), expression quality in the eyes (bright/tired/sharp/gentle/slight droop)
- Skin: tone in 1-2 words (e.g. "warm beige", "deep brown", "fair porcelain")
- Gender appearance: male/female/androgynous
- 1-2 most distinctive features only (glasses, beard stubble, freckles, dimples, mustache — omit entirely if none)

Then write an image generation prompt for a CHIBI HEAD STICKER — head only, no body.

Use this exact prompt structure (fill in brackets from the photo; skip the distinctive-features clause if none):
chibi anime head sticker of [gender] with [hair color] [hair style] hair, [eye color] large expressive eyes with [eye expression quality], [skin tone] skin, [distinctive features if any], round oversized chibi head, thick black outline, pure white background, die-cut sticker shape, flat 2D pastel illustration, no body head only, centered, kawaii cute style, clean line art, high quality print-ready sticker art${stylePrompt ? `, ${stylePrompt}` : ""}

Good output example:
chibi anime head sticker of male with short wavy dark brown hair falling over forehead, large expressive brown eyes with slight droop, warm beige skin, round oversized chibi head, thick black outline, pure white background, die-cut sticker shape, flat 2D pastel illustration, no body head only, centered, kawaii cute style, clean line art, high quality print-ready sticker art

Return ONLY valid JSON (no markdown):
{
  "features": "1 sentence face description",
  "prompt": "the full image generation prompt as one line"
}
`.trim();
