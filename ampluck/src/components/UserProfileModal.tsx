import React from 'react';
import {
  X,
  ExternalLink,
  ShieldAlert,
  LogOut,
  Trophy,
  Package,
  Percent,
  Gamepad2,
  Crown
} from 'lucide-react';
import { User, InventoryItem } from '../types';
import { formatCompactValue } from '../utils/format';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  inventory: InventoryItem[];
  onOpenInventory: () => void;
  onOpenAdmin?: () => void;
  onLogout: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  inventory,
  onOpenInventory,
  onOpenAdmin,
  onLogout,
}) => {
  if (!isOpen) return null;

  const totalInventoryValue = inventory.reduce((sum, item) => sum + item.totalValue, 0);
  const winRate = user.totalGames > 0 ? Math.round((user.wins / user.totalGames) * 100) : 0;
  const isOwner = user.role === 'admin' || user.robloxUsername?.toLowerCase() === 'cute240bunny' || user.username?.toLowerCase() === 'cute240bunny';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 select-none animate-in fade-in duration-150">
      <div className="bg-[#0e131e] border border-[#1f2a3f] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#1b2538] flex items-center justify-between bg-[#121825]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] shadow-[0_0_8px_#3b82f6]" />
            <h2 className="font-gaming font-black text-white text-sm tracking-wider uppercase">
              Player Profile
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Main User Card */}
          <div className="p-4 bg-[#141c2c] border border-[#1e2a42] rounded-xl flex items-center gap-3.5 relative overflow-hidden">
            <div className="relative shrink-0">
              <img
                src={user.avatarUrl || 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-2A0DE04FF101FD93723B00B54581C2D3-Png/150/150/AvatarHeadshot/Png/isCircular'}
                alt={user.robloxUsername}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-2A0DE04FF101FD93723B00B54581C2D3-Png/150/150/AvatarHeadshot/Png/isCircular';
                }}
                className={`w-16 h-16 rounded-full object-cover border-2 shadow-md ${
                  isOwner ? 'border-amber-400' : 'border-slate-700'
                }`}
              />
              {isOwner ? (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-md">
                  <Crown className="w-3.5 h-3.5 fill-slate-950 stroke-[2.5]" />
                </span>
              ) : (
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#3b82f6] border-2 border-[#141c2c] shadow-[0_0_8px_#3b82f6]" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-gaming font-black text-white text-base truncate">
                  {user.robloxUsername || user.username}
                </span>
                {!isOwner && (
                  <span className="px-2 py-0.5 rounded bg-[#3b82f6]/20 border border-[#3b82f6]/40 text-[#3b82f6] text-[10px] font-gaming font-black uppercase">
                    VERIFIED
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-400 font-mono">
                  Roblox ID: {user.robloxUserId ? `#${user.robloxUserId}` : user.id}
                </span>
                {user.robloxUserId && (
                  <a
                    href={`https://www.roblox.com/users/${user.robloxUserId}/profile`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#3b82f6] hover:underline flex items-center gap-0.5 font-gaming"
                  >
                    <span>View</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-xs text-slate-400 font-gaming">Profit:</span>
                <span className={`text-xs font-mono font-black ${user.totalProfit >= 0 ? 'text-[#3b82f6]' : 'text-rose-400'}`}>
                  {user.totalProfit >= 0 ? '+' : ''}{formatCompactValue(user.totalProfit)} Val
                </span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 rounded-xl bg-[#121826] border border-[#1b2539] flex flex-col">
              <span className="text-[10px] font-gaming text-slate-400 uppercase flex items-center gap-1">
                <Gamepad2 className="w-3 h-3 text-sky-400" />
                Games
              </span>
              <span className="text-sm font-mono font-bold text-white mt-0.5">
                {user.totalGames || 0}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#121826] border border-[#1b2539] flex flex-col">
              <span className="text-[10px] font-gaming text-slate-400 uppercase flex items-center gap-1">
                <Trophy className="w-3 h-3 text-amber-400" />
                Wins
              </span>
              <span className="text-sm font-mono font-bold text-blue-400 mt-0.5">
                {user.wins || 0}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#121826] border border-[#1b2539] flex flex-col">
              <span className="text-[10px] font-gaming text-slate-400 uppercase flex items-center gap-1">
                <Percent className="w-3 h-3 text-[#3b82f6]" />
                Win Rate
              </span>
              <span className="text-sm font-mono font-bold text-[#3b82f6] mt-0.5">
                {winRate}%
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#121826] border border-[#1b2539] flex flex-col">
              <span className="text-[10px] font-gaming text-slate-400 uppercase flex items-center gap-1">
                <Package className="w-3 h-3 text-purple-400" />
                Inventory
              </span>
              <span className="text-sm font-mono font-bold text-purple-300 mt-0.5">
                {inventory.length} pets
              </span>
            </div>
          </div>

          {/* Admin notice banner if admin */}
          {isOwner && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Authorized Owner & Administrator</span>
              </div>
              {onOpenAdmin && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenAdmin();
                  }}
                  className="px-2.5 py-1 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-gaming font-black text-[10px] tracking-wider uppercase transition cursor-pointer"
                >
                  Open Panel
                </button>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenInventory();
              }}
              className="flex-1 py-2.5 rounded-xl bg-[#121826] hover:bg-[#182235] border border-[#202b40] text-slate-200 font-gaming font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Package className="w-3.5 h-3.5 text-[#3b82f6]" />
              <span>View Inventory</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="py-2.5 px-4 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-gaming font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
