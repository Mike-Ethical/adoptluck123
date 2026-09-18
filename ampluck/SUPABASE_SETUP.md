# AmpLuck + Supabase setup

The app now uses Supabase as the server-side persistent database. The browser no longer contains a service-role key.

## Tables
- `amp_users` — verified Roblox/site users
- `amp_pets` — pet catalog and admin-edited values/status
- `amp_inventory` — user pet inventory
- `amp_matches` — coinflip matches and provably-fair data
- `amp_featured_matches` — featured match cards
- `amp_chat_messages` — chat history
- `amp_giveaways` — giveaways and winners
- `amp_audit_logs` — admin actions
- `amp_delivery_orders` — withdrawal/delivery requests
- `amp_settings` — site settings such as the Discord invite

Run `supabase-schema.sql` once in Supabase Dashboard → SQL Editor.

## Server environment
```text
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
VERIFICATION_SECRET=YOUR_VERIFICATION_SECRET
INTERNAL_ADMIN_SECRET=YOUR_INTERNAL_ADMIN_SECRET
```

Optional browser-safe variables:
```text
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY
```

Never put `SUPABASE_SERVICE_ROLE_KEY` in a `VITE_*` variable.

## Security
An earlier version contained a Supabase service-role secret in browser code. Rotate/revoke that old service-role key in Supabase and use a fresh server-only key.

## Local test
```bash
npm install
npm run dev
```
Then open `/api/health`. The server logs `[Supabase] Persistent state loaded.` when the tables and credentials are working.
