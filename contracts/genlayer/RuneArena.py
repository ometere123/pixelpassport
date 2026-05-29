# v0.2.17
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json


CONTRACT_NAME = "PixelPassport RuneArena"
CONTRACT_VERSION = "1.0.1"


VALID_ACTIONS = [
    "strike",
    "guard",
    "focus",
    "rune_cast",
    "item_action",
]


OPPONENT_TEMPLATES = [
    {
        "name": "Iron Shade",
        "hp": 80,
        "attack": 15,
        "defense": 8,
        "rarity": "common",
        "lore": "A shadow forged in the arena's oldest matches.",
    },
    {
        "name": "Rune Wraith",
        "hp": 100,
        "attack": 20,
        "defense": 12,
        "rarity": "uncommon",
        "lore": "An ancient combatant bound to rune-stone forever.",
    },
    {
        "name": "Ember Colossus",
        "hp": 140,
        "attack": 25,
        "defense": 18,
        "rarity": "rare",
        "lore": "Born from fire runes and arena legend.",
    },
]


class RuneArena(gl.Contract):
    battles: TreeMap[str, str]
    player_battles: TreeMap[str, str]
    arena_stats: TreeMap[str, str]

    battle_count: u256

    def __init__(self) -> None:
        self.battles = TreeMap()
        self.player_battles = TreeMap()
        self.arena_stats = TreeMap()
        self.battle_count = u256(0)

    # -------------------------------------------------------------------------
    # Internal helpers
    # -------------------------------------------------------------------------

    def _now(self) -> str:
        try:
            return str(gl.message.timestamp)
        except Exception:
            return "0"

    def _safe_json_object(self, raw: str):
        try:
            data = json.loads(raw)
            if isinstance(data, dict):
                return data
            return {}
        except Exception:
            return {}

    def _safe_json_array(self, raw: str):
        try:
            data = json.loads(raw)
            if isinstance(data, list):
                return data
            return []
        except Exception:
            return []

    def _array_get(self, store: TreeMap[str, str], key: str):
        if key not in store:
            return []

        try:
            data = json.loads(store[key])
            if isinstance(data, list):
                return data
            return []
        except Exception:
            return []

    def _array_set(self, store: TreeMap[str, str], key: str, value) -> None:
        store[key] = json.dumps(value)

    def _safe_int(self, value, fallback: int) -> int:
        try:
            return int(value)
        except Exception:
            return fallback

    def _clamp_int(self, value: int, minimum: int, maximum: int) -> int:
        if value < minimum:
            return minimum
        if value > maximum:
            return maximum
        return value

    def _add_unique_to_array_store(
        self,
        store: TreeMap[str, str],
        key: str,
        value: str,
    ) -> None:
        arr = self._array_get(store, key)

        exists = False
        for item in arr:
            if str(item) == value:
                exists = True

        if not exists:
            arr.append(value)

        self._array_set(store, key, arr)

    def _is_valid_action(self, action: str) -> bool:
        for valid_action in VALID_ACTIONS:
            if action == valid_action:
                return True
        return False

    def _default_stats(self):
        return {
            "wins": 0,
            "losses": 0,
            "total_battles": 0,
            "total_xp": 0,
        }

    def _get_stats(self, passport_id: str):
        if passport_id not in self.arena_stats:
            return self._default_stats()

        try:
            data = json.loads(self.arena_stats[passport_id])
            if isinstance(data, dict):
                return data
            return self._default_stats()
        except Exception:
            return self._default_stats()

    # -------------------------------------------------------------------------
    # Write functions
    # -------------------------------------------------------------------------

    @gl.public.write
    def create_battle(
        self,
        battle_id: str,
        passport_id: str,
        loadout_json: str,
    ) -> str:
        if battle_id == "":
            return json.dumps({"error": "battle_id required"})

        if passport_id == "":
            return json.dumps({"error": "passport_id required"})

        if battle_id in self.battles:
            return json.dumps({"error": "battle_id already exists"})

        loadout = self._safe_json_array(loadout_json)

        if len(loadout) == 0:
            return json.dumps({"error": "loadout must be a non-empty list"})

        if len(loadout) > 5:
            return json.dumps({"error": "loadout max 5 items"})

        clean_loadout = []

        for item in loadout:
            clean_loadout.append(str(item))

        opponent_idx = int(self.battle_count) % len(OPPONENT_TEMPLATES)
        template = OPPONENT_TEMPLATES[opponent_idx]

        opponent = {
            "name": template["name"],
            "hp": template["hp"],
            "max_hp": template["hp"],
            "attack": template["attack"],
            "defense": template["defense"],
            "rarity": template["rarity"],
            "lore": template["lore"],
        }

        battle = {
            "id": battle_id,
            "passport_id": passport_id,
            "loadout": clean_loadout,
            "status": "pending",
            "player_hp": 100,
            "player_max_hp": 100,
            "opponent": opponent,
            "turns": [],
            "winner": "",
            "reward_item_id": "",
            "reward_data": {},
            "xp_earned": 0,
            "narration": [],
            "stats_recorded": False,
            "created_at": self._now(),
            "started_at": "",
            "finished_at": "",
        }

        self.battles[battle_id] = json.dumps(battle)

        self._add_unique_to_array_store(
            self.player_battles,
            passport_id,
            battle_id,
        )

        self.battle_count = self.battle_count + u256(1)

        return json.dumps({
            "ok": True,
            "battle_id": battle_id,
            "passport_id": passport_id,
            "opponent": opponent,
        })

    @gl.public.write
    def start_battle(self, battle_id: str) -> str:
        if battle_id not in self.battles:
            return json.dumps({"error": "battle not found"})

        battle = json.loads(self.battles[battle_id])

        if battle.get("status") != "pending":
            return json.dumps({"error": "battle already started"})

        battle["status"] = "active"
        battle["started_at"] = self._now()

        loadout = battle.get("loadout", [])
        if not isinstance(loadout, list):
            loadout = []

        narration = (
            "The arena trembles. "
            + str(battle["opponent"]["name"])
            + " enters the field. Your loadout: "
            + ", ".join(loadout)
            + ". Let the runes decide your fate."
        )

        narration_list = battle.get("narration", [])
        if not isinstance(narration_list, list):
            narration_list = []

        narration_list.append(narration)
        battle["narration"] = narration_list

        self.battles[battle_id] = json.dumps(battle)

        return json.dumps({
            "ok": True,
            "battle_id": battle_id,
            "narration": narration,
        })

    @gl.public.write
    def submit_action(self, battle_id: str, action_json: str) -> str:
        if battle_id not in self.battles:
            return json.dumps({"error": "battle not found"})

        battle = json.loads(self.battles[battle_id])

        if battle.get("status") != "active":
            return json.dumps({"error": "battle not active"})

        action_data = self._safe_json_object(action_json)
        action = str(action_data.get("action", ""))

        if not self._is_valid_action(action):
            return json.dumps({
                "error": "invalid action",
                "valid_actions": VALID_ACTIONS,
            })

        turns = battle.get("turns", [])
        if not isinstance(turns, list):
            turns = []

        if len(turns) > 0:
            last = turns[-1]
            if isinstance(last, dict) and "result" not in last:
                return json.dumps({
                    "error": "previous turn must be resolved first",
                    "pending_turn": last.get("turn", len(turns)),
                })

        turn = {
            "turn": len(turns) + 1,
            "action": action,
            "item_used": str(action_data.get("item_id", "")),
            "submitted_at": self._now(),
        }

        turns.append(turn)
        battle["turns"] = turns

        self.battles[battle_id] = json.dumps(battle)

        return json.dumps({
            "ok": True,
            "battle_id": battle_id,
            "turn": turn["turn"],
            "action": action,
        })

    @gl.public.write
    def resolve_turn(self, battle_id: str) -> str:
        if battle_id not in self.battles:
            return json.dumps({"error": "battle not found"})

        battle = json.loads(self.battles[battle_id])

        if battle.get("status") != "active":
            return json.dumps({"error": "battle not active"})

        turns = battle.get("turns", [])

        if not isinstance(turns, list) or len(turns) == 0:
            return json.dumps({"error": "no action submitted"})

        last_turn = turns[-1]

        if "result" in last_turn:
            return json.dumps({"error": "turn already resolved"})

        opponent = battle.get("opponent", {})
        loadout = battle.get("loadout", [])

        if not isinstance(loadout, list):
            loadout = []

        prompt = """
You are the battle adjudicator for RuneArena in the PixelPassport protocol.

Battle state:
""" + json.dumps(battle) + """

Last player turn:
""" + json.dumps(last_turn) + """

Rules:
- strike: deals 15-25 damage, opponent deals 8-15 damage back.
- guard: reduces opponent damage heavily, player deals small damage.
- focus: prepares rune energy and deals small damage, opponent deals reduced damage.
- rune_cast: deals 20-35 magical damage, but can miss or backfire lightly.
- item_action: effect depends on item, but translated combat items may add bonus damage.
- Damage values must be fair and bounded.
- Narration should be vivid fantasy prose in 2-3 sentences.
- Return only valid JSON.

Required JSON:
{
  "player_damage_dealt": 20,
  "player_damage_taken": 10,
  "narration": "string",
  "special_effect": "string"
}
"""

        raw = gl.eq_principle.prompt_non_comparative(prompt)

        try:
            result = json.loads(raw)
            if not isinstance(result, dict):
                result = {}
        except Exception:
            result = {}

        if len(result) == 0:
            action = str(last_turn.get("action", ""))

            dealt = 15
            taken = 10
            special = ""

            if action == "strike":
                dealt = 20
                taken = 12
                special = "clean_hit"
            elif action == "guard":
                dealt = 5
                taken = 5
                special = "guarded"
            elif action == "focus":
                dealt = 10
                taken = 6
                special = "rune_focus"
            elif action == "rune_cast":
                dealt = 28
                taken = 4
                special = "rune_burst"
            elif action == "item_action":
                dealt = 25
                taken = 10
                special = "item_resonance"

            result = {
                "player_damage_dealt": dealt,
                "player_damage_taken": taken,
                "narration": "You execute " + action + ". Runes spark across the arena as both fighters stagger under the force of the exchange.",
                "special_effect": special,
            }

        dealt = self._safe_int(result.get("player_damage_dealt", 0), 0)
        taken = self._safe_int(result.get("player_damage_taken", 0), 0)

        dealt = self._clamp_int(dealt, 0, 60)
        taken = self._clamp_int(taken, 0, 40)

        result["player_damage_dealt"] = dealt
        result["player_damage_taken"] = taken
        result["narration"] = str(result.get("narration", "The arena shakes as the turn resolves."))
        result["special_effect"] = str(result.get("special_effect", ""))

        player_hp = self._safe_int(battle.get("player_hp", 100), 100)
        opponent_hp = self._safe_int(opponent.get("hp", 0), 0)

        player_hp = self._clamp_int(player_hp - taken, 0, 100)
        opponent_hp = self._clamp_int(opponent_hp - dealt, 0, self._safe_int(opponent.get("max_hp", 200), 200))

        battle["player_hp"] = player_hp
        opponent["hp"] = opponent_hp
        battle["opponent"] = opponent

        last_turn["result"] = result
        last_turn["resolved_at"] = self._now()
        turns[-1] = last_turn
        battle["turns"] = turns

        narration_list = battle.get("narration", [])
        if not isinstance(narration_list, list):
            narration_list = []

        narration_list.append(result["narration"])
        battle["narration"] = narration_list

        if player_hp == 0:
            battle["status"] = "finished"
            battle["winner"] = "opponent"
            battle["finished_at"] = self._now()

        elif opponent_hp == 0:
            battle["status"] = "finished"
            battle["winner"] = "player"
            battle["finished_at"] = self._now()
            battle["xp_earned"] = 250 + (self._safe_int(last_turn.get("turn", 1), 1) * 10)

        self.battles[battle_id] = json.dumps(battle)

        return json.dumps({
            "ok": True,
            "battle_id": battle_id,
            "result": result,
            "battle": battle,
        })

    @gl.public.write
    def finish_battle(self, battle_id: str) -> str:
        if battle_id not in self.battles:
            return json.dumps({"error": "battle not found"})

        battle = json.loads(self.battles[battle_id])

        status = str(battle.get("status", ""))

        if status not in ["active", "finished"]:
            return json.dumps({"error": "cannot finish this battle"})

        turns = battle.get("turns", [])
        if not isinstance(turns, list):
            turns = []

        if status == "active":
            if len(turns) < 10:
                return json.dumps({
                    "error": "battle still active",
                    "turns_required_to_force_finish": 10,
                    "current_turns": len(turns),
                })

            player_hp = self._safe_int(battle.get("player_hp", 0), 0)
            opponent = battle.get("opponent", {})
            opponent_hp = self._safe_int(opponent.get("hp", 0), 0)

            if player_hp > opponent_hp:
                battle["winner"] = "player"
                battle["xp_earned"] = 150
            else:
                battle["winner"] = "opponent"
                battle["xp_earned"] = 0

            battle["status"] = "finished"
            battle["finished_at"] = self._now()

        if bool(battle.get("stats_recorded", False)):
            self.battles[battle_id] = json.dumps(battle)
            return json.dumps({
                "ok": True,
                "battle_id": battle_id,
                "winner": battle.get("winner", ""),
                "xp_earned": battle.get("xp_earned", 0),
                "stats_recorded": True,
            })

        passport_id = str(battle.get("passport_id", ""))
        stats = self._get_stats(passport_id)

        stats["total_battles"] = self._safe_int(stats.get("total_battles", 0), 0) + 1

        if battle.get("winner", "") == "player":
            stats["wins"] = self._safe_int(stats.get("wins", 0), 0) + 1
        else:
            stats["losses"] = self._safe_int(stats.get("losses", 0), 0) + 1

        stats["total_xp"] = self._safe_int(stats.get("total_xp", 0), 0) + self._safe_int(
            battle.get("xp_earned", 0),
            0,
        )

        battle["stats_recorded"] = True

        self.arena_stats[passport_id] = json.dumps(stats)
        self.battles[battle_id] = json.dumps(battle)

        return json.dumps({
            "ok": True,
            "battle_id": battle_id,
            "winner": battle.get("winner", ""),
            "xp_earned": battle.get("xp_earned", 0),
            "stats": stats,
        })

    @gl.public.write
    def claim_battle_reward(self, battle_id: str) -> str:
        if battle_id not in self.battles:
            return json.dumps({"error": "battle not found"})

        battle = json.loads(self.battles[battle_id])

        if battle.get("status") != "finished":
            return json.dumps({"error": "battle not finished"})

        if battle.get("winner", "") != "player":
            return json.dumps({"error": "only winner can claim reward"})

        if battle.get("reward_item_id", "") != "":
            return json.dumps({"error": "reward already claimed"})

        prompt = """
A player just won a RuneArena battle.

Battle:
""" + json.dumps(battle) + """

Generate a reward weapon or combat relic appropriate to this victory.

Rules:
- class must be weapon or combat_relic.
- rarity must be common, uncommon, or rare.
- power_level must be between 10 and 60.
- traits must be a list of short strings.
- lore should be 1-2 sentences.
- Return only valid JSON.

Required JSON:
{
  "name": "string",
  "class": "weapon",
  "rarity": "uncommon",
  "power_level": 35,
  "traits": ["fire_affinity", "combat_heat"],
  "lore": "string"
}
"""

        raw = gl.eq_principle.prompt_non_comparative(prompt)

        try:
            reward_data = json.loads(raw)
            if not isinstance(reward_data, dict):
                reward_data = {}
        except Exception:
            reward_data = {}

        if len(reward_data) == 0:
            opponent = battle.get("opponent", {})
            reward_data = {
                "name": "Ember Blade",
                "class": "weapon",
                "rarity": "uncommon",
                "power_level": 35,
                "traits": [
                    "fire_affinity",
                    "cutting_edge",
                    "combat_heat",
                ],
                "lore": "Forged in the heat of victory over " + str(opponent.get("name", "the arena foe")) + ".",
            }

        reward_class = str(reward_data.get("class", "weapon"))
        if reward_class not in ["weapon", "combat_relic"]:
            reward_class = "weapon"

        rarity = str(reward_data.get("rarity", "common"))
        if rarity not in ["common", "uncommon", "rare"]:
            rarity = "common"

        power_level = self._safe_int(reward_data.get("power_level", 10), 10)
        power_level = self._clamp_int(power_level, 10, 60)

        traits = reward_data.get("traits", [])
        if not isinstance(traits, list):
            traits = []

        reward_data["name"] = str(reward_data.get("name", "Arena Relic"))
        reward_data["class"] = reward_class
        reward_data["rarity"] = rarity
        reward_data["power_level"] = power_level
        reward_data["traits"] = traits
        reward_data["lore"] = str(reward_data.get("lore", "A relic earned in RuneArena."))

        reward_item_id = "item_" + battle_id + "_reward"

        battle["reward_item_id"] = reward_item_id
        battle["reward_data"] = reward_data

        self.battles[battle_id] = json.dumps(battle)

        return json.dumps({
            "ok": True,
            "battle_id": battle_id,
            "item_id": reward_item_id,
            "item": reward_data,
        })

    # -------------------------------------------------------------------------
    # View functions
    # -------------------------------------------------------------------------

    @gl.public.view
    def contract_name(self) -> str:
        return CONTRACT_NAME

    @gl.public.view
    def contract_version(self) -> str:
        return CONTRACT_VERSION

    @gl.public.view
    def get_total_battles(self) -> str:
        return str(self.battle_count)

    @gl.public.view
    def get_valid_actions(self) -> str:
        return json.dumps(VALID_ACTIONS)

    @gl.public.view
    def get_opponent_templates(self) -> str:
        return json.dumps(OPPONENT_TEMPLATES)

    @gl.public.view
    def get_battle(self, battle_id: str) -> str:
        if battle_id not in self.battles:
            return json.dumps({"error": "not found"})

        return self.battles[battle_id]

    @gl.public.view
    def get_player_battle_ids(self, passport_id: str) -> str:
        return json.dumps(self._array_get(self.player_battles, passport_id))

    @gl.public.view
    def get_player_battles(self, passport_id: str) -> str:
        battle_ids = self._array_get(self.player_battles, passport_id)
        result = []

        for battle_id in battle_ids:
            if battle_id in self.battles:
                result.append(json.loads(self.battles[battle_id]))

        return json.dumps(result)

    @gl.public.view
    def get_arena_stats(self, passport_id: str) -> str:
        return json.dumps(self._get_stats(passport_id))