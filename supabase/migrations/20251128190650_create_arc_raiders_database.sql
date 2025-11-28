/*
  # ARC Raiders Companion Database Schema

  ## Overview
  Complete database structure for ARC Raiders companion app with all game elements,
  user tracking, community features, and marketplace functionality.

  ## New Tables

  ### Core Game Data
  - `weapons` - Weapon database with stats, damage, DPS, rarity
  - `armor` - Armor pieces with defense stats and perks
  - `items` - General items, resources, and consumables
  - `enemies` - ARC enemies with health, damage, locations
  - `maps` - Game maps with regions and points of interest
  - `quests` - Quest database with requirements and rewards
  - `perks` - Available perks and modifiers
  - `rarities` - Rarity tiers with colors and drop rates

  ### User Tracking
  - `user_profiles` - Extended user profiles
  - `user_weapons` - Tracked weapons owned by users
  - `user_quests` - Quest completion tracking
  - `user_recipes` - Crafting recipes unlocked
  - `user_builds` - User-created builds

  ### Community Features
  - `marketplace_listings` - Item market prices and trends
  - `community_guides` - User-submitted guides and builds
  - `comments` - Comments on guides and items
  - `votes` - Voting system for community content

  ## Security
  - RLS enabled on all tables
  - Authenticated users can read public data
  - Users can only modify their own tracked data
  - Community contributions tied to user accounts
*/

-- Rarities table
CREATE TABLE IF NOT EXISTS rarities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color text NOT NULL,
  tier integer NOT NULL,
  drop_rate numeric(5,2),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rarities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view rarities"
  ON rarities FOR SELECT
  TO authenticated
  USING (true);

-- Weapons table
CREATE TABLE IF NOT EXISTS weapons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  rarity_id uuid REFERENCES rarities(id),
  damage numeric(10,2) NOT NULL DEFAULT 0,
  dps numeric(10,2) NOT NULL DEFAULT 0,
  fire_rate numeric(10,2),
  magazine_size integer,
  reload_speed numeric(10,2),
  range numeric(10,2),
  accuracy numeric(5,2),
  description text,
  lore text,
  obtain_method text,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE weapons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view weapons"
  ON weapons FOR SELECT
  TO authenticated
  USING (true);

-- Armor table
CREATE TABLE IF NOT EXISTS armor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slot text NOT NULL,
  rarity_id uuid REFERENCES rarities(id),
  defense numeric(10,2) NOT NULL DEFAULT 0,
  durability integer,
  weight numeric(10,2),
  description text,
  obtain_method text,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE armor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view armor"
  ON armor FOR SELECT
  TO authenticated
  USING (true);

-- Items table
CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  rarity_id uuid REFERENCES rarities(id),
  stack_size integer DEFAULT 1,
  weight numeric(10,2),
  value integer,
  description text,
  obtain_method text,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view items"
  ON items FOR SELECT
  TO authenticated
  USING (true);

-- Maps table
CREATE TABLE IF NOT EXISTS maps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  region text,
  level_range text,
  description text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view maps"
  ON maps FOR SELECT
  TO authenticated
  USING (true);

-- Enemies table
CREATE TABLE IF NOT EXISTS enemies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  health numeric(10,2) NOT NULL DEFAULT 0,
  armor numeric(10,2) DEFAULT 0,
  damage numeric(10,2) NOT NULL DEFAULT 0,
  level integer,
  description text,
  weaknesses text[],
  loot_table jsonb,
  image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE enemies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view enemies"
  ON enemies FOR SELECT
  TO authenticated
  USING (true);

-- Enemy spawn locations
CREATE TABLE IF NOT EXISTS enemy_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enemy_id uuid REFERENCES enemies(id) ON DELETE CASCADE,
  map_id uuid REFERENCES maps(id) ON DELETE CASCADE,
  spawn_rate text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE enemy_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view enemy locations"
  ON enemy_locations FOR SELECT
  TO authenticated
  USING (true);

-- Quests table
CREATE TABLE IF NOT EXISTS quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  level integer,
  description text,
  objectives jsonb,
  rewards jsonb,
  location text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view quests"
  ON quests FOR SELECT
  TO authenticated
  USING (true);

-- Perks table
CREATE TABLE IF NOT EXISTS perks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  description text,
  effect jsonb,
  unlock_requirement text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE perks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view perks"
  ON perks FOR SELECT
  TO authenticated
  USING (true);

-- User profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  avatar_url text,
  level integer DEFAULT 1,
  experience integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- User weapons tracking
CREATE TABLE IF NOT EXISTS user_weapons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  weapon_id uuid REFERENCES weapons(id) ON DELETE CASCADE,
  obtained_at timestamptz DEFAULT now(),
  favorite boolean DEFAULT false,
  UNIQUE(user_id, weapon_id)
);

ALTER TABLE user_weapons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weapons"
  ON user_weapons FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weapons"
  ON user_weapons FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weapons"
  ON user_weapons FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own weapons"
  ON user_weapons FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- User quests tracking
CREATE TABLE IF NOT EXISTS user_quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id uuid REFERENCES quests(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'in_progress',
  progress jsonb DEFAULT '{}',
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, quest_id)
);

ALTER TABLE user_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quests"
  ON user_quests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quests"
  ON user_quests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quests"
  ON user_quests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User recipes/crafting
CREATE TABLE IF NOT EXISTS user_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_name text NOT NULL,
  recipe_data jsonb,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(user_id, recipe_name)
);

ALTER TABLE user_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recipes"
  ON user_recipes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recipes"
  ON user_recipes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Marketplace listings
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type text NOT NULL,
  item_id uuid NOT NULL,
  item_name text NOT NULL,
  current_price integer NOT NULL DEFAULT 0,
  price_history jsonb DEFAULT '[]',
  volume_24h integer DEFAULT 0,
  trend text DEFAULT 'stable',
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view marketplace"
  ON marketplace_listings FOR SELECT
  TO authenticated
  USING (true);

-- Community guides
CREATE TABLE IF NOT EXISTS community_guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL,
  tags text[] DEFAULT '{}',
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  views integer DEFAULT 0,
  published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE community_guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published guides"
  ON community_guides FOR SELECT
  TO authenticated
  USING (published = true OR auth.uid() = author_id);

CREATE POLICY "Users can insert own guides"
  ON community_guides FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own guides"
  ON community_guides FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete own guides"
  ON community_guides FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  guide_id uuid REFERENCES community_guides(id) ON DELETE CASCADE,
  content text NOT NULL,
  upvotes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Votes
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  vote_type text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, target_type, target_id)
);

ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all votes"
  ON votes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own votes"
  ON votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes"
  ON votes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes"
  ON votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert initial rarities
INSERT INTO rarities (name, color, tier, drop_rate) VALUES
  ('Common', '#9CA3AF', 1, 50.00),
  ('Uncommon', '#22C55E', 2, 30.00),
  ('Rare', '#3B82F6', 3, 15.00),
  ('Epic', '#A855F7', 4, 4.00),
  ('Legendary', '#F59E0B', 5, 1.00)
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_weapons_rarity ON weapons(rarity_id);
CREATE INDEX IF NOT EXISTS idx_weapons_type ON weapons(type);
CREATE INDEX IF NOT EXISTS idx_armor_rarity ON armor(rarity_id);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_enemies_type ON enemies(type);
CREATE INDEX IF NOT EXISTS idx_user_weapons_user ON user_weapons(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_user ON user_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_community_guides_author ON community_guides(author_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_item ON marketplace_listings(item_type, item_id);