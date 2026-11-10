// @vitest-environment jsdom
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  LAST_VISIT_KEY,
  SHOW_FROM_VISIT,
  SUPPORT_ASK,
  SUPPORT_BANNER_KEY,
  VISIT_COUNT_KEY,
  WikiSupportBanner,
  sponsorCheckoutUrl,
} from "./wiki-support-banner";

const nav = vi.hoisted(() => ({ pathname: "/cite" }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.pathname }));
vi.mock("posthog-js", () => ({ default: { capture: vi.fn() } }));

expect.extend(toHaveNoViolations);

// Node 22+ ships its own (disabled) localStorage global, which shadows jsdom's.
const store = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => void store.set(key, String(value)),
  removeItem: (key: string) => void store.delete(key),
  clear: () => store.clear(),
});

const DAY_MS = 24 * 60 * 60 * 1000;
const hiddenForDays = () => (Number(localStorage.getItem(SUPPORT_BANNER_KEY)) - Date.now()) / DAY_MS;
const checkout = () => screen.getByRole("link", { name: /on github/i });

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(VISIT_COUNT_KEY, String(SHOW_FROM_VISIT - 1)); // the next render is a qualifying visit
  nav.pathname = "/cite";
});

describe("WikiSupportBanner", () => {
  it("waits for a returning user: nothing on the first visits, the ask from the third", () => {
    localStorage.clear();

    for (let visit = 1; visit <= SHOW_FROM_VISIT; visit++) {
      localStorage.setItem(LAST_VISIT_KEY, String(Date.now() - 31 * 60 * 1000)); // last visit ended 31 min ago
      const { unmount } = render(<WikiSupportBanner />);
      expect(screen.queryByRole("complementary") !== null).toBe(visit >= SHOW_FROM_VISIT);
      unmount();
    }
  });

  it("counts visits, not page views", () => {
    localStorage.clear();

    for (let page = 0; page < 5; page++) render(<WikiSupportBanner />).unmount();

    expect(localStorage.getItem(VISIT_COUNT_KEY)).toBe("1");
  });

  it("asks for the one-time amount and links straight to GitHub Sponsors checkout", () => {
    render(<WikiSupportBanner />);

    expect(screen.getByRole("complementary", { name: /citation tool we were promised/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: `$${SUPPORT_ASK}` })).toBeChecked();
    expect(checkout()).toHaveAttribute(
      "href",
      `https://github.com/sponsors/aicoder2009/sponsorships?frequency=one-time&amount=${SUPPORT_ASK}`
    );
    expect(checkout()).toHaveAttribute("target", "_blank");
    expect(checkout()).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("checks out whichever amount is picked, including a custom whole-dollar one", () => {
    render(<WikiSupportBanner />);

    fireEvent.click(screen.getByRole("radio", { name: "$25" }));
    expect(checkout()).toHaveAttribute("href", sponsorCheckoutUrl(25));

    fireEvent.click(screen.getByRole("radio", { name: "Other" }));
    expect(screen.getByRole("button", { name: /give on github/i })).toBeDisabled();

    const other = screen.getByRole("spinbutton", { name: /other amount/i });
    fireEvent.change(other, { target: { value: "2.75" } });
    expect(screen.getByRole("button", { name: /give on github/i })).toBeDisabled();

    fireEvent.change(other, { target: { value: "7" } });
    expect(checkout()).toHaveAttribute("href", sponsorCheckoutUrl(7));
  });

  it("thanks the user after they head to checkout and stays hidden for a month", () => {
    render(<WikiSupportBanner />);

    fireEvent.click(checkout());

    expect(screen.getByRole("status")).toHaveTextContent(/thank you/i);
    expect(checkout()).toBeInTheDocument(); // still mounted, so the new tab isn't cancelled
    expect(hiddenForDays()).toBeCloseTo(30, 1);
  });

  it("'Maybe later' hides it for a week", () => {
    render(<WikiSupportBanner />);

    fireEvent.click(screen.getByRole("button", { name: "Maybe later" }));

    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
    expect(hiddenForDays()).toBeCloseTo(7, 1);
  });

  it("'I already gave' says thanks and stays hidden for a year", () => {
    render(<WikiSupportBanner />);

    fireEvent.click(screen.getByRole("button", { name: "I already gave" }));

    expect(screen.getByRole("status")).toHaveTextContent(/won’t ask again for a year/i);
    expect(hiddenForDays()).toBeGreaterThan(364);
  });

  it("stays hidden while snoozed, and on auth and public share pages", () => {
    localStorage.setItem(SUPPORT_BANNER_KEY, String(Date.now() + DAY_MS));
    const { unmount } = render(<WikiSupportBanner />);
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
    unmount();

    localStorage.removeItem(SUPPORT_BANNER_KEY); // still a qualifying returning visitor
    for (const path of ["/sign-in", "/sign-up/verify", "/share/abc123"]) {
      nav.pathname = path;
      const { unmount: done } = render(<WikiSupportBanner />);
      expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
      done();
    }

    nav.pathname = "/cite";
    render(<WikiSupportBanner />);
    expect(screen.getByRole("complementary")).toBeInTheDocument(); // same visitor, ordinary page
  });

  it("has no axe violations", async () => {
    const { container } = render(<WikiSupportBanner />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
