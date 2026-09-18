import React, { useEffect, useState } from 'react';
import { BloxLuckLogo } from './BloxLuckLogo';

interface SiteLoadingScreenProps {
  isLoading: boolean;
  onFinished?: () => void;
}

export const SiteLoadingScreen: React.FC<SiteLoadingScreenProps> = ({
  isLoading,
  onFinished,
}) => {
  const [shouldRender, setShouldRender] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [progress, setProgress] = useState(18);

  useEffect(() => {
    // Animate progress smoothly
    const t1 = setTimeout(() => setProgress(50), 200);
    const t2 = setTimeout(() => setProgress(80), 500);
    const t3 = setTimeout(() => setProgress(96), 800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  useEffect(() => {
    if (!isLoading) {
      setProgress(100);
      const timer = setTimeout(() => {
        setFadeOut(true);
        const hideTimer = setTimeout(() => {
          setShouldRender(false);
          if (onFinished) onFinished();
        }, 450);
        return () => clearTimeout(hideTimer);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isLoading, onFinished]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#070c18] transition-all duration-500 select-none ${
        fadeOut ? 'opacity-0 pointer-events-none scale-105' : 'opacity-100'
      }`}
    >
      {/* Ambient background glow */}
      <div className="absolute w-96 h-96 bg-blue-600/15 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute w-64 h-64 bg-sky-400/10 rounded-full blur-[90px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-sm w-full">
        {/* AdoptLuck Logo with ambient glowing pulse - No box border */}
        <div className="relative mb-6">
          <div className="absolute -inset-6 bg-gradient-to-r from-blue-600/35 to-sky-400/35 rounded-full blur-2xl animate-pulse pointer-events-none" />
          <BloxLuckLogo size="lg" className="relative z-10" />
        </div>

        {/* Subtitle */}
        <p className="text-xs text-slate-400 font-medium mb-6 tracking-wide">
          The Provably Fair Adopt Me Coinflip
        </p>

        {/* Progress Bar */}
        <div className="w-full max-w-xs bg-[#0e172a] border border-[#1d2a45] rounded-full h-2.5 p-0.5 overflow-hidden shadow-inner mb-3">
          <div
            className="h-full bg-gradient-to-r from-blue-600 via-sky-400 to-blue-400 rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(56,132,255,0.7)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
          <span>{progress < 100 ? 'Connecting to servers...' : 'Ready!'}</span>
        </div>
      </div>
    </div>
  );
};
