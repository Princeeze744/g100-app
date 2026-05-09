import Image from "next/image";

type Size = "sm" | "md" | "lg" | "xl";

const sizes: Record<Size, number> = {
  sm: 56,
  md: 96,
  lg: 160,
  xl: 280,
};

export function Logo({
  size = "md",
  className = "",
  glow = false,
}: {
  size?: Size;
  className?: string;
  glow?: boolean;
}) {
  const w = sizes[size];
  return (
    <div
      className={`relative inline-block ${glow ? "drop-shadow-[0_0_20px_rgba(201,162,78,0.25)]" : ""} ${className}`}
    >
      <Image
        src="/brand/eagle-gold.png"
        alt="G100"
        width={w}
        height={Math.round(w * 0.65)}
        priority
        style={{ width: w + "px", height: "auto" }}
      />
    </div>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display tracking-tight leading-none ${className}`}>
      G<em className="text-gold not-italic font-medium">100</em>
    </span>
  );
}
