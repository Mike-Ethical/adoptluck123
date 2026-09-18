import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  LogOut,
  UserCheck,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { User } from '../types';
import { formatCompactValue } from '../utils/format';

interface RobloxVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onVerified: (updatedUser: User) => void;
  onLogout?: () => void;
}

export const RobloxVerifyModal: React.FC<RobloxVerifyModalProps> = ({
  isOpen,
  onClose,
  user,
  onVerified,
  onLogout,
}) => {
  const [usernameInput, setUsernameInput] = useState(user.robloxUsername || '');
  const [step, setStep] = useState<'input' | 'phrase'>('input');
  const [phrase, setPhrase] = useState('');
  const [robloxId, setRobloxId] = useState<number | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [profileUrl, setProfileUrl] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Step 1: Start Roblox verification & fetch profile card
  const handleGeneratePhrase = async () => {
    if (!usernameInput.trim()) {
      setError('Please enter your Roblox username');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/user/roblox/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput.trim() }),
      });
      const raw = await res.text();
      let data: any = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        console.error('Roblox start API returned non-JSON:', res.status, raw.slice(0, 500));
        throw new Error(
          res.status === 404
            ? 'Roblox API endpoint was not deployed. Make sure api/user/roblox/start.ts is in the project root.'
            : `Server returned HTTP ${res.status} instead of JSON.`
        );
      }
      if (res.ok && data.phrase) {
        setPhrase(data.phrase);
        setRobloxId(data.robloxId);
        setDisplayName(data.displayName || data.robloxUsername);
        setAvatarUrl(data.avatarUrl || '');
        setProfileUrl(data.profileUrl || `https://www.roblox.com/users/${data.robloxId}/profile`);
        setVerificationToken(data.verificationToken || '');
        setStep('phrase');
      } else {
        setError(data.error || 'Roblox account not found. Please check spelling.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error reaching Roblox API');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify phrase in Roblox bio
  const handleConfirmVerification = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/user/roblox/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          robloxId,
          username: usernameInput.trim(),
          verificationToken,
        }),
      });
      const raw = await res.text();
      let data: any = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        console.error('Roblox check API returned non-JSON:', res.status, raw.slice(0, 500));
        throw new Error(
          res.status === 404
            ? 'Roblox verification API was not deployed. Make sure api/user/roblox/check.ts is in the project root.'
            : `Server returned HTTP ${res.status} instead of JSON.`
        );
      }
      if (res.ok && data.user) {
        onVerified(data.user);
        onClose();
      } else {
        setError(
          data.error ||
            `Phrase "${phrase}" was not found in your Roblox bio. Please paste it into your Roblox 'About' section, save it, and retry.`
        );
      }
    } catch (err: any) {
      setError(err.message || 'Verification network error');
    } finally {
      setLoading(false);
    }
  };

  const copyPhrase = () => {
    navigator.clipboard.writeText(phrase);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 select-none">
      <div className="bg-[#0e131e] border border-[#1f2a3f] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#1b2538] flex items-center justify-between bg-[#121825]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#3b82f6]" />
            <h2 className="font-gaming font-black text-white text-sm tracking-wider uppercase">
              {user.verified ? 'Roblox Account' : 'Sign In With Roblox'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="leading-snug">{error}</div>
            </div>
          )}

          {/* If already logged in, show active user profile card with Logout */}
          {user.verified && step === 'input' ? (
            <div className="space-y-4">
              <div className="p-4 bg-[#141c2c] border border-[#1e2a42] rounded-xl flex items-center gap-3.5">
                <img
                  src={user.avatarUrl}
                  alt={user.robloxUsername}
                  className="w-14 h-14 rounded-full object-cover border border-slate-700 shadow-sm shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-gaming font-black text-white text-base truncate">
                      {user.robloxUsername}
                    </span>
                    {user.role === 'admin' ? (
                      <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-gaming font-bold">
                        ADMIN
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-[#3b82f6]/20 text-[#3b82f6] text-[10px] font-bold">
                        VERIFIED
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 block font-mono mt-0.5">
                    ID: {user.robloxUserId ? `#${user.robloxUserId}` : user.id}
                  </span>
                  <span className="text-xs text-amber-400 font-mono font-bold block mt-0.5">
                    Profit: +{formatCompactValue(user.totalProfit)} Val
                  </span>
                </div>
              </div>

              {user.role === 'admin' && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>You are signed in with administrator privileges (@cute240bunny).</span>
                </div>
              )}

              <div className="flex gap-2.5 pt-1">
                <button
                  onClick={() => {
                    if (user.robloxUsername) {
                      setUsernameInput(user.robloxUsername);
                    }
                    setStep('input');
                  }}
                  className="flex-1 py-2.5 rounded-lg bg-[#182338] hover:bg-[#202e48] text-slate-200 font-gaming font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Switch Account
                </button>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="flex-1 py-2.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-gaming font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                )}
              </div>
            </div>
          ) : step === 'input' ? (
            /* STEP 1: Enter Roblox Username */
            <div className="space-y-4">
              <div>
                <label className="text-xs font-gaming font-bold text-slate-300 block mb-1.5 uppercase tracking-wide">
                  Roblox Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGeneratePhrase()}
                    placeholder="Enter Roblox username"
                    className="w-full bg-[#141c2c] border border-[#233047] rounded-xl px-4 py-3 text-sm text-white font-gaming focus:border-[#3b82f6] focus:outline-none placeholder:text-slate-600"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  No password or cookies needed. We look up your public Roblox profile to verify ownership safely.
                </p>
              </div>

              <button
                onClick={handleGeneratePhrase}
                disabled={loading || !usernameInput.trim()}
                className="w-full py-3 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 text-slate-950 font-gaming font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.25)]"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Locating Roblox Profile...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4 stroke-[2.5]" />
                    <span>Continue</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* STEP 2: Show Roblox Profile Card + Untagged Phrase */
            <div className="space-y-4 animate-fadeIn">
              {/* Profile Card Preview */}
              <div className="p-3.5 bg-[#141c2c] border border-[#202e48] rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                    alt={displayName || usernameInput}
                    className="w-12 h-12 rounded-full object-cover border-2 border-slate-700 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="font-gaming font-bold text-white text-sm truncate">
                      {displayName || usernameInput}
                    </div>
                    <div className="text-xs text-slate-400 font-mono truncate">
                      @{usernameInput}
                    </div>
                    {robloxId && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        ID: #{robloxId}
                      </span>
                    )}
                  </div>
                </div>

                {profileUrl && (
                  <a
                    href={profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded bg-[#1b263b] hover:bg-[#23314c] text-xs text-[#3b82f6] flex items-center gap-1 font-bold shrink-0 transition"
                  >
                    <span>Profile</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Untagged Verification Phrase Box */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-300 font-gaming font-bold">
                    Bio Phrase (Untagged by Roblox):
                  </span>
                  <span className="text-[10px] text-[#3b82f6] font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Filter-safe
                  </span>
                </div>

                <div className="flex items-center gap-2 p-3 bg-[#0a0f18] border border-[#1e2a42] rounded-xl">
                  <span className="font-mono font-black text-amber-400 text-base tracking-wider flex-1 select-all">
                    {phrase}
                  </span>
                  <button
                    onClick={copyPhrase}
                    className="px-3 py-1.5 rounded-lg bg-[#182338] hover:bg-[#22314e] text-slate-200 transition cursor-pointer flex items-center gap-1.5 text-xs font-gaming font-bold"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#3b82f6]" />
                        <span className="text-[#3b82f6]">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Simple Short Instruction */}
              <p className="text-xs text-slate-400 leading-relaxed">
                Paste this phrase into your Roblox profile <strong className="text-white">About</strong> section, save it, and click verify below.
              </p>

              {/* Verify Button */}
              <button
                onClick={handleConfirmVerification}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 text-slate-950 font-gaming font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.25)]"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Roblox Bio...</span>
                  </>
                ) : (
                  <span>Verify Bio & Sign In</span>
                )}
              </button>

              <button
                onClick={() => {
                  setStep('input');
                  setError(null);
                }}
                className="text-xs text-slate-500 hover:text-slate-300 text-center w-full block transition-colors cursor-pointer pt-1"
              >
                ← Change Roblox username
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
