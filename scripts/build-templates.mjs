import { PNG } from "pngjs";
import fs from "node:fs";

const DARK = 128; // luminance threshold for the outline

function load(path) {
  return PNG.sync.read(fs.readFileSync(path));
}

function lum(png, i) {
  const r = png.data[i], g = png.data[i + 1], b = png.data[i + 2], a = png.data[i + 3];
  if (a < 40) return 255; // transparent treated as light/background
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function processTemplate(srcPath, prefix) {
  const png = load(srcPath);
  const { width: w, height: h } = png;
  const N = w * h;

  const dark = new Uint8Array(N);
  for (let p = 0; p < N; p++) dark[p] = lum(png, p * 4) < DARK ? 1 : 0;

  // Flood fill "outside" from all border pixels across light (non-dark) area.
  const outside = new Uint8Array(N);
  const stack = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = y * w + x;
    if (outside[p] || dark[p]) return;
    outside[p] = 1;
    stack.push(p);
  };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  while (stack.length) {
    const p = stack.pop();
    const x = p % w, y = (p / w) | 0;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }

  // "inside" = not outside (interior + outline + any enclosed glyphs).
  // Keep only the largest connected component to drop the corner letter.
  const comp = new Int32Array(N).fill(-1);
  let best = -1, bestSize = 0, bestId = -1, id = 0;
  for (let s = 0; s < N; s++) {
    if (outside[s] || comp[s] !== -1) continue;
    const q = [s];
    comp[s] = id;
    let size = 0, head = 0;
    const members = [];
    while (head < q.length) {
      const p = q[head++];
      members.push(p);
      size++;
      const x = p % w, y = (p / w) | 0;
      const nbrs = [p + 1, p - 1, p + w, p - w];
      if (x + 1 >= w) nbrs[0] = -1;
      if (x - 1 < 0) nbrs[1] = -1;
      for (const np of nbrs) {
        if (np < 0 || np >= N) continue;
        if (outside[np] || comp[np] !== -1) continue;
        comp[np] = id;
        q.push(np);
      }
    }
    if (size > bestSize) { bestSize = size; bestId = id; best = members[0]; }
    id++;
  }

  const head = new Uint8Array(N);
  for (let p = 0; p < N; p++) head[p] = comp[p] === bestId ? 1 : 0;

  // Bounding box of head silhouette
  let minX = w, minY = h, maxX = 0, maxY = 0;
  for (let p = 0; p < N; p++) {
    if (!head[p]) continue;
    const x = p % w, y = (p / w) | 0;
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  const pad = Math.round(Math.max(maxX - minX, maxY - minY) * 0.04);
  minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad); maxY = Math.min(h - 1, maxY + pad);
  const bw = maxX - minX + 1, bh = maxY - minY + 1;

  const writeTrim = (fn) => {
    const out = new PNG({ width: bw, height: bh });
    for (let y = 0; y < bh; y++) {
      for (let x = 0; x < bw; x++) {
        const sp = (minY + y) * w + (minX + x);
        const dp = (y * bw + x) * 4;
        const [r, g, b, a] = fn(sp);
        out.data[dp] = r; out.data[dp + 1] = g; out.data[dp + 2] = b; out.data[dp + 3] = a;
      }
    }
    return out;
  };

  // mask: silhouette (interior + outline) opaque white, exterior transparent
  const mask = writeTrim((p) => (head[p] ? [255, 255, 255, 255] : [0, 0, 0, 0]));
  // frame: outline only, opaque black, on transparent
  const frame = writeTrim((p) => (head[p] && dark[p] ? [20, 20, 20, 255] : [0, 0, 0, 0]));

  fs.writeFileSync(`public/templates/${prefix}-mask.png`, PNG.sync.write(mask));
  fs.writeFileSync(`public/templates/${prefix}-frame.png`, PNG.sync.write(frame));

  console.log(`${prefix}: source ${w}x${h} -> trim ${bw}x${bh} (aspect ${(bw / bh).toFixed(3)})`);
}

const humanSrc = process.argv[2];
const animalSrc = process.argv[3];
processTemplate(humanSrc, "human");
processTemplate(animalSrc, "animal");
