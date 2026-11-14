"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { motion } from "framer-motion";
import { BookOpen, Brain, Feather, Leaf, MessageCircle, Settings, Sun } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { cx, ErrorNote, Loading, Wordmark } from "./ui";

const NAV = [
  { href: "/today", label: "Today", icon: Sun },
  { href: "/mind", label: "Mind", icon: Brain },
  { href: "/soul", label: "Soul", icon: Feather },
  { href: "/intellect", label: "Intellect", icon: BookOpen },
  { href: "/life", label: "My Life", icon: Leaf },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { ready, mode, session, profile, error, reloadProfile } = useApp();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (!ready) return;
    if (mode === "cloud" && !session) router.replace("/auth");
    else if (!profile?.onboarded_at && !error) router.replace("/welcome");
  }, [ready, mode, session, profile, error, router]);

  if (!ready) return <Loading />;
  if (error)
    return (
      <div className="mx-auto max-w-md px-6 py-24">
        <ErrorNote onRetry={() => void reloadProfile()}>{error}</ErrorNote>
      </div>
    );
  if (!profile?.onboarded_at || (mode === "cloud" && !session)) return <Loading />;

  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-forest focus:px-4 focus:py-2 focus:text-ivory">
        Skip to content
      </a>

      <header className="sticky top-0 z-30 border-b border-line/70 bg-ivory/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
          <Link href="/today" aria-label="Sukoon — Today">
            <Wordmark />
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => {
              const active = path.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={cx("relative rounded-full px-4 py-2 text-sm transition-colors", active ? "text-forest" : "text-muted hover:text-forest")}
                >
                  {active && (
                    <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-sage-soft" transition={{ type: "spring", stiffness: 380, damping: 34 }} />
                  )}
                  <span className="relative">{n.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-1">
            {mode === "local" && (
              <Link href="/settings#storage" className="mr-1 hidden rounded-full border border-sand px-3 py-1 text-[11px] tracking-wide text-muted sm:inline-block" title="Your data is stored only in this browser">
                Local mode
              </Link>
            )}
            {profile.ai_mode !== "off" && (
              <Link
                href="/companion"
                aria-label="Reflection companion"
                title="Reflection companion"
                className={cx("inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-sage-soft/70", path.startsWith("/companion") ? "bg-sage-soft text-forest" : "text-muted")}
              >
                <MessageCircle size={18} strokeWidth={1.6} />
              </Link>
            )}
            <Link
              href="/settings"
              aria-label="Settings and privacy"
              title="Settings and privacy"
              className={cx("inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-sage-soft/70", path.startsWith("/settings") ? "bg-sage-soft text-forest" : "text-muted")}
            >
              <Settings size={18} strokeWidth={1.6} />
            </Link>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-6xl px-5 pb-32 pt-10 md:px-8 md:pb-24 md:pt-16">
        <motion.div key={path.split("/")[1]} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}>
          {children}
        </motion.div>
      </main>

      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ivory/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        <ul className="mx-auto flex max-w-md justify-around px-2">
          {NAV.map((n) => {
            const active = path.startsWith(n.href);
            const Icon = n.icon;
            return (
              <li key={n.href}>
                <Link href={n.href} aria-current={active ? "page" : undefined} className={cx("flex w-16 flex-col items-center gap-1 py-2.5 text-[10.5px] tracking-wide transition-colors", active ? "text-forest" : "text-stone")}>
                  <Icon size={20} strokeWidth={active ? 1.9 : 1.5} />
                  {n.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
