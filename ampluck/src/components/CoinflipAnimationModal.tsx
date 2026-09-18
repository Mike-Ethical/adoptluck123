import React, { useState, useEffect } from 'react';
import { Check, Volume2, VolumeX, X, Clock } from 'lucide-react';
import { CoinflipMatch, CoinSide, User } from '../types';
import { Coin3D } from './Coin3D';
import { formatCompactValue } from '../utils/format';
import { soundEffects } from '../utils/audio';

interface CoinflipAnimationModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: CoinflipMatch | null;
  currentUser: User;
  onJoinMatch?: (match: CoinflipMatch) => void;
}

export const CoinflipAnimationModal: React.FC<CoinflipAnimationModalProps> = ({
  isOpen,
  onClose,
  match,
  currentUser,
  onJoinMatch,
}) => {
  const [phase, setPhase] = useState<'waiting' | 'intro' | 'flipping' | 'landed' | 'finished'>('intro');
  const [rotationY, setRotationY] = useState(0);
  const [rotationX, setRotationX] = useState(0);
  const [coinHeight, setCoinHeight] = useState(0);
  const [soundMuted, setSoundMuted] = useState(false);

  useEffect(() => {
    if (!isOpen || !match) return;

    const initialY = match.creator.side === 'TAILS' ? 180 : 0;

    if (match.status === 'WAITING') {
      setPhase('waiting');
      setCoinHeight(0);
      setRotationX(0);
      setRotationY(initialY);
      return;
    }

    // Resolve authoritative target winning side
    const targetSide: CoinSide =
      match.winnerSide ||
      match.fairness.result ||
      (match.winner ? match.winner.side : 'HEADS');

    // Reset animation to intro stage
    setPhase('intro');
    setCoinHeight(0);
    setRotationX(0);
    setRotationY(initialY);

    let bounceTimer1: any;
    let bounceTimer2: any;
    let landTimer: any;
    let dropTimer: any;
    let finishTimer: any;

    // Step 1: Short anticipation, then launch the 3D coin
    const introTimer = setTimeout(() => {
      setPhase('flipping');
      if (!soundMuted) soundEffects.playCoinSpin(2.4);

      // Arc toss: rocket up into 3D space
      setCoinHeight(-130);
      setRotationX(16);

      // High velocity 3D rotation with exact target landing side alignment
      const baseSpins = 12 * 360;
      const targetOffset = targetSide === 'TAILS' ? 180 : 0;
      const finalY = baseSpins + targetOffset;
      setRotationY(finalY);

      // Step 2: At 1.7s, the coin accelerates downward with gravity
      dropTimer = setTimeout(() => {
        setCoinHeight(0);
      }, 1700);

      // Step 3: At 2.5s, the coin strikes the ground
      landTimer = setTimeout(() => {
        setPhase('landed');
        setRotationX(0);
        if (!soundMuted) soundEffects.playCoinLanding();

        // Bounce recoil
        bounceTimer1 = setTimeout(() => {
          setCoinHeight(-14);
        }, 50);

        bounceTimer2 = setTimeout(() => {
          setCoinHeight(0);
        }, 180);

        // Step 4: Show the Winner modal exactly as requested (0.75s after landing)
        finishTimer = setTimeout(() => {
          setPhase('finished');
          if (!soundMuted) soundEffects.playWinFanfare();

          // After a flip ends, auto-delete/dismiss after 4 seconds as requested
          setTimeout(() => {
            onClose();
          }, 4000);
        }, 650);
      }, 2300);
    }, 450);

    return () => {
      clearTimeout(introTimer);
      clearTimeout(dropTimer);
      clearTimeout(landTimer);
      clearTimeout(bounceTimer1);
      clearTimeout(bounceTimer2);
      clearTimeout(finishTimer);
    };
  }, [isOpen, match, soundMuted]);

  if (!isOpen || !match) return null;

  const targetWinner = match.winner || match.creator;
  const isWinnerCurrentUser = targetWinner.userId === currentUser.id;
  const isParticipant =
    match.creator.userId === currentUser.id ||
    (match.opponent && match.opponent.userId === currentUser.id);
  const winnerSide = match.winnerSide || match.fairness.result || 'HEADS';
  const isWaiting = match.status === 'WAITING' || phase === 'waiting';
  const isCreator = match.creator.userId === currentUser.id;

  return (
    <div className="fixed inset-0 bg-black/92 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      {/* Subtle top sound and close controls */}
      <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
        <button
          onClick={() => {
            soundEffects.enabled = soundMuted;
            setSoundMuted(!soundMuted);
          }}
          title={soundMuted ? 'Unmute SFX' : 'Mute SFX'}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer border border-white/10"
        >
          {soundMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-blue-400" />}
        </button>

        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer border border-white/10"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 1. WAITING STATE (Only if match hasn't started yet) */}
      {isWaiting ? (
        <div className="flex flex-col items-center justify-center select-none relative animate-fadeIn scale-150">
          <Coin3D
            rotationY={match.creator.side === 'TAILS' ? 180 : 0}
            rotationX={8}
            height={0}
            isSpinning={false}
            phase="waiting"
            winnerSide={match.creator.side}
          />
        </div>
      ) : phase === 'finished' ? (
        /* 2. FINISHED STATE: EXACT MATCH TO USER'S UPLOADED SCREENSHOT (NOTHING ELSE) */
        <div className="bg-[#121620] border border-white/10 rounded-2xl p-8 max-w-sm w-full mx-4 flex flex-col items-center justify-center text-center shadow-[0_20px_60px_rgba(0,0,0,0.9)] animate-scaleIn relative">
          {/* Circular Badge: Green checkmark for winner, red X for loser */}
          {isWinnerCurrentUser ? (
            <div className="w-20 h-20 rounded-full border-[3.5px] border-[#22c55e] flex items-center justify-center bg-[#13271d] mb-5 shadow-[0_0_25px_rgba(34,197,94,0.25)]">
              <Check className="w-10 h-10 text-[#22c55e] stroke-[3.5]" />
            </div>
          ) : isParticipant ? (
            <div className="w-20 h-20 rounded-full border-[3.5px] border-[#ef4444] flex items-center justify-center bg-[#291417] mb-5 shadow-[0_0_25px_rgba(239,68,68,0.25)]">
              <X className="w-10 h-10 text-[#ef4444] stroke-[3.5]" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full border-[3.5px] border-[#22c55e] flex items-center justify-center bg-[#13271d] mb-5 shadow-[0_0_25px_rgba(34,197,94,0.25)]">
              <Check className="w-10 h-10 text-[#22c55e] stroke-[3.5]" />
            </div>
          )}

          {/* Heading */}
          <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
            {isWinnerCurrentUser
              ? 'You won.'
              : isParticipant
              ? 'You lost this coinflip.'
              : `${targetWinner.username} won.`}
          </h2>

          {/* Subtitle */}
          <p className="text-slate-300 text-base font-normal mb-8">
            {isWinnerCurrentUser
              ? 'You won this coinflip.'
              : isParticipant
              ? 'You lost this coinflip.'
              : `${targetWinner.username} won this coinflip.`}
          </p>

          {/* Purple Continue Button */}
          <button
            onClick={onClose}
            className="w-48 py-3 rounded-lg bg-[#6366f1] hover:bg-[#5558e6] active:scale-95 text-white font-semibold text-base shadow-[0_4px_20px_rgba(99,102,241,0.35)] transition cursor-pointer"
          >
            Continue
          </button>
        </div>
      ) : (
        /* 3. FLIPPING ANIMATION: PURE COIN FLIP IN CENTER (WITHOUT ANYTHING ELSE ON SCREEN) */
        <div className="flex flex-col items-center justify-center select-none relative animate-fadeIn scale-150">
          <Coin3D
            rotationY={rotationY}
            rotationX={rotationX}
            height={coinHeight}
            isSpinning={phase === 'flipping'}
            phase={phase}
            winnerSide={winnerSide}
          />
        </div>
      )}
    </div>
  );
};
