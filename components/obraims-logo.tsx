import Image from "next/image";

type ObraimsLogoProps = {
  className?: string;
  variant?: "full" | "mark";
  dark?: boolean;
};

export function ObraimsLogo({ className = "", variant = "full", dark = false }: ObraimsLogoProps) {
  // The logo PNG has a black background.
  // mix-blend-mode: screen makes black transparent on any background,
  // showing only the colourful parts of the logo cleanly.
  const blendClass = dark ? "mix-blend-screen" : "mix-blend-screen";

  if (variant === "mark") {
    return (
      <span
        className={`relative inline-block overflow-hidden ${className}`}
        style={{ width: 36, height: 36 }}
      >
        <Image
          src="/brand/obraims-logo-mark.png"
          alt="Obraims"
          fill
          className={`object-contain ${blendClass}`}
          sizes="36px"
        />
      </span>
    );
  }

  return (
    <span
      className={`relative inline-block overflow-hidden ${className}`}
      style={{ width: 140, height: 44 }}
    >
      <Image
        src="/brand/obraims-logo-full.png"
        alt="Obraims"
        fill
        className={`object-contain object-left ${blendClass}`}
        sizes="140px"
        priority
      />
    </span>
  );
}
