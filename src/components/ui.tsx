// Composants UI de base — design system Sember (minimal-tech, neutres froids,
// un seul accent). Mobile-first, cibles tactiles généreuses : le jardinier
// utilise l'app sur son téléphone, souvent avec des gants.
import {
  InputHTMLAttributes,
  ButtonHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const CHAMP_BASE =
  "w-full rounded-lg border bg-surface px-4 py-3.5 text-base text-foreground outline-none transition placeholder:text-muted focus:border-accent";

export function Champ({
  label,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-soft">{label}</span>
      <input
        {...props}
        className={`${CHAMP_BASE} ${error ? "border-red-500" : "border-line"}`}
      />
      {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
    </label>
  );
}

export function ChampTexteLong({
  label,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-soft">{label}</span>
      <textarea {...props} className={`${CHAMP_BASE} border-line`} />
    </label>
  );
}

export function Selection({
  label,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-soft">{label}</span>
      <select {...props} className={`${CHAMP_BASE} border-line`}>
        {children}
      </select>
    </label>
  );
}

export function BoutonPrincipal({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="w-full rounded-lg bg-accent px-6 py-4 text-base font-semibold text-on-accent transition hover:bg-accent-hover active:scale-[0.99] disabled:opacity-40 sm:w-auto"
    >
      {children}
    </button>
  );
}

export function BoutonSecondaire({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="w-full rounded-lg border border-line bg-surface px-6 py-4 text-base font-semibold text-foreground transition hover:border-muted active:scale-[0.99] disabled:opacity-40 sm:w-auto"
    >
      {children}
    </button>
  );
}

export function MessageErreur({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
      {message}
    </p>
  );
}
