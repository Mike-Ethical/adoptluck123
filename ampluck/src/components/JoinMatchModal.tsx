import React, { useState } from 'react';
import { X, Check, AlertCircle, Zap } from 'lucide-react';
import { CoinflipMatch, InventoryItem } from '../types';
import { PetImage } from './PetImage';
import { SideBadge } from './CoinChip';
import { formatCompactValue } from '../utils/format';

interface JoinMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: CoinflipMatch | null;
  inventory: InventoryItem[];
  onJoin: (matchId: string, selectedItemIds: string[]) => Promise<void>;
}

export const JoinMatchModal: React.FC<JoinMatchModalProps> = ({
  isOpen,
  onClose,
  match,
  inventory,
  onJoin,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !match) return null;

  const unlockedItems = inventory.filter((i) => !i.locked);
  const creatorValue = match.creator.totalValue;
  const minRange = Math.max(1, Math.floor(creatorValue * 0.95));
  const maxRange = Math.ceil(creatorValue * 1.05);

  const toggleSelect = (id: string) => {
    setError(null);
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (match.maxJoinerPets && prev.length >= match.maxJoinerPets) {
        setError(`This match only allows joining with at most ${match.maxJoinerPets} pet${match.maxJoinerPets > 1 ? 's' : ''}.`);
        return prev;
      }
      return [...prev, id];
    });
  };

  const selectedItems = unlockedItems.filter((i) => selectedIds.includes(i.id));
  const totalSelectedValue = Math.round(selectedItems.reduce((acc, curr) => acc + curr.totalValue, 0) * 10) / 10;
  const isValueInRange = selectedIds.length > 0 && totalSelectedValue >= minRange && totalSelectedValue <= maxRange;

  // Opponent side is opposite of creator
  const opponentSide = match.creator.side === 'HEADS' ? 'TAILS' : 'HEADS';

  const handleJoin = async (autoMatch = false) => {
    setIsSubmitting(true);
    setError(null);
    try {
      // If user has no items selected or clicking auto-match, pass selectedIds (or empty so backend auto-provisions)
      await onJoin(match.id, autoMatch ? [] : selectedIds);
      setSelectedIds([]);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to join match');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="bg-[#0b111e] border border-[#1d2a42] rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#182338] flex items-center justify-between bg-[#0f1728]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3884ff] shadow-[0_0_8px_#3884ff]" />
            <h2 className="font-gaming font-black text-white text-base tracking-wider uppercase">
              Join Coinflip #{match.id.replace('match-', '')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#162238] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Opponent & Match Details Header */}
          <div className="p-3.5 bg-[#0f1728] rounded-xl border border-[#1a263d] flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <img
                src={match.creator.avatarUrl}
                alt={match.creator.username}
                className="w-9 h-9 rounded-full border border-slate-700 object-cover"
              />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-gaming uppercase">Host</span>
                <span className="font-gaming font-bold text-white text-sm">
                  {match.creator.username}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 uppercase font-gaming mb-1">Their Paw</span>
                <SideBadge side={match.creator.side} size="md" />
              </div>

              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 uppercase font-gaming mb-1">Your Paw</span>
                <SideBadge side={opponentSide} size="md" />
              </div>

              {match.maxJoinerPets && (
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-slate-400 uppercase font-gaming">Max Pets</span>
                  <span className="text-xs font-mono font-bold text-sky-400 bg-sky-950/60 border border-sky-500/30 px-2 py-0.5 rounded-md mt-0.5">
                    {match.maxJoinerPets} Pet{match.maxJoinerPets > 1 ? 's' : ''} Max
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Select Inventory Pets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-gaming font-bold text-xs uppercase tracking-wider text-slate-300">
                Deposit Pets (Target: {minRange} - {maxRange} Val)
              </span>
              <span className="font-mono text-xs text-[#3884ff] font-bold">
                {formatCompactValue(totalSelectedValue)} / {formatCompactValue(creatorValue)} Val
              </span>
            </div>

            {unlockedItems.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-700/80 rounded-xl text-slate-400 font-gaming text-xs bg-[#090e18] space-y-3">
                <p>No unlocked pets in inventory.</p>
                <button
                  type="button"
                  onClick={() => handleJoin(true)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-[#3884ff] hover:bg-[#2563eb] text-slate-950 font-gaming font-black text-xs uppercase tracking-wider inline-flex items-center gap-1.5 shadow-[0_0_12px_rgba(56,132,255,0.4)] cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Auto-Equip Bet & Join</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1.5 bg-[#090e18] rounded-xl border border-[#182338]">
                {unlockedItems.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleSelect(item.id)}
                      className={`p-2 rounded-xl border transition-all cursor-pointer relative flex flex-col items-center text-center ${
                        isSelected
                          ? 'bg-[#3884ff]/15 border-[#3884ff] shadow-[0_0_8px_rgba(56,132,255,0.3)]'
                          : 'bg-[#101728] border-[#1a263d] hover:border-slate-500'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#3884ff] text-slate-950 flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                      <PetImage
                        src={item.petImage}
                        alt={item.petName}
                        className="w-10 h-10 mb-1"
                        rarity={item.rarity}
                        variant={item.variant}
                        fly={item.fly}
                        ride={item.ride}
                      />
                      <span className="font-gaming font-bold text-white text-[11px] truncate w-full">
                        {item.petName}
                      </span>
                      <span className="text-[10px] text-sky-400 font-mono font-bold">
                        {formatCompactValue(item.value)} Val
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#182338] bg-[#0f1728] flex items-center justify-between flex-wrap gap-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-gaming">Your Bet:</span>
              <span className={`text-sm font-bold font-mono ${isValueInRange ? 'text-sky-400' : 'text-amber-400'}`}>
                {formatCompactValue(totalSelectedValue)} Val
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                / {minRange} - {maxRange} Val
              </span>
            </div>
            {selectedIds.length > 0 && (
              <span className={`text-[10px] font-gaming ${isValueInRange ? 'text-sky-400' : 'text-rose-400'}`}>
                {isValueInRange
                  ? '✓ Value matches host requirement!'
                  : totalSelectedValue < minRange
                  ? `Need ${(minRange - totalSelectedValue).toFixed(1)} more Val to match`
                  : `Exceeds max by ${(totalSelectedValue - maxRange).toFixed(1)} Val`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-gaming text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => handleJoin(false)}
              disabled={isSubmitting || (unlockedItems.length > 0 && !isValueInRange && selectedIds.length > 0)}
              id="btn-confirm-join-match"
              className="px-5 py-2 rounded-xl bg-[#3884ff] hover:bg-[#2563eb] disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-gaming font-black text-xs uppercase tracking-wider transition shadow-[0_0_15px_rgba(56,132,255,0.35)] cursor-pointer"
            >
              {isSubmitting ? 'Joining...' : 'Confirm & Flip'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
