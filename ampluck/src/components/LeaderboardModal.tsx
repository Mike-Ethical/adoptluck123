import React, { useState, useEffect } from 'react';
import { X, Trophy, Medal, Award } from 'lucide-react';
import { LeaderboardEntry } from '../types';
import { formatCompactValue } from '../utils/format';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose }) => {
  const [timeframe, setTimeframe] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL TIME'>('ALL TIME');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/leaderboard');
        const data = await res.json();
        setEntries(data.allTime || []);
      } catch (err) {
        console.error('Failed to load leaderboard', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [isOpen, timeframe]);

  if (!isOpen) return null;

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold text-xs">
          1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="w-6 h-6 rounded-full bg-slate-300/20 text-slate-200 border border-slate-300/40 flex items-center justify-center font-bold text-xs">
          2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="w-6 h-6 rounded-full bg-amber-700/20 text-amber-600 border border-amber-700/40 flex items-center justify-center font-bold text-xs">
          3
        </span>
      );
    }
    return <span className="text-slate-500 font-mono text-xs font-bold w-6 text-center">#{rank}</span>;
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="bg-[#0e131d] border border-[#202c42] rounded-xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#1b2538] flex items-center justify-between bg-[#121825]">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="font-gaming font-black text-white text-base tracking-wider uppercase">
              Coinflip Leaderboard
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeframe Tabs */}
        <div className="px-5 py-3 bg-[#101623] border-b border-[#1b2538] flex items-center gap-2">
          {(['DAILY', 'WEEKLY', 'MONTHLY', 'ALL TIME'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setTimeframe(tab)}
              className={`px-3 py-1 rounded text-xs font-gaming font-bold tracking-wider transition-colors cursor-pointer ${
                timeframe === tab
                  ? 'bg-[#3b82f6] text-slate-950 shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                  : 'bg-[#151c2a] text-slate-400 hover:text-slate-200 border border-[#1f293d]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Leaderboard Table */}
        <div className="p-4 overflow-y-auto flex-1 bg-[#0b0f17]">
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-gaming animate-pulse">
              Loading rankings...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1a2335] text-[11px] font-gaming text-slate-400 uppercase">
                    <th className="py-2.5 px-3">Rank</th>
                    <th className="py-2.5 px-3">User</th>
                    <th className="py-2.5 px-3 text-center">Games</th>
                    <th className="py-2.5 px-3 text-center">W / L</th>
                    <th className="py-2.5 px-3 text-center">Win Rate</th>
                    <th className="py-2.5 px-3 text-right">Pet Value Won</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#161f30] text-xs font-gaming">
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 font-gaming">
                        No leaderboard rankings recorded yet. Play coinflip matches to claim rank #1!
                      </td>
                    </tr>
                  ) : (
                    entries.map((entry) => (
                      <tr
                        key={entry.userId}
                        className="hover:bg-[#121927] transition-colors"
                      >
                        <td className="py-3 px-3">{getRankBadge(entry.rank)}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={entry.avatarUrl}
                              alt={entry.username}
                              className="w-7 h-7 rounded-full object-cover border border-slate-700"
                            />
                            <span className="font-bold text-white tracking-wide">
                              {entry.username}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-300">
                          {entry.games}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          <span className="text-blue-400 font-bold">{entry.wins}</span>
                          <span className="text-slate-600 mx-1">/</span>
                          <span className="text-rose-400">{entry.losses}</span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-[#3b82f6] font-bold">
                          {entry.winRate}%
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-amber-400">
                          {formatCompactValue(entry.petValueWon ?? 0)} Val
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
