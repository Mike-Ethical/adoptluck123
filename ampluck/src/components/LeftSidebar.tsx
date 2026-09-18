import React from 'react';
import { Coins, Trophy, HelpCircle, Shield, Scale, MessageSquare, ExternalLink } from 'lucide-react';

export type NavTab = 'coinflip' | 'leaderboard' | 'faq' | 'tos' | 'fair';

interface LeftSidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenFairStats: () => void;
  onOpenTos: () => void;
  onOpenFaq: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenFairStats,
  onOpenTos,
  onOpenFaq,
}) => {
  return (
    <aside className="hidden lg:flex w-20 bg-[#030a1b] border-r border-[#162033] flex-col justify-between items-center py-5 select-none shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.4)]">
      {/* Top section: Main icon menu items */}
      <div className="flex flex-col items-center gap-4 w-full">
        {/* Navigation list */}
        <nav className="flex flex-col items-center gap-3 w-full px-2.5">
          {/* COINFLIP */}
          <button
            id="nav-btn-coinflip"
            onClick={() => onSelectTab('coinflip')}
            className={`w-full flex flex-col items-center py-3 px-1 rounded-xl transition-all duration-200 cursor-pointer ${
              currentTab === 'coinflip'
                ? 'bg-gradient-to-b from-[#141f30] to-[#0f1724] text-white shadow-[0_0_15px_rgba(59,130,246,0.2)] border border-[#3b82f6]/50'
                : 'text-slate-400 hover:text-white hover:bg-[#121926] border border-transparent'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <i
                className={`fa-solid fa-gamepad text-xl mb-1.5 transition-transform hover:scale-110 ${
                  currentTab === 'coinflip' ? 'text-[#3b82f6]' : 'text-slate-400'
                }`}
              />
              {currentTab === 'coinflip' && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#3b82f6] animate-pulse shadow-[0_0_6px_#3b82f6]" />
              )}
            </div>
            <span className="font-gaming text-[11px] font-black tracking-wider leading-none">
              FLIP
            </span>
          </button>

          {/* LEADERBOARD */}
          <button
            id="nav-btn-leaderboard"
            onClick={() => onSelectTab('leaderboard')}
            className={`w-full flex flex-col items-center py-3 px-1 rounded-xl transition-all duration-200 cursor-pointer ${
              currentTab === 'leaderboard'
                ? 'bg-gradient-to-b from-[#141f30] to-[#0f1724] text-white shadow-[0_0_15px_rgba(59,130,246,0.2)] border border-[#3b82f6]/50'
                : 'text-slate-400 hover:text-white hover:bg-[#121926] border border-transparent'
            }`}
          >
            <Trophy
              className={`w-5 h-5 mb-1.5 transition-transform hover:scale-110 ${
                currentTab === 'leaderboard' ? 'text-[#3b82f6]' : 'text-slate-400'
              }`}
            />
            <span className="font-gaming text-[10px] font-black tracking-wider leading-none text-center">
              RANKS
            </span>
          </button>

          {/* FAQ */}
          <button
            id="nav-btn-faq"
            onClick={onOpenFaq}
            className="w-full flex flex-col items-center py-3 px-1 rounded-xl transition-all duration-200 text-slate-400 hover:text-white hover:bg-[#121926] border border-transparent cursor-pointer"
          >
            <HelpCircle className="w-5 h-5 mb-1.5 text-slate-400 hover:text-[#3b82f6] transition-colors" />
            <span className="font-gaming text-[11px] font-black tracking-wider leading-none">
              FAQ
            </span>
          </button>
        </nav>
      </div>

      {/* Bottom section matching screenshot: TOS, FAIR STATS, Discord */}
      <div className="flex flex-col items-center gap-3.5 w-full px-2 text-center">
        {/* TOS */}
        <button
          onClick={onOpenTos}
          id="btn-sidebar-tos"
          className="text-[10px] font-gaming font-bold text-slate-400 hover:text-white transition uppercase tracking-wider py-1 cursor-pointer"
        >
          TOS
        </button>

        {/* FAIR STATS */}
        <button
          onClick={onOpenFairStats}
          id="btn-sidebar-fairstats"
          className="flex flex-col items-center text-[9px] font-gaming font-black text-slate-400 hover:text-[#3b82f6] transition uppercase tracking-wider py-1 cursor-pointer"
          title="Provably Fair Cryptographic Verification"
        >
          <span>FAIR</span>
          <span>STATS</span>
        </button>

        {/* Discord / Community icon */}
        <a
          href="https://discord.com"
          target="_blank"
          rel="noreferrer"
          className="w-9 h-9 rounded-xl bg-[#121826] hover:bg-[#5865F2] border border-[#1e2a40] hover:border-[#5865F2] text-slate-400 hover:text-white flex items-center justify-center transition-all duration-200 shadow-sm cursor-pointer"
          title="Join Adopt Me AdmLuck Community Discord"
        >
          {/* Discord SVG icon */}
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
        </a>
      </div>
    </aside>
  );
};
