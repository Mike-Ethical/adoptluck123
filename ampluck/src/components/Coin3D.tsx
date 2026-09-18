import React from 'react';
import { PawPrint } from 'lucide-react';
import { CoinSide } from '../types';

interface Coin3DProps {
  rotationY: number;
  rotationX: number;
  height: number;
  isSpinning: boolean;
  phase: 'waiting' | 'intro' | 'flipping' | 'landed' | 'finished';
  winnerSide: CoinSide;
}

export const Coin3D: React.FC<Coin3DProps> = ({
  rotationY,
  rotationX,
  height,
  isSpinning,
  phase,
  winnerSide: _winnerSide,
}) => {
  // 3D edge slice offsets to give the coin true physical cylinder thickness
  const edgeSlices = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];

  return (
    <div className="relative flex flex-col items-center justify-center select-none" style={{ width: '240px', height: '260px' }}>
      {/* 3D Perspective Stage */}
      <div
        className="relative flex items-center justify-center"
        style={{
          perspective: '1200px',
          perspectiveOrigin: '50% 50%',
          width: '180px',
          height: '180px',
        }}
      >
        {/* Physical 3D Coin Model */}
        <div
          className="relative w-36 h-36 rounded-full"
          style={{
            transformStyle: 'preserve-3d',
            WebkitTransformStyle: 'preserve-3d',
            transform: `translateY(${height}px) rotateX(${rotationX}deg) rotateY(${rotationY}deg)`,
            transition:
              phase === 'intro'
                ? 'transform 0.4s ease-out'
                : phase === 'flipping'
                ? 'transform 2.6s cubic-bezier(0.12, 0.85, 0.28, 1)'
                : phase === 'landed'
                ? 'transform 0.16s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                : 'transform 0.3s ease-out',
            willChange: 'transform',
          }}
        >
          {/* Edge Thickness Layers (Creates true 3D coin cylinder depth) */}
          {edgeSlices.map((z) => (
            <div
              key={z}
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                transform: `translateZ(${z}px)`,
                background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 25%, #78350f 50%, #d97706 75%, #fef08a 100%)',
                boxShadow: 'inset 0 0 4px rgba(0,0,0,0.6)',
                border: '1.5px solid rgba(180, 83, 9, 0.7)',
              }}
            />
          ))}

          {/* FRONT FACE: HEADS (Bubblegum Rose Luxury Token) */}
          <div
            className="absolute inset-0 rounded-full flex flex-col items-center justify-center overflow-hidden"
            style={{
              transform: 'translateZ(6px)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              background: 'radial-gradient(circle at 35% 32%, #60a5fa 0%, #2563eb 45%, #1e3a8a 80%, #0f172a 100%)',
              boxShadow: 'inset 0 0 16px rgba(0,0,0,0.8), 0 0 20px rgba(244,63,94,0.4)',
              border: '4px solid #bfdbfe',
            }}
          >
            {/* Outer Golden Notched Rim */}
            <div className="absolute inset-1 rounded-full border-2 border-dashed border-blue-200/80 pointer-events-none" />

            {/* Specular Radial Sheen */}
            <div
              className="absolute -inset-full bg-gradient-to-tr from-transparent via-white/25 to-transparent pointer-events-none"
              style={{
                transform: isSpinning ? 'rotate(45deg) translateY(-20%)' : 'rotate(35deg)',
                transition: 'transform 0.5s ease',
              }}
            />

            {/* Inner Ring with Subtle Dark Vignette - Only Paw, No Text */}
            <div className="w-[106px] h-[106px] rounded-full bg-gradient-to-b from-[#2a0818] via-[#430f28] to-[#1d0410] border border-pink-400/60 shadow-inner flex items-center justify-center relative">
              {/* Glowing Heads Paw Icon */}
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 bg-blue-500/50 rounded-full blur-md" />
                <PawPrint className="w-14 h-14 text-blue-100 fill-blue-300 drop-shadow-[0_0_14px_rgba(96,165,250,1)] relative z-10" />
              </div>
            </div>
          </div>

          {/* BACK FACE: TAILS (Pastel Mint / Cyan Diamond Token) */}
          <div
            className="absolute inset-0 rounded-full flex flex-col items-center justify-center overflow-hidden"
            style={{
              transform: 'rotateY(180deg) translateZ(6px)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              background: 'radial-gradient(circle at 35% 32%, #a78bfa 0%, #7c3aed 45%, #4c1d95 80%, #1e1b4b 100%)',
              boxShadow: 'inset 0 0 16px rgba(0,0,0,0.8), 0 0 20px rgba(14,165,233,0.4)',
              border: '4px solid #ddd6fe',
            }}
          >
            {/* Outer Platinum Notched Rim */}
            <div className="absolute inset-1 rounded-full border-2 border-dashed border-violet-200/80 pointer-events-none" />

            {/* Specular Radial Sheen */}
            <div
              className="absolute -inset-full bg-gradient-to-tr from-transparent via-white/25 to-transparent pointer-events-none"
              style={{
                transform: isSpinning ? 'rotate(45deg) translateY(-20%)' : 'rotate(35deg)',
                transition: 'transform 0.5s ease',
              }}
            />

            {/* Inner Ring with Dark Cyan Vignette - Only Paw, No Text */}
            <div className="w-[106px] h-[106px] rounded-full bg-gradient-to-b from-[#061e2b] via-[#0b3247] to-[#04131c] border border-cyan-400/60 shadow-inner flex items-center justify-center relative">
              {/* Glowing Tails Paw Icon */}
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 bg-violet-400/50 rounded-full blur-md" />
                <PawPrint className="w-14 h-14 text-violet-100 fill-violet-300 drop-shadow-[0_0_14px_rgba(167,139,250,1)] relative z-10" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
