"use client";

import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

interface WikiLayoutProps {
  children: React.ReactNode;
}

export function WikiLayout({ children }: WikiLayoutProps) {
  return (
    <div className="min-h-screen bg-wiki-white">
      {/* Header */}
      <header className="border-b border-wiki-border bg-wiki-white">
        <div className="max-w-[960px] mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-wiki-text hover:no-underline">
            OpenCitation
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <SignedOut>
              <Link href="/sign-in" className="text-wiki-link hover:underline">Sign In</Link>
              <Link href="/sign-up" className="text-wiki-link hover:underline">Create Account</Link>
            </SignedOut>
            <SignedIn>
              <Link href="/lists" className="text-wiki-link hover:underline">My Lists</Link>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8"
                  }
                }}
              />
            </SignedIn>
          </nav>
        </div>
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
