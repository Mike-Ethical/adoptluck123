import { CoinflipMatch, FeaturedMatch, ChatMessage, User, InventoryItem } from '../types';

// Default owner account for cute240bunny (Roblox ID: 3058833903)
export const ownerDefaultUser: User = {
  id: 'roblox-cute240bunny',
  username: 'cute240bunny',
  robloxUsername: 'cute240bunny',
  robloxUserId: '3058833903',
  avatarUrl: 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-2A0DE04FF101FD93723B00B54581C2D3-Png/150/150/AvatarHeadshot/Png/isCircular',
  role: 'admin',
  verified: true,
  verificationStatus: 'verified',
  totalGames: 0,
  wins: 0,
  losses: 0,
  totalProfit: 0,
  totalWagered: 0,
  level: 1,
  xp: 0,
  createdAt: new Date().toISOString(),
};

export const defaultGuestUser: User = {
  id: 'guest',
  username: 'Guest',
  robloxUsername: '',
  robloxUserId: '',
  avatarUrl: 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-11E8F297E815597FF806ED04B4C1BAF3-Png/150/150/AvatarHeadshot/Png/isCircular',
  role: 'user',
  verified: false,
  verificationStatus: 'unverified',
  totalGames: 0,
  wins: 0,
  losses: 0,
  totalProfit: 0,
  totalWagered: 0,
  level: 1,
  xp: 0,
  createdAt: new Date().toISOString(),
};

export const defaultUser: User = defaultGuestUser;

// All fake data deleted as requested. Pure backend and real user data only.
export const sampleUsers: User[] = [];
export const initialInventory: InventoryItem[] = [];
export const initialFeaturedMatches: FeaturedMatch[] = [];
export const initialMatches: CoinflipMatch[] = [];
export const initialChatMessages: ChatMessage[] = [];
