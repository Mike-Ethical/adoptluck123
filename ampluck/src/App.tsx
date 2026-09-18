import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  InventoryItem,
  CoinflipMatch,
  FeaturedMatch,
  ChatMessage,
  CoinSide,
} from './types';
import { TopBar } from './components/TopBar';
import { LeftSidebar, NavTab } from './components/LeftSidebar';
import { RightChatSidebar } from './components/RightChatSidebar';
import { FeaturedMatches } from './components/FeaturedMatches';
import { MatchActionBar } from './components/MatchActionBar';
import { MatchFeed } from './components/MatchFeed';
import { CreateMatchModal } from './components/CreateMatchModal';
import { JoinMatchModal } from './components/JoinMatchModal';
import { CoinflipAnimationModal } from './components/CoinflipAnimationModal';
import { InventoryModal } from './components/InventoryModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { ProvablyFairModal } from './components/ProvablyFairModal';
import { RobloxVerifyModal } from './components/RobloxVerifyModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { Giveaways } from './components/Giveaways';
import { CreateGiveawayModal } from './components/CreateGiveawayModal';
import { FaqModal } from './components/FaqModal';
import { TosModal } from './components/TosModal';
import { BottomNavBar } from './components/BottomNavBar';
import { UserProfileModal } from './components/UserProfileModal';
import { defaultUser, defaultGuestUser } from './data/initialData';
import { BloxLuckLogo } from './components/BloxLuckLogo';

export function App() {
  // Core state initialized safely as Guest (never auto-log into owner)
  const [isInitialAppLoading, setIsInitialAppLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User>(defaultGuestUser);
  const [originalOwnerUser, setOriginalOwnerUser] = useState<User | null>(null);
  const [discordLink, setDiscordLink] = useState<string>('https://discord.gg/bloxluck');

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [matches, setMatches] = useState<CoinflipMatch[]>([]);
  const [featured, setFeatured] = useState<FeaturedMatch[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [onlineCount, setOnlineCount] = useState<number>(113);

  // Filters & Tabs
  const [currentTab, setCurrentTab] = useState<NavTab>('coinflip');
  const [showOnlyMyMatches, setShowOnlyMyMatches] = useState(false);

  // Modals state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [joiningMatch, setJoiningMatch] = useState<CoinflipMatch | null>(null);

  const [isAnimationOpen, setIsAnimationOpen] = useState(false);
  const [animatingMatch, setAnimatingMatch] = useState<CoinflipMatch | null>(null);

  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isFairnessOpen, setIsFairnessOpen] = useState(false);
  const [selectedFairnessMatch, setSelectedFairnessMatch] = useState<CoinflipMatch | null>(null);

  const [isRobloxVerifyOpen, setIsRobloxVerifyOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [isTosOpen, setIsTosOpen] = useState(false);
  const [isCreateGiveawayOpen, setIsCreateGiveawayOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Fetch user profile
  const fetchUserProfile = useCallback(async (explicitUserId?: string) => {
    try {
      const activeId = explicitUserId ?? localStorage.getItem('bloxluck_user_id');
      if (!activeId || activeId === 'guest') {
        setCurrentUser(defaultGuestUser);
        return;
      }
      const headers: Record<string, string> = { 'x-user-id': activeId };
      const res = await fetch('/api/user/profile', { headers });
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          const userObj = data.user || (data.id ? data : null);
          if (userObj && userObj.id !== 'guest') {
            setCurrentUser(userObj);
            localStorage.setItem('bloxluck_user_id', userObj.id);
            localStorage.setItem('bloxluck_user', JSON.stringify(userObj));
          } else {
            setCurrentUser(defaultGuestUser);
            localStorage.removeItem('bloxluck_user_id');
            localStorage.removeItem('bloxluck_user');
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch user profile', err);
    }
  }, []);

  // Fetch inventory
  const fetchInventory = useCallback(async (explicitUserId?: string) => {
    try {
      const activeId = explicitUserId ?? localStorage.getItem('bloxluck_user_id');
      if (!activeId || activeId === 'guest') {
        setInventory([]);
        return;
      }
      const headers: Record<string, string> = { 'x-user-id': activeId };
      const res = await fetch('/api/inventory', { headers });
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setInventory(data.items || []);
        }
      }
    } catch (err) {
      console.error('Failed to fetch inventory', err);
    }
  }, []);

  // Fetch matches
  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch('/api/matches');
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setMatches(data.matches || []);
          if (data.featured && Array.isArray(data.featured) && data.featured.length > 0) {
            setFeatured(data.featured);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch matches', err);
    }
  }, []);

  // Fetch featured matches
  const fetchFeatured = useCallback(async () => {
    try {
      const res = await fetch('/api/matches/featured');
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.featured) {
            setFeatured(data.featured);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch featured matches', err);
    }
  }, []);

  // Fetch chat
  const fetchChat = useCallback(async () => {
    try {
      const res = await fetch('/api/chat');
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setChatMessages(data.messages || []);
          if (data.onlineCount) setOnlineCount(data.onlineCount);
        }
      }
    } catch (err) {
      console.error('Failed to fetch chat', err);
    }
  }, []);

  // Fetch settings (including Discord server link)
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.discordLink) {
          setDiscordLink(data.discordLink);
        }
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const savedUserStr = localStorage.getItem('bloxluck_user');
    const savedUserId = localStorage.getItem('bloxluck_user_id');

    // Restore verified user from localStorage
    if (savedUserId && savedUserId !== 'guest' && savedUserStr) {
      try {
        const parsed = JSON.parse(savedUserStr);
        if (parsed && parsed.verified && parsed.id !== 'guest') {
          setCurrentUser(parsed);
          fetchUserProfile(savedUserId);
          fetchInventory(savedUserId);
        } else {
          setCurrentUser(defaultGuestUser);
        }
      } catch (e) {
        setCurrentUser(defaultGuestUser);
      }
    } else if (
      savedUserId &&
      (savedUserId === 'cute240bunny' ||
        savedUserId === 'roblox-cute240bunny' ||
        savedUserId === '3058833903' ||
        savedUserId === 'roblox-3058833903')
    ) {
      setCurrentUser(defaultUser);
      fetchUserProfile(savedUserId);
      fetchInventory(savedUserId);
    } else {
      setCurrentUser(defaultGuestUser);
    }

    fetchMatches();
    fetchFeatured();
    fetchChat();
    fetchSettings();

    // Regular interval to keep feed & chat fresh
    const interval = setInterval(() => {
      fetchMatches();
      fetchChat();
    }, 4000);

    return () => clearInterval(interval);
  }, [fetchUserProfile, fetchInventory, fetchMatches, fetchFeatured, fetchChat, fetchSettings]);

  // Handle successful Roblox verification
  
  const handleImpersonate = (user: User) => {
    if (currentUser.role === 'admin' && !originalOwnerUser) {
      setOriginalOwnerUser(currentUser);
    }
    setCurrentUser(user);
    setIsAdminOpen(false);
  };
  
  const handleStopImpersonating = () => {
    if (originalOwnerUser) {
      setCurrentUser(originalOwnerUser);
      setOriginalOwnerUser(null);
    }
  };

  const handleVerifiedUser = (updatedUser: User) => {

    setCurrentUser(updatedUser);
    localStorage.setItem('bloxluck_user_id', updatedUser.id);
    localStorage.setItem('bloxluck_user', JSON.stringify(updatedUser));
    fetchInventory(updatedUser.id);
    fetchUserProfile(updatedUser.id);
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('bloxluck_user_id');
    localStorage.removeItem('bloxluck_user');
    setCurrentUser(defaultGuestUser);
    setIsAdminOpen(false);
    setIsRobloxVerifyOpen(false);
    fetchInventory('guest');
  };

  // Handle Send Chat Message (Require real Roblox account login)
  const handleSendMessage = async (msg: string): Promise<boolean> => {
    if (!currentUser.verified || currentUser.id === 'guest') {
      setIsRobloxVerifyOpen(true);
      throw new Error('Please log in with your Roblox account to chat with your real profile.');
    }
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUser.id,
      },
      body: JSON.stringify({ message: msg }),
    });
    if (res.ok) {
      const data = await res.json();
      setChatMessages((prev) => [...prev, data.message]);
      if (data.message?.message?.includes('Tipped')) {
        fetchInventory(currentUser.id);
      }
      return true;
    }
    const errData = await res.json();
    throw new Error(errData.error || 'Failed to send message');
  };

  // Handle Report Message
  const handleReportMessage = async (messageId: string) => {
    try {
      await fetch('/api/chat/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({ messageId, reason: 'Inappropriate language' }),
      });
      alert('Message reported to moderators.');
    } catch (err) {
      console.error(err);
    }
  };

  // Count active matches posted by currentUser for 5-post limit
  const activeUserMatchesCount = matches.filter(
    (m) => m.creator.userId === currentUser.id && m.status === 'WAITING'
  ).length;

  // Handle Cancel Match (Returns pets to inventory and frees post slot)
  const handleCancelMatch = async (match: CoinflipMatch) => {
    try {
      const res = await fetch(`/api/matches/${match.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
      });
      if (res.ok) {
        fetchMatches();
        if (currentUser.id && currentUser.id !== 'guest') {
          fetchInventory(currentUser.id);
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to cancel match');
      }
    } catch (e) {
      console.error('Failed to cancel match', e);
    }
  };

  // Handle Create Match (Guarded by Roblox verification & 5-post limit)
  const handleCreateMatch = async (
    selectedItemIds: string[],
    side: CoinSide,
    maxJoinerPets?: number | null
  ) => {
    if (!currentUser.verified || currentUser.id === 'guest') {
      setIsRobloxVerifyOpen(true);
      throw new Error('Please log in with Roblox before creating a coinflip');
    }

    if (activeUserMatchesCount >= 5) {
      throw new Error('Post limit reached: You can have at most 5 active coinflip matches posted at a time. Please wait for an opponent or cancel one of your existing matches.');
    }

    const res = await fetch('/api/matches/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUser.id,
      },
      body: JSON.stringify({ itemIds: selectedItemIds, side, maxJoinerPets }),
    });

    if (res.ok) {
      fetchMatches();
      fetchInventory(currentUser.id);
      fetchUserProfile(currentUser.id);
    } else {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create match');
    }
  };

  // Handle Open Join Match from Feed (Guarded by Roblox verification)
  const handleOpenJoin = (match: CoinflipMatch) => {
    if (!currentUser.verified) {
      setIsRobloxVerifyOpen(true);
      return;
    }
    setJoiningMatch(match);
    setIsJoinOpen(true);
  };

  const handleConfirmJoin = async (matchId: string, selectedItemIds: string[]) => {
    if (!currentUser.verified) {
      setIsRobloxVerifyOpen(true);
      throw new Error('Please log in with Roblox first');
    }

    const res = await fetch('/api/matches/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUser.id,
      },
      body: JSON.stringify({ matchId, itemIds: selectedItemIds }),
    });

    if (res.ok) {
      const data = await res.json();
      fetchMatches();
      fetchInventory(currentUser.id);
      fetchUserProfile(currentUser.id);

      // Launch 3D coinflip animation modal with server outcome!
      setAnimatingMatch(data.match);
      setIsAnimationOpen(true);
    } else {
      const err = await res.json();
      throw new Error(err.error || 'Failed to join match');
    }
  };

  // Admin-only helper: start a posted match against a randomized house opponent.
  // The server keeps the outcome provably-fair; this does not force a loss/win.
  const handleAdminCallOpponent = async (match: CoinflipMatch) => {
    if (currentUser.role !== 'admin') return;
    try {
      const res = await fetch(`/api/matches/${match.id}/call-bot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({ matchId: match.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to start opponent');
      fetchMatches();
      fetchInventory(currentUser.id);
      fetchUserProfile(currentUser.id);
      setAnimatingMatch(data.match);
      setIsAnimationOpen(true);
    } catch (err: any) {
      alert(err.message || 'Failed to start opponent');
    }
  };

  // Handle Join Featured Match
  const handleJoinFeatured = (item: FeaturedMatch) => {
    if (!currentUser.verified) {
      setIsRobloxVerifyOpen(true);
      return;
    }
    const found = matches.find((m) => m.status === 'WAITING');
    if (found) {
      handleOpenJoin(found);
    } else {
      setIsCreateOpen(true);
    }
  };

  // Handle Pet Withdrawal (Deletes chosen pets from inventory and returns discordLink)
  const handleWithdrawPets = async (itemIds: string[]): Promise<{ discordLink?: string }> => {
    if (!currentUser.verified) {
      setIsRobloxVerifyOpen(true);
      throw new Error('Please log in with Roblox before withdrawing pets');
    }

    const res = await fetch('/api/inventory/withdraw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUser.id,
      },
      body: JSON.stringify({ itemIds }),
    });

    if (res.ok) {
      const data = await res.json();
      // Instantly refresh inventory and user profile so withdrawn pets disappear
      fetchInventory(currentUser.id);
      fetchUserProfile(currentUser.id);
      if (data.discordLink) {
        setDiscordLink(data.discordLink);
      }
      return data;
    } else {
      const err = await res.json();
      throw new Error(err.error || 'Withdrawal failed');
    }
  };

  // Filtered match feed list
  const filteredMatches = matches.filter((m) => {
    if (!showOnlyMyMatches) return true;
    return m.creator.userId === currentUser.id || m.opponent?.userId === currentUser.id;
  });

  useEffect(() => {
    // Artificial load time for professional logo screen
    const timer = setTimeout(() => {
      setIsInitialAppLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (isInitialAppLoading) {
    return (
      <div className="fixed inset-0 bg-[#030a1b] z-[9999] flex flex-col items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <BloxLuckLogo size="lg" className="mb-8" />
          <div className="w-64 h-1.5 bg-[#162033] rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 w-1/2 rounded-full animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]" style={{ animationDuration: '1.5s', animationName: 'progress' }} />
          </div>
          <style>{`
            @keyframes progress {
              0% { transform: translateX(-100%); width: 50%; }
              100% { transform: translateX(200%); width: 50%; }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030a1b] text-slate-100 flex flex-col font-sans selection:bg-[#3b82f6] selection:text-slate-950">
      {originalOwnerUser && (
        <div className="bg-purple-600 text-white text-xs font-gaming font-bold p-2 text-center flex items-center justify-center gap-4 z-[60] relative">
          <span>You are currently impersonating: {currentUser.username}</span>
          <button 
            onClick={handleStopImpersonating}
            className="px-3 py-1 bg-slate-900 rounded hover:bg-slate-800 transition"
          >
            STOP IMPERSONATING
          </button>
        </div>
      )}
      {/* Top Navigation Bar matching Screenshot 1 */}
      <TopBar
        user={currentUser}
        inventory={inventory}
        onOpenInventory={() => {
          if (!currentUser.verified || currentUser.id === 'guest') {
            setIsRobloxVerifyOpen(true);
          } else {
            setIsInventoryOpen(true);
          }
        }}
        onOpenRobloxVerify={() => setIsRobloxVerifyOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenFairness={() => {
          setSelectedFairnessMatch(matches[0] || null);
          setIsFairnessOpen(true);
        }}
        onOpenFaq={() => setIsFaqOpen(true)}
        onlineCount={onlineCount}
      />

      {/* Main App Canvas: Centered Dense Match Feed matching Screenshot 1 */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Navigation Sidebar (Desktop only) */}
        <LeftSidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            if (tab === 'leaderboard') setIsLeaderboardOpen(true);
          }}
          onOpenFairStats={() => {
            setSelectedFairnessMatch(matches[0] || null);
            setIsFairnessOpen(true);
          }}
          onOpenTos={() => setIsTosOpen(true)}
          onOpenFaq={() => setIsFaqOpen(true)}
        />

        {/* Center Main Stage */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 max-w-2xl mx-auto w-full pb-28 md:pb-24">
          {/* ACTION BAR: Create Match button container */}
          <MatchActionBar
            userProfit={currentUser?.totalProfit ?? 0}
            showOnlyMyMatches={showOnlyMyMatches}
            onToggleMyMatches={() => setShowOnlyMyMatches(!showOnlyMyMatches)}
            onCreateMatch={() => {
              setIsCreateOpen(true);
            }}
          />

          {/* DENSE SCROLLING MATCH FEED */}
          <MatchFeed
            matches={filteredMatches}
            currentUser={currentUser}
            onJoinMatch={handleOpenJoin}
            onViewFairness={(m) => {
              setSelectedFairnessMatch(m);
              setIsFairnessOpen(true);
            }}
            onWatchFlip={(m) => {
              setAnimatingMatch(m);
              setIsAnimationOpen(true);
            }}
            onCancelMatch={handleCancelMatch}
            onAdminCallOpponent={handleAdminCallOpponent}
          />
        </main>

        {/* Right Global Chat Sidebar / Drawer */}
        <RightChatSidebar
          messages={chatMessages}
          currentUser={currentUser}
          onlineCount={onlineCount}
          onSendMessage={handleSendMessage}
          onReportMessage={handleReportMessage}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          onOpenRobloxVerify={() => setIsRobloxVerifyOpen(true)}
          onOpenCreateGiveaway={() => setIsCreateGiveawayOpen(true)}
        />
      </div>

      {/* Bottom Navigation Bar: Coinflips, Inventory, Chat all with icons */}
      <BottomNavBar
        user={currentUser}
        inventoryCount={inventory.length}
        onlineCount={onlineCount}
        isChatOpen={isChatOpen}
        onSelectCoinflips={() => {
          setIsInventoryOpen(false);
          setIsChatOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenInventory={() => {
          setIsChatOpen(false);
          if (!currentUser.verified || currentUser.id === 'guest') {
            setIsRobloxVerifyOpen(true);
          } else {
            setIsInventoryOpen(true);
          }
        }}
        onToggleChat={() => setIsChatOpen((prev) => !prev)}
        onOpenRobloxVerify={() => setIsRobloxVerifyOpen(true)}
      />

      {/* MODALS */}

      {/* 1. Create Match Modal with 5-post limit */}
      <CreateMatchModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        inventory={inventory}
        onCreate={handleCreateMatch}
        activePostsCount={activeUserMatchesCount}
      />

      {/* 2. Join Match Modal */}
      <JoinMatchModal
        isOpen={isJoinOpen}
        onClose={() => {
          setIsJoinOpen(false);
          setJoiningMatch(null);
        }}
        match={joiningMatch}
        inventory={inventory}
        onJoin={handleConfirmJoin}
      />

      {/* 3. 3D Coinflip Animation Modal */}
      <CoinflipAnimationModal
        isOpen={isAnimationOpen}
        onClose={() => {
          setIsAnimationOpen(false);
          setAnimatingMatch(null);
        }}
        match={animatingMatch}
        currentUser={currentUser}
        onJoinMatch={(m) => {
          setIsAnimationOpen(false);
          setAnimatingMatch(null);
          handleOpenJoin(m);
        }}
      />

      {/* 4. Inventory Modal */}
      <InventoryModal
        isOpen={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
        inventory={inventory}
        onWithdraw={handleWithdrawPets}
        robloxUsername={currentUser.robloxUsername}
        user={currentUser}
        discordLink={discordLink}
        onOpenRobloxVerify={() => setIsRobloxVerifyOpen(true)}
        onInventoryRefreshed={() => fetchInventory(currentUser.id)}
      />

      {/* 5. Leaderboard Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => {
          setIsLeaderboardOpen(false);
          setCurrentTab('coinflip');
        }}
      />

      {/* 6. Provably Fair Verification Modal */}
      <ProvablyFairModal
        isOpen={isFairnessOpen}
        onClose={() => {
          setIsFairnessOpen(false);
          setSelectedFairnessMatch(null);
        }}
        selectedMatch={selectedFairnessMatch}
      />

      {/* 7. Player Profile Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={currentUser}
        inventory={inventory}
        onOpenInventory={() => setIsInventoryOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onLogout={handleLogout}
      />

      {/* 8. Roblox Profile Phrase Verification Modal */}
      <RobloxVerifyModal
        isOpen={isRobloxVerifyOpen}
        onClose={() => setIsRobloxVerifyOpen(false)}
        user={currentUser}
        onVerified={handleVerifiedUser}
        onLogout={handleLogout}
      />

      {/* 8. Admin Management Panel (Protected) */}
      <AdminPanelModal
        isOpen={isAdminOpen}
        onImpersonate={handleImpersonate}
        onClose={() => setIsAdminOpen(false)}
        currentUser={currentUser}
        onInventoryUpdated={() => {
          fetchInventory(currentUser.id);
          fetchMatches();
        }}
      />

      {/* 9. FAQ Modal */}
      <FaqModal isOpen={isFaqOpen} onClose={() => setIsFaqOpen(false)} />

      {/* 10. Terms of Service Modal */}
      <TosModal isOpen={isTosOpen} onClose={() => setIsTosOpen(false)} />
    
      {/* 11. Create Giveaway Modal */}
      <CreateGiveawayModal
        isOpen={isCreateGiveawayOpen}
        onClose={() => setIsCreateGiveawayOpen(false)}
        currentUser={currentUser}
        inventory={inventory}
        onGiveawayCreated={() => {
          fetchInventory(currentUser.id);
          // Assuming Giveaways component polls automatically or we can trigger it. It fetches on mount.
          // The page reload or just the state is fine.
        }}
      />
    </div>
  );
}
export default App;
