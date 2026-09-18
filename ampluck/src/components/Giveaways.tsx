import React, { useState, useEffect } from 'react';
import { PetImage } from './PetImage';
import { Giveaway } from '../types';

import { User } from '../types';

export const Giveaways: React.FC<{currentUser?: User}> = ({currentUser}) => {
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);

  useEffect(() => {
    const fetchGW = () => {
      fetch('/api/giveaways')
        .then(r => r.json())
        .then(data => setGiveaways(data || []));
    };
    fetchGW();
    const timer = setInterval(fetchGW, 2000);
    return () => clearInterval(timer);
  }, []);

  if (!giveaways.length) return null;

  return (
    <div className="w-full bg-[#111724] border border-amber-500/30 rounded-xl p-4 mb-4 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
      <h2 className="text-amber-400 font-gaming font-black uppercase text-sm mb-3">🔥 Active Giveaways 🔥</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {giveaways.map(gw => {
          const isEnded = gw.winnerId || new Date() > new Date(gw.endTime);
          return (
            <div key={gw.id} className="bg-[#151c2a] border border-[#232f45] rounded-lg p-3 flex flex-col items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 font-gaming font-black text-[10px] px-2 py-0.5 rounded-bl">
                {gw.value} VAL
              </div>
              <PetImage src={gw.petImage} alt={gw.petName} className="w-16 h-16 mb-2" />
              <div className="text-white font-gaming font-bold text-xs mb-1 text-center">{gw.petName}</div>
              <div className="text-slate-400 font-mono text-[10px] mb-2">
                Participants: <span className="text-amber-400">{gw.participants.length}</span>
              </div>
              
              {isEnded ? (
                <div className="w-full text-center text-xs font-gaming font-bold text-rose-400 py-1 border border-rose-500/30 rounded bg-rose-500/10">
                  {gw.winnerId ? 'WINNER DRAWN' : 'ENDED'}
                </div>
              ) : (
                <button
                  onClick={() => {
                    fetch(`/api/giveaways/${gw.id}/join`, { method: 'POST', headers: { 'x-user-id': currentUser?.id || '' } }) // Just for test, needs currentUser
                  }}
                  className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-gaming font-bold text-xs py-1.5 rounded transition"
                >
                  JOIN GIVEAWAY
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
