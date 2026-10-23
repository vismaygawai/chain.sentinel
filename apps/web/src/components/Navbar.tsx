"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="border-b-2 border-black bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand identity */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-electric border-2 border-black shadow-hard-sm group-hover:rotate-6 transition-transform"></div>
          <div className="flex flex-col">
            <span className="font-display text-2xl font-black uppercase tracking-tight text-black leading-none">
              CHAIN<span className="text-electric">.</span>SENTINEL
            </span>
            <span className="font-serif italic text-xs text-gray-600 tracking-wide mt-0.5">
              Autonomous On-Chain Defense
            </span>
          </div>
        </Link>

        {/* Navigation links & Status indicator */}
        <div className="flex items-center gap-4 sm:gap-8">
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
              href="https://github.com/vismaygawai/ChainSentinel"
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
          <Link href="/dashboard">
            <button className="border-2 border-black px-5 py-2.5 bg-electric text-white font-display text-xs font-black uppercase tracking-widest shadow-hard hover:shadow-hard-md hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">
              Launch App →
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}
