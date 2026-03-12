"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "News Feed", icon: "📡" },
  { href: "/models", label: "Models", icon: "🧠" },
  { href: "/question", label: "Question", icon: "🎯" },
  { href: "/challenge", label: "Daily Challenge", icon: "⚡" },
  { href: "/jobs", label: "Jobs", icon: "💼" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold text-white">
          AI<span className="text-blue-500">Pulse</span>
        </Link>
        <div className="flex gap-1">
          {NAV_ITEMS.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname === href
                  ? "bg-blue-600 text-white"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <span className="mr-1.5">{icon}</span>
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
