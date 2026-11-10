"use client";

import { ButtonHTMLAttributes } from "react";

type WikiButtonVariant = "default" | "primary";

interface WikiButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: WikiButtonVariant;
  children: React.ReactNode;
}

const baseStyles = `
  px-4 py-2 text-sm
  border border-wiki-border-light
  transition-colors
  focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text
`;

const variantStyles: Record<WikiButtonVariant, string> = {
  default: `
    bg-wiki-white text-wiki-text
    hover:bg-wiki-tab-bg
    active:bg-wiki-border-light
  `,
  primary: `
    bg-wiki-white text-wiki-link font-medium
    hover:bg-wiki-tab-bg
    active:bg-wiki-border-light
  `,
};

/** WikiButton's look, for an `<a>` that has to read as a button (e.g. an external checkout link). */
export function wikiButtonClasses(variant: WikiButtonVariant = "default") {
  // `!` so it beats the unlayered `a:hover` underline in globals.css.
  return `${baseStyles} ${variantStyles[variant]} hover:no-underline!`;
}

export function WikiButton({
  variant = "default",
  children,
  className = "",
  disabled,
  ...props
}: WikiButtonProps) {
  const disabledStyles = disabled
    ? "opacity-50 cursor-not-allowed hover:bg-wiki-white"
    : "cursor-pointer";

  return (
    <button
      className={`${wikiButtonClasses(variant)} ${disabledStyles} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
