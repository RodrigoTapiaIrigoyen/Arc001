export interface Rarity {
  id: string;
  name: string;
  color: string;
  tier: number;
  drop_rate: number;
}

export interface Weapon {
  id: string;
  name: string;
  type: string;
  rarity_id: string;
  damage: number;
  dps: number;
  fire_rate?: number;
  magazine_size?: number;
  reload_speed?: number;
  range?: number;
  accuracy?: number;
  description?: string;
  lore?: string;
  obtain_method?: string;
  image_url?: string;
  rarity?: Rarity;
}

export interface Enemy {
  id: string;
  name: string;
  type: string;
  health: number;
  armor: number;
  damage: number;
  level?: number;
  description?: string;
  weaknesses?: string[];
  loot_table?: any;
  image_url?: string;
}

export interface Quest {
  id: string;
  name: string;
  type: string;
  level?: number;
  description?: string;
  objectives?: any;
  rewards?: any;
  location?: string;
}

export interface MarketplaceListing {
  id: string;
  item_type: string;
  item_id: string;
  item_name: string;
  current_price: number;
  price_history?: any[];
  volume_24h: number;
  trend: string;
  updated_at: string;
}
