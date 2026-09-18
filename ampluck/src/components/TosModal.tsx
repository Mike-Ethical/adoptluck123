import React from 'react';
import { X, Scale, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface TosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TosModal: React.FC<TosModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="bg-[#0e131d] border border-[#202c42] rounded-xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#1b2538] flex items-center justify-between bg-[#121825]">
          <div className="flex items-center gap-2.5">
            <Scale className="w-5 h-5 text-amber-400" />
            <h2 className="font-gaming font-black text-white text-base tracking-wider uppercase">
              Terms of Service
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
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs text-slate-300 leading-relaxed font-sans">
          <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-lg text-amber-300">
            <strong>Important Notice:</strong> AdmLuck is an independent enthusiast platform and is NOT affiliated with, endorsed by, or sponsored by Roblox Corporation or DreamCraft (Adopt Me).
          </div>

          <div className="space-y-2">
            <h4 className="font-gaming font-bold text-white text-sm">1. Internal Virtual Items</h4>
            <p>
              All pet assets displayed in your platform inventory represent virtual platform tokens. No real-world currency gambling takes place. Items have no guaranteed cash value outside the entertainment context of the platform.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-gaming font-bold text-white text-sm">2. Account Safety & Verification</h4>
            <p>
              Users are responsible for their Roblox account credentials. AdmLuck never asks for or stores passwords or cookies. We utilize non-invasive profile phrase verification only.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-gaming font-bold text-white text-sm">3. In-Game Deliveries & Trades</h4>
            <p>
              Deliveries are processed via standard in-game player-to-player trading mechanisms. Users must comply with Roblox community standards during any trade.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-gaming font-bold text-white text-sm">4. Provable Fairness</h4>
            <p>
              Coinflips are settled deterministically on our server utilizing industry-standard SHA-256 hash commitments. Outcomes are 50/50 mathematically without house edge.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
