"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { MeepoMascot } from "../components/MeepoMascot";
import { SakuraDecor } from "../components/SakuraDecor";
import { TemplatePicker } from "../components/TemplatePicker";
import { MeepoHeadUpload } from "../components/MeepoHeadUpload";
import { DEFAULT_TEMPLATE, getTemplate, MeepoTemplateId } from "@/lib/meepo-templates";

type Step = "idle" | "analyzing" | "generating" | "done" | "error";

async function compressImage(
  base64: string,
  mimeType: string,
): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const MAX = 1024;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      resolve({ base64: dataUrl.split(",")[1], mimeType: "image/jpeg" });
    };
    img.src = `data:${mimeType};base64,${base64}`;
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Paste the AI-generated inner face into the FIXED head template.
 * The mask clips the face to the exact locked silhouette and the frame draws the
 * locked outline on top — so the head shape + size are identical on every sticker.
 */
async function compositeOntoTemplate(
  generatedBase64: string,
  generatedMime: string,
  maskSrc: string,
  frameSrc: string,
): Promise<{ base64: string; mimeType: string }> {
  const SCALE = 4; // upscale the locked template px for print-ready output
  const [face, mask, frame] = await Promise.all([
    loadImage(`data:${generatedMime};base64,${generatedBase64}`),
    loadImage(maskSrc),
    loadImage(frameSrc),
  ]);

  const w = mask.naturalWidth * SCALE;
  const h = mask.naturalHeight * SCALE;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";

  // 1) draw the generated face scaled to COVER the template box (center crop)
  const cover = Math.max(w / face.naturalWidth, h / face.naturalHeight);
  const fw = face.naturalWidth * cover;
  const fh = face.naturalHeight * cover;
  ctx.drawImage(face, (w - fw) / 2, (h - fh) / 2, fw, fh);

  // 2) clip to the fixed silhouette
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(mask, 0, 0, w, h);

  // 3) lay the fixed outline on top
  ctx.globalCompositeOperation = "source-over";
  ctx.drawImage(frame, 0, 0, w, h);

  return { base64: canvas.toDataURL("image/png").split(",")[1], mimeType: "image/png" };
}

interface Result {
  imageBase64: string;
  mimeType: string;
}

const STEP_KEYS = ["analyzing", "generating", "done"] as const;

export default function Page() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoB64, setPhotoB64] = useState<string | null>(null);
  const [photoMime, setPhotoMime] = useState("image/jpeg");
  const [step, setStep] = useState<Step>("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [templateId, setTemplateId] = useState<MeepoTemplateId>(DEFAULT_TEMPLATE);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (step === "done" && resultRef.current) {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      resultRef.current.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "center",
      });
    }
  }, [step]);

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setPhoto(url);
      setPhotoMime(file.type || "image/jpeg");
      setPhotoB64(url.split(",")[1]);
      setStep("idle");
      setResult(null);
      setError("");
    };
    reader.readAsDataURL(file);
  }, []);

  const generate = useCallback(async () => {
    if (!photoB64 || step === "analyzing" || step === "generating") return;

    setStep("analyzing");
    setError("");
    setResult(null);

    try {
      setStep("generating");

      const { base64: compressedB64, mimeType: compressedMime } = await compressImage(photoB64, photoMime);

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: compressedB64,
          imageMimeType: compressedMime,
          templateId,
        }),
      });

      let data: Record<string, unknown>;
      try {
        data = await res.json();
      } catch {
        throw new Error("เซิร์ฟเวอร์ปฏิเสธคำขอ — รูปภาพอาจใหญ่เกินไป ลองใช้รูปที่เล็กกว่านี้");
      }
      if (!res.ok || data.error) throw new Error((data.error as string) ?? "Server error");

      // Paste the generated face into the FIXED head template (shape + size locked).
      const tpl = getTemplate(templateId);
      const composited = await compositeOntoTemplate(
        data.imageBase64 as string,
        (data.mimeType as string) ?? "image/png",
        tpl.maskSrc,
        tpl.frameSrc,
      );

      setResult({ imageBase64: composited.base64, mimeType: composited.mimeType });
      setStep("done");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStep("error");
    }
  }, [photoB64, photoMime, templateId, step]);

  const download = useCallback(() => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = `data:${result.mimeType};base64,${result.imageBase64}`;
    a.download = "meepo-sticker.png";
    a.click();
  }, [result]);

  const isLoading = step === "analyzing" || step === "generating";
  const curIdx = STEP_KEYS.indexOf(step as (typeof STEP_KEYS)[number]);
  const template = getTemplate(templateId);

  return (
    <main className="min-h-screen bg-white text-bgn-ink font-nunito px-4 py-0 pb-16 relative overflow-hidden">
      <SakuraDecor />

      <div className="relative z-10 max-w-[460px] mx-auto flex flex-col gap-5">
        {/* Header — aqua accent band (~40% visual weight) */}
        <header className="text-center -mx-4 px-4 pt-8 pb-7 bg-bgn-primary text-bgn-on-bg rounded-b-[2rem] shadow-sm">
          <div className={`flex justify-center items-end gap-1 mb-3 ${isLoading ? "animate-meeple-bob" : ""}`}>
            {(["char1", "char2", "char3", "char4", "char5", "char6"] as const).map((name) => (
              <Image
                key={name}
                src={`/meeples/${name}.png`}
                alt=""
                width={64}
                height={64}
                className="object-contain"
                style={{ width: 64, height: 64 }}
                aria-hidden
              />
            ))}
          </div>
          <h1 className="text-[32px] font-black text-bgn-on-bg leading-none text-balance tracking-tight">
            DIY My Meeple
          </h1>
          <p className="text-base font-bold text-bgn-muted-on-bg mt-2 tracking-wide">
            By BGN
          </p>
        </header>

        <div className="flex flex-col gap-5 pt-1">
        <TemplatePicker
          value={templateId}
          onChange={setTemplateId}
          disabled={isLoading}
        />

        <MeepoHeadUpload
          template={template}
          photo={photo}
          dragging={dragging}
          onClick={() => fileRef.current?.click()}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            e.dataTransfer.files[0] && loadFile(e.dataTransfer.files[0]);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])}
        />

        {/* Generate */}
        <button
          onClick={generate}
          disabled={!photo || isLoading}
          className={`w-full py-4 rounded-2xl font-extrabold text-[17px] tracking-wide transition-all duration-200 border-none
            ${
              !photo || isLoading
                ? "bg-bgn-primary-soft text-bgn-muted cursor-not-allowed"
                : "bg-bgn-primary text-bgn-on-bg cursor-pointer hover:bg-bgn-primary-hover active:scale-[0.98] animate-pulse-soft shadow-md"
            }`}
        >
          {step === "analyzing"
            ? "กำลังวิเคราะห์ใบหน้า..."
            : step === "generating"
              ? "กำลังสร้าง Meepo..."
              : "สร้าง Meeple Sticker"}
        </button>

        {/* Progress */}
        {(isLoading || step === "done") && (
          <div className="flex items-center justify-center gap-2.5 animate-fade-up">
            {(["วิเคราะห์", "สร้างรูป", "เสร็จแล้ว"] as const).map((label, i) => {
              const active = curIdx === i;
              const done = i < curIdx || step === "done";
              return (
                <div key={i} className="flex items-center gap-2.5">
                  {i > 0 && (
                    <div
                      className={`w-6 h-0.5 rounded-full transition-colors ${done || active ? "bg-bgn-primary" : "bg-bgn-border"}`}
                    />
                  )}
                  <span
                    className={`text-sm font-extrabold transition-colors ${
                      done || active ? "text-bgn-primary" : "text-bgn-muted"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {step === "generating" && (
          <p className="text-center text-sm text-bgn-muted font-semibold animate-fade-up">
            อาจใช้เวลา 30–60 วินาที
          </p>
        )}

        {step === "done" && result && (
          <div
            ref={resultRef}
            className="scroll-mt-6 bg-bgn-primary-soft rounded-3xl p-6 text-center animate-pop-in shadow-md ring-1 ring-bgn-border"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <MeepoMascot size={28} />
              <span className="text-sm font-extrabold text-bgn-primary-hover tracking-wide">
                Meepo ของคุณพร้อมแล้ว
              </span>
            </div>
            <div className="inline-block bg-white rounded-2xl p-3 shadow-sm ring-1 ring-bgn-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:${result.mimeType};base64,${result.imageBase64}`}
                alt="meepo sticker"
                className="w-full max-w-[260px] rounded-xl block"
              />
            </div>
            <div className="flex gap-3 mt-5 justify-center">
              <button
                onClick={generate}
                className="px-5 py-3 bg-white rounded-xl text-bgn-ink font-bold text-[15px] cursor-pointer hover:bg-bgn-primary-soft transition-colors ring-1 ring-bgn-border"
              >
                สร้างใหม่
              </button>
              <button
                onClick={download}
                className="px-5 py-3 bg-bgn-primary rounded-xl text-bgn-on-bg font-bold text-[15px] cursor-pointer hover:bg-bgn-primary-hover transition-colors"
              >
                บันทึก PNG
              </button>
            </div>
          </div>
        )}

        {step === "error" && error && (
          <div className="bg-bgn-error-bg rounded-2xl p-4 text-bgn-error text-sm font-semibold animate-fade-up">
            {error}
            <button
              onClick={() => setStep("idle")}
              className="mt-3 block bg-white rounded-xl text-bgn-error px-4 py-2 text-sm cursor-pointer font-bold hover:bg-bgn-error-bg transition-colors"
            >
              ปิด
            </button>
          </div>
        )}

        <footer className="text-center text-xs text-bgn-muted font-bold tracking-wide pt-3">
          powered by Sandory Box
        </footer>
        </div>
      </div>
    </main>
  );
}
