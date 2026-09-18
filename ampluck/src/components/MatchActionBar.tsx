import React from 'react';
import { Filter, Sparkles, Flame, Bot } from 'lucide-react';

interface MatchActionBarProps {
  userProfit?: number;
  showOnlyMyMatches: boolean;
  onToggleMyMatches: () => void;
  onCreateMatch: () => void;
}

export const MatchActionBar: React.FC<MatchActionBarProps> = ({
  showOnlyMyMatches,
  onToggleMyMatches,
  onCreateMatch,
}) => {
  return (
    <div className="w-full bg-[#0d1322]/90 backdrop-blur-md border border-[#1b263b] rounded-2xl p-3 sm:p-3.5 mb-3 flex items-center justify-between select-none shadow-[0_4px_20px_rgba(0,0,0,0.4)] gap-3 flex-wrap">
      {/* Action buttons: Create Match */}
      <div className="flex items-center gap-2">
        <button
          onClick={onCreateMatch}
          id="btn-create-match"
          className="relative group overflow-hidden bg-gradient-to-r from-[#3b82f6] via-[#3b82f6] to-[#1d4ed8] hover:from-[#60a5fa] hover:to-[#3b82f6] text-slate-950 font-gaming font-black text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer shadow-[0_0_20px_rgba(59,130,246,0.35)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] flex items-center gap-2"
        >
          <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <i className="fa-solid fa-paw text-base text-slate-950 transition-transform group-hover:scale-110" />
          <span className="tracking-wider uppercase">Create Coinflip</span>
        </button>
      </div>

      {/* Filter Segmented Pills */}
      <div className="flex items-center gap-1.5 bg-[#090e18] p-1 rounded-xl border border-[#182337]">
        <button
          onClick={() => {
            if (showOnlyMyMatches) onToggleMyMatches();
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-gaming font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            !showOnlyMyMatches
              ? 'bg-[#152033] text-[#3b82f6] border border-[#3b82f6]/30 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Flame className={`w-3.5 h-3.5 ${!showOnlyMyMatches ? 'text-[#3b82f6]' : 'text-slate-500'}`} />
          <span>All Battles</span>
        </button>

        <button
          onClick={() => {
            if (!showOnlyMyMatches) onToggleMyMatches();
          }}
          id="btn-my-matches"
          className={`px-3 py-1.5 rounded-lg text-xs font-gaming font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            showOnlyMyMatches
              ? 'bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/50 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Filter to only matches you created"
        >
          <Filter className={`w-3.5 h-3.5 ${showOnlyMyMatches ? 'text-[#3b82f6]' : 'text-slate-500'}`} />
          <span>My Battles</span>
          {showOnlyMyMatches && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-pulse" />
          )}
        </button>
      </div>
    </div>
  );
};
