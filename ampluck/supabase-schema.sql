-- AmpLuck Supabase schema
-- Run this entire file once in Supabase Dashboard -> SQL Editor.
-- The service-role key is used ONLY by the Node server. Never expose it as VITE_*.

create table if not exists public.amp_users (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.amp_pets (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.amp_inventory (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.amp_matches (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.amp_featured_matches (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.amp_chat_messages (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.amp_giveaways (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.amp_audit_logs (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.amp_delivery_orders (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.amp_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

-- Server-side persistence only. These tables are not directly exposed to the browser.
-- RLS is enabled and no public policies are created.
alter table public.amp_users enable row level security;
alter table public.amp_pets enable row level security;
alter table public.amp_inventory enable row level security;
alter table public.amp_matches enable row level security;
alter table public.amp_featured_matches enable row level security;
alter table public.amp_chat_messages enable row level security;
alter table public.amp_giveaways enable row level security;
alter table public.amp_audit_logs enable row level security;
alter table public.amp_delivery_orders enable row level security;
alter table public.amp_settings enable row level security;
