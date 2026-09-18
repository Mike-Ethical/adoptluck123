import React from 'react';
import { Package } from 'lucide-react';
import { User } from '../types';

interface MobileBottomBarProps {
  user: User;
  inventoryCount: number;
  onlineCount: number;
  onSelectCoinflips: () => void;
  onOpenInventory: () => void;
  onOpenRobloxVerify: () => void;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  user,
  inventoryCount,
  onlineCount,
  onSelectCoinflips,
  onOpenInventory,
  onOpenRobloxVerify,
}) => {
  const handleInventoryClick = () => {
    if (!user.verified) {
      onOpenRobloxVerify();
    } else {
      onOpenInventory();
    }
  };

  return (
    <nav
      id="mobile-bottom-nav"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090d15]/95 backdrop-blur-md border-t border-[#1a2337] px-3 py-2 flex items-center justify-around shadow-[0_-5px_25px_rgba(0,0,0,0.6)] select-none"
    >
      {/* 1. Coinflips Tab */}
      <button
        onClick={onSelectCoinflips}
        id="btn-mobile-nav-coinflips"
        className="flex flex-col items-center justify-center flex-1 py-1 text-slate-400 hover:text-white transition group cursor-pointer active:scale-95"
      >
        <div className="relative p-1 rounded-lg group-hover:bg-[#141b2a] transition flex items-center justify-center">
          <i className="fa-solid fa-gamepad text-lg text-[#3b82f6] group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
        </div>
        <span className="text-[10px] font-gaming font-bold tracking-wider uppercase mt-0.5 text-slate-300 group-hover:text-white">
          Coinflips
        </span>
      </button>

      {/* 2. My Inventory Tab - dedicated icon matching site color */}
      <button
        onClick={handleInventoryClick}
        id="btn-mobile-nav-inventory"
        className="flex flex-col items-center justify-center flex-1 py-1 text-slate-400 hover:text-white transition group cursor-pointer active:scale-95"
      >
        <div className="relative p-1 rounded-lg group-hover:bg-[#141b2a] transition flex items-center justify-center">
          <div className="relative">
            <Package className="w-5 h-5 text-[#3b82f6] group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
            <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 rounded-full bg-[#3b82f6] text-slate-950 font-mono font-bold text-[8px] leading-tight shadow-sm">
              {inventoryCount}
            </span>
          </div>
        </div>
        <span className="text-[10px] font-gaming font-bold tracking-wider uppercase mt-0.5 text-slate-300 group-hover:text-white">
          Inventory
        </span>
      </button>
    </nav>
  );
};
