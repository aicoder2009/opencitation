import type { ReactNode } from "react";

type WikiNoticeVariant = "info" | "warn";

interface WikiNoticeProps {
  variant?: WikiNoticeVariant;
  children: ReactNode;
  className?: string;
}

/**
 * Inline status message styled in the Wikipedia 2005 idiom: a left-edge
 * border with muted offwhite fill, no saturated state colors. The variant
 * only changes the left-border weight so info messages read lighter than
 * warnings without breaking the design system's "no state colors" rule.
 */
export function WikiNotice({ variant = "info", children, className = "" }: WikiNoticeProps) {
  const accent =
    variant === "warn"
      ? "border-l-4 border-l-wiki-border"
      : "border-l-2 border-l-wiki-border-light";

  return (
    <div
      role={variant === "warn" ? "alert" : "status"}
      className={`px-3 py-2 text-sm bg-wiki-offwhite border border-wiki-border-light text-wiki-text ${accent} ${className}`}
    >
      {children}
    </div>
  );
}
