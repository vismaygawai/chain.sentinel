"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="border-b-2 border-black bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        
        {/* Brand identity */}
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-electric border-2 border-black shadow-hard-sm group-hover:rotate-6 transition-transform"></div>
          <div className="flex flex-col">
            <span className="font-display text-lg sm:text-2xl font-black uppercase tracking-tight text-black leading-none">
              CHAIN<span className="text-electric">.</span>SENTINEL
            </span>
            <span className="font-serif italic text-[11px] sm:text-xs text-gray-600 tracking-wide mt-0.5">
              Autonomous On-Chain Defense
            </span>
          </div>
        </Link>

        {/* Navigation links & Status indicator */}
        <div className="flex items-center gap-3 sm:gap-8">
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className={`text-xs font-black uppercase tracking-widest transition-colors ${
                pathname === "/" ? "text-electric underline underline-offset-4" : "text-black hover:text-electric"
              }`}
            >
              Intelligence
            </Link>
            <Link
              href="/dashboard"
              className={`text-xs font-black uppercase tracking-widest transition-colors ${
                pathname === "/dashboard" ? "text-electric underline underline-offset-4" : "text-black hover:text-electric"
              }`}
            >
              Operations Center
            </Link>
            <a
              href="https://github.com/vismaygawai/chain.sentinel"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-black uppercase tracking-widest text-black hover:text-electric transition-colors"
            >
              GitHub
            </a>
          </nav>

          {/* Engine status indicator */}
          <div className="hidden lg:flex items-center gap-2 border-2 border-black px-3 py-1.5 shadow-hard-sm bg-white">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></span>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-black">
              ADK-TS // ACTIVE
            </span>
          </div>

          {/* Launch / Action CTA */}
          <Link href="/dashboard" className="shrink-0">
            <button className="border-2 border-black px-3 py-1.5 sm:px-5 sm:py-2.5 bg-electric text-white font-display text-[11px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest whitespace-nowrap shadow-hard-sm sm:shadow-hard hover:shadow-hard-md hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">
              Launch App →
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}
