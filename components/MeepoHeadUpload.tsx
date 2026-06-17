"use client";

import { MeepoTemplate } from "@/lib/meepo-templates";
import { MeepoMascot } from "./MeepoMascot";

type MeepoHeadUploadProps = {
  template: MeepoTemplate;
  photo: string | null;
  dragging: boolean;
  onClick: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
};

export function MeepoHeadUpload({
  template,
  photo,
  dragging,
  onClick,
  onDrop,
  onDragOver,
  onDragLeave,
}: MeepoHeadUploadProps) {
  const maskStyle: React.CSSProperties = {
    WebkitMaskImage: `url(${template.maskSrc})`,
    maskImage: `url(${template.maskSrc})`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskSize: "100% 100%",
    maskSize: "100% 100%",
  };

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={onClick}
      className={`relative mx-auto w-full max-w-[260px] cursor-pointer transition-transform duration-200
        ${dragging ? "scale-[1.02]" : "hover:scale-[1.01]"}`}
      style={{ aspectRatio: template.aspect }}
    >
      {/* white fill so empty silhouette reads as a card */}
      <div className="absolute inset-0 drop-shadow-md" style={{ ...maskStyle, background: "#ffffff" }} />

      {photo && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ ...maskStyle, backgroundImage: `url(${photo})` }}
        />
      )}

      {/* real outline artwork on top */}
      <img
        src={template.frameSrc}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full pointer-events-none select-none"
        draggable={false}
      />

      {!photo && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 pointer-events-none pt-4">
          <MeepoMascot size={44} />
          <span className="text-[15px] font-extrabold text-bgn-ink leading-tight">อัปโหลดรูปหน้า</span>
          <span className="text-xs text-bgn-muted font-semibold">แตะหรือลากรูป</span>
        </div>
      )}

      {photo && (
        <span className="absolute bottom-2 right-2 bg-bgn-ink/75 text-white text-xs font-bold px-2.5 py-1 rounded-lg pointer-events-none">
          เปลี่ยนรูป
        </span>
      )}
    </div>
  );
}
