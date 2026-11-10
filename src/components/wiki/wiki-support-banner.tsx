"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import { WikiButton, wikiButtonClasses } from "./wiki-button";

const SPONSORS_URL = "https://github.com/sponsors/aicoder2009";
const HELP_URL =
  "https://docs.github.com/en/sponsors/sponsoring-open-source-contributors/sponsoring-an-open-source-contributor";
const CONTRIBUTE_URL = "https://github.com/aicoder2009/opencitation#contributing";

/**
 * The ask: a small, specific number with a reason attached ("less than a penny a
 * day for a year" — keep that line true if this changes). GitHub Sponsors only
 * charges whole dollars (its API takes an Int), so $3 is the closest it gets to
 * Wikipedia's $2.75; an exact-cents ask would need a Stripe Payment Link.
 */
export const SUPPORT_ASK = 3;
const AMOUNTS = [SUPPORT_ASK, 10, 25, 50, 100];

export const SUPPORT_BANNER_KEY = "opencitation-support-hidden-until";
export const VISIT_COUNT_KEY = "opencitation-visits";
export const LAST_VISIT_KEY = "opencitation-last-visit";
/** Only ask people who keep coming back: the banner first appears on this visit. */
export const SHOW_FROM_VISIT = 3;
const VISIT_GAP_MS = 30 * 60 * 1000; // 30 idle minutes starts a new visit (the usual analytics session rule)
const DAY_MS = 24 * 60 * 60 * 1000;
const SNOOZE_MS = 7 * DAY_MS; // "Maybe later" and close
const CHECKOUT_MS = 30 * DAY_MS; // Clicked Give, but may have bounced at GitHub's login wall
const THANKS_MS = 365 * DAY_MS; // Says they already gave

// Auth flows, and public share pages whose viewers may never have used the app.
const HIDDEN_ON = ["/sign-in", "/sign-up", "/share"];

export function sponsorCheckoutUrl(amount: number) {
  return `${SPONSORS_URL}/sponsorships?frequency=one-time&amount=${amount}`;
}

function isSnoozed() {
  try {
    return Number(localStorage.getItem(SUPPORT_BANNER_KEY)) > Date.now();
  } catch {
    return false;
  }
}

/** Counts visits, not page views, and returns the current visit number. */
function recordVisit(now: number) {
  try {
    const last = Number(localStorage.getItem(LAST_VISIT_KEY)) || 0;
    let count = Number(localStorage.getItem(VISIT_COUNT_KEY)) || 0;
    if (now - last >= VISIT_GAP_MS) count += 1;
    localStorage.setItem(VISIT_COUNT_KEY, String(count));
    localStorage.setItem(LAST_VISIT_KEY, String(now));
    return count;
  } catch {
    return 0; // Storage unavailable: we can't spot a returning user, so don't ask.
  }
}

function snooze(ms: number) {
  try {
    localStorage.setItem(SUPPORT_BANNER_KEY, String(Date.now() + ms));
  } catch {
    // Storage unavailable: the banner just comes back next visit.
  }
}

// Wikipedia's banner cream. Dark mode stays lighter-handed so links keep 4.5:1.
const tint = "bg-wiki-warning/40 dark:bg-wiki-warning/20";
const link =
  "text-wiki-link hover:underline focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text";

/**
 * Fundraising appeal modelled on Wikipedia's 2025 banner: a dated saffron
 * letter on the left, a one-time GitHub Sponsors form on the right.
 */
export function WikiSupportBanner() {
  const pathname = usePathname();
  const id = useId();
  const [today, setToday] = useState<Date | null>(null);
  const [phase, setPhase] = useState<"ask" | "checkout" | "thanks" | "closed">("ask");
  const [choice, setChoice] = useState<number | "other">(SUPPORT_ASK);
  const [otherAmount, setOtherAmount] = useState("");

  useEffect(() => {
    // Client-only: visits and dismissal live in localStorage, and the letter is dated today.
    const visit = recordVisit(Date.now());
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (visit >= SHOW_FROM_VISIT && !isSnoozed()) setToday(new Date());
  }, []);

  if (!today || phase === "closed" || HIDDEN_ON.some((p) => pathname?.startsWith(p))) {
    return null;
  }

  const amount = choice === "other" ? Number(otherAmount) : choice;
  const canGive = Number.isInteger(amount) && amount >= 1; // GitHub takes whole dollars only
  const dayMonth = today.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const fullDate = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const dismiss = (reason: "close" | "later") => {
    snooze(SNOOZE_MS);
    setPhase("closed");
    posthog.capture("support_banner_dismissed", { reason });
  };

  const alreadyGave = () => {
    snooze(THANKS_MS);
    setPhase("thanks");
    posthog.capture("support_banner_dismissed", { reason: "already_gave" });
  };

  // The link itself opens GitHub; keep it mounted so the navigation isn't cancelled.
  const startCheckout = () => {
    snooze(CHECKOUT_MS);
    setPhase("checkout");
    posthog.capture("support_banner_checkout_clicked", { amount });
  };

  if (phase === "thanks") {
    return (
      <div className="max-w-[960px] mx-auto px-4 pt-6">
        <div role="status" className={`flex items-start justify-between gap-3 px-4 py-3 text-sm ${tint}`}>
          <p>
            <strong>Thank you for supporting OpenCitation.</strong> We won’t ask again for a year.
          </p>
          <button type="button" onClick={() => setPhase("closed")} className={link}>
            [close]
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[960px] mx-auto px-4 pt-6">
      <aside
        aria-labelledby={`${id}-title`}
        className="relative grid gap-4 md:grid-cols-[minmax(0,1fr)_16rem] md:gap-x-6 md:gap-y-3"
      >
        {/* The letter */}
        <div className={`relative px-5 py-5 sm:px-8 sm:py-6 ${tint}`}>
          <div className="mb-4 px-6 text-center">
            <p id={`${id}-title`} className="inline-flex items-center gap-2 text-lg font-bold leading-snug">
              <InfoIcon />
              The citation tool we were promised
            </p>
            <p className="text-sm">{dayMonth}: A note for everyone who cites with OpenCitation.</p>
          </div>
          <div className="space-y-3">
            <p>
              Please don’t skip this 1-minute read. It’s {fullDate}, and if you’ve lost count of how many
              citations you’ve made with OpenCitation, we hope that means it’s saved you at least $
              {SUPPORT_ASK} worth of time. Please give what you can to help keep it free, ad-free, and open
              to everyone.
            </p>
            <p className="hidden sm:block">
              OpenCitation is the citation tool we were promised: open source, with no ads, no paywalls, and
              no premium tier. Every lookup, saved list, and share link runs on servers that cost money every
              month, and keeping up with each new edition of APA, MLA, and Chicago takes real time. We’d
              rather those costs be covered by the people who use it than by ads.
            </p>
            <p className="hidden sm:block">
              Most people never give, so your gift matters.{" "}
              <strong>
                If OpenCitation has saved you ${SUPPORT_ASK} worth of time, please give ${SUPPORT_ASK} right
                now
              </strong>
              —that’s less than a penny a day for a year. It’s a one-time gift, not a subscription.
              Thank you.
            </p>
          </div>
          <div className="mt-5 hidden sm:flex items-center justify-center gap-3">
            <Image src="/logo.png" alt="" width={28} height={28} />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">OpenCitation</span>
            <span className="text-sm">Proudly free and open source</span>
          </div>
          {/* Speech-bubble tail pointing at the form */}
          <svg
            aria-hidden
            viewBox="0 0 8 16"
            className="hidden md:block absolute top-1/2 -right-2 -mt-2 w-2 h-4 fill-wiki-warning/40 dark:fill-wiki-warning/20"
          >
            <path d="M0 0l8 8-8 8z" />
          </svg>
        </div>

        {/* The form */}
        <div className="text-sm md:col-start-2 md:row-start-1 md:row-span-2">
          <p className="pr-8 font-medium">1. How often would you like to give?</p>
          <p className="mt-1 pl-4">
            <strong>Once.</strong> <span className="text-wiki-text-muted">OpenCitation doesn’t do subscriptions.</span>
          </p>

          <fieldset className="mt-4">
            <legend className="font-medium">2. Please select an amount (USD)</legend>
            <div className="mt-2 grid grid-cols-3 gap-2 pl-4">
              {AMOUNTS.map((a) => (
                <label key={a} className="flex items-center gap-1.5 font-bold cursor-pointer">
                  <input
                    type="radio"
                    name={`${id}-amount`}
                    checked={choice === a}
                    onChange={() => setChoice(a)}
                  />
                  ${a}
                </label>
              ))}
              <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                <input
                  type="radio"
                  name={`${id}-amount`}
                  checked={choice === "other"}
                  onChange={() => setChoice("other")}
                />
                Other
              </label>
            </div>
            {choice === "other" && (
              <input
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={otherAmount}
                onChange={(e) => setOtherAmount(e.target.value)}
                placeholder="Whole dollars"
                aria-label="Other amount in US dollars"
                className="mt-2 w-full"
                autoFocus
              />
            )}
          </fieldset>

          <p className="mt-4 font-medium">3. Finish on GitHub Sponsors</p>
          <p className="mt-1 pl-4 text-wiki-text-muted">Secure checkout with a free GitHub account.</p>

          <div className="mt-4">
            {canGive ? (
              <a
                href={sponsorCheckoutUrl(amount)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={startCheckout}
                className={`${wikiButtonClasses("primary")} block w-full text-center`}
              >
                Give ${amount} on GitHub <span aria-hidden>›</span>
              </a>
            ) : (
              <WikiButton variant="primary" disabled className="w-full">
                Give on GitHub <span aria-hidden>›</span>
              </WikiButton>
            )}
            {phase === "checkout" && (
              <p role="status" className="mt-2 text-center">
                Thank you! Finish your gift in the GitHub tab that just opened.
              </p>
            )}
          </div>
          <p className="mt-3 text-center">
            <button type="button" onClick={() => dismiss("later")} className={`${link} font-bold`}>
              Maybe later
            </button>
          </p>
        </div>

        {/* Below the letter */}
        <div className="text-center md:col-start-1 md:row-start-2">
          <p className="text-sm font-medium">
            <a href={HELP_URL} target="_blank" rel="noopener noreferrer" className={link}>
              Problems giving?
            </a>
            <span aria-hidden className="mx-2 text-wiki-text-muted">|</span>
            <a href={CONTRIBUTE_URL} target="_blank" rel="noopener noreferrer" className={link}>
              Other ways to help
            </a>
            <span aria-hidden className="mx-2 text-wiki-text-muted">|</span>
            <button type="button" onClick={alreadyGave} className={`${link} font-medium`}>
              I already gave
            </button>
          </p>
          <p className="mt-2 hidden sm:block text-xs text-wiki-text-muted">
            Payments are handled by GitHub Sponsors, so OpenCitation never sees your card details. You’ll
            need a free GitHub account. A one-time gift is charged once — there’s nothing to cancel.
          </p>
        </div>

        <button
          type="button"
          onClick={() => dismiss("close")}
          aria-label="Close"
          className="absolute top-0 right-0 px-1.5 text-xl leading-none text-wiki-text-muted hover:text-wiki-text transition-colors focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
        >
          ×
        </button>
      </aside>
    </div>
  );
}

function InfoIcon() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="w-6 h-6 shrink-0">
      <circle cx="10" cy="10" r="10" className="fill-wiki-warning" />
      <text
        x="10"
        y="15"
        textAnchor="middle"
        fontSize="14"
        fontWeight="bold"
        fontStyle="italic"
        className="fill-wiki-text dark:fill-wiki-white"
      >
        i
      </text>
    </svg>
  );
}
