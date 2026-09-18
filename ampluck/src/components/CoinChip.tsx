import React from 'react';
import { PawPrint } from 'lucide-react';
import { CoinSide } from '../types';

interface CoinChipProps {
  side: CoinSide;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animate?: boolean;
}

export const CoinChip: React.FC<CoinChipProps> = ({ side, size = 'md', className = '', animate = false }) => {
  const isTails = side === 'TAILS';

  // Sizing definitions
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-18 h-18',
    xl: 'w-28 h-28',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-9 h-9',
    xl: 'w-14 h-14',
  };

  // Heads = Cute Bubblegum Pink Paw; Tails = Cute Pastel Mint/Cyan Paw
  const borderGradient = isTails
    ? 'from-cyan-300 via-teal-400 to-cyan-700 shadow-[0_0_22px_rgba(34,211,238,0.55)]'
    : 'from-pink-300 via-rose-400 to-pink-600 shadow-[0_0_22px_rgba(244,114,182,0.6)]';

  const innerDisc = isTails
    ? 'bg-gradient-to-br from-[#061b24] via-[#082a32] to-[#0d3b45] border-cyan-400/50 text-cyan-200'
    : 'bg-gradient-to-br from-[#260918] via-[#3a0f26] to-[#4c1332] border-pink-400/50 text-pink-200';

  const accentRing = isTails ? 'border-cyan-300/60' : 'border-pink-300/60';
  const pawColor = isTails ? 'text-cyan-300 fill-cyan-400/80 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]' : 'text-pink-300 fill-pink-400/80 drop-shadow-[0_0_10px_rgba(244,114,182,0.8)]';

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full font-gaming font-black select-none transition-transform duration-200 hover:scale-105 ${sizeClasses[size]} ${className} ${
        animate ? 'animate-bounce' : ''
      }`}
    >
      {/* Outer cute paw chip rim */}
      <div
        className={`absolute inset-0 rounded-full bg-gradient-to-br ${borderGradient} p-[3px] border border-white/30`}
      >
        {/* Soft dashed detail ring */}
        <div className={`w-full h-full rounded-full border border-dashed ${accentRing} flex items-center justify-center p-[2px]`}>
          {/* Inner cute plush disc */}
          <div
            className={`w-full h-full rounded-full ${innerDisc} flex items-center justify-center shadow-inner border relative overflow-hidden`}
          >
            {/* Specular glass reflection */}
            <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/20 rounded-full blur-[2px] pointer-events-none transform rotate-45" />

            {/* Cute Paw Print */}
            <PawPrint className={`${iconSizes[size]} ${pawColor} transition-transform duration-200`} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const SideBadge: React.FC<{ side: CoinSide; size?: 'sm' | 'md'; className?: string }> = ({
  side,
  size = 'md',
  className = '',
}) => {
  const isTails = side === 'TAILS';
  const dimensions = size === 'sm' ? 'w-6 h-6' : 'w-7 h-7';
  const iconDim = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full font-gaming font-black select-none shrink-0 shadow-md border relative overflow-hidden transition-transform duration-150 hover:scale-105 ${
        isTails
          ? 'bg-gradient-to-br from-cyan-400 via-teal-400 to-cyan-600 border-cyan-200/90 text-white shadow-[0_0_12px_rgba(34,211,238,0.5)]'
          : 'bg-gradient-to-br from-pink-400 via-rose-400 to-pink-600 border-pink-200/90 text-white shadow-[0_0_12px_rgba(244,114,182,0.55)]'
      } ${dimensions} ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
      <PawPrint className={`${iconDim} text-white fill-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] z-10`} />
    </div>
  );
};

