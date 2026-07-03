/** Reference viewport width (matches MeepoHeadUpload max-w). Offsets are stored in this space. */
export const CROP_VIEWPORT_WIDTH = 260;

export interface CropState {
  /** Pan X in reference-viewport pixels */
  offsetX: number;
  /** Pan Y in reference-viewport pixels */
  offsetY: number;
  /** Zoom multiplier on top of cover-fit (1 = minimum cover) */
  zoom: number;
}

export const DEFAULT_CROP: CropState = { offsetX: 0, offsetY: 0, zoom: 1 };

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

export function cropViewportHeight(aspect: number): number {
  return CROP_VIEWPORT_WIDTH / aspect;
}

/** Cover-fit draw rect for an image inside the template viewport. */
export function coverRect(
  imgW: number,
  imgH: number,
  vpW: number,
  vpH: number,
  crop: CropState,
): { dw: number; dh: number; dx: number; dy: number } {
  const cover = Math.max(vpW / imgW, vpH / imgH) * crop.zoom;
  const dw = imgW * cover;
  const dh = imgH * cover;
  const dx = (vpW - dw) / 2 + crop.offsetX;
  const dy = (vpH - dh) / 2 + crop.offsetY;
  return { dw, dh, dx, dy };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Render the user crop (pan/zoom inside template aspect) to a JPEG for the API.
 * Output long edge is at most `maxDim` px.
 */
export async function exportTemplateCrop(
  photoDataUrl: string,
  aspect: number,
  crop: CropState,
  maxDim = 1024,
): Promise<{ base64: string; mimeType: string }> {
  const img = await loadImage(photoDataUrl);
  const refW = CROP_VIEWPORT_WIDTH;
  const refH = cropViewportHeight(aspect);
  const outW = aspect >= 1 ? maxDim : Math.round(maxDim * aspect);
  const outH = aspect >= 1 ? Math.round(maxDim / aspect) : maxDim;
  const scale = outW / refW;

  const { dw, dh, dx, dy } = coverRect(
    img.naturalWidth,
    img.naturalHeight,
    refW,
    refH,
    crop,
  );

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, dx * scale, dy * scale, dw * scale, dh * scale);

  const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
  return { base64: dataUrl.split(",")[1], mimeType: "image/jpeg" };
}
