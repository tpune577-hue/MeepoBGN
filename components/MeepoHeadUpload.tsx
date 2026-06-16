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
      <svg
        viewBox={template.viewBox}
        className="w-full h-auto drop-shadow-md"
        aria-hidden
      >
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <path d={template.outlinePath} />
          </clipPath>
        </defs>

        {/* Fill area */}
        <path
          d={template.outlinePath}
          className={`transition-colors duration-200 ${dragging ? "fill-white" : "fill-bgn-surface"}`}
          style={{ fill: dragging ? "#fff" : undefined }}
        />

        {/* Dashed outline */}
        <path
          d={template.outlinePath}
          fill="none"
          stroke={photo ? "var(--bgn-border)" : "white"}
          strokeWidth="2.5"
          strokeDasharray={photo ? "0" : "6 4"}
          opacity={photo ? 0.6 : 0.9}
        />
      </svg>

      {/* Photo clipped to head shape */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ clipPath: `url(#${clipId})` }}
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt="upload"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-transparent pt-4">
            <MeepoMascot size={40} />
            <span className="text-[11px] font-extrabold text-bgn-ink px-4 text-center leading-tight">
              อัปโหลดรูปหน้า
            </span>
            <span className="text-[9px] text-bgn-muted font-semibold">แตะหรือลากรูป</span>
          </div>
        )}
      </div>

      {photo && (
        <span className="absolute bottom-1 right-1 bg-bgn-ink/75 text-white text-[10px] font-bold px-2 py-0.5 rounded-md pointer-events-none">
          เปลี่ยนรูป
        </span>
      )}
    </div>
  );
}
