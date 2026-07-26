// Identité de marque Sember — symbole « jeune pousse » + wordmark.
// Le symbole hérite de la couleur via currentColor (par défaut : accent).

type MarkProps = { className?: string };

export function SemberMark({ className = "h-6 w-6 text-accent" }: MarkProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path d="M20 37V17" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M20 21c0-6 4.6-10.5 11-11 .4 6.2-4.2 11-11 11Z" fill="currentColor" />
      <path d="M20 26c-.2-5-3.8-8.8-9-9.4-.4 5.2 3.5 9.3 9 9.4Z" fill="currentColor" />
    </svg>
  );
}

type LogoProps = {
  /** "full" = symbole + wordmark ; "mark" = symbole seul. */
  variant?: "full" | "mark";
  className?: string;
  /** Classe appliquée au symbole (taille + couleur). */
  markClassName?: string;
};

export function Logo({
  variant = "full",
  className = "",
  markClassName = "h-[1.1em] w-auto text-accent",
}: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <SemberMark className={markClassName} />
      {variant === "full" && (
        <span className="font-semibold tracking-tight text-foreground">Sember</span>
      )}
    </span>
  );
}

export default Logo;
