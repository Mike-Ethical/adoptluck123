import React from 'react';
import { CoinflipMatch, User } from '../types';
import { SideBadge } from './CoinChip';
import { PetImage } from './PetImage';
import { Eye, Sparkles, X, Trophy, Bot } from 'lucide-react';
import { formatCompactValue } from '../utils/format';

interface MatchFeedProps {
  matches: CoinflipMatch[];
  currentUser: User;
  onJoinMatch: (match: CoinflipMatch) => void;
  onViewFairness: (match: CoinflipMatch) => void;
  onWatchFlip: (match: CoinflipMatch) => void;
  onCancelMatch?: (match: CoinflipMatch) => void;
  onAdminCallOpponent?: (match: CoinflipMatch) => void;
}

export const MatchFeed: React.FC<MatchFeedProps> = ({
  matches,
  currentUser,
  onJoinMatch,
  onViewFairness,
  onWatchFlip,
  onCancelMatch,
  onAdminCallOpponent,
}) => {
  if (matches.length === 0) {
    return (
      <div className="bg-[#0e1422] border border-[#1b263b] rounded-2xl p-10 text-center text-slate-400 font-sans shadow-lg">
        <div className="w-12 h-12 rounded-full bg-[#151f33] border border-[#23324d] mx-auto flex items-center justify-center text-slate-500 mb-3">
          <i className="fa-solid fa-ghost text-lg" />
        </div>
        <p className="font-gaming font-bold text-slate-300 text-sm">No active coinflips in feed</p>
        <p className="text-xs text-slate-500 mt-1">Create a new coinflip!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 select-none w-full">
      {matches.map((match) => {
        const isWaiting = match.status === 'WAITING';
        const isFlipping = match.status === 'FLIPPING';
        const isCompleted = match.status === 'COMPLETED';
        const isCreator = match.creator.userId === currentUser.id;

        const totalVal = Math.round(match.creator.totalValue);
        const pets = match.creator.items || [];
        const opponentSide = match.creator.side === 'HEADS' ? 'TAILS' : 'HEADS';

        // Range calculation (±5% acceptable join value matching screenshot 178 - 197 for 188)
        const minRange = Math.max(1, Math.floor(totalVal * 0.95));
        const maxRange = Math.ceil(totalVal * 1.05);

        return (
          <div
            key={match.id}
            id={`match-card-${match.id}`}
            className="w-full bg-[#0d1424] hover:bg-[#10182b] rounded-2xl p-4 sm:p-5 border border-[#1c273e] hover:border-[#283857] transition-all duration-150 shadow-xl flex flex-col gap-4 relative overflow-hidden"
          >
            {/* Top & Middle Section */}
            <div className="flex items-start justify-between gap-4">
              {/* Left Column: Creator Header, Wagered Pets, Opponent Paw */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                {/* 1. Creator Info: Creator Paw + Circular Avatar + Big Bold Username */}
                <div className="flex items-center gap-3">
                  <div className="shrink-0" title={`Creator chosen side: ${match.creator.side}`}>
                    <SideBadge side={match.creator.side} size="md" />
                  </div>

                  <div className="relative shrink-0">
                    <img
                      src={
                        match.creator.avatarUrl ||
                        'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-2A0DE04FF101FD93723B00B54581C2D3-Png/150/150/AvatarHeadshot/Png/isCircular'
                      }
                      alt={match.creator.username}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-2A0DE04FF101FD93723B00B54581C2D3-Png/150/150/AvatarHeadshot/Png/isCircular';
                      }}
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border border-slate-700 bg-slate-900 shadow-sm"
                    />
                  </div>

                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-gaming font-black text-white text-lg sm:text-2xl truncate tracking-wide">
                      {match.creator.username}
                    </span>
                    {isCreator && (
                      <span className="px-1.5 py-0.5 rounded bg-[#3b82f6]/20 text-[#3b82f6] font-gaming text-[10px] font-black tracking-wider uppercase border border-[#3b82f6]/40 shrink-0">
                        YOU
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Items/Pets Wagered (Clean row of pet graphics matching screenshot) */}
                <div className="flex items-center gap-2.5 flex-wrap min-h-[52px] py-3">
                  {pets.length > 0 ? (
                    pets.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl bg-[#121929]/80 border border-[#202d44] hover:border-[#3b82f6]/50 p-1 flex items-center justify-center shrink-0 relative transition-transform hover:scale-110 shadow-sm"
                        title={`${item.variant !== 'Normal' ? item.variant + ' ' : ''}${item.petName} (${formatCompactValue(item.value)} Val)`}
                      >
                        <PetImage
                          src={item.petImage}
                          alt={item.petName}
                          rarity={item.rarity}
                          className="w-full h-full object-contain"
                        />
                        {(item.mega || item.neon) && (
                          <span
                            className={`absolute -top-1 -right-1 text-[8px] font-black px-1 rounded-full text-white ${
                              item.mega ? 'bg-fuchsia-500' : 'bg-blue-400 text-slate-950'
                            }`}
                          >
                            {item.mega ? 'M' : 'N'}
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-[#121929] border border-[#202d44] flex items-center justify-center text-xs text-slate-500">
                      Pet
                    </div>
                  )}
                </div>

                {/* 3. Opponent Paw on the bottom-left (matching screenshot's blue chip placement) */}
                <div className="flex items-center gap-2.5 pt-1">
                  <div className="shrink-0" title={`Opponent side: ${opponentSide}`}>
                    <SideBadge side={opponentSide} size="md" />
                  </div>
                  {match.maxJoinerPets && (
                    <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-950/70 border border-sky-500/30 px-2 py-0.5 rounded-md">
                      Max {match.maxJoinerPets} Pet{match.maxJoinerPets > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Right Column: Stacked Value & Range (matching screenshot exactly) */}
              <div className="text-right shrink-0 flex flex-col items-end justify-start pt-1">
                <span className="text-slate-400 font-gaming font-bold text-sm sm:text-base tracking-wide">
                  Value
                </span>
                <span className="font-mono font-black text-white text-3xl sm:text-4xl tracking-tight my-0.5 leading-none">
                  {formatCompactValue(totalVal)}
                </span>
                <span className="text-cyan-400/90 font-mono font-bold text-xs sm:text-sm tracking-wide">
                  {minRange} - {maxRange}
                </span>
              </div>
            </div>

            {/* Bottom Section: Full-Width Mint Green Button (matching screenshot) */}
            <div className="w-full pt-1">
              {isWaiting ? (
                isCreator ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onWatchFlip(match)}
                      className="flex-1 py-3 px-4 rounded-xl bg-[#141d2e] hover:bg-[#1b273d] text-slate-300 hover:text-white font-gaming font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 border border-[#22314d] cursor-pointer min-w-0"
                    >
                      <Eye className="w-4 h-4 text-sky-400 shrink-0" />
                      <span className="truncate">Waiting ({minRange} - {maxRange})</span>
                    </button>
                    {onCancelMatch && (
                      <button
                        onClick={() => onCancelMatch(match)}
                        className="py-3 px-3 sm:px-4 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 hover:text-rose-200 font-gaming font-black text-xs sm:text-sm transition cursor-pointer active:scale-95 flex items-center gap-1.5 shrink-0"
                        title="Cancel coinflip and return pets to inventory"
                      >
                        <X className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>
                    )}
                    {currentUser.role === 'admin' && onAdminCallOpponent && (
                      <button
                        onClick={() => onAdminCallOpponent(match)}
                        className="py-3 px-3 sm:px-4 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/40 text-violet-300 hover:text-violet-200 font-gaming font-black text-xs sm:text-sm transition cursor-pointer active:scale-95 flex items-center gap-1.5 shrink-0"
                        title="Start this posted coinflip with a randomized house opponent"
                      >
                        <Bot className="w-4 h-4" />
                        <span>Call Opponent</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onJoinMatch(match)}
                      id={`btn-join-match-${match.id}`}
                      className="flex-1 py-3 sm:py-3.5 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] active:scale-[0.99] text-slate-950 font-gaming font-black text-sm sm:text-base tracking-wide transition-all shadow-[0_0_18px_rgba(59,130,246,0.35)] hover:shadow-[0_0_24px_rgba(59,130,246,0.5)] cursor-pointer flex items-center justify-center gap-2 min-w-0"
                    >
                      <span className="truncate">Join Match ({minRange} - {maxRange})</span>
                    </button>
                  </div>
                )
              ) : isFlipping ? (
                <button
                  onClick={() => onWatchFlip(match)}
                  className="w-full py-3 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 font-gaming font-black text-sm animate-pulse flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Flipping...</span>
                </button>
              ) : (
                <button
                  onClick={() => onWatchFlip(match)}
                  className="w-full py-3 rounded-xl bg-[#121929] hover:bg-[#182236] border border-[#202d44] text-slate-300 hover:text-white font-gaming font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Match Completed • View Fairness & Result</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
