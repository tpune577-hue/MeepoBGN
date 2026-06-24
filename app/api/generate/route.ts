import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_STYLE_PROMPT, LOCKED_ASPECT_RATIO, VISION_PROMPT, loadSkill } from "@/lib/meepo-sticker-prompt";
import { DEFAULT_TEMPLATE, getTemplate, MeepoTemplateId } from "@/lib/meepo-templates";

function getGenai() {
  const apiKey = process.env.GOOGLE_AI_API_KEY?.trim();
  if (!apiKey || apiKey === "your_google_ai_api_key_here") {
    throw new Error("GOOGLE_AI_API_KEY is not configured. Add it in .env.local (local) or Vercel Environment Variables (production).");
  }
  return new GoogleGenAI({ apiKey });
}

function parseApiError(err: unknown): string {
  if (!(err instanceof Error)) return "Unknown error";
  try {
    const parsed = JSON.parse(err.message) as { error?: { message?: string } };
    if (parsed.error?.message?.includes("API key not valid")) {
      return "API key ไม่ถูกต้อง — สร้าง key ใหม่ที่ https://aistudio.google.com/apikey แล้วอัปเดตใน Vercel Environment Variables";
    }
    if (parsed.error?.message) return parsed.error.message;
  } catch {
    // not JSON
  }
  if (err.message.includes("API key not valid")) {
    return "API key ไม่ถูกต้อง — สร้าง key ใหม่ที่ https://aistudio.google.com/apikey แล้วอัปเดตใน Vercel Environment Variables";
  }
  return err.message;
}

export async function POST(req: NextRequest) {
  try {
    const genai = getGenai();
    const { imageBase64, imageMimeType, stylePrompt, templateId } = await req.json();

    if (!imageBase64 || !imageMimeType) {
      return NextResponse.json({ error: "Missing image data" }, { status: 400 });
    }

    const model = "imagen-4.0-fast-generate-001";
    const style = stylePrompt ?? DEFAULT_STYLE_PROMPT;
    const resolvedTemplateId =
      templateId === "animal" || templateId === "human" ? templateId : DEFAULT_TEMPLATE;
    const template = getTemplate(resolvedTemplateId);
    const skill = loadSkill();

    const visionRes = await genai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [
          { inlineData: { data: imageBase64, mimeType: imageMimeType } },
          { text: VISION_PROMPT(skill, style, template.shapePrompt) },
        ],
      }],
    });

    const raw = visionRes.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Vision model parse error" }, { status: 500 });
    }

    const { features, prompt: imgPrompt } = JSON.parse(jsonMatch[0]) as {
      features: string;
      prompt: string;
    };

    if (!imgPrompt) {
      return NextResponse.json({ error: "Vision model returned no prompt" }, { status: 500 });
    }

    const imgRes = await genai.models.generateImages({
      model,
      prompt: imgPrompt,
      config: { numberOfImages: 1, aspectRatio: LOCKED_ASPECT_RATIO, outputMimeType: "image/png" },
    });

    const generatedImg = imgRes.generatedImages?.[0];
    if (!generatedImg?.image?.imageBytes) {
      return NextResponse.json({ error: "Image generation returned nothing" }, { status: 500 });
    }

    // Return only the raw GENERATED inner-face art. The fixed head template
    // (mask + frame) is composited on top of this client-side, so the head
    // shape and size stay identical on every sticker.
    return NextResponse.json({
      features,
      imageBase64: generatedImg.image.imageBytes,
      mimeType: "image/png",
      prompt: imgPrompt,
      templateId: resolvedTemplateId,
    });

  } catch (err: unknown) {
    const msg = parseApiError(err);
    console.error("[/api/generate]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
