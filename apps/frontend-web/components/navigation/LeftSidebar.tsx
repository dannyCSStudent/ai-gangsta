'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Mic2 } from "lucide-react";

import { 
  LuNewspaper, 

  LuSearch,
  LuActivity,
  LuBrainCircuit
} from 'react-icons/lu';
import clsx from 'clsx';

const links = [
  { href: '/', label: 'Intelligence Feed', icon: Home },
  { href: '/news', label: 'News', icon: LuNewspaper },
  { href: '/scan', label: 'Audio Scan', icon: Mic2 },
  { href: '/post-truth', label: 'Truth Scanner', icon: LuSearch },
  { href: '/timeline', label: 'Timeline', icon: LuActivity },
  { href: '/authors', label: 'Author Fingerprint', icon: LuBrainCircuit },
];

export default function LeftSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-60 h-screen backdrop-blur-xl border-r border-zinc-800 bg-black/30 px-4 py-6 fixed left-0 top-0">

      <h1 className="text-2xl font-bold mb-8 tracking-widest text-tron-cyan">
        GANGSTA AI
      </h1>

      <nav className="flex flex-col space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm hover:bg-zinc-800/40',
                pathname === link.href ? 'bg-zinc-800/60 text-white' : 'text-zinc-400'
              )}
            >
              <Icon className="w-5 h-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto text-xs text-zinc-600">
        <p className="opacity-50">Gangsta Intelligence v3</p>
      </div>
    </aside>
  );
}
