"use client";

import { ButtonHTMLAttributes } from "react";

interface WikiButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary";
  children: React.ReactNode;
}

export function WikiButton({
  variant = "default",
  children,
  className = "",
  disabled,
  ...props
}: WikiButtonProps) {
  const baseStyles = `
    px-4 py-2 text-sm
    border border-wiki-border-light
    transition-colors
    focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text
  `;

  const variantStyles = {
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

  const disabledStyles = disabled
    ? "opacity-50 cursor-not-allowed hover:bg-wiki-white"
    : "cursor-pointer";

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${disabledStyles} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
