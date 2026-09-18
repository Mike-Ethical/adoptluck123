import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'node:crypto';

function json(res: VercelResponse, status: number, body: unknown) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8').send(JSON.stringify(body));
}
function sign(payload: string) {
  const secret = process.env.VERIFICATION_SECRET || process.env.SUPABASE_SECRET_KEY || 'change-this-secret';
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}
function safeEqual(a: string, b: string) {
  const aa = Buffer.from(a), bb = Buffer.from(b);
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const token = typeof body.verificationToken === 'string' ? body.verificationToken.trim() : '';
    if (!token) return json(res, 400, { error: 'Verification session missing. Please start again.' });
    const dot = token.lastIndexOf('.');
    if (dot < 1) return json(res, 400, { error: 'Invalid verification session. Please start again.' });
    const payload = token.slice(0, dot);
    const signature = token.slice(dot + 1);
    if (!safeEqual(sign(payload), signature)) return json(res, 400, { error: 'Invalid verification session. Please start again.' });

    let pending: any;
    try {
      pending = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    } catch {
      return json(res, 400, { error: 'Invalid verification session. Please start again.' });
    }

    const robloxId = Number(pending.robloxId);
    if (!Number.isSafeInteger(robloxId) || robloxId <= 0 || !pending.phrase || !pending.realUsername) {
      return json(res, 400, { error: 'Invalid verification session. Please start again.' });
    }

    if (Date.now() > Number(pending.expiresAt)) return json(res, 400, { error: 'Verification session expired. Please generate a new code.' });

    const profileRes = await fetch(`https://users.roblox.com/v1/users/${robloxId}`, {
      headers: { Accept: 'application/json' },
    });
    const raw = await profileRes.text();
    let profile: any = null;
    try { profile = JSON.parse(raw); } catch {}
    if (!profileRes.ok || !profile) return json(res, 502, { error: 'Could not fetch the Roblox profile. Please retry.' });

    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
    const bio = normalize(String(profile.description || ''));
    const phrase = normalize(String(pending.phrase));
    const words = phrase.split(' ').filter(Boolean);
    const verified = bio.includes(phrase) || words.every((w: string) => bio.includes(w));
    if (!verified) {
      return json(res, 400, {
        error: `Verification phrase "${pending.phrase}" was not detected in your Roblox About / Bio section.`,
        expectedPhrase: pending.phrase,
        currentBioSnippet: String(profile.description || '').slice(0, 80) || '(empty bio)',
        profileUrl: `https://www.roblox.com/users/${pending.robloxId}/profile`,
      });
    }


// test comment
    let avatarUrl = '';
    try {
      const thumb = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxId}&size=150x150&format=Png&isCircular=true`, { headers: { Accept: 'application/json' } });
      const td = JSON.parse(await thumb.text());
      avatarUrl = td?.data?.[0]?.imageUrl || '';
    } catch {}

    const isAdmin = String(pending.robloxId) === '3058833903' && String(pending.realUsername).toLowerCase() === 'cute240bunny';
    const user = {
      id: `roblox-${pending.robloxId}`,
      username: pending.realUsername,
      robloxUsername: pending.realUsername,
      robloxUserId: String(pending.robloxId),
      avatarUrl,
      role: isAdmin ? 'admin' : 'user',
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

    return json(res, 200, { success: true, message: `Welcome, ${user.username}! Roblox verification successful.`, user });
  } catch (error) {
    console.error('Roblox check error:', error);
    return json(res, 500, { error: 'Server error during Roblox bio verification.' });
  }
}
