import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Flag,
  AlertCircle,
  X,
  MessageSquare,
  Crown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Smile,
  Volume2,
  VolumeX,
  Gift,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { ChatMessage, User, Giveaway } from '../types';
import { soundEffects } from '../utils/audio';
import { PetImage } from './PetImage';

interface RightChatSidebarProps {
  messages: ChatMessage[];
  currentUser: User;
  onlineCount: number;
  onSendMessage: (msg: string) => Promise<boolean>;
  onReportMessage: (messageId: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenRobloxVerify?: () => void;
  onOpenCreateGiveaway?: () => void;
}

const EMOJIS = ['🐾', '🐉', '🔥', '🍀', '💎', '👑', '⚡', '🤑', '🎉', '🤝', '🚀', '❤️'];

export const RightChatSidebar: React.FC<RightChatSidebarProps> = ({
  messages,
  currentUser,
  onlineCount,
  onSendMessage,
  onReportMessage,
  isOpen,
  onClose,
  onOpenRobloxVerify,
  onOpenCreateGiveaway,
}) => {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [currentGwIndex, setCurrentGwIndex] = useState(0);
  const [joiningGwId, setJoiningGwId] = useState<string | null>(null);
  const [nowTime, setNowTime] = useState(Date.now());
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll giveaways every 2 seconds
  useEffect(() => {
    let isMounted = true;
    const fetchGw = async () => {
      try {
        const res = await fetch('/api/giveaways');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data)) {
            setGiveaways(data);
          }
        }
      } catch (e) {
        // silent
      }
    };

    fetchGw();
    const interval = setInterval(fetchGw, 2000);
    const ticker = setInterval(() => setNowTime(Date.now()), 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      clearInterval(ticker);
    };
  }, []);

  // Filter active giveaways OR giveaways ended less than 10 seconds ago
  const visibleGiveaways = giveaways.filter((gw) => {
    const endMs = new Date(gw.endTime).getTime();
    if (!gw.resolved && nowTime < endMs) return true;
    const endedMs = gw.endedAt ? new Date(gw.endedAt).getTime() : endMs;
    const elapsed = nowTime - endedMs;
    return elapsed >= 0 && elapsed <= 10000;
  });

  // Adjust index if out of bounds
  const safeGwIndex =
    visibleGiveaways.length === 0
      ? 0
      : Math.min(currentGwIndex, visibleGiveaways.length - 1);
  const visibleGiveaway = visibleGiveaways[safeGwIndex] || null;

  const handleNextGiveaway = () => {
    if (visibleGiveaways.length > 1) {
      setCurrentGwIndex((prev) => (prev + 1) % visibleGiveaways.length);
    }
  };

  const handlePrevGiveaway = () => {
    if (visibleGiveaways.length > 1) {
      setCurrentGwIndex((prev) =>
        prev === 0 ? visibleGiveaways.length - 1 : prev - 1
      );
    }
  };

  const handleJoinGiveaway = async (gwId: string) => {
    if (!currentUser.verified || currentUser.id === 'guest') {
      if (onOpenRobloxVerify) onOpenRobloxVerify();
      return;
    }
    setJoiningGwId(gwId);
    try {
      const res = await fetch(`/api/giveaways/${gwId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
      });
      if (res.ok) {
        const updated = await res.json();
        setGiveaways((prev) => prev.map((g) => (g.id === gwId ? updated : g)));
        if (soundEnabled) soundEffects.playChatPop();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setJoiningGwId(null);
    }
  };

  // Format remaining time
  const formatRemaining = (endTimeStr: string) => {
    const diff = Math.max(0, Math.floor((new Date(endTimeStr).getTime() - nowTime) / 1000));
    if (diff === 0) return 'Rolling...';
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hrs}h ${remMins}m`;
    }
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Auto scroll chat to bottom when near bottom
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    setIsScrolledUp(false);
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 80;
    setIsScrolledUp(isUp);
  };

  useEffect(() => {
    if (isOpen && !isScrolledUp) {
      scrollToBottom(false);
    }
  }, [messages, isOpen, isScrolledUp]);

  const handleSend = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const text = (customText || inputText).trim();
    if (!text || isSending) return;

    if (!currentUser.verified && onOpenRobloxVerify) {
      onOpenRobloxVerify();
      return;
    }

    setIsSending(true);
    setErrorNotice(null);
    try {
      const success = await onSendMessage(text);
      if (success) {
        if (!customText) {
          setInputText('');
        }
        if (soundEnabled) soundEffects.playChatPop();
        scrollToBottom();
      }
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to send message');
      setTimeout(() => setErrorNotice(null), 3000);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <aside
      className="fixed top-13 bottom-16 md:bottom-0 right-0 w-full sm:w-80 md:w-88 h-auto max-h-[calc(100dvh-3.25rem)] bg-[#090e18]/95 backdrop-blur-md border-l border-[#172236] flex flex-col min-h-0 overflow-hidden select-none shadow-[0_0_40px_rgba(0,0,0,0.85)] z-40 animate-in slide-in-from-right duration-200"
    >
      {/* Chat header: Blue pulse dot + online count + Host Giveaway + Audio + Close button */}
      <div className="h-12 px-3.5 border-b border-[#162135] flex items-center justify-between bg-[#0c1220] shrink-0">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3884ff] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#3884ff] shadow-[0_0_6px_#3884ff]"></span>
          </span>
          <span className="font-gaming text-xs font-black text-white tracking-wider flex items-center gap-1.5 uppercase">
            <i className="fa-solid fa-comments text-[#3884ff] text-xs" />
            <span>Chat</span>
          </span>
          <span className="text-[10px] font-mono font-bold text-[#3884ff] bg-[#3884ff]/15 border border-[#3884ff]/30 px-1.5 py-0.5 rounded-full">
            {onlineCount}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Host Giveaway Top-Of-Chat Button */}
          {onOpenCreateGiveaway && (
            <button
              onClick={onOpenCreateGiveaway}
              className="px-2 py-1 rounded-lg bg-[#3884ff]/15 hover:bg-[#3884ff]/25 text-sky-300 border border-[#3884ff]/40 text-[10px] font-gaming font-bold flex items-center gap-1 transition cursor-pointer shadow-[0_0_8px_rgba(56,132,255,0.2)]"
              title="Host a Pet Giveaway in Chat"
            >
              <Gift className="w-3 h-3 text-[#3884ff]" />
              <span>Giveaway</span>
            </button>
          )}

          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              soundEffects.enabled = !soundEnabled;
            }}
            title={soundEnabled ? 'Mute Chat Sound' : 'Unmute Chat Sound'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#151f30] transition-colors cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#3884ff]" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          </button>
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white p-1.5 rounded-lg bg-[#121a2c] hover:bg-[#18233a] transition-colors flex items-center justify-center cursor-pointer border border-[#1d2940]"
            title="Close Chat"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Giveaway Banner: Matches site color palette with blue neon glowing border, hoster username, and pagination (< >) if multiple */}
      {visibleGiveaway && (
        <div className="mx-3 mt-2.5 p-2.5 rounded-xl bg-[#0d1525]/95 border border-[#3884ff]/40 shadow-[0_0_16px_rgba(56,132,255,0.18)] shrink-0 transition-all duration-300">
          {/* Header row: Host user and pagination if multiple */}
          <div className="flex items-center justify-between gap-1 mb-1.5 pb-1 border-b border-[#1b273d]">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="px-1.5 py-0.2 rounded text-[9px] font-gaming font-black bg-[#3884ff]/20 text-sky-300 border border-[#3884ff]/30 flex items-center gap-0.5">
                <Gift className="w-2.5 h-2.5 text-[#3884ff]" />
                <span>GIVEAWAY</span>
              </span>
              <span className="text-[10px] text-slate-400 truncate">
                by <strong className="text-white font-gaming">@{visibleGiveaway.creatorUsername || 'System'}</strong>
              </span>
            </div>

            {/* Pagination controls if multiple giveaways active */}
            {visibleGiveaways.length > 1 && (
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[9px] font-mono font-bold text-sky-300 px-1 py-0.2 rounded bg-[#131d30]">
                  {safeGwIndex + 1}/{visibleGiveaways.length}
                </span>
                <button
                  onClick={handlePrevGiveaway}
                  className="p-0.5 rounded bg-[#141e30] hover:bg-[#1f2e4a] text-slate-300 hover:text-white border border-[#223350] transition cursor-pointer"
                  title="Previous Giveaway"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <button
                  onClick={handleNextGiveaway}
                  className="p-0.5 rounded bg-[#141e30] hover:bg-[#1f2e4a] text-slate-300 hover:text-white border border-[#223350] transition cursor-pointer"
                  title="Next Giveaway"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            {/* Left: Pet Image & Info */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative shrink-0 w-9 h-9 rounded-lg bg-[#131c2d] border border-[#3884ff]/30 flex items-center justify-center p-0.5">
                <PetImage
                  src={visibleGiveaway.petImage}
                  alt={visibleGiveaway.petName}
                  className="w-full h-full object-contain"
                  variant={visibleGiveaway.variant}
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1 truncate">
                  <span className="text-[11px] font-gaming font-black text-white truncate">
                    {visibleGiveaway.variant !== 'Normal' ? `${visibleGiveaway.variant} ` : ''}
                    {visibleGiveaway.petName}
                  </span>
                </div>
                <div className="text-[10px] text-sky-400 flex items-center gap-1 font-mono font-bold">
                  <span>{visibleGiveaway.value} Val</span>
                </div>
              </div>
            </div>

            {/* Right: Timer & Join OR Winner State (showing for 10s then auto disappears) */}
            <div className="shrink-0 flex items-center gap-2">
              {visibleGiveaway.resolved || nowTime >= new Date(visibleGiveaway.endTime).getTime() ? (
                <div className="text-right flex flex-col items-end">
                  <div className="flex items-center gap-1 text-[#3884ff] text-[10px] font-gaming font-black uppercase tracking-wide">
                    <Sparkles className="w-3 h-3 text-sky-400 animate-spin" />
                    <span>Winner!</span>
                  </div>
                  <div className="text-[11px] font-gaming font-black text-white truncate max-w-[100px]">
                    @{visibleGiveaway.winnerUsername || 'Player'}
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono">
                    ends in{' '}
                    {Math.max(
                      0,
                      Math.ceil(
                        (10000 -
                          (nowTime -
                            (visibleGiveaway.endedAt
                              ? new Date(visibleGiveaway.endedAt).getTime()
                              : new Date(visibleGiveaway.endTime).getTime()))) /
                          1000
                      )
                    )}
                    s
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <div className="text-right">
                    <div className="text-[10px] font-mono font-bold text-sky-400 flex items-center gap-1 justify-end">
                      <Clock className="w-2.5 h-2.5 text-[#3884ff]" />
                      <span>{formatRemaining(visibleGiveaway.endTime)}</span>
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono">
                      {visibleGiveaway.participants.length} joined
                    </div>
                  </div>

                  {/* Join Button */}
                  {currentUser.id !== 'guest' &&
                  visibleGiveaway.participants.includes(currentUser.id) ? (
                    <div className="px-2 py-1 rounded-lg bg-sky-500/20 border border-sky-500/40 text-sky-300 text-[10px] font-gaming font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-[#3884ff]" />
                      <span>Entered</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleJoinGiveaway(visibleGiveaway.id)}
                      disabled={joiningGwId === visibleGiveaway.id}
                      className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#3884ff] to-[#2563eb] hover:from-[#60a5fa] hover:to-[#3884ff] text-slate-950 font-gaming font-black text-[10px] uppercase tracking-wider transition cursor-pointer shadow-[0_0_10px_rgba(56,132,255,0.3)] disabled:opacity-50"
                    >
                      {joiningGwId === visibleGiveaway.id ? '...' : 'Join'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error alert toast */}
      {errorNotice && (
        <div className="mx-3 mt-2 px-3 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn shrink-0">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
          <span className="truncate">{errorNotice}</span>
        </div>
      )}

      {/* Messages Feed Container */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 space-y-2.5 scroll-smooth relative"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 text-xs">
            <div className="w-10 h-10 rounded-full bg-[#111827] border border-[#1c273c] flex items-center justify-center text-slate-400 mb-2">
              <MessageSquare className="w-5 h-5 text-[#3884ff]" />
            </div>
            <p className="font-gaming font-bold text-slate-300">No chat messages yet</p>
            <p className="text-[11px] mt-1 text-slate-500 max-w-[200px]">
              Say hello or discuss pet coinflips with other players!
            </p>
          </div>
        ) : (
          messages
            .filter((msg) => !msg.isSystemWin)
            .map((msg) => {
              const isOwner =
                msg.username?.toLowerCase() === 'cute240bunny' ||
                msg.username?.toLowerCase() === 'adpcoin' ||
                msg.isOwner ||
                msg.isAdmin;
              const isMe = msg.username === (currentUser.robloxUsername || currentUser.username);
              const messageText = msg.message || (msg as any).text || '';

              return (
                <div
                  key={msg.id}
                  className={`group relative flex items-start gap-2.5 text-xs p-2.5 rounded-xl transition-all duration-150 border ${
                    isOwner
                      ? 'bg-[#121929]/90 border-transparent shadow-[0_0_12px_rgba(56,132,255,0.06)]'
                      : isMe
                      ? 'bg-[#0f1728]/90 border-[#3884ff]/25 hover:border-[#3884ff]/40'
                      : 'bg-[#0e1422]/60 border-transparent hover:border-[#1c273c] hover:bg-[#111828]/80'
                  }`}
                >
                  {/* User Roblox Avatar */}
                  <div className="relative shrink-0 mt-0.5">
                    <img
                      src={
                        msg.username?.toLowerCase() === 'cute240bunny'
                          ? 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-2A0DE04FF101FD93723B00B54581C2D3-Png/150/150/AvatarHeadshot/Png/isCircular'
                          : msg.avatarUrl || 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-2A0DE04FF101FD93723B00B54581C2D3-Png/150/150/AvatarHeadshot/Png/isCircular'
                      }
                      alt={msg.username}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-2A0DE04FF101FD93723B00B54581C2D3-Png/150/150/AvatarHeadshot/Png/isCircular';
                      }}
                      className={`w-7 h-7 rounded-full object-cover border bg-slate-900 shadow-sm ${
                        isOwner ? 'border-amber-400' : isMe ? 'border-[#3884ff]' : 'border-slate-700'
                      }`}
                    />
                    {isOwner && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs">
                        <Crown className="w-2.5 h-2.5 fill-slate-950 stroke-[2.5]" />
                      </span>
                    )}
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span
                        className={`font-gaming font-bold truncate text-[11px] ${
                          isOwner ? 'text-amber-400' : isMe ? 'text-sky-300' : 'text-slate-200'
                        }`}
                      >
                        {msg.username}
                      </span>

                      {/* Badges */}
                      {isOwner ? (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold font-gaming bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-0.5">
                          <Crown className="w-2.5 h-2.5" />
                          <span>OWNER</span>
                        </span>
                      ) : messageText.startsWith('🎁 Tipped') ? (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold font-gaming bg-[#3884ff]/20 text-sky-300 border border-[#3884ff]/40">
                          TIP
                        </span>
                      ) : (msg as any).badge === 'GIVEAWAY' ? (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold font-gaming bg-[#3884ff]/20 text-sky-300 border border-[#3884ff]/40">
                          GIVEAWAY
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono text-slate-400 bg-slate-800/60 border border-slate-700/50">
                          LVL {msg.level || 1}
                        </span>
                      )}

                      <span className="text-[10px] text-slate-500 font-mono ml-auto">
                        {msg.timestamp}
                      </span>
                    </div>

                    <p className="text-slate-200 font-medium break-words leading-relaxed text-[11.5px]">
                      {messageText}
                    </p>
                  </div>

                  {/* Report action button on hover */}
                  {!isOwner && !isMe && (
                    <button
                      onClick={() => onReportMessage(msg.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded cursor-pointer"
                      title="Report message"
                    >
                      <Flag className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll-To-Bottom Indicator Button */}
      {isScrolledUp && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute bottom-20 right-4 z-10 px-3 py-1.5 rounded-full bg-[#162135] border border-slate-700 text-slate-200 text-xs font-gaming font-bold shadow-lg flex items-center gap-1.5 hover:bg-slate-700 transition cursor-pointer"
        >
          <ChevronDown className="w-3.5 h-3.5 text-[#3884ff]" />
          <span>New messages</span>
        </button>
      )}

      {/* Emoji Picker Popup */}
      {showEmojiPicker && (
        <div className="mx-3 mb-2 p-2 bg-[#101726] border border-[#1e2a42] rounded-xl shadow-xl flex flex-wrap gap-1.5 animate-fadeIn">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                setInputText((prev) => prev + emoji);
                setShowEmojiPicker(false);
              }}
              className="p-1 text-base hover:bg-[#1a253a] rounded transition cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Chat Input Bar - Simple & Clean without extra clutter */}
      <form
        onSubmit={handleSend}
        className="sticky bottom-0 z-20 p-3 border-t border-[#162135] bg-[#0c1220] flex items-center gap-2 shrink-0"
      >
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#151f32] transition cursor-pointer"
          title="Emojis"
        >
          <Smile className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            !currentUser.verified
              ? 'Verify Roblox account to chat...'
              : 'Type a message...'
          }
          maxLength={150}
          autoComplete="off"
          className="flex-1 bg-[#101728] border border-[#1d2940] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#3884ff] transition-colors"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="p-2 rounded-xl bg-[#3884ff] hover:bg-[#2563eb] text-slate-950 transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none shrink-0"
          title="Send"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </aside>
  );
};
