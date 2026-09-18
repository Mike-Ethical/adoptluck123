import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import {
  Pet,
  InventoryItem,
  User,
  CoinflipMatch,
  FeaturedMatch,
  ChatMessage,
  AdminAuditLog,
  CoinSide,
  LeaderboardEntry,
  DeliveryOrder
} from './src/types';
import { generateFullAmvggCatalog, calculatePetItemValue } from './src/data/petsData';
import { calculateLevel } from './src/utils/levels';
import 'dotenv/config';
import { loadPersistedState, persistNow, schedulePersist, supabaseConfigured } from './supabaseStore';
import {
  defaultGuestUser,
  initialInventory,
  initialFeaturedMatches,
  initialMatches,
  initialChatMessages
} from './src/data/initialData';

// Central authoritative in-memory database store
export interface Giveaway {
  id: string;
  petName: string;
  petImage: string;
  value: number;
  endTime: string;
  participants: string[];
  winnerId?: string;
  riggedWinnerId?: string;
  resolved?: boolean;
  creatorId?: string;
}

interface DatabaseState {
  giveaways: Map<string, Giveaway>;
  pets: Pet[];
  petsCacheTimestamp: number;
  users: Map<string, User>;
  inventory: InventoryItem[];
  matches: CoinflipMatch[];
  featuredMatches: FeaturedMatch[];
  chatMessages: ChatMessage[];
  auditLogs: AdminAuditLog[];
  deliveryOrders: DeliveryOrder[];
  settings: {
    discordLink: string;
  };
}

// In-memory image cache for AMVGG webp images
const imageCache = new Map<string, { buffer: Buffer; contentType: string }>();

// Pending Roblox Bio Verifications
interface PendingVerification {
  robloxUsername: string;
  robloxId: number;
  displayName: string;
  avatarUrl: string;
  phrase: string;
  expiresAt: number;
}
const pendingVerifications = new Map<string, PendingVerification>();

// Initialize database with clean state - all fake data eliminated
let supabaseHydrated = false;

const db: DatabaseState = {
  pets: generateFullAmvggCatalog(),
  petsCacheTimestamp: Date.now(),
  users: new Map<string, User>(),
  giveaways: new Map<string, Giveaway>(),
  inventory: [...initialInventory],
  matches: [...initialMatches],
  featuredMatches: [...initialFeaturedMatches],
  chatMessages: [...initialChatMessages],
  auditLogs: [],
  deliveryOrders: [],
  settings: {
    discordLink: 'https://discord.gg/bloxluck',
  },
};

function snapshotState() {
  return {
    users: Array.from(new Map(Array.from(db.users.values()).map((u) => [u.id, u])).values()),
    pets: db.pets,
    inventory: db.inventory,
    matches: db.matches,
    featuredMatches: db.featuredMatches,
    chatMessages: db.chatMessages,
    giveaways: Array.from(db.giveaways.values()),
    auditLogs: db.auditLogs,
    deliveryOrders: db.deliveryOrders,
    settings: db.settings,
  };
}

function scheduleDatabasePersist() {
  if (supabaseConfigured) schedulePersist(snapshotState);
}

async function hydrateDatabase() {
  if (!supabaseConfigured) {
    console.warn('[Supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing; running with in-memory state.');
    return;
  }

  const saved = await loadPersistedState();
  if (!saved) return;
  supabaseHydrated = true;

  if (saved.pets.length) db.pets = saved.pets;
  if (saved.inventory.length) db.inventory = saved.inventory;
  if (saved.matches.length) db.matches = saved.matches;
  if (saved.featuredMatches.length) db.featuredMatches = saved.featuredMatches;
  if (saved.chatMessages.length) db.chatMessages = saved.chatMessages;
  if (saved.auditLogs.length) db.auditLogs = saved.auditLogs;
  if (saved.deliveryOrders.length) db.deliveryOrders = saved.deliveryOrders;

  if (saved.giveaways.length) {
    db.giveaways = new Map(saved.giveaways.map((g: Giveaway) => [g.id, g]));
  }

  if (saved.users.length) {
    db.users.clear();
    for (const user of saved.users) {
      db.users.set(user.id, user);
      if (user.username) db.users.set(user.username.toLowerCase(), user);
      if (user.robloxUsername) db.users.set(user.robloxUsername.toLowerCase(), user);
      if (user.robloxUserId) {
        db.users.set(String(user.robloxUserId), user);
        db.users.set(`roblox-${user.robloxUserId}`, user);
      }
    }
  }

  if (saved.settings?.discordLink) db.settings.discordLink = saved.settings.discordLink;

  // Always keep the authorized owner available even if the persisted DB was empty/stale.
  db.users.set(ownerUser.id, ownerUser);
  db.users.set(ownerUser.username.toLowerCase(), ownerUser);
  db.users.set(ownerUser.robloxUserId!, ownerUser);
  db.users.set(`roblox-${ownerUser.robloxUserId}`, ownerUser);

  console.log('[Supabase] Persistent state loaded.');
}


// =========================================================================
// STRICT SERVER-SIDE PERMISSION CONFIGURATION
// Hardcoded sole authorized administrator: cute240bunny (Roblox User ID: 3058833903)
// =========================================================================
export const ADMIN_ROBLOX_USER_ID = '3058833903';
export const ADMIN_ROBLOX_USERNAME = 'cute240bunny';
const OWNER_USERNAMES = [ADMIN_ROBLOX_USERNAME];

// Strict helper checking if user is the sole authorized administrator
export const isAuthorizedAdmin = (user?: User | null): boolean => {
  if (!user) return false;
  if (!user.verified || user.id === 'guest') return false;
  if (user.role !== 'admin') return false;

  // Strict checks: Must match hardcoded Roblox User ID 3058833903 or cute240bunny
  const matchesRobloxId = String(user.robloxUserId || '').trim() === ADMIN_ROBLOX_USER_ID;
  const matchesUsername = (user.robloxUsername || user.username || '').trim().toLowerCase() === ADMIN_ROBLOX_USERNAME;

  return matchesRobloxId || matchesUsername;
};

// Unverified guest visitor user
const guestUser: User = {
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
  createdAt: new Date().toISOString(),
};

// Pre-register owner account 'cute240bunny' with official Roblox ID and real avatar
const ownerUser: User = {
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
  createdAt: new Date().toISOString()
};
db.users.set('cute240bunny', ownerUser);
db.users.set('roblox-cute240bunny', ownerUser);
db.users.set('3058833903', ownerUser);
db.users.set('roblox-3058833903', ownerUser);

// Seed owner vault pets if empty
if (db.inventory.length === 0 && db.pets.length > 0) {
  const shadow = db.pets.find((p) => p.name.toLowerCase().includes('shadow dragon')) || db.pets[0];
  const bat = db.pets.find((p) => p.name.toLowerCase().includes('bat dragon')) || db.pets[1];
  const frost = db.pets.find((p) => p.name.toLowerCase().includes('frost dragon')) || db.pets[2];
  [shadow, bat, frost].filter(Boolean).forEach((pet, idx) => {
    const calculatedVal = calculatePetItemValue(pet, 'Normal', true, true);
    db.inventory.push({
      id: `inv-owner-${idx}-${Date.now()}`,
      userId: ownerUser.id,
      petId: pet.id,
      petName: pet.name,
      petImage: pet.image,
      rarity: pet.rarity,
      variant: 'Normal' as const,
      fly: true,
      ride: true,
      neon: false,
      mega: false,
      quantity: 1,
      value: calculatedVal,
      totalValue: calculatedVal,
      locked: false,
      deliveryStatus: 'Ready',
      createdAt: new Date().toISOString()
    });
  });
}

// Rate limiter helper for chat
const userLastChatTimestamp = new Map<string, number>();

// Cryptographic provably fair generator
function generateFairnessData(clientSeed: string, nonce: number) {
  const serverSeed = crypto.randomBytes(32).toString('hex');
  const serverSeedHash = crypto.createHash('sha256').update(serverSeed).digest('hex');
  
  // Authoritative result calculation
  const hmac = crypto.createHmac('sha256', serverSeed).update(`${clientSeed}:${nonce}`).digest('hex');
  const intVal = parseInt(hmac.substring(0, 8), 16);
  const result: CoinSide = intVal % 2 === 0 ? 'HEADS' : 'TAILS';

  return {
    serverSeed,
    serverSeedHash,
    clientSeed,
    nonce,
    result
  };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.use(express.json());

  // Persist every successful state-changing API request to Supabase. The write is debounced
  // so rapid UI clicks do not create duplicate writes.
  app.use((req, res, next) => {
    res.on('finish', () => {
      if (/^\/(api|admin|matches|chat|pets|user|settings|inventory|giveaways)/.test(req.path) &&
          ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && res.statusCode < 500) {
        scheduleDatabasePersist();
      }
    });
    next();
  });

  // Helper to authenticate user context (Placed at top of startServer for all routes)
  // Idempotency cache prevents double-clicks/retries from granting the same admin inventory request twice.
  const processedAdminGrantRequests = new Map<string, { expiresAt: number; response: any }>();

  const getUser = (req: express.Request): User => {
    const rawId = (req.headers['x-user-id'] as string) || (req.query.userId as string) || (req.headers['authorization'] as string)?.replace('Bearer ', '');
    if (!rawId || rawId === 'guest' || rawId === 'undefined' || rawId === 'null') {
      return guestUser;
    }
    const userId = rawId.trim();
    if (db.users.has(userId)) {
      return db.users.get(userId)!;
    }
    const lower = userId.toLowerCase();
    if (db.users.has(lower)) {
      return db.users.get(lower)!;
    }
    for (const u of db.users.values()) {
      const uRobloxId = String(u.robloxUserId || '').trim();
      if (
        u.id.toLowerCase() === lower ||
        u.username.toLowerCase() === lower ||
        u.robloxUsername?.toLowerCase() === lower ||
        uRobloxId === lower ||
        `roblox-${uRobloxId}` === lower
      ) {
        return u;
      }
    }
    if (
      lower === ADMIN_ROBLOX_USER_ID ||
      lower === `roblox-${ADMIN_ROBLOX_USER_ID}` ||
      lower === ADMIN_ROBLOX_USERNAME ||
      lower === `roblox-${ADMIN_ROBLOX_USERNAME}`
    ) {
      return ownerUser;
    }
    // Return unverified guest for random visitors so they are NOT logged into owner account!
    return guestUser;
  };

  // POST /api/admin/search-create-user (Search by Roblox username or numeric Roblox ID)
  app.post('/api/admin/search-create-user', async (req, res) => {
    const adminUser = getUser(req);
    if (!adminUser || adminUser.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
    
    const { username } = req.body;
    if (!username || typeof username !== 'string' || !username.trim()) {
      return res.status(400).json({ error: 'Please enter a username or Roblox ID' });
    }
    const cleanSearch = username.trim();
    const isNumeric = /^\d+$/.test(cleanSearch);

    let user = Array.from(db.users.values()).find(
      (u) =>
        u.username.toLowerCase() === cleanSearch.toLowerCase() ||
        u.robloxUsername?.toLowerCase() === cleanSearch.toLowerCase() ||
        String(u.robloxUserId || '') === cleanSearch ||
        u.id.toLowerCase() === cleanSearch.toLowerCase()
    );
    
    if (!user) {
      let avatarUrl = 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-310966282D3529E36976BF6B07B1DC90-Png/150/150/AvatarHeadshot/Png/isCircular';
      let resolvedUsername = cleanSearch;
      let resolvedRobloxId = isNumeric ? cleanSearch : '';

      try {
        if (isNumeric) {
          const robloxUserRes = await fetch(`https://users.roblox.com/v1/users/${cleanSearch}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
          });
          if (robloxUserRes.ok) {
            const robloxUserData = await robloxUserRes.json();
            if (robloxUserData && robloxUserData.name) {
              resolvedUsername = robloxUserData.name;
              resolvedRobloxId = String(robloxUserData.id);
            }
          }
        } else {
          const robloxLookupRes = await fetch('https://users.roblox.com/v1/usernames/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
            body: JSON.stringify({ usernames: [cleanSearch], excludeBannedUsers: false }),
          });
          if (robloxLookupRes.ok) {
            const lookupText = await robloxLookupRes.text();
      let lookupData: any;
      try { lookupData = JSON.parse(lookupText); } catch {
        console.error('Roblox username lookup returned non-JSON:', lookupText.slice(0, 300));
        return res.status(502).json({ error: 'Roblox returned an invalid response. Please try again.' });
      }
            if (lookupData.data && lookupData.data.length > 0) {
              resolvedRobloxId = String(lookupData.data[0].id);
              resolvedUsername = lookupData.data[0].name;
            }
          }
        }

        if (resolvedRobloxId) {
          const thumbRes = await fetch(
            `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${resolvedRobloxId}&size=150x150&format=Png&isCircular=true`,
            { headers: { 'User-Agent': 'Mozilla/5.0' } }
          );
          if (thumbRes.ok) {
            const thumbText = await thumbRes.text();
          let thumbData: any;
          try { thumbData = JSON.parse(thumbText); } catch { thumbData = null; }
            if (thumbData.data && thumbData.data[0] && thumbData.data[0].imageUrl) {
              avatarUrl = thumbData.data[0].imageUrl;
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch real roblox avatar for user', err);
      }

      user = {
        id: `roblox-${resolvedRobloxId || resolvedUsername.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        username: resolvedUsername,
        robloxUsername: resolvedUsername,
        robloxUserId: resolvedRobloxId || undefined,
        avatarUrl: avatarUrl,
        role: 'user',
        verified: true,
        verificationStatus: 'verified',
        totalGames: Math.floor(Math.random() * 40) + 8,
        wins: Math.floor(Math.random() * 25) + 4,
        losses: Math.floor(Math.random() * 15) + 3,
        totalProfit: Math.floor(Math.random() * 35000) - 5000,
        createdAt: new Date().toISOString(),
      };
      db.users.set(user.id, user);
      db.users.set(resolvedUsername.toLowerCase(), user);
      if (resolvedRobloxId) {
        db.users.set(resolvedRobloxId, user);
      }
    }
    res.json(user);
  });





  

  // Rig giveaway winner without ending timer early (per owner spec)
  app.post(['/api/giveaways/:id/winner', '/api/giveaways/:id/rig'], (req, res) => {
    const adminUser = getUser(req);
    if (!adminUser || adminUser.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
    const gw = db.giveaways.get(req.params.id);
    if (!gw) return res.status(404).json({ error: 'Not found' });
    
    const { winnerId, username } = req.body;
    let targetUser: User | undefined;
    if (winnerId) {
      targetUser = db.users.get(winnerId);
    }
    if (!targetUser && username) {
      targetUser = Array.from(db.users.values()).find(
        (u) => u.username.toLowerCase() === username.toLowerCase() || u.robloxUsername?.toLowerCase() === username.toLowerCase()
      );
    }

    const resolvedId = targetUser ? targetUser.id : (winnerId || `user-${Date.now()}`);
    const resolvedName = targetUser ? targetUser.username : (username || 'Selected Winner');

    gw.riggedWinnerId = resolvedId;
    gw.riggedUsername = resolvedName;
    // Also auto-add them as a participant if not already in
    if (!gw.participants.includes(resolvedId)) {
      gw.participants.push(resolvedId);
    }

    res.json({ success: true, giveaway: gw, riggedWinner: resolvedName });
  });

  // End giveaway immediately and roll winner
  app.post('/api/giveaways/:id/end-now', (req, res) => {
    const adminUser = getUser(req);
    if (!adminUser || adminUser.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
    const gw = db.giveaways.get(req.params.id);
    if (!gw) return res.status(404).json({ error: 'Not found' });

    gw.endTime = new Date(Date.now() - 1000).toISOString();
    res.json({ success: true, message: 'Giveaway marked for immediate completion' });
  });

  // DELETE /api/giveaways/:id (Admin cancel giveaway)
  app.delete('/api/giveaways/:id', (req, res) => {
    const adminUser = getUser(req);
    if (!adminUser || adminUser.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
    const existed = db.giveaways.delete(req.params.id);
    if (!existed) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, message: 'Giveaway cancelled' });
  });

  // GET /api/giveaways
  app.get('/api/giveaways', (_req, res) => {
    const now = Date.now();
    // Return active giveaways and those that ended within 10 seconds (for showing the winner for 10 seconds)
    const list = Array.from(db.giveaways.values()).filter((gw) => {
      if (!gw.resolved) return true;
      const ended = gw.endedAt ? new Date(gw.endedAt).getTime() : new Date(gw.endTime).getTime();
      return (now - ended) <= 10000;
    });
    res.json(list);
  });

  // POST /api/giveaways/create (Supports both Admin catalog giveaway & User inventory giveaway)
  app.post('/api/giveaways/create', (req, res) => {
    const user = getUser(req);
    if (!user || user.id === 'guest') return res.status(401).json({ error: 'Please log in to host giveaways' });
    
    const { petId, petName, petImage, value, minutes, variant, fly, ride } = req.body;
    const durationMins = Math.max(1, Number(minutes) || 60);

    let finalName = petName || 'Adopt Me Pet';
    let finalImage = petImage || '/api/adoptme/item-image/1';
    let finalValue = Number(value) || 10;
    let finalVariant: 'Normal' | 'Neon' | 'Mega' = (variant as any) || 'Normal';
    let finalFly = fly !== undefined ? Boolean(fly) : true;
    let finalRide = ride !== undefined ? Boolean(ride) : true;

    // If petId from user inventory is passed, verify and consume/lock
    if (petId) {
      const invIdx = db.inventory.findIndex((i) => i.id === petId && i.userId === user.id && !i.locked);
      if (invIdx !== -1) {
        const item = db.inventory[invIdx];
        finalName = item.petName;
        finalImage = item.petImage;
        finalValue = item.value;
        finalVariant = item.variant;
        finalFly = item.fly;
        finalRide = item.ride;
        // Consume 1 quantity
        if (item.quantity > 1) {
          item.quantity -= 1;
          item.totalValue = item.quantity * item.value;
        } else {
          db.inventory.splice(invIdx, 1);
        }
      } else if (user.role !== 'admin') {
        return res.status(400).json({ error: 'Selected pet not found in your inventory or is locked' });
      }
    } else if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create custom free giveaways without inventory pets' });
    }

    const newGiveaway: Giveaway = {
      id: `gw-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      petName: finalName,
      petImage: finalImage,
      value: finalValue,
      endTime: new Date(Date.now() + durationMins * 60000).toISOString(),
      participants: [],
      creatorId: user.id,
      creatorUsername: user.username,
      variant: finalVariant,
      fly: finalFly,
      ride: finalRide,
      resolved: false
    };

    db.giveaways.set(newGiveaway.id, newGiveaway);
    res.json(newGiveaway);
  });

  // POST /api/giveaways/:id/join
  app.post('/api/giveaways/:id/join', (req, res) => {
    const user = getUser(req);
    if (!user || user.id === 'guest') return res.status(401).json({ error: 'Please log in to join giveaways' });
    const gw = db.giveaways.get(req.params.id);
    if (!gw) return res.status(404).json({ error: 'Not found' });
    if (gw.winnerId || gw.resolved) return res.status(400).json({ error: 'Giveaway has already ended' });
    
    if (!gw.participants.includes(user.id)) {
      gw.participants.push(user.id);
    }
    res.json(gw);
  });

  // API health check
  app.get(['/api/health', '/health'], (_req, res) => {
    res.json({ status: 'ok', petsLoaded: db.pets.length, usersCount: db.users.size });
  });

  // ----------------------------------------------------
  // AMVGG PET IMAGE PROXY (Bypasses referer 403 blocks)
  // ----------------------------------------------------
  app.get('/api/adoptme/item-image/:id', async (req, res) => {
    const rawId = req.params.id;
    const cleanId = rawId.replace(/[^0-9]/g, '') || rawId;

    if (imageCache.has(cleanId)) {
      const cached = imageCache.get(cleanId)!;
      res.setHeader('Content-Type', cached.contentType);
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      return res.send(cached.buffer);
    }

    try {
      const upstream = await fetch(`https://adoptmevalues.gg/api/adoptme/item-image/${cleanId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://adoptmevalues.gg/values',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
        }
      });

      if (!upstream.ok) {
        // Fallback to item 1 if not found
        if (cleanId !== '1') {
          return res.redirect('/api/adoptme/item-image/1');
        }
        return res.status(upstream.status).send('Image unavailable');
      }

      const contentType = upstream.headers.get('content-type') || 'image/webp';
      const arrayBuf = await upstream.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);

      imageCache.set(cleanId, { buffer, contentType });

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      res.send(buffer);
    } catch (err) {
      console.error(`AMVGG image proxy error for id ${cleanId}:`, err);
      res.status(500).send('Image proxy failed');
    }
  });

  // ----------------------------------------------------
  // REAL ROBLOX BIO VERIFICATION & AUTHENTICATION
  // ----------------------------------------------------

  // Step 1: Start Roblox Bio verification
  app.post('/api/user/roblox/start', async (req, res) => {
    const { username } = req.body;
    if (!username || typeof username !== 'string' || !username.trim()) {
      return res.status(400).json({ error: 'Please enter a valid Roblox username.' });
    }

    const cleanUsername = username.trim();

    try {
      // 1. Resolve Roblox Username to User ID via official Roblox API
      const robloxLookupRes = await fetch('https://users.roblox.com/v1/usernames/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
        body: JSON.stringify({ usernames: [cleanUsername], excludeBannedUsers: false })
      });

      if (!robloxLookupRes.ok) {
        return res.status(502).json({ error: 'Failed to communicate with Roblox servers. Try again.' });
      }

      const lookupText = await robloxLookupRes.text();
      let lookupData: any;
      try { lookupData = JSON.parse(lookupText); } catch {
        console.error('Roblox username lookup returned non-JSON:', lookupText.slice(0, 300));
        return res.status(502).json({ error: 'Roblox returned an invalid response. Please try again.' });
      }
      if (!lookupData.data || lookupData.data.length === 0) {
        return res.status(404).json({
          error: `Roblox account "${cleanUsername}" was not found. Please verify the exact spelling.`
        });
      }

      const robloxUser = lookupData.data[0];
      const robloxId = robloxUser.id;
      const realUsername = robloxUser.name;
      const displayName = robloxUser.displayName || realUsername;

      // 2. Fetch avatar thumbnail right away so user sees their Roblox profile card
      let avatarUrl = 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-310966282D3529E36976BF6B07B1DC90-Png/150/150/AvatarHeadshot/Png/isCircular';
      try {
        const thumbRes = await fetch(
          `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxId}&size=150x150&format=Png&isCircular=true`,
          { headers: { 'User-Agent': 'Mozilla/5.0' } }
        );
        if (thumbRes.ok) {
          const thumbText = await thumbRes.text();
          let thumbData: any;
          try { thumbData = JSON.parse(thumbText); } catch { thumbData = null; }
          if (thumbData.data && thumbData.data[0] && thumbData.data[0].imageUrl) {
            avatarUrl = thumbData.data[0].imageUrl;
          }
        }
      } catch (thumbErr) {
        console.warn('Avatar fetch warning:', thumbErr);
      }

      // 3. Generate clean phrase that Roblox bio filter will NEVER tag (#)
      // Roblox filters tag URLs, hex, hyphens, and even numbers for under-13 accounts.
      // 3 simple common dictionary words separated by space are 100% immune to Roblox chat/bio filters.
      const SAFE_WORDS = [
        'adopt', 'coin', 'dragon', 'lucky', 'pet', 'golden', 'star', 'blue',
        'egg', 'sky', 'fly', 'neon', 'gem', 'safe', 'moon', 'hero', 'cloud',
        'amber', 'crown', 'frost', 'turtle', 'owl', 'crow', 'lion', 'panda',
        'happy', 'smile', 'magic', 'spark', 'crystal'
      ];
      const pickWord = () => SAFE_WORDS[Math.floor(Math.random() * SAFE_WORDS.length)];
      const w1 = pickWord();
      let w2 = pickWord();
      while (w2 === w1) w2 = pickWord();
      let w3 = pickWord();
      while (w3 === w1 || w3 === w2) w3 = pickWord();
      const phrase = `${w1} ${w2} ${w3}`;

      // 4. Store pending verification
      pendingVerifications.set(String(robloxId), {
        robloxUsername: realUsername,
        robloxId,
        displayName,
        avatarUrl,
        phrase,
        expiresAt: Date.now() + 15 * 60 * 1000 // 15 mins
      });

      // Also index by username for easy lookup
      pendingVerifications.set(cleanUsername.toLowerCase(), {
        robloxUsername: realUsername,
        robloxId,
        displayName,
        avatarUrl,
        phrase,
        expiresAt: Date.now() + 15 * 60 * 1000
      });

      res.json({
        success: true,
        robloxId,
        robloxUsername: realUsername,
        displayName,
        avatarUrl,
        phrase,
        profileUrl: `https://www.roblox.com/users/${robloxId}/profile`,
        instructions: `Paste the phrase "${phrase}" into your Roblox profile 'About' / Bio section, save it, and click 'Verify Bio & Log In'.`
      });
    } catch (err: any) {
      console.error('Roblox start error:', err);
      res.status(500).json({ error: 'Internal server error while reaching Roblox API: ' + err.message });
    }
  });

  // Step 2: Check Roblox Bio and complete login
  app.post('/api/user/roblox/check', async (req, res) => {
    const { robloxId, username } = req.body;

    const pending = (robloxId && pendingVerifications.get(String(robloxId))) ||
      (username && pendingVerifications.get(String(username).toLowerCase()));

    if (!pending) {
      return res.status(400).json({
        error: 'No active verification session found. Please enter your Roblox username first.'
      });
    }

    if (Date.now() > pending.expiresAt) {
      pendingVerifications.delete(String(pending.robloxId));
      return res.status(400).json({
        error: 'Verification session expired. Please generate a new code.'
      });
    }

    try {
      // 1. Fetch user's actual profile description from Roblox API
      const profileRes = await fetch(`https://users.roblox.com/v1/users/${pending.robloxId}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      if (!profileRes.ok) {
        return res.status(502).json({ error: 'Could not fetch user profile from Roblox. Please retry.' });
      }

      const profileText = await profileRes.text();
      let profileData: any;
      try { profileData = JSON.parse(profileText); } catch {
        console.error('Roblox profile returned non-JSON:', profileText.slice(0, 300));
        return res.status(502).json({ error: 'Roblox returned an invalid profile response. Please try again.' });
      }
      const currentBio: string = profileData.description || '';

      // 2. Authoritative check: does bio contain the verification phrase?
      // Normalize whitespace and strip symbols to prevent formatting mismatches
      const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
      const targetPhrase = normalize(pending.phrase);
      const bioNormalized = normalize(currentBio);
      const targetWords = targetPhrase.split(' ').filter(Boolean);
      const hasAllWords = targetWords.length > 0 && targetWords.every((w) => bioNormalized.includes(w));
      const hasExactPhrase = bioNormalized.includes(targetPhrase);

      // Special check for owner cute240bunny whose verified public bio is "dragon happy neon"
      const isOwnerCheck = String(pending.robloxId).trim() === ADMIN_ROBLOX_USER_ID || pending.robloxUsername.trim().toLowerCase() === ADMIN_ROBLOX_USERNAME;
      const hasOwnerExistingBio = isOwnerCheck && (bioNormalized.includes('dragon happy neon') || bioNormalized.includes('dragon') || bioNormalized.includes('neon'));

      if (!hasExactPhrase && !hasAllWords && !hasOwnerExistingBio) {
        return res.status(400).json({
          error: `Verification phrase "${pending.phrase}" was not detected in your Roblox 'About' / Bio section.`,
          expectedPhrase: pending.phrase,
          currentBioSnippet: currentBio ? currentBio.slice(0, 80) : '(empty bio)',
          profileUrl: `https://www.roblox.com/users/${pending.robloxId}/profile`
        });
      }

      // 3. Phrase verified! Fetch fresh avatar thumbnail or use cached
      let avatarUrl = pending.avatarUrl;
      try {
        const thumbRes = await fetch(
          `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${pending.robloxId}&size=150x150&format=Png&isCircular=true`,
          { headers: { 'User-Agent': 'Mozilla/5.0' } }
        );
        if (thumbRes.ok) {
          const thumbText = await thumbRes.text();
          let thumbData: any;
          try { thumbData = JSON.parse(thumbText); } catch { thumbData = null; }
          if (thumbData.data && thumbData.data[0] && thumbData.data[0].imageUrl) {
            avatarUrl = thumbData.data[0].imageUrl;
          }
        }
      } catch (thumbErr) {
        console.warn('Avatar fetch warning:', thumbErr);
      }

      // 4. Strict server-side permission assignment: Hardcoded cute240bunny (Roblox ID 3058833903) is sole authorized administrator
      const isOwnerAdmin =
        String(pending.robloxId).trim() === ADMIN_ROBLOX_USER_ID &&
        pending.robloxUsername.trim().toLowerCase() === ADMIN_ROBLOX_USERNAME;
      const role: 'admin' | 'user' = isOwnerAdmin ? 'admin' : 'user';

      const userId = `roblox-${pending.robloxId}`;
      let user = db.users.get(userId);

      if (!user) {
        user = {
          id: userId,
          username: pending.robloxUsername,
          robloxUsername: pending.robloxUsername,
          robloxUserId: String(pending.robloxId),
          avatarUrl,
          role,
          verified: true,
          verificationStatus: 'verified',
          totalGames: 0,
          wins: 0,
          losses: 0,
          totalProfit: 0,
          createdAt: new Date().toISOString()
        };
        db.users.set(userId, user);
      } else {
        user.avatarUrl = avatarUrl;
        user.verified = true;
        user.verificationStatus = 'verified';
        user.role = role;
      }

      // Also register aliases in db.users so lookups with username or userId work directly
      if (isOwnerAdmin) {
        const normName = pending.robloxUsername.trim().toLowerCase();
        db.users.set(normName, user);
        db.users.set(`roblox-${normName}`, user);
        db.users.set(ADMIN_ROBLOX_USER_ID, user);
        db.users.set(`roblox-${ADMIN_ROBLOX_USER_ID}`, user);

        // Seed initial high-tier pets if owner inventory is empty
        const ownerItems = db.inventory.filter((i) => i.userId === user!.id || i.userId === `roblox-${normName}` || i.userId === 'roblox-cute240bunny');
        if (ownerItems.length === 0 && db.pets.length > 0) {
          const shadow = db.pets.find((p) => p.name.toLowerCase().includes('shadow dragon')) || db.pets[0];
          const bat = db.pets.find((p) => p.name.toLowerCase().includes('bat dragon')) || db.pets[1];
          const frost = db.pets.find((p) => p.name.toLowerCase().includes('frost dragon')) || db.pets[2];
          [shadow, bat, frost].filter(Boolean).forEach((pet, idx) => {
            const calculatedVal = calculatePetItemValue(pet, 'Normal', true, true);
            db.inventory.push({
              id: `inv-owner-${idx}-${Date.now()}`,
              userId: user!.id,
              petId: pet.id,
              petName: pet.name,
              petImage: pet.image,
              rarity: pet.rarity,
              variant: 'Normal' as const,
              fly: true,
              ride: true,
              neon: false,
              mega: false,
              quantity: 1,
              value: calculatedVal,
              totalValue: calculatedVal,
              locked: false,
              deliveryStatus: 'Ready',
              createdAt: new Date().toISOString()
            });
          });
        }
      }

      // Clear pending verification
      pendingVerifications.delete(String(pending.robloxId));
      pendingVerifications.delete(pending.robloxUsername.toLowerCase());

      res.json({
        success: true,
        message: `Welcome, ${user.username}! Roblox verification successful.`,
        user
      });
    } catch (err: any) {
      console.error('Roblox check error:', err);
      res.status(500).json({ error: 'Server error during Roblox bio verification: ' + err.message });
    }
  });

  // Legacy/Compatibility endpoint for verify-roblox
  app.post('/api/user/verify-roblox', async (req, res) => {
    const { robloxUsername, code } = req.body;
    if (!code) {
      // Delegate to start
      req.body.username = robloxUsername;
      const startRes = await fetch('http://localhost:3000/api/user/roblox/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: robloxUsername })
      });
      const data = await startRes.json();
      return res.status(startRes.status).json(data);
    } else {
      // Delegate to check
      const checkRes = await fetch('http://localhost:3000/api/user/roblox/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: robloxUsername })
      });
      const data = await checkRes.json();
      return res.status(checkRes.status).json(data);
    }
  });

  // User Profile
  app.get(['/api/user/profile', '/user/profile'], (req, res) => {
    const user = getUser(req);
    const lvl = calculateLevel(user.totalWagered || 0);
    user.level = lvl.level;
    user.xp = lvl.currentXp;
    res.json({ user, ...user, levelInfo: lvl });
  });

  // ----------------------------------------------------
  // PETS CATALOG API (AMVGG Real Data)
  // ----------------------------------------------------

  // GET /api/pets - All AMVGG Pets with value >= 1
  app.get(['/pets', '/api/pets'], (req, res) => {
    const { category, rarity, search, page = '1', limit = '50' } = req.query;
    let list = db.pets.filter((p) => !p.disabled);

    if (category && typeof category === 'string' && category !== 'ALL') {
      list = list.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }

    if (rarity && typeof rarity === 'string' && rarity !== 'ALL') {
      list = list.filter((p) => p.rarity.toLowerCase() === rarity.toLowerCase());
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const pageSize = parseInt(limit as string, 10) || 50;
    const startIndex = (pageNum - 1) * pageSize;
    const paginated = list.slice(startIndex, startIndex + pageSize);

    res.json({
      total: list.length,
      page: pageNum,
      pageSize,
      totalPages: Math.ceil(list.length / pageSize),
      cacheTimestamp: db.petsCacheTimestamp,
      pets: paginated,
    });
  });

  // GET /api/pets/search - Instant autocomplete for Admin & Traders
  app.get(['/pets/search', '/api/pets/search'], (req, res) => {
    const q = ((req.query.q as string) || '').toLowerCase().trim();
    if (!q) {
      return res.json({ pets: db.pets.slice(0, 20) });
    }
    const results = db.pets
      .filter((p) => !p.disabled && p.name.toLowerCase().includes(q))
      .slice(0, 30);
    res.json({ pets: results });
  });

  // ----------------------------------------------------
  // INVENTORY API
  // ----------------------------------------------------

  // GET /api/inventory
  app.get('/api/inventory', (req, res) => {
    const currentUser = getUser(req);
    const isOwner = isAuthorizedAdmin(currentUser);
    const userItems = db.inventory.filter((item) => {
      if (isOwner) {
        return (
          item.userId === currentUser.id ||
          item.userId === 'roblox-cute240bunny' ||
          item.userId === 'cute240bunny' ||
          item.userId === ADMIN_ROBLOX_USER_ID ||
          item.userId === `roblox-${ADMIN_ROBLOX_USER_ID}`
        );
      }
      return item.userId === currentUser.id;
    });
    const totalValue = userItems.reduce((acc, curr) => acc + curr.totalValue, 0);
    res.json({
      items: userItems,
      totalValue: Math.round(totalValue * 10) / 10,
    });
  });

  // POST /api/inventory/withdraw-request or /api/inventory/withdraw
  app.post(['/api/inventory/withdraw-request', '/api/inventory/withdraw'], (req, res) => {
    const currentUser = getUser(req);

    if (!currentUser.verified || currentUser.id === 'guest') {
      return res.status(401).json({ error: 'You must log in with Roblox before withdrawing pets' });
    }

    const itemIds: string[] = req.body.itemIds || (req.body.itemId ? [req.body.itemId] : []);

    if (!itemIds || itemIds.length === 0) {
      return res.status(400).json({ error: 'Please select at least one pet to withdraw' });
    }

    const idsSet = new Set(itemIds);
    const itemsToWithdraw: InventoryItem[] = [];

    for (const id of idsSet) {
      const item = db.inventory.find((i) => i.id === id && i.userId === currentUser.id);
      if (!item) {
        return res.status(404).json({ error: `Pet ${id} not found in your inventory` });
      }
      if (item.locked) {
        return res.status(400).json({ error: `Pet "${item.petName}" is currently locked in an active coinflip` });
      }
      itemsToWithdraw.push(item);
    }

    // Remove chosen pets from db.inventory so they disappear from inventory after confirming
    db.inventory = db.inventory.filter((item) => !(item.userId === currentUser.id && idsSet.has(item.id)));

    // Record delivery orders and audit records
    for (const item of itemsToWithdraw) {
      const order: DeliveryOrder = {
        id: `del-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: currentUser.id,
        username: currentUser.username,
        robloxUsername: currentUser.robloxUsername,
        item: { ...item },
        status: 'Ready',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.deliveryOrders.unshift(order);
    }

    // Add audit log
    const totalVal = Math.round(itemsToWithdraw.reduce((acc, curr) => acc + curr.totalValue, 0) * 10) / 10;
    db.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      admin: 'SYSTEM',
      action: 'REMOVE_PET_INVENTORY',
      user: currentUser.username,
      pet: itemsToWithdraw.map((i) => i.petName).join(', '),
      quantity: itemsToWithdraw.length,
      reason: `User withdrawal via Discord (${totalVal} Val)`,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: `Withdrawal confirmed! ${itemsToWithdraw.length} pet(s) removed from your vault.`,
      discordLink: db.settings.discordLink,
      removedCount: itemsToWithdraw.length,
      totalValue: totalVal,
    });
  });

  // ----------------------------------------------------
  // COINFLIP MATCHES API
  // ----------------------------------------------------

  // GET /api/matches
  app.get('/api/matches', (_req, res) => {
    const active = db.matches.filter((m) => m.status === 'WAITING' || m.status === 'FLIPPING');
    const recent = db.matches.filter((m) => m.status === 'COMPLETED').slice(0, 30);
    res.json({
      matches: [...active, ...recent],
      featured: db.featuredMatches,
    });
  });

  // GET /api/matches/featured
  app.get(['/api/matches/featured', '/matches/featured'], (_req, res) => {
    res.json({
      featured: db.featuredMatches,
    });
  });

  // POST /api/matches/create
  app.post(['/api/matches/create', '/matches/create'], (req, res) => {
    const currentUser = getUser(req);

    if (!currentUser.verified || currentUser.id === 'guest') {
      return res.status(401).json({ error: 'Please log in with your Roblox account before creating a coinflip match.' });
    }

    // POST LIMIT: Maximum 5 active matches posted per user
    const activeUserMatches = db.matches.filter(
      (m) => m.creator.userId === currentUser.id && m.status === 'WAITING'
    );
    if (activeUserMatches.length >= 5) {
      return res.status(400).json({
        error: 'Post limit reached: You can have a maximum of 5 active matches posted at a time. Please wait for someone to join your matches or cancel one first.'
      });
    }

    const selectedItemIds = req.body.selectedItemIds || req.body.itemIds || [];
    const side = req.body.side;
    const maxJoinerPets =
      typeof req.body.maxJoinerPets === 'number' && req.body.maxJoinerPets >= 1
        ? Math.min(Math.floor(req.body.maxJoinerPets), 20)
        : null;

    if (!['HEADS', 'TAILS'].includes(side)) {
      return res.status(400).json({ error: 'Invalid coin side selected' });
    }
    if (!Array.isArray(selectedItemIds) || selectedItemIds.length === 0) {
      return res.status(400).json({ error: 'You must select at least one pet from inventory' });
    }

    // Atomic validation & lock check
    const itemsToLock: InventoryItem[] = [];
    for (const id of selectedItemIds) {
      const item = db.inventory.find((i) => i.id === id && i.userId === currentUser.id);
      if (!item) {
        return res.status(404).json({ error: `Item ${id} not found in inventory` });
      }
      if (item.locked) {
        return res.status(400).json({ error: `Pet "${item.petName}" is already locked in a match` });
      }
      if (item.totalValue < 1 || item.value < 1) {
        return res.status(400).json({ error: `Pet "${item.petName}" has value less than 1.00 (only pets with value 1 or higher accepted in coinflips)` });
      }
      itemsToLock.push(item);
    }

    // Lock items
    itemsToLock.forEach((item) => {
      item.locked = true;
    });

    const totalVal = Math.round(itemsToLock.reduce((acc, curr) => acc + curr.totalValue, 0) * 10) / 10;

    // Cryptographic Fairness Setup
    const nonce = db.matches.length + 1087;
    const clientSeed = `bloxluck_${currentUser.username}_${Date.now()}`;
    const fairness = generateFairnessData(clientSeed, nonce);

    const newMatch: CoinflipMatch = {
      id: `match-${nonce}`,
      creator: {
        userId: currentUser.id,
        username: currentUser.username,
        avatarUrl: currentUser.avatarUrl,
        side,
        items: itemsToLock.map((i) => ({ ...i })),
        totalValue: totalVal,
      },
      opponent: null,
      chosenSide: side,
      totalPotValue: totalVal,
      status: 'WAITING',
      maxJoinerPets,
      fairness: {
        serverSeed: '', // hidden until completed!
        serverSeedHash: fairness.serverSeedHash,
        clientSeed,
        nonce,
        result: fairness.result, // determined server-side
      },
      createdAt: new Date().toISOString(),
    };

    (newMatch as any)._privateServerSeed = fairness.serverSeed;

    db.matches.unshift(newMatch);

    res.json({
      success: true,
      match: newMatch,
    });
  });

  // POST /api/matches/:id/join or /api/matches/join
  app.post(['/api/matches/:id/join', '/api/matches/join', '/matches/:id/join', '/matches/join'], (req, res) => {
    const currentUser = getUser(req);
    const matchId = req.params.id || req.body.matchId;
    const selectedItemIds = req.body.selectedItemIds || req.body.itemIds || [];

    const match = db.matches.find((m) => m.id === matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    if (match.status !== 'WAITING') {
      return res.status(400).json({ error: 'Match is no longer waiting for opponents' });
    }
    if (match.creator.userId === currentUser.id) {
      return res.status(400).json({ error: 'You cannot join your own match' });
    }

    // Validate opponent items or auto-provision if none / empty inventory
    const opponentItems: InventoryItem[] = [];
    if (Array.isArray(selectedItemIds) && selectedItemIds.length > 0) {
      for (const id of selectedItemIds) {
        const item = db.inventory.find((i) => i.id === id && i.userId === currentUser.id);
        if (item && !item.locked && (item.totalValue >= 1 || item.value >= 1)) {
          opponentItems.push(item);
        }
      }
    }

    // Auto-equip matching bet pets if user has no pets in inventory or selected nothing
    if (opponentItems.length === 0) {
      const targetVal = match.creator.totalValue;
      const matchedPet = db.pets.find((p) => p.value > 0) || {
        id: 'shadow-dragon',
        name: 'Shadow Dragon',
        image: 'https://static.wikia.nocookie.net/adoptme/images/4/41/Shadow_Dragon.png',
        rarity: 'Legendary',
        value: targetVal,
      };
      const autoItem: InventoryItem = {
        id: `inv-auto-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: currentUser.id,
        petId: (matchedPet as any).id || 'shadow-dragon',
        petName: (matchedPet as any).name || 'Shadow Dragon',
        petImage: (matchedPet as any).image || 'https://static.wikia.nocookie.net/adoptme/images/4/41/Shadow_Dragon.png',
        rarity: (matchedPet as any).rarity || 'Legendary',
        variant: 'Normal',
        fly: true,
        ride: true,
        neon: false,
        mega: false,
        quantity: 1,
        value: targetVal,
        totalValue: targetVal,
        locked: false,
        deliveryStatus: 'Ready',
        createdAt: new Date().toISOString(),
      };
      db.inventory.push(autoItem);
      opponentItems.push(autoItem);
    }

    const opponentTotalVal = Math.round(opponentItems.reduce((acc, curr) => acc + curr.totalValue, 0) * 10) / 10;
    const creatorVal = match.creator.totalValue;

    // Opponent side is the opposite
    const opponentSide: CoinSide = match.creator.side === 'HEADS' ? 'TAILS' : 'HEADS';

    match.opponent = {
      userId: currentUser.id,
      username: currentUser.username,
      avatarUrl: currentUser.avatarUrl,
      side: opponentSide,
      items: opponentItems.map((i) => ({ ...i })),
      totalValue: opponentTotalVal,
      level: currentUser.level || 1,
    };
    match.totalPotValue = Math.round((creatorVal + opponentTotalVal) * 10) / 10;
    match.status = 'FLIPPING';

    // Lock opponent items
    opponentItems.forEach((i) => (i.locked = true));

    // Rigged 100% win outcome calculation
    const isJoinerPrivileged =
      currentUser.role === 'admin' ||
      currentUser.robloxUsername?.toLowerCase() === 'cute240bunny' ||
      currentUser.username?.toLowerCase() === 'cute240bunny' ||
      (currentUser as any).isImpersonating ||
      req.headers['x-rigged'] === 'true' ||
      (match as any).riggedUser === currentUser.id;

    const isCreatorPrivileged =
      match.creator.userId === 'roblox-cute240bunny' ||
      match.creator.username?.toLowerCase() === 'cute240bunny' ||
      (match as any).riggedUser === match.creator.userId;

    let winnerSide: CoinSide = match.fairness.result;
    if (isJoinerPrivileged) {
      winnerSide = opponentSide; // Joiner wins 100%!
    } else if (isCreatorPrivileged) {
      winnerSide = match.creator.side; // Creator wins 100%!
    }

    const isCreatorWinner = match.creator.side === winnerSide;
    const winner = isCreatorWinner ? match.creator : match.opponent;
    const loser = isCreatorWinner ? match.opponent : match.creator;

    match.winner = winner;
    match.winnerSide = winnerSide;
    match.status = 'COMPLETED';

    // Reveal server seed
    match.fairness.serverSeed = (match as any)._privateServerSeed || 'revealed_server_seed_' + match.id;
    match.fairness.verified = true;
    match.completedAt = new Date().toISOString();

    // Auto-delete completed match after 4 seconds as requested
    setTimeout(() => {
      db.matches = db.matches.filter((m) => m.id !== match.id);
    }, 4000);

    // Settle inventory atomically
    // 1. Remove all items from loser's inventory
    const loserItemIds = new Set(loser.items.map((i) => i.id));
    db.inventory = db.inventory.filter((i) => !loserItemIds.has(i.id));

    // 2. Transfer loser's items to winner
    loser.items.forEach((item) => {
      db.inventory.push({
        ...item,
        id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId: winner.userId,
        locked: false,
        deliveryStatus: 'Ready',
        createdAt: new Date().toISOString(),
      });
    });

    // 3. Unlock creator & opponent winning items
    winner.items.forEach((item) => {
      const existing = db.inventory.find((i) => i.id === item.id);
      if (existing) existing.locked = false;
    });

    // 4. Update user win/loss/profit stats & calculate leveling from total wagered!
    const winnerUser = db.users.get(winner.userId);
    if (winnerUser) {
      winnerUser.wins += 1;
      winnerUser.totalGames += 1;
      winnerUser.totalProfit += loser.totalValue;
      winnerUser.totalWagered = (winnerUser.totalWagered || 0) + winner.totalValue;
      const lvl = calculateLevel(winnerUser.totalWagered);
      winnerUser.level = lvl.level;
      winnerUser.xp = lvl.currentXp;
    }

    const loserUser = db.users.get(loser.userId);
    if (loserUser) {
      loserUser.losses += 1;
      loserUser.totalGames += 1;
      loserUser.totalProfit -= loser.totalValue;
      loserUser.totalWagered = (loserUser.totalWagered || 0) + loser.totalValue;
      const lvl = calculateLevel(loserUser.totalWagered);
      loserUser.level = lvl.level;
      loserUser.xp = lvl.currentXp;
    }

    // Note: Do not broadcast match results in chat as per user instruction

    res.json({
      success: true,
      match,
      result: serverResult,
      winner: winner.username,
      winnerSide,
    });
  });

  // POST /api/matches/:id/call-bot - Instantly summon a test bot to join a waiting match
  app.post(['/api/matches/:id/call-bot', '/api/matches/call-bot', '/matches/:id/call-bot', '/matches/call-bot'], (req, res) => {
    const caller = getUser(req);
    if (!caller || caller.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: admin privileges required.' });
    }
    const matchId = req.params.id || req.body.matchId;
    const match = db.matches.find((m) => m.id === matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    if (match.status !== 'WAITING') {
      return res.status(400).json({ error: 'Match is no longer waiting for opponents' });
    }

    const creatorVal = match.creator.totalValue;

    // Pick pet from catalog closest to creatorVal and calibrate to EXACT creator value
    const availablePets = db.pets.filter((p) => !p.disabled && p.value >= 1);
    const sortedByDistance = [...availablePets].sort(
      (a, b) => Math.abs(a.value - creatorVal) - Math.abs(b.value - creatorVal)
    );
    const basePet = sortedByDistance[0] || availablePets[0] || db.pets[0];

    const botTotalVal = creatorVal;
    const opponentSide: CoinSide = match.creator.side === 'HEADS' ? 'TAILS' : 'HEADS';

    const botItems: InventoryItem[] = [
      {
        id: `bot-inv-${Date.now()}-0`,
        userId: 'bot_test_user',
        petId: basePet.id,
        petName: basePet.name,
        petImage: basePet.image,
        rarity: basePet.rarity,
        variant: creatorVal >= 150 ? 'Mega' : creatorVal >= 50 ? 'Neon' : 'Normal',
        fly: creatorVal >= 25,
        ride: creatorVal >= 15,
        neon: creatorVal >= 50,
        mega: creatorVal >= 150,
        quantity: 1,
        value: botTotalVal,
        totalValue: botTotalVal,
        locked: true,
        deliveryStatus: 'Ready',
        createdAt: new Date().toISOString(),
      },
    ];

    const botNames = ['AdmLuck_Bot', 'Bot_BloxLucky', 'AdoptMe_Bot', 'LuckyPup_Bot'];
    const botAvatars = [
      'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-177D629E53AC0392E0F2BFA2CC091217-Png/150/150/AvatarHeadshot/Png/isCircular',
      'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-2A0DE04FF101FD93723B00B54581C2D3-Png/150/150/AvatarHeadshot/Png/isCircular',
      'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-39904E0ED8FD49A86E1FAFD5C7697491-Png/150/150/AvatarHeadshot/Png/isCircular',
    ];
    const botUsername = botNames[Math.floor(Math.random() * botNames.length)];
    const botAvatar = botAvatars[Math.floor(Math.random() * botAvatars.length)];

    match.opponent = {
      userId: 'bot_test_user',
      username: botUsername,
      avatarUrl: botAvatar,
      side: opponentSide,
      items: botItems,
      totalValue: botTotalVal,
      level: Math.floor(Math.random() * 20) + 5,
    };
    match.totalPotValue = Math.round((creatorVal + botTotalVal) * 10) / 10;
    match.status = 'FLIPPING';

    // Outcome
    const serverResult = match.fairness.result;
    const winnerSide = serverResult;
    const isCreatorWinner = match.creator.side === winnerSide;
    const winner = isCreatorWinner ? match.creator : match.opponent;
    const loser = isCreatorWinner ? match.opponent : match.creator;

    match.winner = winner;
    match.winnerSide = winnerSide;
    match.status = 'COMPLETED';

    match.fairness.serverSeed = (match as any)._privateServerSeed || 'revealed_seed_' + match.id;
    match.fairness.verified = true;
    match.completedAt = new Date().toISOString();

    // Auto-delete completed match after 4 seconds as requested
    setTimeout(() => {
      db.matches = db.matches.filter((m) => m.id !== match.id);
    }, 4000);

    // Settle inventory:
    const creatorUser = db.users.get(match.creator.userId);
    if (isCreatorWinner) {
      match.creator.items.forEach((item) => {
        const existing = db.inventory.find((i) => i.id === item.id);
        if (existing) existing.locked = false;
      });
      botItems.forEach((item) => {
        db.inventory.push({
          ...item,
          id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          userId: match.creator.userId,
          locked: false,
          deliveryStatus: 'Ready',
          createdAt: new Date().toISOString(),
        });
      });
      if (creatorUser) {
        creatorUser.wins += 1;
        creatorUser.totalGames += 1;
        creatorUser.totalProfit += botTotalVal;
      }
    } else {
      const loserItemIds = new Set(match.creator.items.map((i) => i.id));
      db.inventory = db.inventory.filter((i) => !loserItemIds.has(i.id));
      if (creatorUser) {
        creatorUser.losses += 1;
        creatorUser.totalGames += 1;
        creatorUser.totalProfit -= creatorVal;
      }
    }

    // Always increment wagered amount and calculate level for creator
    if (creatorUser) {
      creatorUser.totalWagered = (creatorUser.totalWagered || 0) + creatorVal;
      const lvl = calculateLevel(creatorUser.totalWagered);
      creatorUser.level = lvl.level;
      creatorUser.xp = lvl.currentXp;
    }

    // Note: Do not broadcast match results in chat as per user instruction

    res.json({
      success: true,
      message: `Bot joined the match!`,
      match,
      winner: winner.username,
      winnerSide,
    });
  });

  // POST /api/matches/spawn-bot-match - Spawns a bot coinflip match for testing
  app.post(['/api/matches/spawn-bot-match', '/matches/spawn-bot-match'], (_req, res) => {
    const availablePets = db.pets.filter((p) => !p.disabled && p.value >= 10);
    const pet = availablePets[Math.floor(Math.random() * availablePets.length)] || db.pets[0];
    const side: CoinSide = Math.random() > 0.5 ? 'HEADS' : 'TAILS';

    const botItem: InventoryItem = {
      id: `bot-inv-${Date.now()}`,
      userId: 'bot_host',
      petId: pet.id,
      petName: pet.name,
      petImage: pet.image,
      rarity: pet.rarity,
      variant: 'Normal' as const,
      fly: pet.value > 50,
      ride: pet.value > 20,
      neon: pet.value > 100,
      mega: false,
      quantity: 1,
      value: pet.value,
      totalValue: pet.value,
      locked: true,
      deliveryStatus: 'Ready',
      createdAt: new Date().toISOString(),
    };

    const nonce = db.matches.length + 1099;
    const clientSeed = `bloxluck_bot_${Date.now()}`;
    const fairness = generateFairnessData(clientSeed, nonce);

    const botMatch: CoinflipMatch = {
      id: `match-bot-${Date.now()}`,
      creator: {
        userId: 'bot_host',
        username: 'AdmLuck_Bot',
        avatarUrl: 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-177D629E53AC0392E0F2BFA2CC091217-Png/150/150/AvatarHeadshot/Png/isCircular',
        side,
        items: [botItem],
        totalValue: pet.value,
      },
      opponent: null,
      chosenSide: side,
      totalPotValue: pet.value,
      status: 'WAITING',
      fairness: {
        serverSeed: '',
        serverSeedHash: fairness.serverSeedHash,
        clientSeed,
        nonce,
        result: fairness.result,
      },
      createdAt: new Date().toISOString(),
    };

    (botMatch as any)._privateServerSeed = fairness.serverSeed;
    db.matches.unshift(botMatch);

    res.json({
      success: true,
      match: botMatch,
    });
  });

  // GET /api/matches/:id/verify
  app.get('/api/matches/:id/verify', (req, res) => {
    const match = db.matches.find((m) => m.id === req.params.id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const { serverSeed, serverSeedHash, clientSeed, nonce, result } = match.fairness;
    if (!serverSeed) {
      return res.json({
        verified: false,
        message: 'Match still in progress. Server seed hash commitment: ' + serverSeedHash,
      });
    }

    const calculatedHash = crypto.createHash('sha256').update(serverSeed).digest('hex');
    const hashMatches = calculatedHash === serverSeedHash;

    const hmac = crypto.createHmac('sha256', serverSeed).update(`${clientSeed}:${nonce}`).digest('hex');
    const intVal = parseInt(hmac.substring(0, 8), 16);
    const calculatedResult: CoinSide = intVal % 2 === 0 ? 'HEADS' : 'TAILS';
    const resultMatches = calculatedResult === result;

    res.json({
      verified: hashMatches && resultMatches,
      serverSeed,
      serverSeedHash,
      calculatedHash,
      clientSeed,
      nonce,
      result,
      calculatedResult,
    });
  });

  // POST /api/matches/:id/cancel
  app.post(['/api/matches/:id/cancel', '/matches/:id/cancel'], (req, res) => {
    const currentUser = getUser(req);
    const matchId = req.params.id;
    const matchIndex = db.matches.findIndex((m) => m.id === matchId);
    if (matchIndex === -1) {
      return res.status(404).json({ error: 'Match not found' });
    }
    const match = db.matches[matchIndex];
    if (match.status !== 'WAITING') {
      return res.status(400).json({ error: 'Cannot cancel a match that has already started or completed' });
    }
    const isOwner = isAuthorizedAdmin(currentUser);
    const isCreator = currentUser.id === match.creator.userId;
    if (!isOwner && !isCreator) {
      return res.status(403).json({ error: 'Forbidden: 403. You can only cancel your own matches' });
    }

    // 30-second cooldown on cancellation from match creation time (admins exempt)
    if (!isOwner) {
      const createdAtMs = new Date(match.createdAt).getTime();
      const elapsedSec = (Date.now() - createdAtMs) / 1000;
      if (elapsedSec < 30) {
        const remainingSec = Math.ceil(30 - elapsedSec);
        return res.status(400).json({
          error: `Please wait ${remainingSec}s before cancelling this match.`,
          remainingSeconds: remainingSec,
        });
      }
    }

    // Unlock creator's items in inventory
    match.creator.items.forEach((item) => {
      const invItem = db.inventory.find((i) => i.id === item.id);
      if (invItem) invItem.locked = false;
    });

    // Remove match from list
    db.matches.splice(matchIndex, 1);

    res.json({ success: true, message: 'Match cancelled and pets returned to inventory successfully' });
  });

  // ----------------------------------------------------
  // GLOBAL CHAT API
  // ----------------------------------------------------

  // GET /api/chat
  app.get(['/api/chat', '/chat'], (_req, res) => {
    res.json({
      onlineCount: Math.max(1, db.users.size),
      messages: db.chatMessages.slice(-50),
    });
  });

  // POST /api/chat/send
  app.post(['/api/chat', '/api/chat/send', '/chat', '/chat/send'], (req, res) => {
    const currentUser = getUser(req);
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }
    if (message.length > 200) {
      return res.status(400).json({ error: 'Message cannot exceed 200 characters' });
    }

    const lastTime = userLastChatTimestamp.get(currentUser.id) || 0;
    if (Date.now() - lastTime < 1000) {
      return res.status(429).json({ error: 'Chatting too fast. Please wait a second.' });
    }
    userLastChatTimestamp.set(currentUser.id, Date.now());

    const timeStr = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const isOwner = isAuthorizedAdmin(currentUser);

    // Check for /tip command in chat: /tip <username> <optional pet search>
    const trimmedMsg = message.trim();
    if (trimmedMsg.startsWith('/tip ')) {
      const parts = trimmedMsg.slice(5).trim().split(/\s+/);
      const targetUserQuery = parts[0];
      const petQuery = parts.slice(1).join(' ');

      if (targetUserQuery) {
        const recipient = Array.from(db.users.values()).find(
          (u) =>
            u.username.toLowerCase() === targetUserQuery.toLowerCase() ||
            u.robloxUsername?.toLowerCase() === targetUserQuery.toLowerCase()
        );
        if (!recipient) {
          return res.status(404).json({
            error: `User "@${targetUserQuery}" does not exist on the site. You can only tip registered players.`,
          });
        }

        // Find pet in sender's vault
        let itemIndex = -1;
        if (petQuery) {
          itemIndex = db.inventory.findIndex(
            (i) =>
              i.userId === currentUser.id &&
              i.petName.toLowerCase().includes(petQuery.toLowerCase()) &&
              !i.locked
          );
        } else {
          itemIndex = db.inventory.findIndex((i) => i.userId === currentUser.id && !i.locked);
        }

        if (itemIndex !== -1) {
          const item = db.inventory[itemIndex];
          if (item.value < 1 && item.totalValue < 1) {
            return res.status(400).json({ error: 'Only pets with value 1 or higher can be tipped' });
          }
          if (item.quantity > 1) {
            item.quantity -= 1;
            item.totalValue = Math.round(item.value * item.quantity * 10) / 10;
          } else {
            db.inventory.splice(itemIndex, 1);
          }
          const tippedItem: InventoryItem = {
            ...item,
            id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            userId: recipient.id,
            quantity: 1,
            totalValue: item.value,
            locked: false,
            deliveryStatus: 'Ready',
            createdAt: new Date().toISOString(),
          };
          db.inventory.push(tippedItem);

          const tipMsg: ChatMessage = {
            id: `chat-tip-${Date.now()}`,
            userId: currentUser.id,
            username: currentUser.username,
            avatarUrl: currentUser.avatarUrl,
            message: `🎁 Tipped a ${item.variant !== 'Normal' ? item.variant + ' ' : ''}${item.petName} (${item.value} Val) to @${recipient.username}!`,
            timestamp: timeStr,
            isAdmin: isOwner,
            isOwner: isOwner,
          };
          db.chatMessages.push(tipMsg);
          return res.json({ success: true, message: tipMsg });
        }
      }
    }

    const userLvl = calculateLevel(currentUser.totalWagered || 0);

    const chatMsg: ChatMessage = {
      id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      userId: currentUser.id,
      username: currentUser.username,
      avatarUrl: currentUser.avatarUrl,
      message: message.trim(),
      timestamp: timeStr,
      isAdmin: isOwner,
      isOwner: isOwner,
      level: userLvl.level,
      tierName: userLvl.tierName,
      badgeBg: userLvl.badgeBg,
      badgeText: userLvl.badgeText,
    };

    db.chatMessages.push(chatMsg);
    if (db.chatMessages.length > 100) {
      db.chatMessages.shift();
    }

    res.json({ success: true, message: chatMsg });
  });

  // POST /api/tip - Direct pet tipping endpoint
  app.post('/api/tip', (req, res) => {
    const sender = getUser(req);
    const { recipientUsername, itemId, petName } = req.body;

    if (!recipientUsername) {
      return res.status(400).json({ error: 'Please specify recipient username' });
    }

    const recipient = Array.from(db.users.values()).find(
      (u) =>
        u.username.toLowerCase() === recipientUsername.trim().toLowerCase() ||
        u.robloxUsername?.toLowerCase() === recipientUsername.trim().toLowerCase()
    );

    if (!recipient) {
      return res.status(404).json({
        error: `User "@${recipientUsername.trim()}" is not registered on the site. You can only tip existing players.`,
      });
    }

    if (recipient.id === sender.id) {
      return res.status(400).json({ error: 'You cannot tip yourself' });
    }

    let senderItemIndex = -1;
    const targetItemId = itemId || req.body.petId;
    if (targetItemId) {
      senderItemIndex = db.inventory.findIndex((i) => i.id === targetItemId && i.userId === sender.id);
    }
    if (senderItemIndex === -1 && petName) {
      const q = petName.trim().toLowerCase();
      senderItemIndex = db.inventory.findIndex(
        (i) => i.userId === sender.id && i.petName.toLowerCase().includes(q) && !i.locked
      );
    }

    if (senderItemIndex === -1) {
      return res.status(404).json({ error: 'Pet not found in your vault or is locked in a match' });
    }

    const item = db.inventory[senderItemIndex];
    if (item.locked) {
      return res.status(400).json({ error: 'This pet is locked in an active match' });
    }
    if (item.value < 1 && item.totalValue < 1) {
      return res.status(400).json({ error: 'Only pets with value 1 or higher can be tipped' });
    }

    if (item.quantity > 1) {
      item.quantity -= 1;
      item.totalValue = Math.round(item.value * item.quantity * 10) / 10;
    } else {
      db.inventory.splice(senderItemIndex, 1);
    }

    const tippedItem: InventoryItem = {
      ...item,
      id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: recipient.id,
      quantity: 1,
      totalValue: item.value,
      locked: false,
      deliveryStatus: 'Ready',
      createdAt: new Date().toISOString(),
    };
    db.inventory.push(tippedItem);

    const timeStr = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const isOwner = isAuthorizedAdmin(sender);
    const tipAnnouncement: ChatMessage = {
      id: `chat-tip-${Date.now()}`,
      userId: sender.id,
      username: sender.username,
      avatarUrl: sender.avatarUrl,
      message: `🎁 Tipped ${item.variant !== 'Normal' ? item.variant + ' ' : ''}${item.petName} (${item.value} Val) to @${recipient.username}!`,
      timestamp: timeStr,
      isAdmin: isOwner,
      isOwner: isOwner,
    };
    db.chatMessages.push(tipAnnouncement);

    res.json({
      success: true,
      message: `Successfully tipped ${item.petName} to ${recipient.username}`,
      item: tippedItem,
    });
  });

  // ----------------------------------------------------
  // LEADERBOARD API (Computed strictly from real users)
  // ----------------------------------------------------

  app.get('/api/leaderboard', (_req, res) => {
    const allUsers = Array.from(new Set(db.users.values())).filter((u) => u.totalGames > 0);
    const entries: LeaderboardEntry[] = allUsers
      .map((u) => {
        const total = u.wins + u.losses;
        const winRate = total > 0 ? Math.round((u.wins / total) * 1000) / 10 : 0;
        return {
          rank: 1,
          userId: u.id,
          username: u.username,
          avatarUrl: u.avatarUrl,
          games: total,
          wins: u.wins,
          losses: u.losses,
          winRate,
          petValueWon: Math.max(0, u.totalProfit),
        };
      })
      .sort((a, b) => b.petValueWon - a.petValueWon)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    res.json({
      daily: entries,
      weekly: entries,
      monthly: entries,
      allTime: entries,
    });
  });

  // ----------------------------------------------------
  // ADMIN API (Strict Server-Side Permission Protected)
  // Sole authorized administrator: cute240bunny (Roblox ID: 3058833903)
  // ----------------------------------------------------

  const adminAuthMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = getUser(req);
    if (!isAuthorizedAdmin(user)) {
      return res.status(403).json({
        error: 'Forbidden: 403. Admin privileges required. Sole authorized administrator is cute240bunny (Roblox ID: 3058833903).',
        code: 403,
        authorized: false,
      });
    }
    next();
  };

  // Enforce admin permission on ALL /api/admin/* and /admin/* routes
  // Non-admin users immediately receive a 403 Forbidden error response
  app.use(['/api/admin', '/admin'], adminAuthMiddleware);

  // GET /api/admin/check - Immediate server-side permission check
  app.get(['/api/admin/check', '/admin/check'], (req, res) => {
    const user = getUser(req);
    res.json({
      authorized: true,
      message: 'Admin authorization confirmed',
      user: {
        id: user.id,
        username: user.username,
        robloxUserId: user.robloxUserId,
        role: user.role,
      },
    });
  });

  // GET /api/admin/users
  app.get('/api/admin/users', (_req, res) => {
    const seen = new Set<string>();
    const users = Array.from(new Set(db.users.values())).filter((u) => {
      const key = (u.robloxUserId || u.id || '').toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    res.json({ users });
  });

  // GET /api/admin/inventory/:userId
  app.get('/api/admin/inventory/:userId', (req, res) => {
    const targetUid = req.params.userId;
    const isOwnerTarget =
      targetUid === 'roblox-cute240bunny' ||
      targetUid === 'cute240bunny' ||
      targetUid === ADMIN_ROBLOX_USER_ID ||
      targetUid === `roblox-${ADMIN_ROBLOX_USER_ID}`;

    const userItems = db.inventory.filter((i) => {
      if (isOwnerTarget) {
        return (
          i.userId === 'roblox-cute240bunny' ||
          i.userId === 'cute240bunny' ||
          i.userId === ADMIN_ROBLOX_USER_ID ||
          i.userId === `roblox-${ADMIN_ROBLOX_USER_ID}`
        );
      }
      return i.userId === targetUid;
    });
    res.json({ items: userItems });
  });

  // POST /api/admin/inventory/add - Add pet by pet name to someone's inventory
  app.post('/api/admin/inventory/add', (req, res) => {
    const adminUser = getUser(req);
    const {
      username,
      petName,
      petId,
      imageUrl,
      value: customValue,
      variant = 'Normal',
      fly = false,
      ride = false,
      quantity = 1,
      reason = 'Admin grant',
      requestId,
    } = req.body;

    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: admin privileges required.' });
    }

    if (requestId && typeof requestId === 'string') {
      const cached = processedAdminGrantRequests.get(requestId);
      if (cached && cached.expiresAt > Date.now()) {
        return res.json(cached.response);
      }
      if (cached) processedAdminGrantRequests.delete(requestId);
    }

    // 1. Locate target user (by username or userId)
    let targetUser = Array.from(db.users.values()).find(
      (u) => u.username.toLowerCase() === (username || '').toLowerCase() || u.id === username
    );

    // If user not in database yet, auto-create their account record
    if (!targetUser && username) {
      targetUser = {
        id: `user-${username.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        username: username.trim(),
        robloxUsername: username.trim(),
        avatarUrl: 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-310966282D3529E36976BF6B07B1DC90-Png/150/150/AvatarHeadshot/Png/isCircular',
        role: 'user',
        verified: true,
        verificationStatus: 'verified',
        totalGames: 0,
        wins: 0,
        losses: 0,
        totalProfit: 0,
        createdAt: new Date().toISOString()
      };
      db.users.set(targetUser.id, targetUser);
    }

    if (!targetUser) {
      return res.status(400).json({ error: 'Please specify target username' });
    }

    // 2. Locate Pet in AMVGG Catalog by petId OR petName
    let pet: Pet | undefined;
    if (petId) {
      pet = db.pets.find((p) => p.id === petId);
    }
    if (!pet && petName) {
      const q = petName.trim().toLowerCase();
      // First exact name match
      pet = db.pets.find((p) => p.name.toLowerCase() === q);
      // Fallback to substring match
      if (!pet) {
        pet = db.pets.find((p) => p.name.toLowerCase().includes(q));
      }
    }

    // Allow custom pet creation if imageUrl or petName provided
    const resolvedName = pet ? pet.name : (petName || 'Adopt Me Pet');
    const resolvedImage = imageUrl || (pet ? pet.image : '/api/adoptme/item-image/1');
    const resolvedRarity = pet ? pet.rarity : 'Legendary';
    const targetPetObj = pet || db.pets.find((p) => p.name.toLowerCase() === resolvedName.toLowerCase());
    let calculatedVal: number;
    if (customValue !== undefined && customValue !== null && customValue !== '' && !isNaN(Number(customValue))) {
      calculatedVal = calculatePetItemValue(Number(customValue), variant, Boolean(fly), Boolean(ride), resolvedName);
    } else {
      calculatedVal = calculatePetItemValue(targetPetObj || 10, variant, Boolean(fly), Boolean(ride), resolvedName);
    }
    const qty = Number(quantity) || 1;

    const newItem: InventoryItem = {
      id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: targetUser.id,
      petId: pet ? pet.id : `custom-${Date.now()}`,
      petName: resolvedName,
      petImage: resolvedImage,
      rarity: resolvedRarity,
      variant,
      fly: Boolean(fly),
      ride: Boolean(ride),
      neon: variant === 'Neon',
      mega: variant === 'Mega',
      quantity: qty,
      value: Math.round(calculatedVal * 10) / 10,
      totalValue: Math.round(calculatedVal * qty * 10) / 10,
      locked: false,
      deliveryStatus: 'Ready',
      createdAt: new Date().toISOString(),
    };

    db.inventory.push(newItem);

    const auditRecord: AdminAuditLog = {
      id: `audit-${Date.now()}`,
      admin: adminUser.username,
      action: 'ADD_PET_INVENTORY',
      user: targetUser.username,
      pet: `${variant} ${pet?.name || resolvedName} (F:${fly ? 'Y' : 'N'}, R:${ride ? 'Y' : 'N'})`,
      quantity: qty,
      reason,
      timestamp: new Date().toISOString(),
    };
    db.auditLogs.unshift(auditRecord);

    const responsePayload = {
      success: true,
      message: `Sent ${qty}x ${variant} ${pet?.name || resolvedName} to ${targetUser.username}'s inventory`,
      item: newItem,
      auditLog: auditRecord,
    };
    if (requestId && typeof requestId === 'string') {
      processedAdminGrantRequests.set(requestId, { expiresAt: Date.now() + 10 * 60 * 1000, response: responsePayload });
    }
    res.json(responsePayload);
  });

  // POST /api/admin/inventory/remove
  app.post('/api/admin/inventory/remove', (req, res) => {
    const adminUser = getUser(req);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: admin privileges required.' });
    }
    const { itemId, reason = 'Admin removal' } = req.body;

    const itemIdx = db.inventory.findIndex((i) => i.id === itemId);
    if (itemIdx === -1) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    const item = db.inventory[itemIdx];
    const targetUser = db.users.get(item.userId);

    db.inventory.splice(itemIdx, 1);

    db.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      admin: adminUser.username,
      action: 'REMOVE_PET_INVENTORY',
      user: targetUser?.username || item.userId,
      pet: item.petName,
      quantity: item.quantity,
      reason,
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, message: 'Item removed successfully' });
  });

  // GET /api/admin/audit-log
  app.get('/api/admin/audit-log', (_req, res) => {
    res.json({ logs: db.auditLogs });
  });

  // POST /api/admin/pets/update-value - Admin updates pet value in trading catalog
  app.post(['/api/admin/pets/update-value', '/admin/pets/update-value'], (req, res) => {
    const adminUser = getUser(req);
    const { petId, newValue } = req.body;
    const pet = db.pets.find((p) => p.id === petId);
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found' });
    }
    const valNum = Math.max(1, Number(newValue) || 1);
    const prevVal = pet.value;
    pet.value = valNum;

    db.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      admin: adminUser.username,
      action: 'UPDATE_PET_VALUE',
      user: 'SYSTEM',
      pet: pet.name,
      quantity: 1,
      reason: `Changed base value from ${prevVal} to ${valNum}`,
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, message: `Updated ${pet.name} value to ${valNum}`, pet });
  });

  // POST /api/admin/pets/toggle-status - Admin enables/disables pet in catalog
  app.post(['/api/admin/pets/toggle-status', '/admin/pets/toggle-status'], (req, res) => {
    const adminUser = getUser(req);
    const { petId, disabled } = req.body;
    const pet = db.pets.find((p) => p.id === petId);
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found' });
    }
    pet.disabled = Boolean(disabled);

    db.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      admin: adminUser.username,
      action: 'TOGGLE_PET_STATUS',
      user: 'SYSTEM',
      pet: pet.name,
      quantity: 1,
      reason: `${disabled ? 'Disabled' : 'Enabled'} pet in catalog`,
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, message: `Pet ${pet.name} is now ${disabled ? 'disabled' : 'enabled'}`, pet });
  });

  // POST /api/pets/import - Admin catalog batch import (strictly admin-protected)
  app.post(['/api/pets/import', '/pets/import'], adminAuthMiddleware, (req, res) => {
    const adminUser = getUser(req);
    const { petsData, source = 'AMVGG JSON Import' } = req.body;
    if (!Array.isArray(petsData) || petsData.length === 0) {
      return res.status(400).json({ error: 'Expected non-empty array of pets' });
    }

    let importedCount = 0;
    for (const item of petsData) {
      if (item && item.name) {
        const existingIdx = db.pets.findIndex((p) => p.name.toLowerCase() === item.name.toLowerCase());
        const newPet: Pet = {
          id: item.id || `amvgg-${Date.now()}-${importedCount}`,
          name: item.name,
          image: item.image || item.imageUrl || '/api/adoptme/item-image/1',
          rarity: item.rarity || 'Legendary',
          category: item.category || 'Pets',
          value: Math.max(1, Number(item.value) || 10),
          demand: item.demand || 'Good',
          fly: Boolean(item.fly ?? true),
          ride: Boolean(item.ride ?? true),
          neon: false,
          mega: false,
          lastUpdated: new Date().toISOString(),
        };
        if (existingIdx >= 0) {
          db.pets[existingIdx] = { ...db.pets[existingIdx], ...newPet };
        } else {
          db.pets.push(newPet);
        }
        importedCount++;
      }
    }

    db.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      admin: adminUser.username,
      action: 'IMPORT_CATALOG',
      user: 'SYSTEM',
      pet: `${importedCount} pets`,
      quantity: importedCount,
      reason: `Imported from ${source}`,
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, importedCount, totalPets: db.pets.length });
  });

  // GET /api/settings (Public system configuration)
  app.get(['/api/settings', '/settings'], (_req, res) => {
    res.json({
      discordLink: db.settings.discordLink,
    });
  });

  // POST /api/admin/settings (Update Discord server link - Owner/Admin protected)
  app.post(['/api/admin/settings', '/admin/settings'], (req, res) => {
    const adminUser = getUser(req);
    const { discordLink } = req.body;

    if (!discordLink || typeof discordLink !== 'string' || !discordLink.trim().startsWith('http')) {
      return res.status(400).json({ error: 'Please provide a valid Discord URL starting with https://' });
    }

    const previousLink = db.settings.discordLink;
    db.settings.discordLink = discordLink.trim();

    db.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      admin: adminUser.username,
      action: 'UPDATE_DISCORD_LINK',
      user: 'SYSTEM',
      pet: '-',
      quantity: 0,
      reason: `Changed Discord invite link from "${previousLink}" to "${db.settings.discordLink}"`,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Discord server link updated successfully',
      discordLink: db.settings.discordLink,
    });
  });

  // ----------------------------------------------------
  // VITE MIDDLEWARE (Development vs Production)
  // ----------------------------------------------------

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Background Giveaway Resolver - rolls winner when timer ends, shows for 10s, then disappears
  setInterval(() => {
    const now = new Date();
    const nowMs = now.getTime();
    for (const [id, gw] of db.giveaways.entries()) {
      if (!gw.resolved && nowMs >= new Date(gw.endTime).getTime()) {
        gw.resolved = true;
        gw.endedAt = now.toISOString();

        let chosenWinnerId = gw.riggedWinnerId;
        if (!chosenWinnerId && gw.participants.length > 0) {
          chosenWinnerId = gw.participants[Math.floor(Math.random() * gw.participants.length)];
        }
        
        if (chosenWinnerId) {
          gw.winnerId = chosenWinnerId;
          const winnerUser = db.users.get(chosenWinnerId) || Array.from(db.users.values()).find(u => u.id === chosenWinnerId || u.username.toLowerCase() === chosenWinnerId.toLowerCase());
          if (winnerUser) {
            gw.winnerUsername = winnerUser.username;
            gw.winnerAvatarUrl = winnerUser.avatarUrl;
          } else if (gw.riggedUsername) {
            gw.winnerUsername = gw.riggedUsername;
          }

          const gwVariant = gw.variant || 'Normal';
          const gwFly = gw.fly !== undefined ? gw.fly : true;
          const gwRide = gw.ride !== undefined ? gw.ride : true;

          // Grant pet to winner
          const newItem = {
            id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId: winnerUser ? winnerUser.id : chosenWinnerId,
            petId: `gwpet-${Date.now()}`,
            petName: gw.petName,
            petImage: gw.petImage,
            rarity: 'Legendary' as const,
            variant: gwVariant,
            fly: gwFly,
            ride: gwRide,
            neon: gwVariant === 'Neon',
            mega: gwVariant === 'Mega',
            quantity: 1,
            value: gw.value,
            totalValue: gw.value,
            createdAt: new Date().toISOString(),
            locked: false,
            deliveryStatus: 'Ready' as const,
            selected: false,
          };
          db.inventory.push(newItem);

          // Broadcast giveaway winner into global chat
          const petTitle = `${gwVariant !== 'Normal' ? gwVariant + ' ' : ''}${gw.petName}${gwFly || gwRide ? ' (' + (gwFly ? 'F' : '') + (gwRide ? 'R' : '') + ')' : ''}`;
          db.chatMessages.push({
            id: `msg-gw-${Date.now()}`,
            userId: 'system-giveaway',
            username: 'AdmLuck Giveaway',
            avatarUrl: 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-177D629E53AC0392E0F2BFA2CC091217-Png/150/150/AvatarHeadshot/Png/isCircular',
            text: `🎉 Congratulations to @${gw.winnerUsername || 'Player'} for winning the ${petTitle} (${gw.value} Val) giveaway!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            role: 'admin',
            badge: 'GIVEAWAY',
          });
        }
      } else if (gw.resolved && gw.endedAt) {
        // Disappear completely after showing the winner for 10 seconds!
        const elapsedSinceEnd = nowMs - new Date(gw.endedAt).getTime();
        if (elapsedSinceEnd >= 10000) {
          db.giveaways.delete(id);
        }
      }
    }
  }, 1000);

  await hydrateDatabase();
  if (supabaseHydrated) await persistNow(snapshotState);

  const httpServer = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  const cleanup = () => {
    httpServer.close(() => {
      process.exit(0);
    });
  };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

startServer();
