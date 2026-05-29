-- PixelPassport Initial Schema Migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (linked to wallet auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  wallet TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Passports table (canonical identity, mirrored from GenLayer)
CREATE TABLE IF NOT EXISTS passports (
  id TEXT PRIMARY KEY,
  owner TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  metadata_uri TEXT,
  ecosystem_xp BIGINT DEFAULT 0,
  level INTEGER DEFAULT 1,
  reputation INTEGER DEFAULT 100,
  genlayer_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Games registry
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT,
  color TEXT DEFAULT '#F6C85F',
  accent TEXT DEFAULT '#38D9F8',
  icon TEXT,
  status TEXT DEFAULT 'active',
  contract_address TEXT,
  allowed_item_classes TEXT[] DEFAULT '{}',
  balance_rules JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Passport game progress
CREATE TABLE IF NOT EXISTS passport_game_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  passport_id TEXT NOT NULL REFERENCES passports(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL REFERENCES games(id),
  xp BIGINT DEFAULT 0,
  level INTEGER DEFAULT 1,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  items_earned INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_played TIMESTAMPTZ,
  UNIQUE(passport_id, game_id)
);

-- Items (canonical items, mirrored from GenLayer)
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'common',
  power_level INTEGER DEFAULT 1,
  traits TEXT[] DEFAULT '{}',
  lore TEXT,
  origin_game TEXT NOT NULL,
  owner_passport_id TEXT NOT NULL REFERENCES passports(id),
  metadata_uri TEXT,
  is_translated BOOLEAN DEFAULT FALSE,
  genlayer_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Item translations (GenLayer-generated)
CREATE TABLE IF NOT EXISTS item_translations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  source_game TEXT NOT NULL,
  target_game TEXT NOT NULL,
  translated_name TEXT NOT NULL,
  translated_class TEXT NOT NULL,
  translated_power_level INTEGER DEFAULT 1,
  abilities TEXT[] DEFAULT '{}',
  visual_direction TEXT,
  reasoning TEXT,
  balance_notes TEXT,
  source_traits_used TEXT[] DEFAULT '{}',
  genlayer_tx_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(item_id, target_game)
);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  passport_id TEXT NOT NULL REFERENCES passports(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🏆',
  rarity TEXT DEFAULT 'common',
  genlayer_tx_id TEXT,
  unlocked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game sessions (generic session tracking)
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  passport_id TEXT NOT NULL REFERENCES passports(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  session_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- RuneArena battles
CREATE TABLE IF NOT EXISTS rune_battles (
  id TEXT PRIMARY KEY,
  passport_id TEXT NOT NULL REFERENCES passports(id) ON DELETE CASCADE,
  loadout TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  turns JSONB DEFAULT '[]',
  winner TEXT,
  reward_item_id TEXT,
  xp_earned INTEGER DEFAULT 0,
  narration TEXT[] DEFAULT '{}',
  genlayer_tx_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

-- ChainFarm farms
CREATE TABLE IF NOT EXISTS chain_farms (
  id TEXT PRIMARY KEY,
  passport_id TEXT NOT NULL REFERENCES passports(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  resources JSONB DEFAULT '{}',
  genlayer_tx_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Farm plots
CREATE TABLE IF NOT EXISTS farm_plots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farm_id TEXT NOT NULL REFERENCES chain_farms(id) ON DELETE CASCADE,
  plot_index INTEGER NOT NULL,
  status TEXT DEFAULT 'empty',
  crop TEXT,
  planted_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  applied_item_id TEXT,
  yield_modifier DECIMAL DEFAULT 1.0,
  UNIQUE(farm_id, plot_index)
);

-- VoidRun runs
CREATE TABLE IF NOT EXISTS void_runs (
  id TEXT PRIMARY KEY,
  passport_id TEXT NOT NULL REFERENCES passports(id) ON DELETE CASCADE,
  loadout TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active',
  current_room INTEGER DEFAULT 0,
  rooms JSONB DEFAULT '[]',
  score INTEGER DEFAULT 0,
  reward_item_id TEXT,
  genlayer_tx_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

-- Disputes
CREATE TABLE IF NOT EXISTS disputes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES items(id),
  translation_id UUID REFERENCES item_translations(id),
  challenger_passport_id TEXT NOT NULL REFERENCES passports(id),
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  resolution TEXT,
  genlayer_tx_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Activity feed
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  passport_id TEXT NOT NULL REFERENCES passports(id) ON DELETE CASCADE,
  game_id TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GenLayer transaction records
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  passport_id TEXT REFERENCES passports(id),
  contract TEXT NOT NULL,
  action TEXT NOT NULL,
  request_payload JSONB DEFAULT '{}',
  response_payload JSONB DEFAULT '{}',
  tx_id TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Governance proposals
CREATE TABLE IF NOT EXISTS governance_proposals (
  id TEXT PRIMARY KEY,
  proposer_passport_id TEXT REFERENCES passports(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  payload JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  votes_for INTEGER DEFAULT 0,
  votes_against INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  executed_at TIMESTAMPTZ
);

-- Governance votes
CREATE TABLE IF NOT EXISTS governance_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  proposal_id TEXT NOT NULL REFERENCES governance_proposals(id),
  passport_id TEXT NOT NULL REFERENCES passports(id),
  support BOOLEAN NOT NULL,
  reason TEXT,
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(proposal_id, passport_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_passports_owner ON passports(owner);
CREATE INDEX IF NOT EXISTS idx_items_owner ON items(owner_passport_id);
CREATE INDEX IF NOT EXISTS idx_items_origin ON items(origin_game);
CREATE INDEX IF NOT EXISTS idx_translations_item ON item_translations(item_id);
CREATE INDEX IF NOT EXISTS idx_activity_passport ON activity_feed(passport_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_battles_passport ON rune_battles(passport_id);
CREATE INDEX IF NOT EXISTS idx_farms_passport ON chain_farms(passport_id);
CREATE INDEX IF NOT EXISTS idx_runs_passport ON void_runs(passport_id);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE passports ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rune_battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chain_farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE void_runs ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "public_read_passports" ON passports FOR SELECT USING (true);
CREATE POLICY "public_read_games" ON games FOR SELECT USING (true);
CREATE POLICY "public_read_items" ON items FOR SELECT USING (true);
CREATE POLICY "public_read_translations" ON item_translations FOR SELECT USING (true);
CREATE POLICY "public_read_achievements" ON achievements FOR SELECT USING (true);
CREATE POLICY "public_read_activity" ON activity_feed FOR SELECT USING (true);

-- Service role write policies (service role bypasses RLS by default)
