import React from 'react';
import { Package, MessageSquare, Flame } from 'lucide-react';
import { User } from '../types';

interface BottomNavBarProps {
  user: User;
  inventoryCount: number;
  onlineCount: number;
  isChatOpen: boolean;
  onSelectCoinflips: () => void;
  onOpenInventory: () => void;
  onToggleChat: () => void;
  onOpenRobloxVerify: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  user,
  inventoryCount,
  onlineCount,
  isChatOpen,
  onSelectCoinflips,
  onOpenInventory,
  onToggleChat,
  onOpenRobloxVerify,
}) => {
  const handleInventoryClick = () => {
    if (!user.verified || user.id === 'guest') {
      onOpenRobloxVerify();
    } else {
      onOpenInventory();
    }
  };

  return (
    <nav
      id="bottom-nav-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#090d15]/95 backdrop-blur-md border-t border-[#1a2337] px-4 py-2 flex items-center justify-around shadow-[0_-5px_25px_rgba(0,0,0,0.6)] select-none"
    >
      <div className="w-full max-w-lg mx-auto flex items-center justify-around">
        {/* 1. Coinflips Tab */}
        <button
          onClick={onSelectCoinflips}
          id="btn-nav-coinflips"
          className="flex flex-col items-center justify-center flex-1 py-1 text-slate-400 hover:text-white transition group cursor-pointer active:scale-95"
          title="Browse Coinflip Matches"
        >
          <div className="relative p-1.5 rounded-xl group-hover:bg-[#141b2a] transition flex items-center justify-center">
            <Flame className="w-5 h-5 text-[#3b82f6] group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
          </div>
          <span className="text-[11px] font-gaming font-bold tracking-wider uppercase mt-0.5 text-slate-300 group-hover:text-white">
            Coinflips
          </span>
        </button>

        {/* 2. Inventory Tab */}
        <button
          onClick={handleInventoryClick}
          id="btn-nav-inventory"
          className="flex flex-col items-center justify-center flex-1 py-1 text-slate-400 hover:text-white transition group cursor-pointer active:scale-95"
          title="My Pets Inventory"
        >
          <div className="relative p-1.5 rounded-xl group-hover:bg-[#141b2a] transition flex items-center justify-center">
            <div className="relative">
              <Package className="w-5 h-5 text-[#3b82f6] group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
              {inventoryCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 rounded-full bg-[#3b82f6] text-slate-950 font-mono font-bold text-[9px] leading-tight shadow-sm">
                  {inventoryCount}
                </span>
              )}
            </div>
          </div>
          <span className="text-[11px] font-gaming font-bold tracking-wider uppercase mt-0.5 text-slate-300 group-hover:text-white">
            Inventory
          </span>
        </button>

        {/* 3. Chat Tab */}
        <button
          onClick={onToggleChat}
          id="btn-nav-chat"
          className={`flex flex-col items-center justify-center flex-1 py-1 transition group cursor-pointer active:scale-95 ${
            isChatOpen ? 'text-[#3b82f6]' : 'text-slate-400 hover:text-white'
          }`}
          title={isChatOpen ? 'Close Live Chat' : 'Open Live Chat'}
        >
          <div className={`relative p-1.5 rounded-xl transition flex items-center justify-center ${
            isChatOpen ? 'bg-[#3b82f6]/15 shadow-[0_0_12px_rgba(59,130,246,0.3)]' : 'group-hover:bg-[#141b2a]'
          }`}>
            <div className="relative">
              <MessageSquare className="w-5 h-5 text-[#3b82f6] group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
              {/* Online pulse indicator */}
              <span className="absolute -top-1 -right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3b82f6] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#3b82f6]"></span>
              </span>
            </div>
          </div>
          <span className={`text-[11px] font-gaming font-bold tracking-wider uppercase mt-0.5 ${
            isChatOpen ? 'text-[#3b82f6]' : 'text-slate-300 group-hover:text-white'
          }`}>
            Chat
          </span>
        </button>
      </div>
    </nav>
  );
};
