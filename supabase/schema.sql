-- ============================================================
-- Precrop Markets — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── Profiles (extends auth.users) ───────────────────────────
create table if not exists public.profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  role          text check (role in ('farmer', 'buyer')) not null default 'buyer',
  full_name     text,
  email         text,
  phone         text,
  wallet_address text,
  onboarded     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── Farms (one per farmer) ───────────────────────────────────
create table if not exists public.farms (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references public.profiles(id) on delete cascade unique not null,
  farm_name        text not null,
  contact_name     text,
  region           text,
  state            text,
  country          text not null default 'USA',
  email            text,
  phone            text,
  bio              text,
  reputation_score numeric not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ── Buyer Profiles ───────────────────────────────────────────
create table if not exists public.buyer_profiles (
  id           uuid references public.profiles(id) on delete cascade primary key,
  company_name text,
  buyer_type   text, -- 'restaurant', 'distributor', 'retailer', 'individual'
  address      text,
  city         text,
  state        text,
  country      text not null default 'USA',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── Contracts (mirrors on-chain + metadata) ──────────────────
create table if not exists public.contracts (
  id                  text primary key,
  token_id            integer unique,
  farm_id             uuid references public.farms(id) on delete set null,
  crop_name           text not null,
  crop_category       text,
  description         text,
  grading_standard    text,
  quality_standards   jsonb,
  quantity_units      numeric,
  unit_type           text,
  unit_size_lbs       numeric,
  price_per_unit_usdc numeric,
  total_value_usdc    numeric,
  harvest_date        date,
  delivery_date       date,
  delivery_method     text,
  delivery_location   text,
  dockage             text,
  notes               text,
  status              text check (status in ('available', 'sold', 'redeemable', 'redeemed')) not null default 'available',
  placeholder_gradient text,
  contract_address    text,
  image_url           text,
  minted_at           timestamptz default now(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ── Purchases ────────────────────────────────────────────────
create table if not exists public.purchases (
  id               uuid primary key default gen_random_uuid(),
  contract_id      text references public.contracts(id) on delete restrict not null,
  buyer_id         uuid references public.profiles(id) on delete restrict not null,
  purchased_at     timestamptz not null default now(),
  paid_usdc        numeric not null,
  tx_hash          text,
  delivery_address text,
  redeemed_at      timestamptz,
  redeem_tx_hash   text,
  created_at       timestamptz not null default now()
);

-- ── Row Level Security ───────────────────────────────────────
alter table public.profiles      enable row level security;
alter table public.farms         enable row level security;
alter table public.buyer_profiles enable row level security;
alter table public.contracts     enable row level security;
alter table public.purchases     enable row level security;

-- Profiles
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Farms: public read, owner write
create policy "Anyone can view farms"
  on public.farms for select using (true);
create policy "Farmers can manage own farm"
  on public.farms for all using (user_id = auth.uid());

-- Buyer profiles: private
create policy "Buyers can manage own profile"
  on public.buyer_profiles for all using (id = auth.uid());

-- Contracts: public read, farm owner write
create policy "Anyone can view contracts"
  on public.contracts for select using (true);
create policy "Farmers can manage own contracts"
  on public.contracts for all using (
    farm_id in (select id from public.farms where user_id = auth.uid())
  );

-- Purchases: buyer sees own; farmer sees purchases on their contracts
create policy "Buyers can view own purchases"
  on public.purchases for select using (buyer_id = auth.uid());
create policy "Buyers can insert own purchases"
  on public.purchases for insert with check (buyer_id = auth.uid());
create policy "Buyers can update own purchases"
  on public.purchases for update using (buyer_id = auth.uid());
create policy "Farmers can view purchases of their contracts"
  on public.purchases for select using (
    contract_id in (
      select c.id from public.contracts c
      join public.farms f on c.farm_id = f.id
      where f.user_id = auth.uid()
    )
  );

-- ── Auto-create profile on signup ────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Updated_at trigger ───────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger set_farms_updated_at
  before update on public.farms
  for each row execute procedure public.set_updated_at();

create trigger set_contracts_updated_at
  before update on public.contracts
  for each row execute procedure public.set_updated_at();

create trigger set_buyer_profiles_updated_at
  before update on public.buyer_profiles
  for each row execute procedure public.set_updated_at();
