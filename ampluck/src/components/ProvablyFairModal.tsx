import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, AlertTriangle, KeyRound } from 'lucide-react';
import { CoinflipMatch } from '../types';

interface ProvablyFairModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMatch?: CoinflipMatch | null;
}

export const ProvablyFairModal: React.FC<ProvablyFairModalProps> = ({
  isOpen,
  onClose,
  selectedMatch,
}) => {
  const [matchId, setMatchId] = useState(selectedMatch?.id || 'match-1082');
  const [serverSeed, setServerSeed] = useState(
    selectedMatch?.fairness.serverSeed ||
      'a38c92ef94b150917246b9a2c10b784e6284f18390bb94cf7483829ad30e9912'
  );
  const [clientSeed, setClientSeed] = useState(
    selectedMatch?.fairness.clientSeed || 'bloxluck_client_9941'
  );
  const [nonce, setNonce] = useState(String(selectedMatch?.fairness.nonce || '1082'));

  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVerify = async () => {
    setVerifying(true);
    setError(null);
    try {
      const res = await fetch(`/api/matches/${matchId}/verify`);
      const data = await res.json();
      if (res.ok) {
        setVerificationResult(data);
      } else {
        setError(data.error || 'Verification query failed');
      }
    } catch (err: any) {
      setError(err.message || 'Verification network error');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="bg-[#0e131d] border border-[#202c42] rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#1b2538] flex items-center justify-between bg-[#121825]">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#3b82f6]" />
            <h2 className="font-gaming font-black text-white text-base tracking-wider uppercase">
              Provably Fair Verification
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
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Explanation Banner */}
          <div className="p-3 bg-[#121927] border border-[#1d273a] rounded-lg text-xs text-slate-300 font-sans space-y-1.5 leading-relaxed">
            <p>
              <strong className="text-white font-gaming">Cryptographic Fairness Guarantee:</strong>{' '}
              Before each match begins, the server creates a secret 256-bit random{' '}
              <span className="text-[#3b82f6] font-mono">Server Seed</span> and immediately publishes its public{' '}
              <span className="text-amber-400 font-mono">SHA-256 Commitment Hash</span>. Because the hash cannot be reversed, the server cannot alter the outcome once bets are placed.
            </p>
            <p className="text-slate-400">
              When the coinflip ends, the secret server seed is revealed. You can verify that{' '}
              <code className="bg-slate-900 px-1 py-0.5 rounded text-slate-300 font-mono text-[10px]">
                SHA-256(Server Seed) == Commitment Hash
              </code>{' '}
              and re-derive the exact HMAC flip result.
            </p>
          </div>

          {/* Form */}
          <div className="space-y-3 bg-[#101623] p-4 rounded-lg border border-[#1b2538]">
            <span className="font-gaming font-bold text-xs uppercase tracking-wider text-slate-300 block">
              Match Verifier Inputs
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-gaming text-slate-400 block mb-1">
                  Match ID
                </label>
                <input
                  type="text"
                  value={matchId}
                  onChange={(e) => setMatchId(e.target.value)}
                  className="w-full bg-[#151c2a] border border-[#242f44] rounded px-3 py-1.5 text-xs text-white font-mono focus:border-[#3b82f6] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-gaming text-slate-400 block mb-1">
                  Nonce
                </label>
                <input
                  type="text"
                  value={nonce}
                  onChange={(e) => setNonce(e.target.value)}
                  className="w-full bg-[#151c2a] border border-[#242f44] rounded px-3 py-1.5 text-xs text-white font-mono focus:border-[#3b82f6] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-gaming text-slate-400 block mb-1">
                Client Seed
              </label>
              <input
                type="text"
                value={clientSeed}
                onChange={(e) => setClientSeed(e.target.value)}
                className="w-full bg-[#151c2a] border border-[#242f44] rounded px-3 py-1.5 text-xs text-white font-mono focus:border-[#3b82f6] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-gaming text-slate-400 block mb-1">
                Revealed Server Seed
              </label>
              <input
                type="text"
                value={serverSeed}
                onChange={(e) => setServerSeed(e.target.value)}
                className="w-full bg-[#151c2a] border border-[#242f44] rounded px-3 py-1.5 text-xs text-white font-mono focus:border-[#3b82f6] focus:outline-none"
              />
            </div>

            <button
              onClick={handleVerify}
              disabled={verifying}
              className="w-full py-2 rounded bg-[#3b82f6] hover:bg-[#2563eb] text-slate-950 font-gaming font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              {verifying ? 'Computing Cryptographic Verification...' : 'Verify Match Now'}
            </button>
          </div>

          {/* Verification Results Output */}
          {verificationResult && (
            <div
              className={`p-4 rounded-lg border text-xs font-mono space-y-2 ${
                verificationResult.verified
                  ? 'bg-blue-950/30 border-blue-500/50 text-blue-200'
                  : 'bg-rose-950/30 border-rose-500/50 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2 font-gaming font-bold text-sm">
                {verificationResult.verified ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-[#3b82f6]" />
                    <span className="text-[#3b82f6]">CRYPTOGRAPHICALLY VERIFIED & AUTHENTIC</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                    <span className="text-rose-400">HASH OR RESULT MISMATCH</span>
                  </>
                )}
              </div>

              <div className="space-y-1 text-[11px] pt-1">
                <div>
                  <span className="text-slate-400">Target Commitment Hash:</span>{' '}
                  <span className="text-white break-all">{verificationResult.serverSeedHash}</span>
                </div>
                <div>
                  <span className="text-slate-400">Recomputed SHA-256:</span>{' '}
                  <span className="text-[#3b82f6] break-all">{verificationResult.calculatedHash}</span>
                </div>
                <div>
                  <span className="text-slate-400">Authoritative Result:</span>{' '}
                  <span className="text-amber-400 font-bold">{verificationResult.result}</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
