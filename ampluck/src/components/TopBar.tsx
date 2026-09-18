import React, { useState } from 'react';
import { Menu, Package, ShieldAlert, Trophy, HelpCircle, Scale, X, LogIn, User as UserIcon, Crown } from 'lucide-react';
import { User, InventoryItem } from '../types';
import { BloxLuckLogo } from './BloxLuckLogo';

interface TopBarProps {
  user: User;
  inventory: InventoryItem[];
  onOpenInventory: () => void;
  onOpenRobloxVerify: () => void;
  onOpenProfile?: () => void;
  onOpenAdmin: () => void;
  onOpenLeaderboard: () => void;
  onOpenFairness: () => void;
  onOpenFaq: () => void;
  onlineCount?: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  user,
  inventory,
  onOpenInventory,
  onOpenRobloxVerify,
  onOpenProfile,
  onOpenAdmin,
  onOpenLeaderboard,
  onOpenFairness,
  onOpenFaq,
  onlineCount,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleProfileClick = () => {
    if (user.verified) {
      if (onOpenProfile) onOpenProfile();
      else onOpenRobloxVerify();
    } else {
      onOpenRobloxVerify();
    }
  };

  const isOwner = user.role === 'admin' || user.robloxUsername?.toLowerCase() === 'cute240bunny' || user.username?.toLowerCase() === 'cute240bunny';

  return (
    <>
      {/* Modern High-Tier TopBar - Slim 52px */}
      <header className="h-[52px] bg-[#030a1b] border-b border-[#162033] px-3 sm:px-5 flex items-center justify-between select-none z-30 sticky top-0 w-full shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-2 py-1">
          <BloxLuckLogo size="md" />
        </div>

        {/* Desktop-only quick action pills */}
        <div className="hidden md:flex items-center gap-3">
          {user.verified && isOwner && (
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 transition-all text-xs font-gaming font-black tracking-wider uppercase cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.2)]"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>ADMIN PORTAL</span>
            </button>
          )}

          {/* Desktop Inventory button */}
          <button
            onClick={onOpenInventory}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#111928] hover:bg-[#162238] border border-[#3b82f6]/30 hover:border-[#3b82f6]/60 text-[#3b82f6] text-xs font-gaming font-bold transition-all duration-150 cursor-pointer shadow-sm hover:shadow-[0_0_12px_rgba(59,130,246,0.2)]"
          >
            <Package className="w-3.5 h-3.5 text-[#3b82f6]" />
            <span>Inventory</span>
            <span className="px-1.5 py-0.2 rounded-md bg-[#3b82f6]/20 text-white font-mono text-[11px] font-bold">
              {inventory.length}
            </span>
          </button>

          {/* Desktop User profile / Login button */}
          {user.verified ? (
            <button
              onClick={handleProfileClick}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#0f1523] hover:bg-[#141d30] border border-[#1e2a40] hover:border-[#2a3b59] transition-all cursor-pointer select-none shadow-sm"
              title="Click to view Player Profile"
            >
              {/* Roblox Avatar - Shown ONLY when signed in */}
              <div className="relative shrink-0">
                <img
                  src={user.avatarUrl || 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-2A0DE04FF101FD93723B00B54581C2D3-Png/150/150/AvatarHeadshot/Png/isCircular'}
                  alt={user.robloxUsername}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-2A0DE04FF101FD93723B00B54581C2D3-Png/150/150/AvatarHeadshot/Png/isCircular';
                  }}
                  className={`w-7 h-7 rounded-full object-cover border shadow-sm ${
                    isOwner ? 'border-amber-400' : 'border-slate-700'
                  }`}
                />
                {isOwner ? (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs">
                    <Crown className="w-2.5 h-2.5 fill-slate-950 stroke-[2.5]" />
                  </span>
                ) : (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#3b82f6] border border-slate-950 shadow-[0_0_6px_#3b82f6]" />
                )}
              </div>

              {/* Username */}
              <div className="flex flex-col items-start leading-none min-w-0 pr-1">
                <span className="font-gaming font-black text-white text-xs tracking-wide truncate max-w-[140px]">
                  {user.robloxUsername || user.username}
                </span>
              </div>
            </button>
          ) : (
            <button
              onClick={onOpenRobloxVerify}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:from-[#60a5fa] hover:to-[#3b82f6] text-slate-950 font-gaming font-black text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer shadow-[0_0_15px_rgba(59,130,246,0.35)]"
            >
              <LogIn className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Log In</span>
            </button>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2.5">
          {/* Mobile Profile pill: show avatar ONLY when verified, NO value */}
          {user.verified ? (
            <button
              onClick={handleProfileClick}
              className="flex md:hidden items-center gap-2 px-2.5 py-1 rounded-xl bg-[#0f1523] hover:bg-[#141d30] border border-[#1e2a40] transition cursor-pointer select-none"
              title="Click to view Player Profile"
            >
              <div className="relative shrink-0">
                <img
                  src={user.avatarUrl || 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-2A0DE04FF101FD93723B00B54581C2D3-Png/150/150/AvatarHeadshot/Png/isCircular'}
                  alt={user.robloxUsername}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-2A0DE04FF101FD93723B00B54581C2D3-Png/150/150/AvatarHeadshot/Png/isCircular';
                  }}
                  className={`w-6 h-6 rounded-full object-cover border ${
                    isOwner ? 'border-amber-400' : 'border-slate-700'
                  }`}
                />
                {isOwner && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs">
                    <Crown className="w-2 h-2 fill-slate-950 stroke-[2.5]" />
                  </span>
                )}
              </div>
              <span className="font-gaming font-black text-white text-xs truncate max-w-[95px]">
                {user.robloxUsername}
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenRobloxVerify}
              id="btn-mobile-login"
              className="flex md:hidden items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-slate-950 font-gaming font-black text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-[0_0_12px_rgba(59,130,246,0.3)]"
            >
              <LogIn className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Log In</span>
            </button>
          )}

          {/* Hamburger Menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            id="btn-mobile-menu"
            className="w-9 h-9 rounded-xl bg-[#111928] hover:bg-[#162238] border border-[#1e2a40] text-[#3b82f6] flex items-center justify-center transition active:scale-95 cursor-pointer shadow-sm"
            title="Navigation Menu"
          >
            <Menu className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </header>

      {/* Slide-out Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs">
          <div className="w-72 max-w-[85vw] h-full bg-[#030a1b] border-l border-[#1d273f] flex flex-col p-4 shadow-2xl select-none animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1b253b]">
              <div className="flex items-center gap-2">
                <BloxLuckLogo size="sm" />
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-8 h-8 rounded-lg bg-[#162033] text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Info Card: Avatar ONLY if verified, NO value */}
            <div
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleProfileClick();
              }}
              className="mt-4 p-3 rounded-xl bg-[#121826] hover:bg-[#161f30] border border-[#202b40] flex items-center justify-between cursor-pointer transition"
            >
              {user.verified ? (
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <img
                      src={user.avatarUrl}
                      alt={user.robloxUsername}
                      className="w-9 h-9 rounded-full object-cover border border-slate-700"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-950 bg-blue-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-sm">{user.robloxUsername}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-black font-gaming tracking-wide uppercase ${
                          isOwner
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-[#3b82f6]/20 text-[#3b82f6]'
                        }`}
                      >
                        {isOwner ? 'OWNER' : 'VERIFIED'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-gaming">View Profile</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#162033] border border-slate-700 flex items-center justify-center text-[#3b82f6]">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-sm block">Guest Player</span>
                    <span className="text-xs text-[#3b82f6] font-gaming">Click to Log In</span>
                  </div>
                </div>
              )}
            </div>

            {/* Menu Links */}
            <div className="mt-4 space-y-1.5 flex-1 overflow-y-auto">
              {/* Inventory */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenInventory();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#141d2e] hover:bg-[#1a263d] text-slate-100 font-bold text-sm transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5 text-[#3b82f6]">
                  <Package className="w-4 h-4" />
                  <span className="text-white">My Inventory</span>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-[#3b82f6]/20 text-[#3b82f6] text-xs font-mono font-bold">
                  {inventory.length}
                </span>
              </button>

              {/* Admin Panel (If authorized) */}
              {user.verified && isOwner && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenAdmin();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-sm transition border border-amber-500/30 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>Admin Panel</span>
                  </div>
                  <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded">
                    OWNER
                  </span>
                </button>
              )}

              {/* Leaderboard */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenLeaderboard();
                }}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-[#141d2e] text-slate-200 font-semibold text-sm transition cursor-pointer"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Leaderboard</span>
              </button>

              {/* Provably Fair */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenFairness();
                }}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-[#141d2e] text-slate-200 font-semibold text-sm transition cursor-pointer"
              >
                <Scale className="w-4 h-4 text-[#3b82f6]" />
                <span>Provably Fair</span>
              </button>

              {/* FAQ */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenFaq();
                }}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-[#141d2e] text-slate-200 font-semibold text-sm transition cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-sky-400" />
                <span>FAQ</span>
              </button>
            </div>

            {/* Bottom Footer */}
            <div className="pt-3 border-t border-[#1b253b] text-center">
              <span className="text-[11px] text-slate-500 font-mono">
                AdmLuck Adopt Me • Provably Fair
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
