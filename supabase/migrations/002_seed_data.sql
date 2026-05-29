-- Seed Data for PixelPassport

-- Games
INSERT INTO games (id, name, description, long_description, color, accent, icon, status, allowed_item_classes, balance_rules)
VALUES
  (
    'rune-arena',
    'RuneArena',
    'A tactical combat arena powered by ancient runes and GenLayer AI adjudication.',
    'Enter the arena. Forge your loadout from runes and relics earned across the ecosystem. Each battle is adjudicated by GenLayer AI, ensuring fair and dynamic combat resolution. Win to earn legendary weapons and combat relics.',
    '#F97373',
    '#6B7280',
    '⚔️',
    'active',
    ARRAY['weapon','armor','rune','combat_relic','translated_relic'],
    '{"damage_cap": 50, "magic_resistance_cap": 80, "combo_limit": 3, "max_loadout_size": 5}'::jsonb
  ),
  (
    'chain-farm',
    'ChainFarm',
    'A blockchain farming economy where translated tools unlock powerful crop yields.',
    'Cultivate your plot on the blockchain plains. Plant mystical crops, use translated tools from other worlds, and let GenLayer evaluate your farming strategy. Cross-game items take new life here — a battle sword becomes a plough, a rune becomes a seed blessing.',
    '#65D46E',
    '#F6C85F',
    '🌾',
    'active',
    ARRAY['tool','seed','fertilizer','harvest_relic','translated_tool'],
    '{"yield_boost_cap": 3.0, "growth_speed_cap": 2.0, "plot_limit": 8, "max_active_items": 3}'::jsonb
  ),
  (
    'void-run',
    'VoidRun',
    'A puzzle-survival experience in the shifting void dimension, judged by GenLayer AI.',
    'Step into the Void. Rooms shift and puzzle logic bends. Submit your answers and let GenLayer reason about their validity with nuance and creativity. Translated relics grant strange abilities in this liminal space.',
    '#8B5CF6',
    '#38D9F8',
    '🌀',
    'active',
    ARRAY['relic','puzzle_tool','void_artifact','navigator','translated_relic'],
    '{"puzzle_hint_limit": 2, "damage_resistance_cap": 60, "room_skip_limit": 1, "max_rooms": 7}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- Sample achievements
DO $$
DECLARE
  sample_passport_id TEXT := 'passport_sample_001';
BEGIN
  -- Only insert if sample passport exists (won't run in fresh DB)
  NULL;
END $$;

-- Starter achievement definitions (stored as template in a separate table concept)
-- In production, these are awarded through PassportRegistry and synced here
