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
  const clipId = `meepo-clip-${template.id}`;

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={onClick}
      className={`relative mx-auto w-full max-w-[260px] cursor-pointer transition-transform duration-200
        ${dragging ? "scale-[1.02]" : "hover:scale-[1.01]"}`}
    >
      <svg viewBox={template.viewBox} className="w-full h-auto drop-shadow-md" aria-hidden>
        <defs>
          <clipPath id={clipId}>
            <path d={template.outlinePath} />
          </clipPath>
        </defs>

        <path d={template.outlinePath} fill="#ffffff" />

        {photo && (
          <image
            href={photo}
            x="0"
            y="0"
            width="100"
            height="120"
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${clipId})`}
          />
        )}

        <path
          d={template.outlinePath}
          fill="none"
          stroke={photo ? "rgba(90,48,72,0.35)" : "white"}
          strokeWidth="2.5"
          strokeDasharray={photo ? "0" : "6 4"}
        />
      </svg>

      {!photo && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 pointer-events-none pt-5">
          <MeepoMascot size={40} />
          <span className="text-[11px] font-extrabold text-bgn-ink leading-tight">อัปโหลดรูปหน้า</span>
          <span className="text-[9px] text-bgn-muted font-semibold">แตะหรือลากรูป</span>
        </div>
      )}

      {photo && (
        <span className="absolute bottom-1 right-1 bg-bgn-ink/75 text-white text-[10px] font-bold px-2 py-0.5 rounded-md pointer-events-none">
          เปลี่ยนรูป
        </span>
      )}
    </div>
  );
}
