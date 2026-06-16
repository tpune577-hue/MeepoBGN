import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_STYLE_PROMPT, VISION_PROMPT } from "@/lib/meepo-sticker-prompt";

const genai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, imageMimeType, stylePrompt } = await req.json();

    if (!imageBase64 || !imageMimeType) {
      return NextResponse.json({ error: "Missing image data" }, { status: 400 });
    }

    const model = "imagen-4.0-fast-generate-001";
    const style = stylePrompt ?? DEFAULT_STYLE_PROMPT;

    const visionRes = await genai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [
          { inlineData: { data: imageBase64, mimeType: imageMimeType } },
          { text: VISION_PROMPT(style) },
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
      config: { numberOfImages: 1, aspectRatio: "1:1", outputMimeType: "image/png" },
    });

    const generatedImg = imgRes.generatedImages?.[0];
    if (!generatedImg?.image?.imageBytes) {
      return NextResponse.json({ error: "Image generation returned nothing" }, { status: 500 });
    }

    return NextResponse.json({
      features,
      imageBase64: generatedImg.image.imageBytes,
      mimeType: "image/png",
      prompt: imgPrompt,
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/generate]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
