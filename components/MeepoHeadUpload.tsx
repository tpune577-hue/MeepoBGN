"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  clampZoom,
  coverRect,
  cropViewportHeight,
  CROP_VIEWPORT_WIDTH,
  CropState,
} from "@/lib/crop-image";
import { MeepoTemplate } from "@/lib/meepo-templates";
import { MeepoMascot } from "./MeepoMascot";

type MeepoHeadUploadProps = {
  template: MeepoTemplate;
  photo: string | null;
  crop: CropState;
  onCropChange: (crop: CropState) => void;
  dragging: boolean;
  disabled?: boolean;
  onRequestUpload: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
};

export function MeepoHeadUpload({
  template,
  photo,
  crop,
  onCropChange,
  dragging,
  disabled = false,
  onRequestUpload,
  onDrop,
  onDragOver,
  onDragLeave,
}: MeepoHeadUploadProps) {
  const vpW = CROP_VIEWPORT_WIDTH;
  const vpH = cropViewportHeight(template.aspect);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const dragRef = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);
  const movedRef = useRef(false);

  useEffect(() => {
    if (!photo) {
      setImgSize(null);
      return;
    }
    const img = new window.Image();
    img.onload = () => setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = photo;
  }, [photo]);

  const maskStyle: React.CSSProperties = {
    WebkitMaskImage: `url(${template.maskSrc})`,
    maskImage: `url(${template.maskSrc})`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskSize: "100% 100%",
    maskSize: "100% 100%",
  };

  const photoRect =
    photo && imgSize
      ? coverRect(imgSize.w, imgSize.h, vpW, vpH, crop)
      : null;

  const setZoom = useCallback(
    (delta: number) => {
      onCropChange({ ...crop, zoom: clampZoom(crop.zoom + delta) });
    },
    [crop, onCropChange],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!photo || disabled) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        px: e.clientX,
        py: e.clientY,
        ox: crop.offsetX,
        oy: crop.offsetY,
      };
      movedRef.current = false;
    },
    [photo, disabled, crop.offsetX, crop.offsetY],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.px;
      const dy = e.clientY - dragRef.current.py;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) movedRef.current = true;
      onCropChange({
        ...crop,
        offsetX: dragRef.current.ox + dx,
        offsetY: dragRef.current.oy + dy,
      });
    },
    [crop, onCropChange],
  );

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!photo || disabled) return;
      e.preventDefault();
      setZoom(e.deltaY > 0 ? -0.08 : 0.08);
    },
    [photo, disabled, setZoom],
  );

  const onContainerClick = useCallback(() => {
    if (!photo) {
      onRequestUpload();
      return;
    }
    if (!movedRef.current) return;
  }, [photo, onRequestUpload]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        onDrop={disabled ? undefined : onDrop}
        onDragOver={disabled ? undefined : onDragOver}
        onDragLeave={disabled ? undefined : onDragLeave}
        onClick={disabled ? undefined : onContainerClick}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`relative mx-auto w-full max-w-[260px] transition-transform duration-200 touch-none
          ${dragging ? "scale-[1.02]" : photo ? "" : "hover:scale-[1.01] cursor-pointer"}
          ${photo && !disabled ? "cursor-grab active:cursor-grabbing" : ""}
          ${disabled ? "opacity-60 pointer-events-none" : ""}`}
        style={{ aspectRatio: template.aspect }}
      >
        <div className="absolute inset-0 drop-shadow-md" style={{ ...maskStyle, background: "#ffffff" }} />

        {photo && photoRect && (
          <div className="absolute inset-0 overflow-hidden" style={maskStyle}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              alt=""
              draggable={false}
              className="absolute max-w-none select-none pointer-events-none"
              style={{
                width: photoRect.dw,
                height: photoRect.dh,
                left: photoRect.dx,
                top: photoRect.dy,
              }}
            />
          </div>
        )}

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
      </div>

      {photo && !disabled && (
        <div className="flex items-center justify-center gap-2 w-full max-w-[260px]">
          <button
            type="button"
            onClick={() => setZoom(-0.15)}
            className="w-9 h-9 rounded-xl bg-bgn-primary-soft text-bgn-ink font-black text-lg leading-none ring-1 ring-bgn-border"
            aria-label="ซูมออก"
          >
            −
          </button>
          <span className="text-xs font-bold text-bgn-muted flex-1 text-center">
            ลากเพื่อเลื่อน · ซูม {Math.round(crop.zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom(0.15)}
            className="w-9 h-9 rounded-xl bg-bgn-primary-soft text-bgn-ink font-black text-lg leading-none ring-1 ring-bgn-border"
            aria-label="ซูมเข้า"
          >
            +
          </button>
          <button
            type="button"
            onClick={onRequestUpload}
            className="text-xs font-bold text-bgn-primary-hover px-2.5 py-1.5 rounded-lg ring-1 ring-bgn-border bg-white"
          >
            เปลี่ยนรูป
          </button>
        </div>
      )}
    </div>
  );
}
