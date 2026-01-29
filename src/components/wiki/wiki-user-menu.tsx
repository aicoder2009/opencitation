"use client";

import { useState, useRef, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import Image from "next/image";

interface WikiUserMenuProps {
  size?: "sm" | "md";
}

export function WikiUserMenu({ size = "md" }: WikiUserMenuProps) {
  const { user, isLoaded } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const avatarSize = size === "sm" ? 28 : 32;

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  if (!isLoaded || !user) {
    return (
      <div
        className="rounded-full bg-wiki-border-light animate-pulse"
        style={{ width: avatarSize, height: avatarSize }}
      />
    );
  }

  const displayName = user.username || user.firstName || "User";
  const email = user.primaryEmailAddress?.emailAddress || "";

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full focus:outline-none"
        style={{ width: avatarSize, height: avatarSize }}
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        {user.imageUrl ? (
          <Image
            src={user.imageUrl}
            alt={displayName}
            width={avatarSize}
            height={avatarSize}
            className="rounded-full"
            style={{ width: avatarSize, height: avatarSize }}
          />
        ) : (
          <div
            className="rounded-full bg-wiki-tab-bg flex items-center justify-center text-wiki-text text-xs font-bold"
            style={{ width: avatarSize, height: avatarSize }}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-wiki-white border border-wiki-border z-50">
          {/* User Info */}
          <div className="px-3 py-2 border-b border-wiki-border-light">
            <div className="font-bold text-wiki-text text-sm truncate">
              {displayName}
            </div>
            {email && (
              <div className="text-wiki-text-muted text-xs truncate">
                {email}
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={() => {
                openUserProfile();
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 text-sm text-wiki-link hover:bg-wiki-offwhite hover:underline"
            >
              Manage account
            </button>
            <button
              onClick={() => {
                signOut({ redirectUrl: "/" });
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 text-sm text-wiki-link hover:bg-wiki-offwhite hover:underline"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
