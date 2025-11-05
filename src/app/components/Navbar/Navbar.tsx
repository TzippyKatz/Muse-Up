"use client";
import React, { useState } from "react";
import Link from "next/link";
import styles from "./Navbar.module.css";
import { Home, Search, PlusSquare, Bell, MessageCircle, User, LogOut, Bookmark, Settings } from "lucide-react";

export default function Navbar() {
  const [query, setQuery] = useState("");
  const [openMenu, setOpenMenu] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-3 sm:h-16 sm:gap-4 sm:px-6">
        <Link href="/feed" className="flex items-center gap-2" aria-label="MuseUp home">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-indigo-600 text-white font-bold">MU</div>
          <span className="hidden text-lg font-semibold sm:inline">MuseUp</span>
        </Link>

        <form
          action="/explore"
          className="relative ml-2 hidden flex-1 items-center sm:flex"
          aria-label="Search artworks, artists, tags"
          onSubmit={(e) => {
            if (!query.trim()) e.preventDefault();
          }}
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            name="q"
            placeholder="Search artists, artworks, #tags"
            className="w-full rounded-lg border px-9 py-2 text-sm outline-none ring-0 focus:border-indigo-500"
          />
        </form>

        <nav className="ml-auto hidden items-center gap-2 sm:flex" aria-label="Primary">
          <Link href="/feed" className={styles.navBtn} aria-label="Home">
            <Home className="h-5 w-5" />
          </Link>
          <Link href="/explore" className={styles.navBtn} aria-label="Explore">
            <Search className="h-5 w-5" />
          </Link>
          <Link href="/create" className={styles.navBtnPrimary} aria-label="Create new post">
            <PlusSquare className="h-5 w-5" />
            <span className="hidden md:inline">Create</span>
          </Link>
          <Link href="/notifications" className={`${styles.navBtn} relative`} aria-label="Notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-red-500 text-[10px] text-white">3</span>
          </Link>
          <Link href="/messages" className={styles.navBtn} aria-label="Messages">
            <MessageCircle className="h-5 w-5" />
          </Link>

          <div className="relative">
            <button
              className={styles.navAvatar}
              onClick={() => setOpenMenu((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={openMenu}
              aria-label="User menu"
            >
              <img
                src="https://i.pravatar.cc/64?u=museup"
                alt="Your avatar"
                className="h-8 w-8 rounded-full object-cover"
              />
            </button>
            {openMenu && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border bg-white shadow-xl"
              >
                <Link role="menuitem" href="/profile/me" className={styles.menuItem}>
                  <User className="h-4 w-4" /> Profile
                </Link>
                <Link role="menuitem" href="/collections" className={styles.menuItem}>
                  <Bookmark className="h-4 w-4" /> Collections
                </Link>
                <Link role="menuitem" href="/settings" className={styles.menuItem}>
                  <Settings className="h-4 w-4" /> Settings
                </Link>
                <hr />
                <button role="menuitem" className={`${styles.menuItem} w-full text-left`}>
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              </div>
            )}
          </div>
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:hidden">
          <Link href="/create" className={styles.navBtnPrimary} aria-label="Create new post">
            <PlusSquare className="h-5 w-5" />
          </Link>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 grid h-14 grid-cols-5 border-t bg-white sm:hidden" aria-label="Bottom navigation">
        <Link href="/feed" className={styles.tabBtn} aria-label="Home"><Home className="h-5 w-5" /></Link>
        <Link href="/explore" className={styles.tabBtn} aria-label="Explore"><Search className="h-5 w-5" /></Link>
        <Link href="/create" className={styles.tabBtn} aria-label="Create"><PlusSquare className="h-5 w-5" /></Link>
        <Link href="/notifications" className={`${styles.tabBtn} relative`} aria-label="Notifications">
          <Bell className="h-5 w-5" />
          <span className="absolute right-5 top-1 grid h-4 w-4 place-items-center rounded-full bg-red-500 text-[10px] text-white">3</span>
        </Link>
        <Link href="/profile/me" className={styles.tabBtn} aria-label="Profile"><User className="h-5 w-5" /></Link>
      </nav>
    </header>
  );
}