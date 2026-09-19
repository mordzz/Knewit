import { Link } from "@tanstack/react-router";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
      aria-label="Knew It home"
    >
      <span className="grid size-8 place-items-center rounded-lg bg-primary font-black text-primary-foreground">
        K
      </span>
      {!compact && <span className="font-display text-lg font-bold text-foreground">Knew It</span>}
    </Link>
  );
}
