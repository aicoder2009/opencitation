/**
 * OpenCitation component API, transcribed from the React source in
 * src/components/wiki/ and src/components/pwa/ at
 * aicoder2009/opencitation@b69285b.
 *
 * Documentation only — this system ships no runnable bundle. Import the real
 * components from "@/components/wiki" in the Next.js app.
 */

import type { ButtonHTMLAttributes, ReactNode } from "react";

/** Square, bordered, never filled. Both variants share the same box. */
export interface WikiButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** "default" is wiki-text; "primary" is wiki-link at weight 500. No solid fill exists. */
  variant?: "default" | "primary";
  children: ReactNode;
}
export declare function WikiButton(props: WikiButtonProps): JSX.Element;

export interface WikiTab {
  id: string;
  label: string;
  href?: string;
  active?: boolean;
}
export interface WikiTabsProps {
  /** Keep to five or fewer; the strip has no overflow handling. */
  tabs: WikiTab[];
  onTabChange?: (tabId: string) => void;
}
export declare function WikiTabs(props: WikiTabsProps): JSX.Element;

export interface DropdownItem {
  label: string;
  onClick: () => void;
  /** Right-aligned secondary text, e.g. a keyboard shortcut. */
  hint?: string;
}
export interface WikiDropdownProps {
  label: string;
  items: DropdownItem[];
  align?: "left" | "right";
  disabled?: boolean;
}
export declare function WikiDropdown(props: WikiDropdownProps): JSX.Element;

export interface WikiSelectOption {
  value: string;
  label: string;
}
export interface WikiSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: WikiSelectOption[];
  placeholder?: string;
  className?: string;
  /** Required when no visible label is associated with the trigger. */
  "aria-label"?: string;
  "aria-labelledby"?: string;
}
export declare function WikiSelect(props: WikiSelectProps): JSX.Element;

export interface WikiCollapsibleProps {
  title: string;
  children: ReactNode;
  /** Defaults to true — sections open unless there is a reason to hide them. */
  defaultOpen?: boolean;
}
export declare function WikiCollapsible(props: WikiCollapsibleProps): JSX.Element;

export interface BreadcrumbItem {
  label: string;
  /** Omit on the last item; the current page is never a link. */
  href?: string;
}
export interface WikiBreadcrumbsProps {
  items: BreadcrumbItem[];
}
export declare function WikiBreadcrumbs(props: WikiBreadcrumbsProps): JSX.Element;

export interface WikiNoticeProps {
  /** Changes the left rule's weight only: 2px for info, 4px for warn. No hue. */
  variant?: "info" | "warn";
  children: ReactNode;
  className?: string;
  /** Pass to render a [dismiss] link. */
  onDismiss?: () => void;
}
export declare function WikiNotice(props: WikiNoticeProps): JSX.Element;

/** Centred 20px spinner with role="status". Takes no props. */
export declare function WikiSpinner(): JSX.Element;

export interface WikiUserMenuProps {
  /** "md" is a 32px avatar, "sm" is 28px for the mobile header. */
  size?: "sm" | "md";
}
export declare function WikiUserMenu(props: WikiUserMenuProps): JSX.Element;

export interface WikiDatePickerProps {
  /** ISO date string, or "" when unset. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}
export declare function WikiDatePicker(props: WikiDatePickerProps): JSX.Element;

export interface WikiLayoutProps {
  children: ReactNode;
}
export declare function WikiLayout(props: WikiLayoutProps): JSX.Element;

/** Sidebar rail for /docs. Reads the active route itself; takes no props. */
export declare function WikiDocsSidebar(): JSX.Element;
export declare const DOCS_NAV: ReadonlyArray<{ label: string; href: string }>;

/** ⌘K palette. Mounted once by WikiLayout; opens on its own shortcut. */
export declare function WikiCommandPalette(): JSX.Element;

/** Award toast, driven by the useBarnstarAward hook. Takes no props. */
export declare function BarnstarToast(): JSX.Element;

export interface OfflineIndicatorProps {
  position?: "top" | "bottom";
  showSyncStatus?: boolean;
}
export declare function OfflineIndicator(props: OfflineIndicatorProps): JSX.Element;

/** One of ten palette slots, resolved from a tag name by hash. */
export interface TagColor {
  name: string;
  bg: string;
  text: string;
  border: string;
  activeBg: string;
  activeText: string;
  activeBorder: string;
  /** Divider inside an active pill, between the swatch and the label button. */
  activeInnerBorder: string;
}
export declare const TAG_COLORS: TagColor[];
export declare function resolveTagColor(tag: string, map: Record<string, string>): TagColor;
export declare function useTagColors(): {
  getColor: (tag: string) => TagColor;
  setColor: (tag: string, colorName: string) => void;
  clearColor: (tag: string) => void;
};
