import { GoogleGenAI } from "@google/genai";

export function getGenai() {
  const apiKey = process.env.GOOGLE_AI_API_KEY?.trim();
  if (!apiKey || apiKey === "your_google_ai_api_key_here") {
    throw new Error("GOOGLE_AI_API_KEY is not configured. Add it in .env.local (local) or Vercel Environment Variables (production).");
  }
  return new GoogleGenAI({ apiKey });
}

export function parseApiError(err: unknown): string {
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
