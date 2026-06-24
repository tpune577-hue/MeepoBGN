import { NextRequest, NextResponse } from "next/server";
import { buildEditInstruction, loadHeadRef, loadSkill } from "@/lib/meepo-sticker-prompt";
import { DEFAULT_TEMPLATE, MeepoTemplateId } from "@/lib/meepo-templates";
import { getGenai, parseApiError } from "@/lib/genai";

/**
 * Meepo head sticker generation (v2 flow).
 * A fixed BGN head reference (ears + face structure + art style) is handed to a Gemini
 * image-edit model together with the user's photo. The model redraws the person onto
 * that locked reference, so the ears and BGN style never drift. The client then cuts
 * the result out as a die-cut sticker. The full spec lives in
 * skills/meepo-head-sticker/SKILL.md and is fed to the model on every request.
 */
const EDIT_MODEL = "gemini-2.5-flash-image";

export async function POST(req: NextRequest) {
  try {
    const genai = getGenai();
    const { imageBase64, imageMimeType, templateId } = await req.json();

    if (!imageBase64 || !imageMimeType) {
      return NextResponse.json({ error: "Missing image data" }, { status: 400 });
    }

    const resolvedTemplateId: MeepoTemplateId =
      templateId === "animal" || templateId === "human" ? templateId : DEFAULT_TEMPLATE;

    const skill = loadSkill();
    const ref = loadHeadRef();
    const instruction = buildEditInstruction(skill, resolvedTemplateId);

    const res = await genai.models.generateContent({
      model: EDIT_MODEL,
      contents: [{
        role: "user",
        parts: [
          { text: instruction },
          { inlineData: { data: ref, mimeType: "image/png" } },
          { inlineData: { data: imageBase64, mimeType: imageMimeType } },
        ],
      }],
      config: { responseModalities: ["IMAGE"] },
    });

    const parts = res.candidates?.[0]?.content?.parts ?? [];
    const imgPart = parts.find((p) => p.inlineData?.data);
    if (!imgPart?.inlineData?.data) {
      return NextResponse.json({ error: "Image edit model returned no image" }, { status: 500 });
    }

    return NextResponse.json({
      imageBase64: imgPart.inlineData.data,
      mimeType: imgPart.inlineData.mimeType ?? "image/png",
      templateId: resolvedTemplateId,
    });
  } catch (err: unknown) {
    const msg = parseApiError(err);
    console.error("[/api/generate]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
