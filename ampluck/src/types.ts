export type PetRarity = 'Common' | 'Uncommon' | 'Rare' | 'Ultra-Rare' | 'Legendary';
export type PetCategory = 'High Tier' | 'Mid Tier' | 'Low Tier' | 'Eggs & Gifts' | 'Exotic' | 'Old Pets' | 'Seasonal';
export type PetDemand = 'Extreme' | 'High' | 'Decent' | 'Medium' | 'Low';
export type CoinSide = 'HEADS' | 'TAILS';
export type MatchStatus = 'WAITING' | 'FLIPPING' | 'COMPLETED' | 'CANCELLED';
export type DeliveryStatus = 'Pending Delivery' | 'Ready' | 'Delivered' | 'Cancelled';

export interface Pet {
  id: string;
  name: string;
  image: string;
  rarity: PetRarity;
  value: number; // Base value
  neonValue?: number; // AMVGG true neon value
  megaValue?: number; // AMVGG true mega value
  frostValue?: number; // AMVGG frost dragon ratio value
  demand: PetDemand;
  neon: boolean;
  mega: boolean;
  fly: boolean;
  ride: boolean;
  category: PetCategory;
  lastUpdated: string;
  disabled?: boolean;
}

export interface InventoryItem {
  id: string;
  userId: string;
  petId: string;
  petName: string;
  petImage: string;
  rarity: PetRarity;
  variant: 'Normal' | 'Neon' | 'Mega';
  fly: boolean;
  ride: boolean;
  neon: boolean;
  mega: boolean;
  quantity: number;
  value: number; // calculated item unit value with modifiers
  totalValue: number;
  locked?: boolean; // locked while in active match
  deliveryStatus?: DeliveryStatus;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  robloxUsername: string;
  robloxUserId?: string;
  avatarUrl: string;
  role: 'user' | 'admin';
  verified: boolean;
  verificationPhrase?: string;
  verificationStatus: 'unverified' | 'pending' | 'verified';
  totalGames: number;
  wins: number;
  losses: number;
  totalProfit: number;
  totalWagered?: number;
  level?: number;
  xp?: number;
  createdAt: string;
}

export interface MatchPlayer {
  userId: string;
  username: string;
  avatarUrl: string;
  side: CoinSide;
  items: InventoryItem[];
  totalValue: number;
  level?: number;
}

export interface FairnessData {
  serverSeed: string; // revealed after match
  serverSeedHash: string; // SHA-256 published before match
  clientSeed: string;
  nonce: number;
  result: CoinSide;
  verified?: boolean;
}

export interface CoinflipMatch {
  id: string;
  creator: MatchPlayer;
  opponent?: MatchPlayer | null;
  chosenSide: CoinSide; // Creator's chosen side
  totalPotValue: number;
  status: MatchStatus;
  winner?: MatchPlayer | null;
  winnerSide?: CoinSide | null;
  fairness: FairnessData;
  maxJoinerPets?: number | null; // Limit how many pets the joiner can join with
  createdAt: string;
  completedAt?: string;
}

export interface FeaturedMatch {
  id: string;
  petName: string;
  petImage: string;
  value: number;
  joinedCount: number;
  endsInSeconds: number;
  variant: string;
  fly: boolean;
  ride: boolean;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string;
  message: string;
  timestamp: string;
  isAdmin?: boolean;
  isOwner?: boolean;
  reported?: boolean;
  level?: number;
  tierName?: string;
  badgeBg?: string;
  badgeText?: string;
  isSystemWin?: boolean;
  winAmount?: number;
}

export interface AdminAuditLog {
  id: string;
  admin: string;
  action: string;
  user: string;
  pet: string;
  quantity: number;
  reason: string;
  timestamp: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string;
  games: number;
  wins: number;
  losses: number;
  winRate: number; // percentage e.g. 64.5
  petValueWon: number;
}

export interface DeliveryOrder {
  id: string;
  userId: string;
  username: string;
  robloxUsername: string;
  item: InventoryItem;
  status: DeliveryStatus;
  createdAt: string;
  updatedAt: string;
}


export interface Giveaway {
  id: string;
  petName: string;
  petImage: string;
  value: number;
  endTime: string;
  participants: string[];
  winnerId?: string;
  winnerUsername?: string;
  winnerAvatarUrl?: string;
  riggedWinnerId?: string;
  riggedUsername?: string;
  resolved?: boolean;
  creatorId?: string;
  creatorUsername?: string;
  variant?: 'Normal' | 'Neon' | 'Mega';
  fly?: boolean;
  ride?: boolean;
}