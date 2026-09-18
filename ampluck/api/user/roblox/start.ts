import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'node:crypto';

const WORDS = ['adopt','coin','dragon','lucky','pet','golden','star','blue','egg','sky','fly','neon','gem','safe','moon','hero','cloud','amber','crown','frost','turtle','owl','crow','lion','panda','happy','smile','magic','spark','crystal'];

function json(res: VercelResponse, status: number, body: unknown) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8').send(JSON.stringify(body));
}

function makePhrase() {
  const shuffled = [...WORDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3).join(' ');
}

function sign(payload: string) {
  const secret = process.env.VERIFICATION_SECRET || process.env.SUPABASE_SECRET_KEY || 'change-this-secret';
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  try {
    const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    if (!username) return json(res, 400, { error: 'Please enter a valid Roblox username.' });

    const robloxResponse = await fetch('https://users.roblox.com/v1/usernames/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
    });

    const raw = await robloxResponse.text();
    let data: any = null;
    try { data = JSON.parse(raw); } catch { data = null; }

    if (!robloxResponse.ok) {
      return json(res, 502, { error: `Roblox returned HTTP ${robloxResponse.status}. Please try again.` });
    }
    if (!data?.data?.length) {
      return json(res, 404, { error: `Roblox account "${username}" was not found. Please verify the exact spelling.` });
    }

    const robloxUser = data.data[0];
    const robloxId = Number(robloxUser.id);
    const realUsername = String(robloxUser.name);
    const displayName = String(robloxUser.displayName || realUsername);

    let avatarUrl = '';
    try {
      const thumb = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxId}&size=150x150&format=Png&isCircular=true`, {
        headers: { Accept: 'application/json' },
      });
      const thumbRaw = await thumb.text();
      const thumbData = JSON.parse(thumbRaw);
      avatarUrl = thumbData?.data?.[0]?.imageUrl || '';
    } catch {}

    const phrase = makePhrase();
    const expiresAt = Date.now() + 15 * 60 * 1000;
    const payload = Buffer.from(JSON.stringify({ robloxId, realUsername, displayName, phrase, expiresAt })).toString('base64url');
    const verificationToken = `${payload}.${sign(payload)}`;

    return json(res, 200, {
      success: true,
      robloxId,
      robloxUsername: realUsername,
      displayName,
      avatarUrl,
      phrase,
      profileUrl: `https://www.roblox.com/users/${robloxId}/profile`,
      verificationToken,
      instructions: `Paste the phrase "${phrase}" into your Roblox profile About / Bio section, save it, and click Verify Bio & Log In.`,
    });
  } catch (error: any) {
    console.error('Roblox start error:', error);
    return json(res, 500, { error: 'Unable to contact Roblox right now. Please try again.' });
  }
}
