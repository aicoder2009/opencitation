"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { WikiUserMenu } from "./wiki-user-menu";

interface WikiLayoutProps {
  children: React.ReactNode;
}

export function WikiLayout({ children }: WikiLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-wiki-white">
      {/* Header */}
      <header className="border-b border-wiki-border bg-wiki-white">
        <div className="max-w-[960px] mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-wiki-text hover:no-underline">
            <Image
              src="/logo.png"
              alt="OpenCitation"
              width={24}
              height={24}
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
            </SignedOut>
            <SignedIn>
              <Link href="/cite" className="text-wiki-link hover:underline">Cite</Link>
              <Link href="/lists" className="text-wiki-link hover:underline">Lists</Link>
              <Link href="/projects" className="text-wiki-link hover:underline">Projects</Link>
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
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-[960px] mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
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
    </div>
  );
}
