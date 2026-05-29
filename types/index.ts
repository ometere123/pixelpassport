export type GameId = "rune-arena" | "chain-farm" | "void-run";

export type ItemRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface Passport {
  id: string;
  owner: string;
  username: string;
  avatar_url: string | null;
  metadata_uri: string | null;
  ecosystem_xp: number;
  level: number;
  reputation: number;
  created_at: string;
  updated_at: string;
}

export interface GameProgress {
  passport_id: string;
  game_id: GameId;
  xp: number;
  level: number;
  wins: number;
  losses: number;
  items_earned: number;
  joined_at: string;
  last_played: string | null;
}

export interface CanonicalItem {
  id: string;
  name: string;
  class: string;
  rarity: ItemRarity;
  power_level: number;
  traits: string[];
  lore: string;
  origin_game: GameId;
  owner_passport_id: string;
  metadata_uri: string | null;
  is_translated?: boolean;
  created_at: string;
}

export interface ItemTranslation {
  id: string;
  item_id: string;
  source_game: GameId;
  target_game: GameId;
  translated_name: string;
  translated_class: string;
  translated_power_level: number;
  abilities: string[];
  visual_direction: string;
  reasoning: string;
  balance_notes: string;
  source_traits_used: string[];
  genlayer_tx_id: string | null;
  created_at: string;
}

export interface Achievement {
  id: string;
  passport_id: string;
  game_id: GameId | "ecosystem";
  name: string;
  description: string;
  icon: string;
  rarity: ItemRarity;
  unlocked_at: string;
}

export interface RuneBattle {
  id: string;
  passport_id: string;
  loadout: string[];
  status: "pending" | "active" | "finished" | "rewarded";
  turns: BattleTurn[];
  winner: "player" | "opponent" | null;
  reward_item_id: string | null;
  xp_earned: number;
  narration: string[];
  created_at: string;
  finished_at: string | null;
}

export interface BattleTurn {
  turn: number;
  action: string;
  player_hp: number;
  opponent_hp: number;
  narration: string;
}

export interface ChainFarm {
  id: string;
  passport_id: string;
  name: string;
  plots: FarmPlot[];
  resources: Record<string, number>;
  level: number;
  xp: number;
  created_at: string;
}

export interface FarmPlot {
  id: string;
  farm_id: string;
  index: number;
  status: "empty" | "planted" | "ready" | "harvested";
  crop: string | null;
  planted_at: string | null;
  ready_at: string | null;
  applied_item_id: string | null;
  yield_modifier: number;
}

export interface VoidRun {
  id: string;
  passport_id: string;
  loadout: string[];
  status: "active" | "finished" | "claimed";
  current_room: number;
  total_rooms?: number;
  rooms: VoidRoom[];
  score: number;
  reward_item_id: string | null;
  created_at: string;
  finished_at: string | null;
}

export interface VoidRoom {
  index: number;
  type: "puzzle" | "combat" | "treasure" | "portal";
  description: string;
  puzzle: string | null;
  completed: boolean;
  judgement: PuzzleJudgement | null;
}

export interface PuzzleJudgement {
  accepted: boolean;
  confidence: number;
  summary: string;
  reasoning: string;
  reward_modifier: string;
  next_room_hint: string;
}

export interface GenLayerRecord {
  id: string;
  passport_id: string | null;
  contract: string;
  action: string;
  request_payload: Record<string, unknown>;
  response_payload: Record<string, unknown>;
  tx_id: string | null;
  status: "pending" | "confirmed" | "failed";
  created_at: string;
}

export interface ActivityEntry {
  id: string;
  passport_id: string;
  game_id: GameId | "ecosystem";
  type:
    | "item_earned"
    | "item_translated"
    | "achievement_unlocked"
    | "battle_won"
    | "crop_harvested"
    | "puzzle_solved"
    | "passport_created"
    | "xp_gained";
  title: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Dispute {
  id: string;
  item_id: string;
  translation_id: string;
  challenger_passport_id: string;
  reason: string;
  status: "open" | "resolved" | "rejected";
  resolution: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface GovernanceProposal {
  id: string;
  proposer_passport_id: string;
  type: "add_game" | "item_class" | "translation_rule" | "balance_update";
  title: string;
  description: string;
  payload: Record<string, unknown>;
  status: "pending" | "active" | "passed" | "rejected" | "executed";
  votes_for: number;
  votes_against: number;
  created_at: string;
  executed_at: string | null;
}

export interface Game {
  id: GameId;
  name: string;
  description: string;
  color: string;
  accent: string;
  icon: string;
  status: "active" | "coming_soon";
  contract_address: string | null;
  allowed_item_classes: string[];
  balance_rules: Record<string, unknown>;
}

export interface LeaderboardEntry {
  rank: number;
  passport_id: string;
  username: string;
  avatar_url: string | null;
  score: number;
  game_id: GameId | "ecosystem";
}

export interface TranslationRequest {
  item_id: string;
  target_game: GameId;
  target_context: Record<string, unknown>;
}

export interface TranslationResult {
  translated_name: string;
  translated_class: string;
  translated_power_level: number;
  abilities: string[];
  visual_direction: string;
  reasoning: string;
  balance_notes: string;
  source_traits_used: string[];
}
