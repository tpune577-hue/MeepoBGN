"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { MeepoMascot } from "../components/MeepoMascot";
import { SakuraDecor } from "../components/SakuraDecor";
import { TemplatePicker } from "../components/TemplatePicker";
import { MeepoHeadUpload } from "../components/MeepoHeadUpload";
import { DEFAULT_TEMPLATE, getTemplate, MeepoTemplateId } from "@/lib/meepo-templates";

type Step = "idle" | "analyzing" | "generating" | "done" | "error";

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

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: photoB64,
          imageMimeType: photoMime,
          templateId,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "Server error");

      setResult({
        imageBase64: data.imageBase64,
        mimeType: data.mimeType ?? "image/png",
      });
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
    <main className="min-h-screen bg-bgn-bg text-bgn-on-bg font-nunito px-4 py-8 pb-16 relative overflow-hidden">
      <SakuraDecor />

      <div className="relative z-10 max-w-[460px] mx-auto flex flex-col gap-5">
        {/* Header */}
        <header className="text-center pt-3 pb-1">
          <div className="flex justify-center mb-3">
            <MeepoMascot size={96} variant="badge" animated={isLoading} />
          </div>
          <h1 className="text-[32px] font-black text-bgn-on-bg leading-none text-balance tracking-tight">
            Create your Meepo
          </h1>
          <p className="text-base font-bold text-bgn-muted-on-bg mt-2 tracking-wide">
            By BGN
          </p>
        </header>

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
          <div className="flex items-center justify-center gap-2.5 animate-fade-up">
            {(["วิเคราะห์", "สร้างรูป", "เสร็จแล้ว"] as const).map((label, i) => {
              const active = curIdx === i;
              const done = i < curIdx || step === "done";
              return (
                <div key={i} className="flex items-center gap-2.5">
                  {i > 0 && (
                    <div
                      className={`w-6 h-0.5 rounded-full transition-colors ${done || active ? "bg-white/80" : "bg-white/30"}`}
                    />
                  )}
                  <span
                    className={`text-sm font-extrabold transition-colors ${
                      done || active ? "text-bgn-on-bg" : "text-white/45"
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
          <p className="text-center text-sm text-bgn-muted-on-bg font-semibold animate-fade-up">
            อาจใช้เวลา 30–60 วินาที
          </p>
        )}

        {step === "done" && result && (
          <div
            ref={resultRef}
            className="scroll-mt-6 bg-bgn-surface rounded-3xl p-6 text-center animate-pop-in shadow-md"
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
                className="px-5 py-3 bg-bgn-primary-soft rounded-xl text-bgn-ink font-bold text-[15px] cursor-pointer hover:bg-bgn-primary-soft/70 transition-colors"
              >
                สร้างใหม่
              </button>
              <button
                onClick={download}
                className="px-5 py-3 bg-bgn-primary-hover rounded-xl text-white font-bold text-[15px] cursor-pointer hover:bg-bgn-primary transition-colors"
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

        <footer className="text-center text-xs text-bgn-muted-on-bg/80 font-bold tracking-wide pt-3">
          powered by Sandory Box
        </footer>
      </div>
    </main>
  );
}
