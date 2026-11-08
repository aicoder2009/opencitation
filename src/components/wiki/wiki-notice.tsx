import type { ReactNode } from "react";

type WikiNoticeVariant = "info" | "warn";

interface WikiNoticeProps {
  variant?: WikiNoticeVariant;
  children: ReactNode;
  className?: string;
  onDismiss?: () => void;
}

/**
 * Inline status message styled in the Wikipedia 2005 idiom: a left-edge
 * border with muted offwhite fill, like the article message boxes of the
 * era. Info notices keep a thin grey edge; warnings get the thick saffron
 * bar (`wiki-warning`), the design system's single attention hue.
 * Pass onDismiss to render a [dismiss] link that clears the message.
 */
export function WikiNotice({ variant = "info", children, className = "", onDismiss }: WikiNoticeProps) {
  const accent =
    variant === "warn"
      ? "border-l-8 border-l-wiki-warning"
      : "border-l-2 border-l-wiki-border-light";

  return (
    <div
      role={variant === "warn" ? "alert" : "status"}
      className={`px-3 py-2 text-sm bg-wiki-offwhite border border-wiki-border-light text-wiki-text ${accent} ${className}`}
    >
      {children}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="ml-2 text-wiki-link hover:underline focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
          aria-label="Dismiss"
        >
          [dismiss]
        </button>
      )}
    </div>
  );
}
