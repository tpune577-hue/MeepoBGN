const BLOSSOMS = [
  { top: "6%", left: "4%", size: 28, delay: "0s", rotate: -12 },
  { top: "12%", right: "6%", size: 22, delay: "1.2s", rotate: 18 },
  { top: "72%", left: "2%", size: 20, delay: "0.6s", rotate: 8 },
  { top: "82%", right: "4%", size: 26, delay: "1.8s", rotate: -20 },
] as const;

function Blossom({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      {[0, 72, 144, 216, 288].map((angle) => (
        <ellipse
          key={angle}
          cx="12"
          cy="7"
          rx="4.5"
          ry="6.5"
          fill="currentColor"
          transform={`rotate(${angle} 12 12)`}
          opacity="0.85"
        />
      ))}
      <circle cx="12" cy="12" r="2.8" fill="var(--bgn-blossom-core)" />
    </svg>
  );
}

export function SakuraDecor() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden>
      {BLOSSOMS.map((b, i) => (
        <div
          key={i}
          className="absolute text-bgn-blossom animate-sakura-drift select-none"
          style={{
            top: b.top,
            left: "left" in b ? b.left : undefined,
            right: "right" in b ? b.right : undefined,
            animationDelay: b.delay,
            transform: `rotate(${b.rotate}deg)`,
          }}
        >
          <Blossom size={b.size} />
        </div>
      ))}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[oklch(0.68_0.16_5/0.25)] to-transparent" />
    </div>
  );
}
