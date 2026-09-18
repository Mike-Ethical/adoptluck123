import React, { useState, useEffect } from 'react';
import { FeaturedMatch } from '../types';
import { PetImage } from './PetImage';

interface FeaturedMatchesProps {
  featured: FeaturedMatch[];
  onJoinFeatured: (match: FeaturedMatch) => void;
}

export const FeaturedMatches: React.FC<FeaturedMatchesProps> = ({ featured, onJoinFeatured }) => {
  // Real-time ticking timers
  const [timers, setTimers] = useState<Record<string, number>>({});

  useEffect(() => {
    const initialMap: Record<string, number> = {};
    featured.forEach((m) => {
      initialMap[m.id] = m.endsInSeconds;
    });
    setTimers(initialMap);

    const interval = setInterval(() => {
      setTimers((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => {
          if (next[k] > 0) {
            next[k] -= 1;
          } else {
            // Loop timer between 60 and 120s for realistic gaming lobby experience
            next[k] = 90 + Math.floor(Math.random() * 30);
          }
        });
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [featured]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  if (!featured || featured.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mb-4">
      {featured.map((item) => {
        const timeLeft = timers[item.id] !== undefined ? timers[item.id] : item.endsInSeconds;
        return (
          <div
            key={item.id}
            className="w-full bg-[#121825] hover:bg-[#161e2f] border border-[#1e273a] hover:border-[#2a3752] rounded-lg p-2.5 flex items-center justify-between transition-colors shadow-sm"
          >
            {/* Left: Pet Thumbnail + Name & Value info */}
            <div className="flex items-center gap-3.5">
              {/* Pet square thumbnail with golden glow frame */}
              <div className="w-13 h-13 rounded bg-gradient-to-b from-amber-500/20 to-slate-900 border border-amber-500/40 p-1 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.2)]">
                <PetImage src={item.petImage} alt={item.petName} className="w-11 h-11"  rarity={item.rarity} variant={item.variant} fly={item.fly} ride={item.ride} />
              </div>

              {/* Title & Metadata */}
              <div className="flex flex-col">
                <span className="font-gaming italic font-bold text-white text-sm md:text-base tracking-wide">
                  {item.petName}
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-gaming font-bold text-xs tracking-wider">
                    {item.value} Value
                  </span>
                  <span className="text-[11px] text-[#3b82f6] font-semibold">
                    Ends in {formatTime(timeLeft)}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Joined count & Join button */}
            <div className="flex items-center gap-4">
              <span className="font-gaming italic font-bold text-slate-200 text-xs md:text-sm">
                {item.joinedCount} Joined
              </span>

              <button
                onClick={() => onJoinFeatured(item)}
                id={`btn-join-feat-${item.id}`}
                className="px-4 py-1.5 rounded bg-[#3b82f6] hover:bg-[#2563eb] text-slate-950 font-gaming font-extrabold text-xs tracking-wider transition-transform active:scale-95 shadow-[0_0_10px_rgba(59,130,246,0.3)] cursor-pointer"
              >
                Join
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
