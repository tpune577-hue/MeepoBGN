"use client";

import { useState, useRef, useCallback } from "react";
import { MeepoMascot } from "../components/MeepoMascot";
import { SakuraDecor } from "../components/SakuraDecor";

type Step = "idle" | "analyzing" | "generating" | "done" | "error";

interface Result {
  features: string;
  imageBase64: string;
  mimeType: string;
}

const STEP_KEYS = ["analyzing", "generating", "done"] as const;

export default function Page() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoB64, setPhotoB64] = useState<string | null>(null);
  const [photoMime, setPhotoMime] = useState("image/jpeg");
  const [step, setStep] = useState<Step>("idle");
  const [features, setFeatures] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
      setFeatures("");
      setGeneratedPrompt("");
      setError("");
    };
    reader.readAsDataURL(file);
  }, []);

  const generate = useCallback(async () => {
    if (!photoB64 || step === "analyzing" || step === "generating") return;

    setStep("analyzing");
    setError("");
    setResult(null);
    setFeatures("");
    setGeneratedPrompt("");

    try {
      setStep("generating");

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: photoB64,
          imageMimeType: photoMime,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "Server error");

      setFeatures(data.features ?? "");
      setGeneratedPrompt(data.prompt ?? "");
      setResult({
        features: data.features,
        imageBase64: data.imageBase64,
        mimeType: data.mimeType ?? "image/png",
      });
      setStep("done");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStep("error");
    }
  }, [photoB64, photoMime, step]);

  const download = useCallback(() => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = `data:${result.mimeType};base64,${result.imageBase64}`;
    a.download = "meepo-sticker.png";
    a.click();
  }, [result]);

  const isLoading = step === "analyzing" || step === "generating";
  const curIdx = STEP_KEYS.indexOf(step as (typeof STEP_KEYS)[number]);

  return (
    <main className="min-h-screen bg-bgn-bg text-bgn-on-bg font-nunito px-4 py-8 pb-16 relative overflow-hidden">
      <SakuraDecor />

      <div className="relative z-10 max-w-[440px] mx-auto flex flex-col gap-4">
        {/* Header */}
        <header className="text-center pt-2 pb-1">
          <div className="flex justify-center mb-3">
            <MeepoMascot size={88} variant="badge" animated={isLoading} />
          </div>
          <h1 className="text-[22px] sm:text-2xl font-black text-bgn-on-bg leading-tight text-balance tracking-tight">
            Create your Meepo
          </h1>
          <p className="text-sm font-extrabold text-bgn-muted-on-bg mt-1 tracking-wide">
            By BGN
          </p>
        </header>

        {/* Upload */}
        <div
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
          onClick={() => fileRef.current?.click()}
          className={`relative overflow-hidden rounded-2xl border-2 border-dashed cursor-pointer transition-colors duration-200 flex items-center justify-center bg-bgn-surface shadow-sm
            ${dragging ? "border-bgn-primary-hover bg-bgn-primary-soft" : photo ? "border-bgn-border" : "border-white/60 hover:border-white hover:bg-white"}
            ${!photo ? "min-h-[180px]" : ""}`}
        >
          {photo ? (
            <div className="w-full relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo}
                alt="upload"
                className="w-full max-h-[270px] object-cover rounded-[14px] block"
              />
              <span className="absolute bottom-2 right-2 bg-bgn-ink/75 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">
                เปลี่ยนรูป
              </span>
            </div>
          ) : (
            <div className="text-center p-8">
              <div className="flex justify-center mb-3">
                <MeepoMascot size={56} />
              </div>
              <div className="font-extrabold text-[15px] text-bgn-ink mb-1">
                อัปโหลดรูปหน้าของคุณ
              </div>
              <div className="text-xs text-bgn-muted font-semibold">
                แตะหรือลากรูปมาวาง
              </div>
            </div>
          )}
        </div>
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
          className={`w-full py-3.5 rounded-2xl font-extrabold text-[15px] tracking-wide transition-all duration-200 border-none
            ${
              !photo || isLoading
                ? "bg-white/40 text-bgn-muted-on-bg cursor-not-allowed"
                : "bg-bgn-surface text-bgn-primary-hover cursor-pointer hover:bg-white active:scale-[0.98] animate-pulse-soft shadow-md"
            }`}
        >
          {step === "analyzing"
            ? "กำลังวิเคราะห์ใบหน้า..."
            : step === "generating"
              ? "กำลังสร้าง Meepo..."
              : "สร้าง Meepo Sticker"}
        </button>

        {/* Progress */}
        {(isLoading || step === "done") && (
          <div className="flex items-center justify-center gap-2 animate-fade-up">
            {(["วิเคราะห์", "สร้างรูป", "เสร็จแล้ว"] as const).map((label, i) => {
              const active = curIdx === i;
              const done = i < curIdx || step === "done";
              return (
                <div key={i} className="flex items-center gap-2">
                  {i > 0 && (
                    <div
                      className={`w-5 h-px transition-colors ${done || active ? "bg-white/70" : "bg-white/30"}`}
                    />
                  )}
                  <span
                    className={`text-[11px] font-extrabold ${
                      done ? "text-bgn-on-bg" : active ? "text-bgn-on-bg" : "text-white/45"
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
          <p className="text-center text-[12px] text-bgn-muted-on-bg font-semibold animate-fade-up">
            อาจใช้เวลา 30–60 วินาที
          </p>
        )}

        {features && (
          <div className="bg-bgn-surface border border-bgn-border rounded-2xl px-4 py-3 text-[13px] text-bgn-ink font-semibold animate-fade-up shadow-sm">
            <span className="text-bgn-primary-hover font-extrabold">ลักษณะที่ตรวจพบ: </span>
            {features}
          </div>
        )}

        {step === "done" && result && (
          <div className="bg-bgn-surface border border-bgn-border rounded-2xl p-5 text-center animate-pop-in shadow-sm">
            <div className="flex items-center justify-center gap-2 mb-3">
              <MeepoMascot size={32} />
              <span className="text-[11px] font-extrabold text-bgn-primary-hover tracking-wide">
                Meepo ของคุณพร้อมแล้ว
              </span>
            </div>
            <div className="inline-block bg-white rounded-2xl p-3 shadow-md ring-1 ring-bgn-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:${result.mimeType};base64,${result.imageBase64}`}
                alt="meepo sticker"
                className="w-full max-w-[240px] rounded-xl block"
              />
            </div>
            <div className="flex gap-2.5 mt-4 justify-center">
              <button
                onClick={generate}
                className="px-4 py-2.5 bg-bgn-primary-soft border border-bgn-border rounded-xl text-bgn-ink font-bold text-[13px] cursor-pointer hover:bg-bgn-primary-soft transition-colors"
              >
                สร้างใหม่
              </button>
              <button
                onClick={download}
                className="px-4 py-2.5 bg-bgn-primary-hover rounded-xl text-white font-bold text-[13px] cursor-pointer hover:bg-bgn-primary transition-colors"
              >
                บันทึก PNG
              </button>
            </div>
          </div>
        )}

        {step === "error" && error && (
          <div className="bg-bgn-error-bg border border-bgn-error/25 rounded-2xl p-4 text-bgn-error text-[13px] font-semibold animate-fade-up">
            {error}
            <button
              onClick={() => setStep("idle")}
              className="mt-2 block bg-white border border-bgn-error/20 rounded-xl text-bgn-error px-3 py-1.5 text-xs cursor-pointer font-bold hover:bg-bgn-error-bg transition-colors"
            >
              ปิด
            </button>
          </div>
        )}

        {generatedPrompt && (
          <div className="bg-bgn-surface border border-bgn-border rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => setShowPrompt(!showPrompt)}
              className="w-full bg-transparent border-none text-bgn-muted text-[12px] font-bold px-4 py-2.5 text-left cursor-pointer hover:text-bgn-ink font-nunito"
            >
              {showPrompt ? "▾" : "▸"} ดู prompt ที่สร้าง
            </button>
            {showPrompt && (
              <p className="px-4 pb-3 text-[12px] text-bgn-muted leading-relaxed break-words border-t border-bgn-border pt-2">
                {generatedPrompt}
              </p>
            )}
          </div>
        )}

        <footer className="text-center text-[10px] text-bgn-muted-on-bg/80 font-bold tracking-wide pt-2">
          powered by Sandory Box
        </footer>
      </div>
    </main>
  );
}
