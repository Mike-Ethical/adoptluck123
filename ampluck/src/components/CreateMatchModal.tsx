import React, { useState } from 'react';
import { X, Check, AlertCircle, ArrowLeft, ArrowRight, ShieldCheck, PawPrint } from 'lucide-react';
import { InventoryItem, CoinSide } from '../types';
import { PetImage } from './PetImage';
import { CoinChip } from './CoinChip';
import { formatCompactValue } from '../utils/format';

interface CreateMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  onCreate: (selectedItemIds: string[], side: CoinSide, maxJoinerPets?: number | null) => Promise<void>;
  activePostsCount?: number;
}

export const CreateMatchModal: React.FC<CreateMatchModalProps> = ({
  isOpen,
  onClose,
  inventory,
  onCreate,
  activePostsCount = 0,
}) => {
  const [step, setStep] = useState<'SELECT_PETS' | 'CHOOSE_SIDE'>('SELECT_PETS');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [chosenSide, setChosenSide] = useState<CoinSide>('HEADS');
  const [maxJoinerPets, setMaxJoinerPets] = useState<number | null>(null); // null = Any
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isAtLimit = activePostsCount >= 5;
  const unlockedItems = inventory.filter((i) => !i.locked);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectedItems = unlockedItems.filter((i) => selectedIds.includes(i.id));
  const totalSelectedValue = selectedItems.reduce((acc, curr) => acc + curr.totalValue, 0);

  const handleGoToSideStep = () => {
    if (isAtLimit) {
      setError('Match post limit reached: You can have at most 5 active matches posted at a time.');
      return;
    }
    if (selectedIds.length === 0) {
      setError('Please select at least one pet from your inventory');
      return;
    }
    if (totalSelectedValue < 1) {
      setError('Minimum bet value is 1.00 Val (only pets with value 1 or higher accepted)');
      return;
    }
    setError(null);
    setStep('CHOOSE_SIDE');
  };

  const handlePostMatch = async () => {
    if (isAtLimit) {
      setError('Match post limit reached: You can have at most 5 active matches posted at a time.');
      return;
    }
    if (selectedIds.length === 0) {
      setError('Please select at least one pet from your inventory');
      setStep('SELECT_PETS');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onCreate(selectedIds, chosenSide, maxJoinerPets);
      setSelectedIds([]);
      setStep('SELECT_PETS');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create match');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep('SELECT_PETS');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="bg-[#0f1420] border border-[#222e44] rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#1b2538] flex items-center justify-between bg-[#131a29]">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] shadow-[0_0_8px_#3b82f6]" />
            <h2 className="font-gaming font-black text-white text-base tracking-wider uppercase">
              {step === 'SELECT_PETS' ? '1. Select Pets' : '2. Choose Side'}
            </h2>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border ${
                isAtLimit
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-[#182438] text-slate-300 border-[#23334d]'
              }`}
            >
              Posts: {activePostsCount}/5
            </span>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1a2337] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {isAtLimit && (
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                <strong>Post Limit Reached (5/5):</strong> You have 5 active coinflips posted. Please wait for an opponent or cancel one to create a new match.
              </span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ================= STEP 1: CHOOSE PETS ================= */}
          {step === 'SELECT_PETS' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-gaming font-bold text-xs uppercase tracking-wider text-slate-300">
                  Select pets to wager ({selectedIds.length} chosen)
                </span>
                <span className="font-mono text-xs text-[#3b82f6] font-bold flex items-center gap-1">
                  <span>Total Value:</span>
                  <span>{Math.round(totalSelectedValue * 100) / 100} Val</span>
                </span>
              </div>

              {unlockedItems.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-700/80 rounded-xl text-slate-400 font-gaming text-xs bg-[#0b0f17]">
                  No unlocked pets in inventory. Add pets to your vault first!
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-1.5 bg-[#0b0f17] rounded-xl border border-[#192233]">
                  {unlockedItems.map((item) => {
                    const isSelected = selectedIds.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleSelect(item.id)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer relative flex flex-col items-center text-center ${
                          isSelected
                            ? 'bg-[#3b82f6]/15 border-[#3b82f6] shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                            : 'bg-[#121927] border-[#1d273a] hover:border-slate-500'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#3b82f6] text-slate-950 flex items-center justify-center shadow-sm">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                        <PetImage src={item.petImage} alt={item.petName} className="w-11 h-11 mb-1"  rarity={item.rarity} variant={item.variant} fly={item.fly} ride={item.ride} />
                        <span className="font-gaming font-bold text-white text-[11px] truncate w-full">
                          {item.petName}
                        </span>
                        <span className="text-[10px] text-[#3b82f6] font-mono font-bold mt-0.5">
                          {formatCompactValue(item.value)} Val
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Selected Deposit Preview */}
              {selectedItems.length > 0 && (
                <div className="p-3 bg-[#111724] rounded-xl border border-[#1b2539]">
                  <span className="text-[11px] font-gaming text-slate-400 block mb-1.5 font-bold uppercase">
                    Selected Pets Preview
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedItems.map((item) => (
                      <span
                        key={item.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#182235] border border-[#27354f] text-xs font-gaming text-white"
                      >
                        <PetImage src={item.petImage} alt={item.petName} className="w-4 h-4"  rarity={item.rarity} variant={item.variant} fly={item.fly} ride={item.ride} />
                        <span>{item.petName}</span>
                        <span className="text-[#3b82f6] font-mono text-[10px]">
                          ({formatCompactValue(item.value)})
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 2: CHOOSE SIDE & LIMIT JOINER PETS ================= */}
          {step === 'CHOOSE_SIDE' && (
            <div className="space-y-4">
              {/* Selected Bet Banner */}
              <div className="p-3 bg-[#111724] rounded-xl border border-[#1b2539] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-gaming uppercase block">Your Wager</span>
                  <span className="font-gaming font-bold text-white text-xs sm:text-sm">
                    {selectedItems.map((p) => p.petName).join(', ')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-gaming uppercase block">Bet Value</span>
                  <span className="font-mono font-black text-[#3b82f6] text-sm sm:text-base">
                    {formatCompactValue(totalSelectedValue)} Val
                  </span>
                </div>
              </div>

              {/* Limit How Many Pets Joiner Can Use */}
              <div className="p-3.5 bg-[#0e1422] rounded-xl border border-[#1c273c] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-gaming font-bold text-xs uppercase tracking-wider text-slate-200">
                    Limit Joiner Pets
                  </span>
                  <span className="text-[11px] font-mono text-sky-400 font-bold">
                    {maxJoinerPets ? `Max ${maxJoinerPets} Pet${maxJoinerPets > 1 ? 's' : ''}` : 'Any (No limit)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  Restrict how many pets an opponent can deposit to match your bet value:
                </p>
                <div className="grid grid-cols-5 gap-2 pt-1">
                  {[
                    { label: '1 Pet', val: 1, desc: '1:1 only' },
                    { label: '2 Pets', val: 2, desc: 'Max 2' },
                    { label: '3 Pets', val: 3, desc: 'Max 3' },
                    { label: '5 Pets', val: 5, desc: 'Max 5' },
                    { label: 'Any', val: null, desc: 'No limit' },
                  ].map((opt) => {
                    const isSelected = maxJoinerPets === opt.val;
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setMaxJoinerPets(opt.val)}
                        className={`py-2 px-1 rounded-xl border font-gaming text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#3b82f6]/20 border-[#3b82f6] text-[#3b82f6] shadow-[0_0_10px_rgba(59,130,246,0.25)] font-black'
                            : 'bg-[#121927] border-[#1d273a] text-slate-300 hover:border-slate-500 hover:text-white font-bold'
                        }`}
                      >
                        <div className="text-xs">{opt.label}</div>
                        <div className="text-[9px] opacity-70 mt-0.5">{opt.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ask for the Side (Pure Paws: NO text inside, NO text under) */}
              <div className="space-y-2">
                <span className="font-gaming font-bold text-xs uppercase tracking-wider text-slate-200 block text-center">
                  Select Your Side
                </span>
                <div className="grid grid-cols-2 gap-4">
                  {/* Pink Paw Side */}
                  <button
                    type="button"
                    onClick={() => setChosenSide('HEADS')}
                    className={`py-5 px-4 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer relative ${
                      chosenSide === 'HEADS'
                        ? 'bg-pink-950/30 border-pink-400 text-white'
                        : 'bg-[#121927] border-[#1d273a] hover:border-pink-500/50 opacity-70 hover:opacity-100'
                    }`}
                  >
                    {chosenSide === 'HEADS' && (
                      <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-md">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                    <CoinChip side="HEADS" size="lg" />
                  </button>

                  {/* Cyan Paw Side */}
                  <button
                    type="button"
                    onClick={() => setChosenSide('TAILS')}
                    className={`py-5 px-4 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer relative ${
                      chosenSide === 'TAILS'
                        ? 'bg-cyan-950/30 border-cyan-400 text-white'
                        : 'bg-[#121927] border-[#1d273a] hover:border-cyan-500/50 opacity-70 hover:opacity-100'
                    }`}
                  >
                    {chosenSide === 'TAILS' && (
                      <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-md">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                    <CoinChip side="TAILS" size="lg" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-[#1b2538] bg-[#111724] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-gaming">Total Bet Value</span>
            <span className="text-sm font-bold font-mono text-[#3b82f6]">
              {formatCompactValue(totalSelectedValue)} Val
            </span>
          </div>

          <div className="flex items-center gap-2">
            {step === 'SELECT_PETS' ? (
              <>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-gaming text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGoToSideStep}
                  disabled={selectedIds.length === 0 || isAtLimit}
                  id="btn-next-step-side"
                  className="px-5 py-2 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 text-slate-950 font-gaming font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(59,130,246,0.35)] cursor-pointer flex items-center gap-1.5"
                >
                  <span>Choose Side</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setStep('SELECT_PETS')}
                  className="px-4 py-2 rounded-xl bg-[#182236] hover:bg-[#1f2c45] text-slate-300 hover:text-white font-gaming text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  onClick={handlePostMatch}
                  disabled={isSubmitting || selectedIds.length === 0 || isAtLimit}
                  id="btn-confirm-create-match"
                  className="px-5 py-2 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 text-slate-950 font-gaming font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_18px_rgba(59,130,246,0.4)] cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <PawPrint className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Posting Match...' : 'Post Coinflip'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
