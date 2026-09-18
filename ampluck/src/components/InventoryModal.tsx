import React, { useState } from 'react';
import {
  X,
  Search,
  ArrowUpRight,
  ArrowDownToLine,
  Check,
  Sparkles,
  CheckSquare,
  Square,
  Gift,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { InventoryItem, User } from '../types';
import { PetImage } from './PetImage';
import { formatCompactValue } from '../utils/format';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  onWithdraw: (itemIds: string[]) => Promise<{ discordLink?: string }>;
  robloxUsername: string;
  user: User;
  discordLink: string;
  onOpenRobloxVerify: () => void;
  onInventoryRefreshed?: () => void;
}

type FilterCategory = 'ALL' | 'HIGH_TIER' | 'LEGENDARY' | 'NEON_MEGA' | 'FLY_RIDE';

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  inventory,
  onWithdraw,
  robloxUsername,
  user,
  discordLink,
  onOpenRobloxVerify,
  onInventoryRefreshed,
}) => {
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState<{ count: number; value: number } | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Tip Modal State
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [tipTargetUser, setTipTargetUser] = useState('');
  const [isTipping, setIsTipping] = useState(false);
  const [tipSuccessMessage, setTipSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalValue = Math.round(inventory.reduce((acc, curr) => acc + curr.totalValue, 0) * 10) / 10;
  const availableItems = inventory.filter((item) => !item.locked);

  // Filter items based on category & search
  const filteredItems = inventory.filter((item) => {
    if (searchQuery && !item.petName.toLowerCase().includes(searchQuery.toLowerCase().trim())) {
      return false;
    }

    if (activeCategory === 'HIGH_TIER') {
      return item.value >= 25;
    }
    if (activeCategory === 'LEGENDARY') {
      return item.rarity === 'Legendary';
    }
    if (activeCategory === 'NEON_MEGA') {
      return item.neon || item.mega;
    }
    if (activeCategory === 'FLY_RIDE') {
      return item.fly || item.ride;
    }
    return true;
  });

  const toggleSelectPet = (id: string, locked?: boolean) => {
    if (locked) return;
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === availableItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(availableItems.map((i) => i.id)));
    }
  };

  const handleExecuteWithdraw = async () => {
    if (selectedIds.size === 0) return;
    setIsSubmittingWithdraw(true);
    setErrorNotice(null);

    const itemsToWithdraw = inventory.filter((i) => selectedIds.has(i.id));
    const totalVal = Math.round(itemsToWithdraw.reduce((acc, curr) => acc + curr.totalValue, 0) * 10) / 10;
    const count = itemsToWithdraw.length;

    try {
      const res = await onWithdraw(Array.from(selectedIds));
      const targetDiscord = res?.discordLink || discordLink || 'https://discord.gg/bloxluck';

      setSelectedIds(new Set());
      setConfirmModalOpen(false);
      setWithdrawSuccess({ count, value: totalVal });

      try {
        window.open(targetDiscord, '_blank', 'noopener,noreferrer');
      } catch (e) {
        console.warn('Popup blocked', e);
      }
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to process withdrawal.');
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  const handleExecuteTip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipTargetUser.trim() || selectedIds.size === 0) return;
    const petId = Array.from(selectedIds)[0];
    const pet = inventory.find((p) => p.id === petId);
    if (!pet) return;

    setIsTipping(true);
    setErrorNotice(null);
    try {
      const res = await fetch('/api/tip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          recipientUsername: tipTargetUser.trim(),
          petId: pet.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to tip pet');
      }
      setTipSuccessMessage(data.message || `Successfully tipped ${pet.petName} to @${tipTargetUser}!`);
      setIsTipModalOpen(false);
      setSelectedIds(new Set());
      setTipTargetUser('');
      if (onInventoryRefreshed) {
        onInventoryRefreshed();
      }
      setTimeout(() => setTipSuccessMessage(null), 6000);
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to tip pet');
    } finally {
      setIsTipping(false);
    }
  };

  const selectedItemsList = inventory.filter((i) => selectedIds.has(i.id));
  const selectedTotalValue = Math.round(selectedItemsList.reduce((acc, curr) => acc + curr.totalValue, 0) * 10) / 10;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 select-none animate-fadeIn">
      <div className="bg-[#0b111e] border border-[#1d2a42] rounded-2xl w-full max-w-4xl h-[90vh] sm:h-[82vh] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-[#182338] bg-[#0f1728] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <h2 className="font-gaming font-black text-white text-base tracking-wide uppercase">
              Inventory
            </h2>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDepositOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#3884ff] hover:bg-[#2563eb] text-slate-950 font-gaming font-black text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-[0_0_12px_rgba(56,132,255,0.35)]"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Deposit</span>
            </button>

            <button
              onClick={() => {
                if (selectedIds.size === 0) {
                  setErrorNotice('Select pets from your inventory to withdraw.');
                  setTimeout(() => setErrorNotice(null), 3000);
                  return;
                }
                setConfirmModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141f32] hover:bg-[#1a2842] text-sky-300 border border-[#3884ff]/30 hover:border-[#3884ff]/60 font-gaming font-bold text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer"
            >
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Withdraw</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-[#162238] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {withdrawSuccess && (
          <div className="px-4 py-2.5 bg-sky-950/80 border-b border-[#3884ff]/30 text-sky-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
              <span>
                Withdrawal created for <strong>{withdrawSuccess.count} pet(s)</strong> ({withdrawSuccess.value} Val). Claim in Discord!
              </span>
            </div>
            <button
              onClick={() => setWithdrawSuccess(null)}
              className="text-sky-300 hover:text-white text-xs font-mono"
            >
              Dismiss
            </button>
          </div>
        )}

        {tipSuccessMessage && (
          <div className="px-4 py-2.5 bg-emerald-950/80 border-b border-emerald-500/30 text-emerald-200 text-xs flex items-center justify-between">
            <span>{tipSuccessMessage}</span>
            <button onClick={() => setTipSuccessMessage(null)} className="text-emerald-400 text-xs">
              Dismiss
            </button>
          </div>
        )}

        {errorNotice && (
          <div className="px-4 py-2.5 bg-rose-950/80 border-b border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorNotice}</span>
          </div>
        )}

        {/* Toolbar: Search + Category Filter Tabs + Selection Counter */}
        <div className="px-4 sm:px-6 py-3 border-b border-[#162135] bg-[#0d1424] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          {/* Search bar */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pets..."
              className="w-full bg-[#10192a] border border-[#1e2c45] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#3884ff] transition"
            />
          </div>

          {/* Filter category pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {(
              [
                { id: 'ALL', label: 'All' },
                { id: 'HIGH_TIER', label: 'High-Tier' },
                { id: 'LEGENDARY', label: 'Legendary' },
                { id: 'NEON_MEGA', label: 'Neon & Mega' },
                { id: 'FLY_RIDE', label: 'Fly & Ride' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl font-gaming font-bold text-xs whitespace-nowrap transition cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-[#3884ff] text-slate-950 shadow-[0_0_10px_rgba(56,132,255,0.3)]'
                    : 'bg-[#121b2d] text-slate-400 hover:text-white border border-[#1c2940] hover:border-[#2a3c5a]'
                }`}
              >
                {cat.label}
              </button>
            ))}

            {/* Select all toggle */}
            {availableItems.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="px-2.5 py-1.5 rounded-xl bg-[#121b2d] hover:bg-[#1a263d] border border-[#1c2940] text-slate-300 hover:text-white font-gaming text-xs flex items-center gap-1.5 transition cursor-pointer ml-1"
                title={selectedIds.size === availableItems.length ? 'Deselect All' : 'Select All'}
              >
                {selectedIds.size === availableItems.length ? (
                  <CheckSquare className="w-3.5 h-3.5 text-[#3884ff]" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>{selectedIds.size > 0 ? `${selectedIds.size}` : 'All'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Pet Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#090e18]">
          {filteredItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-[#101726] border border-[#1b263b] flex items-center justify-center text-slate-500 mb-3">
                <Search className="w-7 h-7 text-sky-400" />
              </div>
              <h3 className="font-gaming font-bold text-white text-sm mb-1">
                {searchQuery ? 'No matching pets found' : 'Your inventory is empty'}
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mb-4">
                {searchQuery
                  ? 'Try searching with a different pet name or rarity.'
                  : 'Deposit Adopt Me pets to start coinflips or participate in giveaways.'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setIsDepositOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#3884ff] hover:bg-[#2563eb] text-slate-950 font-gaming font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-[0_0_12px_rgba(56,132,255,0.3)]"
                >
                  Deposit Adopt Me Pets
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredItems.map((item) => {
                const isSelected = selectedIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSelectPet(item.id, item.locked)}
                    className={`group relative p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col items-center text-center select-none ${
                      item.locked
                        ? 'bg-[#0e1422]/50 border-slate-800 opacity-60 cursor-not-allowed'
                        : isSelected
                        ? 'bg-[#3884ff]/15 border-[#3884ff] shadow-[0_0_16px_rgba(56,132,255,0.3)] scale-[1.02]'
                        : 'bg-[#0f1728] border-[#1a263d] hover:border-[#3884ff]/50 hover:bg-[#121c30]'
                    }`}
                  >
                    {/* Top badging row */}
                    <div className="w-full flex items-center justify-between mb-1.5">
                      {/* Selection Checkbox */}
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center transition ${
                          isSelected
                            ? 'bg-[#3884ff] text-slate-950 shadow-[0_0_6px_#3884ff]'
                            : 'border border-slate-700 group-hover:border-slate-500'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>

                      {/* Variant / Locked Badge */}
                      {item.locked ? (
                        <span className="text-[9px] font-gaming font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-1.5 py-0.2 rounded-md">
                          IN MATCH
                        </span>
                      ) : item.variant !== 'Normal' ? (
                        <span
                          className={`text-[9px] font-gaming font-black px-1.5 py-0.2 rounded-md ${
                            item.variant === 'Mega'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {item.variant.toUpperCase()}
                        </span>
                      ) : (
                        <div className="flex items-center gap-1">
                          {item.fly && (
                            <span className="text-[9px] font-gaming font-bold text-sky-300 bg-sky-950/60 border border-sky-500/30 px-1 rounded">
                              F
                            </span>
                          )}
                          {item.ride && (
                            <span className="text-[9px] font-gaming font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-1 rounded">
                              R
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Pet Image with clean glowing frame */}
                    <div className="w-16 h-16 my-1 relative flex items-center justify-center">
                      <PetImage
                        src={item.petImage}
                        alt={item.petName}
                        className="w-full h-full object-contain"
                        rarity={item.rarity}
                        variant={item.variant}
                        fly={item.fly}
                        ride={item.ride}
                      />
                    </div>

                    {/* Pet Name */}
                    <span className="font-gaming font-bold text-white text-xs truncate w-full mt-1">
                      {item.petName}
                    </span>

                    {/* Value Badge */}
                    <div className="mt-1 flex items-center gap-1">
                      <span className="text-xs font-mono font-bold text-sky-400">
                        {formatCompactValue(item.value)}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Val</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Floating Bar when items are selected */}
        {selectedIds.size > 0 && (
          <div className="p-3.5 border-t border-[#182338] bg-[#0e1626] flex items-center justify-between flex-wrap gap-2 shrink-0 animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-300 font-gaming">
                Selected: <strong className="text-white">{selectedIds.size} pet{selectedIds.size > 1 ? 's' : ''}</strong>
              </span>
              <span className="text-xs font-mono font-bold text-sky-400">
                ({formatCompactValue(selectedTotalValue)} Val)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-3 py-1.5 rounded-xl bg-[#141d2d] hover:bg-[#1b273d] text-slate-400 hover:text-white font-gaming text-xs transition cursor-pointer"
              >
                Clear
              </button>

              {selectedIds.size === 1 && (
                <button
                  onClick={() => setIsTipModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#3884ff]/15 hover:bg-[#3884ff]/25 text-sky-300 border border-[#3884ff]/40 font-gaming font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-[0_0_10px_rgba(56,132,255,0.2)]"
                >
                  <Gift className="w-3.5 h-3.5 text-sky-400" />
                  <span>Tip Pet</span>
                </button>
              )}

              <button
                onClick={() => setConfirmModalOpen(true)}
                className="px-4 py-1.5 rounded-xl bg-[#3884ff] hover:bg-[#2563eb] text-slate-950 font-gaming font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-[0_0_12px_rgba(56,132,255,0.35)]"
              >
                Withdraw ({selectedIds.size})
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Withdraw Confirmation Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-[#0e1626] border border-[#1e2a42] rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-[#1b263b]">
              <div className="flex items-center gap-2 text-sky-400">
                <ArrowUpRight className="w-5 h-5" />
                <h3 className="font-gaming font-black text-white text-base">Confirm Withdrawal</h3>
              </div>
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              You are withdrawing <strong>{selectedIds.size} pet(s)</strong> valued at{' '}
              <strong className="text-sky-400">{selectedTotalValue} Val</strong>.
            </p>

            <div className="p-3 rounded-xl bg-[#111a2d] border border-[#1c2a44] text-[11px] text-slate-400 space-y-1">
              <p>• Delivery account: <strong className="text-white">@{robloxUsername}</strong></p>
              <p>• Join the Discord server to complete the in-game Roblox trade delivery.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#141e30] text-slate-400 hover:text-white font-gaming text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteWithdraw}
                disabled={isSubmittingWithdraw}
                className="px-5 py-2 rounded-xl bg-[#3884ff] hover:bg-[#2563eb] text-slate-950 font-gaming font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(56,132,255,0.4)] disabled:opacity-50"
              >
                {isSubmittingWithdraw ? 'Processing...' : 'Confirm & Open Discord'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tip Modal */}
      {isTipModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <form
            onSubmit={handleExecuteTip}
            className="bg-[#0b111e] border border-[#1d2a42] rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-fadeIn"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#182338]">
              <div className="flex items-center gap-2 text-sky-400">
                <Gift className="w-5 h-5" />
                <h3 className="font-gaming font-black text-white text-base">Tip Pet to User</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTipModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-gaming block mb-1.5">
                Recipient Username:
              </label>
              <input
                type="text"
                value={tipTargetUser}
                onChange={(e) => setTipTargetUser(e.target.value)}
                placeholder="Enter existing username..."
                className="w-full bg-[#101728] border border-[#1d2a42] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#3884ff]"
                required
              />
              <span className="text-[10px] text-slate-400 font-gaming mt-1 block">
                * User must be registered on AdoptLuck
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsTipModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#141e30] text-slate-400 hover:text-white font-gaming text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isTipping || !tipTargetUser.trim()}
                className="px-5 py-2 rounded-xl bg-[#3884ff] hover:bg-[#2563eb] text-slate-950 font-gaming font-black text-xs uppercase tracking-wider disabled:opacity-50 shadow-[0_0_12px_rgba(56,132,255,0.35)]"
              >
                {isTipping ? 'Tipping...' : 'Send Pet Tip'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Deposit Modal */}
      {isDepositOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-[#0e1626] border border-[#1e2a42] rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-[#1b263b]">
              <div className="flex items-center gap-2 text-sky-400">
                <ArrowDownToLine className="w-5 h-5" />
                <h3 className="font-gaming font-black text-white text-base">Deposit Pets</h3>
              </div>
              <button
                onClick={() => setIsDepositOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Deposit your Adopt Me pets securely. Once the trade is completed in Roblox, your pets appear instantly in your inventory.
            </p>

            <div className="p-3 rounded-xl bg-[#121c2e] border border-[#1d2c48] space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2 text-sky-400 font-gaming font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Automated Trading Bot</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Join our Discord delivery server or trade our automated bot in Adopt Me to deposit pets directly into your verified inventory.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <a
                href={discordLink || 'https://discord.gg/bloxluck'}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-[#131d2e] hover:bg-[#1a2840] text-sky-300 border border-[#3884ff]/30 font-gaming text-xs flex items-center gap-1.5 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Discord Delivery</span>
              </a>

              <button
                onClick={() => setIsDepositOpen(false)}
                className="px-5 py-2 rounded-xl bg-[#3884ff] hover:bg-[#2563eb] text-slate-950 font-gaming font-black text-xs uppercase tracking-wider"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
