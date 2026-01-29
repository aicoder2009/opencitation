"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { WikiUserMenu } from "./wiki-user-menu";

interface WikiLayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
}

export function WikiLayout({ children, hideFooter = false }: WikiLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-wiki-white">
      {/* Header */}
      <header className="border-b border-wiki-border bg-wiki-white">
        <div className="max-w-[960px] mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 text-2xl md:text-3xl font-bold text-wiki-text hover:no-underline">
            <Image
              src="/logo.png"
              alt="OpenCitation"
              width={40}
              height={40}
              className=""
            />
            OpenCitation
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden sm:flex items-center gap-4 text-sm">
            <SignedOut>
              <Link href="/cite" className="text-wiki-link hover:underline">Cite</Link>
              <Link href="/sign-in" className="text-wiki-link hover:underline">Sign In</Link>
              <Link href="/sign-up" className="text-wiki-link hover:underline">Create Account</Link>
              <a
                href="https://github.com/aicoder2009/opencitation"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2 py-1 border border-wiki-border-light bg-wiki-offwhite hover:bg-wiki-tab-bg text-wiki-text text-xs"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                GitHub
              </a>
            </SignedOut>
            <SignedIn>
              <Link href="/home" className="text-wiki-link hover:underline">Dashboard</Link>
              <Link href="/cite" className="text-wiki-link hover:underline">Cite</Link>
              <Link href="/lists" className="text-wiki-link hover:underline">Lists</Link>
              <Link href="/projects" className="text-wiki-link hover:underline">Projects</Link>
              <a
                href="https://github.com/aicoder2009/opencitation"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2 py-1 border border-wiki-border-light bg-wiki-offwhite hover:bg-wiki-tab-bg text-wiki-text text-xs"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                GitHub
              </a>
              <WikiUserMenu size="md" />
            </SignedIn>
          </nav>

          {/* Mobile Nav Toggle */}
          <div className="flex sm:hidden items-center gap-3">
            <SignedIn>
              <WikiUserMenu size="sm" />
            </SignedIn>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1 text-wiki-text"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-wiki-border-light bg-wiki-offwhite">
            <nav className="max-w-[960px] mx-auto px-4 py-3 flex flex-col gap-2 text-sm">
              <Link
                href="/cite"
                className="text-wiki-link hover:underline py-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                Cite
              </Link>
              <SignedOut>
                <Link
                  href="/sign-in"
                  className="text-wiki-link hover:underline py-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="text-wiki-link hover:underline py-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Create Account
                </Link>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/home"
                  className="text-wiki-link hover:underline py-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/lists"
                  className="text-wiki-link hover:underline py-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Lists
                </Link>
                <Link
                  href="/projects"
                  className="text-wiki-link hover:underline py-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Projects
                </Link>
              </SignedIn>
              <a
                href="https://github.com/aicoder2009/opencitation"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 py-1 text-wiki-text hover:underline"
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                GitHub
              </a>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-[960px] mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      {!hideFooter && (
        <footer className="border-t border-wiki-border-light mt-12">
          <div className="max-w-[960px] mx-auto px-4 py-6 text-sm text-wiki-text-muted">
            <p>
              OpenCitation is a free citation manager.{" "}
              <a href="https://github.com/aicoder2009/opencitation" target="_blank" rel="noopener noreferrer" className="text-wiki-link hover:underline">
                View source on GitHub
              </a>
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
