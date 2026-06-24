import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { getGenai, parseApiError } from "@/lib/genai";

/**
 * PROTOTYPE — Approach A.
 * Instead of letting a text-to-image model redraw the whole head (ears drift, off
 * style), we hand a Gemini image-edit model a LOCKED BGN head reference (ears +
 * face structure + art style) plus the user's photo, and ask it to redraw THIS
 * person as that meeple head — keeping the ears and BGN style fixed.
 */
const EDIT_MODEL = "gemini-2.5-flash-image";

let refCache: string | null = null;
function loadHeadRef(): string {
  if (refCache) return refCache;
  const p = path.join(process.cwd(), "public", "refs", "bgn-head-ref.png");
  refCache = fs.readFileSync(p).toString("base64");
  return refCache;
}

const EDIT_INSTRUCTION = `
You are drawing a single BGN meeple chibi character HEAD sticker.

IMAGE 1 is the LOCKED STYLE + STRUCTURE reference. Copy its look EXACTLY:
- big rounded head with a high forehead and simple SIMPLE ROUND EARS sticking out
  on BOTH sides (the ears are mandatory and must look like image 1's ears)
- thin, even, dark-brown outline (never thick black)
- minimal soft flat cel shading, matte finish, muted warm palette
- medium calm eyes with one tiny highlight, thin natural eyebrows, small simple
  nose, small soft mouth, soft pink cheek blush
- small neck at the bottom, plain pure-white background

IMAGE 2 is a real person. Redraw THAT person as the meeple head from image 1:
match their hairstyle and hair color, eye color, skin tone, gender, and any clear
distinctive features (glasses, beard/stubble, etc). Keep their identity recognizable
but rendered fully in the image-1 style.

Output ONLY the head + small neck, centered, facing forward, on a plain pure-white
background. No body, no shoulders, no text, no border. Keep the ears clearly visible.
`.trim();

export async function POST(req: NextRequest) {
  try {
    const genai = getGenai();
    const { imageBase64, imageMimeType } = await req.json();

    if (!imageBase64 || !imageMimeType) {
      return NextResponse.json({ error: "Missing image data" }, { status: 400 });
    }

    const ref = loadHeadRef();

    const res = await genai.models.generateContent({
      model: EDIT_MODEL,
      contents: [{
        role: "user",
        parts: [
          { text: EDIT_INSTRUCTION },
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
    });
  } catch (err: unknown) {
    const msg = parseApiError(err);
    console.error("[/api/generate-v2]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
