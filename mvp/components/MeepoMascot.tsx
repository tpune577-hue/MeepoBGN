import Image from "next/image";

type MeepoMascotProps = {
  className?: string;
  size?: number;
  animated?: boolean;
  variant?: "default" | "badge";
};

export function MeepoMascot({
  className = "",
  size = 80,
  animated = false,
  variant = "default",
}: MeepoMascotProps) {
  const src = variant === "badge" ? "/meepo-badge.png" : "/meepo.png";

  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      className={`object-contain ${animated ? "animate-meeple-bob" : ""} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
      priority={variant === "default" && size >= 64}
    />
  );
}
