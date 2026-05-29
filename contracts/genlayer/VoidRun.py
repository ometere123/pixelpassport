# v0.2.17
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json


CONTRACT_NAME = "PixelPassport VoidRun"
CONTRACT_VERSION = "1.0.1"


ROOM_TYPES = [
    "puzzle",
    "combat",
    "treasure",
    "portal",
]


PUZZLE_TEMPLATES = [
    {
        "type": "riddle",
        "description": "A floating inscription pulses with void light.",
        "puzzle": "I have cities but no houses, mountains but no trees, water but no fish. What am I?",
        "hint": "Think of something flat that represents the world.",
        "difficulty": 1,
    },
    {
        "type": "pattern",
        "description": "Void crystals arrange in a sequence that shifts as you watch.",
        "puzzle": "Complete the sequence: 2, 6, 12, 20, 30, ?",
        "hint": "Look at the differences between consecutive numbers.",
        "difficulty": 2,
    },
    {
        "type": "logic",
        "description": "Three void entities block your path, each speaking in paradox.",
        "puzzle": "You have 3 void lanterns. Two are cursed. A cursed lantern always lies. A true lantern always tells truth. Lantern A says 'I am true.' Lantern B says 'A is cursed.' Which lantern do you trust?",
        "hint": "Consider what a cursed lantern would say about itself.",
        "difficulty": 3,
    },
    {
        "type": "creative",
        "description": "The void demands something unexpected.",
        "puzzle": "Name something that gets wetter the more it dries.",
        "hint": "Think about everyday objects and their purpose.",
        "difficulty": 1,
    },
    {
        "type": "lore",
        "description": "An ancient void archive opens before you.",
        "puzzle": "In the PixelPassport multiverse, what single object could connect all three game worlds?",
        "hint": "The answer relates to the protocol itself.",
        "difficulty": 2,
    },
]


class VoidRun(gl.Contract):
    runs: TreeMap[str, str]
    rooms: TreeMap[str, str]
    puzzle_judgements: TreeMap[str, str]
    void_rewards: TreeMap[str, str]
    player_runs: TreeMap[str, str]

    run_count: u256

    def __init__(self) -> None:
        self.runs = TreeMap()
        self.rooms = TreeMap()
        self.puzzle_judgements = TreeMap()
        self.void_rewards = TreeMap()
        self.player_runs = TreeMap()
        self.run_count = u256(0)

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

    def _room_key(self, run_id: str, room_index: int) -> str:
        return run_id + ":" + str(room_index)

    def _default_puzzle_room(self, run_id: str, room_index: int, room_type: str):
        template = PUZZLE_TEMPLATES[room_index % len(PUZZLE_TEMPLATES)]

        return {
            "index": room_index,
            "run_id": run_id,
            "completed": False,
            "judgement": {},
            "type": room_type,
            "title": "Room " + str(room_index + 1) + ": The " + room_type.title() + " Chamber",
            "description": template["description"],
            "puzzle": template["puzzle"] if room_type == "puzzle" else "",
            "puzzle_type": template["type"] if room_type == "puzzle" else "",
            "hint": template["hint"] if room_type == "puzzle" else "",
            "hint_available": True if room_type == "puzzle" else False,
            "difficulty": template["difficulty"],
            "atmosphere": "eerie",
        }

    def _reward_score_gain(self, reward_modifier: str) -> int:
        if reward_modifier == "none":
            return 0
        if reward_modifier == "small":
            return 25
        if reward_modifier == "moderate":
            return 50
        if reward_modifier == "large":
            return 100
        return 25

    # -------------------------------------------------------------------------
    # Write functions
    # -------------------------------------------------------------------------

    @gl.public.write
    def start_run(
        self,
        run_id: str,
        passport_id: str,
        loadout_json: str,
    ) -> str:
        if run_id == "":
            return json.dumps({"error": "run_id required"})

        if passport_id == "":
            return json.dumps({"error": "passport_id required"})

        if run_id in self.runs:
            return json.dumps({"error": "run_id already exists"})

        loadout = self._safe_json_array(loadout_json)

        clean_loadout = []
        for item in loadout:
            clean_loadout.append(str(item))

        if len(clean_loadout) > 5:
            return json.dumps({"error": "loadout max 5 items"})

        run = {
            "id": run_id,
            "passport_id": passport_id,
            "loadout": clean_loadout,
            "status": "active",
            "current_room": 0,
            "total_rooms": 5,
            "score": 0,
            "reward_item_id": "",
            "reward_data": {},
            "created_at": self._now(),
            "finished_at": "",
            "claimed_at": "",
        }

        self.runs[run_id] = json.dumps(run)

        self._add_unique_to_array_store(
            self.player_runs,
            passport_id,
            run_id,
        )

        self.run_count = self.run_count + u256(1)

        return json.dumps({
            "ok": True,
            "run_id": run_id,
            "passport_id": passport_id,
            "total_rooms": 5,
        })

    @gl.public.write
    def generate_room(self, run_id: str) -> str:
        if run_id not in self.runs:
            return json.dumps({"error": "run not found"})

        run = json.loads(self.runs[run_id])

        if run.get("status") != "active":
            return json.dumps({"error": "run not active"})

        room_index = self._safe_int(run.get("current_room", 0), 0)
        total_rooms = self._safe_int(run.get("total_rooms", 5), 5)

        if room_index >= total_rooms:
            return json.dumps({"error": "run has no more rooms"})

        room_key = self._room_key(run_id, room_index)

        if room_key in self.rooms:
            return self.rooms[room_key]

        if room_index >= total_rooms - 1:
            room_type = "treasure"
        else:
            room_type = ROOM_TYPES[room_index % len(ROOM_TYPES)]

        loadout = run.get("loadout", [])
        if not isinstance(loadout, list):
            loadout = []

        prompt = """
You are the void dimension's room generator for VoidRun in PixelPassport.

Context:
""" + json.dumps(run) + """

Room type:
""" + room_type + """

Generate a contextual room.

Rules:
- If puzzle room, create a unique and solvable puzzle.
- If combat room, describe a dangerous void encounter.
- If treasure room, describe what is found.
- If portal room, describe where it leads.
- For puzzle rooms, the puzzle must have a definitive or reasonably evaluable answer.
- Return only valid JSON.

Required JSON:
{
  "type": "puzzle",
  "title": "string",
  "description": "string",
  "puzzle": "string",
  "puzzle_type": "riddle",
  "hint": "string",
  "hint_available": true,
  "difficulty": 1,
  "atmosphere": "eerie"
}
"""

        raw = gl.eq_principle.prompt_non_comparative(prompt)

        try:
            room_data = json.loads(raw)
            if not isinstance(room_data, dict):
                room_data = {}
        except Exception:
            room_data = {}

        if len(room_data) == 0:
            room = self._default_puzzle_room(run_id, room_index, room_type)
        else:
            room_type_from_ai = str(room_data.get("type", room_type))
            if room_type_from_ai not in ROOM_TYPES:
                room_type_from_ai = room_type

            difficulty = self._safe_int(room_data.get("difficulty", 1), 1)
            difficulty = self._clamp_int(difficulty, 1, 5)

            hint_available = bool(room_data.get("hint_available", False))

            room = {
                "index": room_index,
                "run_id": run_id,
                "completed": False,
                "judgement": {},
                "type": room_type_from_ai,
                "title": str(room_data.get("title", "Void Room")),
                "description": str(room_data.get("description", "The void bends around you.")),
                "puzzle": str(room_data.get("puzzle", "")),
                "puzzle_type": str(room_data.get("puzzle_type", "")),
                "hint": str(room_data.get("hint", "")),
                "hint_available": hint_available,
                "difficulty": difficulty,
                "atmosphere": str(room_data.get("atmosphere", "eerie")),
            }

            if room["type"] != "puzzle":
                room["puzzle"] = ""
                room["puzzle_type"] = ""
                room["hint"] = ""
                room["hint_available"] = False

        self.rooms[room_key] = json.dumps(room)

        return json.dumps(room)

    @gl.public.write
    def submit_room_action(
        self,
        run_id: str,
        action_json: str,
    ) -> str:
        if run_id not in self.runs:
            return json.dumps({"error": "run not found"})

        run = json.loads(self.runs[run_id])

        if run.get("status") != "active":
            return json.dumps({"error": "run not active"})

        action_data = self._safe_json_object(action_json)
        action_type = str(action_data.get("type", "move"))

        room_index = self._safe_int(run.get("current_room", 0), 0)
        room_key = self._room_key(run_id, room_index)

        if room_key not in self.rooms:
            return json.dumps({"error": "room not generated yet"})

        room = json.loads(self.rooms[room_key])
        room_type = str(room.get("type", ""))

        if room.get("completed", False):
            return json.dumps({"error": "room already completed"})

        if room_type == "puzzle":
            return json.dumps({
                "ok": True,
                "requires_puzzle_answer": True,
                "action": action_type,
            })

        score_gain = 50

        if room_type == "combat":
            score_gain = 60
        elif room_type == "treasure":
            score_gain = 80
        elif room_type == "portal":
            score_gain = 40

        room["completed"] = True
        room["completed_at"] = self._now()
        room["action"] = action_data

        self.rooms[room_key] = json.dumps(room)

        run["score"] = self._safe_int(run.get("score", 0), 0) + score_gain
        run["current_room"] = room_index + 1

        if self._safe_int(run.get("current_room", 0), 0) >= self._safe_int(run.get("total_rooms", 5), 5):
            run["status"] = "finished"
            run["finished_at"] = self._now()

        self.runs[run_id] = json.dumps(run)

        return json.dumps({
            "ok": True,
            "progressed": True,
            "room_type": room_type,
            "score_gain": score_gain,
            "current_room": run["current_room"],
            "status": run["status"],
        })

    @gl.public.write
    def judge_puzzle_answer(
        self,
        run_id: str,
        answer_json: str,
    ) -> str:
        if run_id not in self.runs:
            return json.dumps({"error": "run not found"})

        run = json.loads(self.runs[run_id])

        if run.get("status") != "active":
            return json.dumps({"error": "run not active"})

        room_index = self._safe_int(run.get("current_room", 0), 0)
        room_key = self._room_key(run_id, room_index)

        if room_key not in self.rooms:
            return json.dumps({"error": "room not generated yet"})

        room = json.loads(self.rooms[room_key])

        if room.get("type") != "puzzle":
            return json.dumps({"error": "current room is not a puzzle"})

        if room.get("completed", False):
            return json.dumps({"error": "room already completed"})

        answer_data = self._safe_json_object(answer_json)
        player_answer = str(answer_data.get("answer", ""))

        prompt = """
You are a fair and thoughtful puzzle judge in the VoidRun dimension of PixelPassport.

Puzzle room:
""" + json.dumps(room) + """

Player answer:
""" + player_answer + """

Evaluation rules:
- Be fair but not overly generous.
- Accept creative, unconventional answers if they demonstrate genuine insight.
- For riddles: correct concept counts even if exact wording differs.
- For patterns: exact number required, but accept verbal descriptions.
- For logic: require correct reasoning, not just final answer.
- For creative questions: reward originality and thoughtfulness.
- Empty or nonsensical answers should score very low.
- Return only valid JSON.

Required JSON:
{
  "accepted": true,
  "confidence": 0.8,
  "summary": "brief verdict",
  "reasoning": "2-3 sentences",
  "reward_modifier": "small",
  "next_room_hint": "cryptic hint"
}
"""

        raw = gl.eq_principle.prompt_non_comparative(prompt)

        try:
            judgement = json.loads(raw)
            if not isinstance(judgement, dict):
                judgement = {}
        except Exception:
            judgement = {}

        if len(judgement) == 0:
            lowered = player_answer.lower()
            accepted = False

            accepted_words = [
                "map",
                "42",
                "lantern",
                "towel",
                "passport",
                "pixelpassport",
            ]

            for word in accepted_words:
                if word in lowered:
                    accepted = True

            judgement = {
                "accepted": accepted,
                "confidence": 0.6 if accepted else 0.2,
                "summary": "Answer evaluated." if accepted else "Answer did not satisfy the puzzle.",
                "reasoning": "The void considers your response and renders its verdict.",
                "reward_modifier": "small" if accepted else "none",
                "next_room_hint": "The path forward shifts with shadow.",
            }

        accepted = bool(judgement.get("accepted", False))
        confidence_raw = judgement.get("confidence", 0)

        try:
            confidence_bp = int(float(confidence_raw) * 10000)
        except Exception:
            confidence_bp = 0

        confidence_bp = self._clamp_int(confidence_bp, 0, 10000)

        reward_modifier = str(judgement.get("reward_modifier", "none"))

        if reward_modifier not in ["none", "small", "moderate", "large"]:
            reward_modifier = "none"

        judgement["accepted"] = accepted
        judgement["confidence_bp"] = confidence_bp
        judgement["summary"] = str(judgement.get("summary", "Answer evaluated."))
        judgement["reasoning"] = str(judgement.get("reasoning", ""))
        judgement["reward_modifier"] = reward_modifier
        judgement["next_room_hint"] = str(judgement.get("next_room_hint", ""))

        if "confidence" in judgement:
            del judgement["confidence"]

        judgement_key = self._room_key(run_id, room_index)
        self.puzzle_judgements[judgement_key] = json.dumps(judgement)

        room["completed"] = accepted
        room["judgement"] = judgement
        room["answered_at"] = self._now()

        self.rooms[room_key] = json.dumps(room)

        if accepted:
            score_gain = self._reward_score_gain(reward_modifier)
            run["score"] = self._safe_int(run.get("score", 0), 0) + score_gain
            run["current_room"] = room_index + 1

            if self._safe_int(run.get("current_room", 0), 0) >= self._safe_int(run.get("total_rooms", 5), 5):
                run["status"] = "finished"
                run["finished_at"] = self._now()

        self.runs[run_id] = json.dumps(run)

        return json.dumps({
            "ok": True,
            "judgement": judgement,
            "run": run,
        })

    @gl.public.write
    def use_void_item(
        self,
        run_id: str,
        item_id: str,
        translated_item_json: str,
    ) -> str:
        if run_id not in self.runs:
            return json.dumps({"error": "run not found"})

        if item_id == "":
            return json.dumps({"error": "item_id required"})

        run = json.loads(self.runs[run_id])

        if run.get("status") != "active":
            return json.dumps({"error": "run not active"})

        translated_item = self._safe_json_object(translated_item_json)

        allowed_classes = [
            "relic",
            "puzzle_tool",
            "void_artifact",
            "navigator",
            "translated_relic",
        ]

        translated_class = str(translated_item.get("translated_class", ""))

        class_ok = False
        for allowed_class in allowed_classes:
            if translated_class == allowed_class:
                class_ok = True

        if not class_ok:
            return json.dumps({
                "error": "item class not valid in VoidRun",
                "translated_class": translated_class,
                "allowed_classes": allowed_classes,
            })

        power_level = self._safe_int(
            translated_item.get("translated_power_level", 1),
            1,
        )

        power_level = self._clamp_int(power_level, 1, 80)

        score_gain = 20 + int(power_level // 10)
        score_gain = self._clamp_int(score_gain, 20, 40)

        run["score"] = self._safe_int(run.get("score", 0), 0) + score_gain

        used_items = run.get("used_items", [])
        if not isinstance(used_items, list):
            used_items = []

        used_items.append({
            "item_id": item_id,
            "translated_name": str(translated_item.get("translated_name", "Void Item")),
            "translated_class": translated_class,
            "score_gain": score_gain,
            "used_at": self._now(),
        })

        run["used_items"] = used_items

        self.runs[run_id] = json.dumps(run)

        return json.dumps({
            "ok": True,
            "item_id": item_id,
            "score_gain": score_gain,
            "effect": str(translated_item.get("translated_name", "The item")) + " pulses with void energy, granting passage.",
        })

    @gl.public.write
    def finish_run(self, run_id: str) -> str:
        if run_id not in self.runs:
            return json.dumps({"error": "run not found"})

        run = json.loads(self.runs[run_id])

        if run.get("status") == "claimed":
            return json.dumps({"error": "reward already claimed"})

        if run.get("status") not in ["active", "finished"]:
            return json.dumps({"error": "run already completed"})

        run["status"] = "finished"
        run["finished_at"] = self._now()

        self.runs[run_id] = json.dumps(run)

        return json.dumps({
            "ok": True,
            "run_id": run_id,
            "score": run.get("score", 0),
            "status": "finished",
        })

    @gl.public.write
    def claim_void_reward(self, run_id: str) -> str:
        if run_id not in self.runs:
            return json.dumps({"error": "run not found"})

        run = json.loads(self.runs[run_id])

        if run.get("status") != "finished":
            return json.dumps({"error": "run not finished"})

        if str(run.get("reward_item_id", "")) != "":
            return json.dumps({"error": "reward already claimed"})

        prompt = """
A player completed a VoidRun.

Run:
""" + json.dumps(run) + """

Generate a void reward relic appropriate to their performance.

Rules:
- class must be relic or void_artifact.
- rarity must be common, uncommon, rare, or epic.
- power_level must be between 10 and 80.
- traits must be a list of short strings.
- lore should be 1-2 sentences.
- Return only valid JSON.

Required JSON:
{
  "name": "string",
  "class": "void_artifact",
  "rarity": "rare",
  "power_level": 40,
  "traits": ["void_affinity", "dimensional_memory"],
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
            score = self._safe_int(run.get("score", 0), 0)
            rarity = "uncommon"

            if score >= 250:
                rarity = "rare"

            if score >= 400:
                rarity = "epic"

            reward_data = {
                "name": "Void Crystal Shard",
                "class": "void_artifact",
                "rarity": rarity,
                "power_level": self._clamp_int(20 + int(score // 5), 10, 80),
                "traits": [
                    "void_affinity",
                    "dimensional_memory",
                ],
                "lore": "A fragment of the void dimension itself, crystallised by your passage.",
            }

        reward_class = str(reward_data.get("class", "void_artifact"))
        if reward_class not in ["relic", "void_artifact"]:
            reward_class = "void_artifact"

        rarity = str(reward_data.get("rarity", "common"))
        if rarity not in ["common", "uncommon", "rare", "epic"]:
            rarity = "common"

        power_level = self._safe_int(reward_data.get("power_level", 10), 10)
        power_level = self._clamp_int(power_level, 10, 80)

        traits = reward_data.get("traits", [])
        if not isinstance(traits, list):
            traits = []

        reward_data["name"] = str(reward_data.get("name", "Void Relic"))
        reward_data["class"] = reward_class
        reward_data["rarity"] = rarity
        reward_data["power_level"] = power_level
        reward_data["traits"] = traits
        reward_data["lore"] = str(reward_data.get("lore", "A relic drawn from the shifting void."))

        reward_item_id = "item_" + run_id + "_void_reward"

        run["reward_item_id"] = reward_item_id
        run["reward_data"] = reward_data
        run["status"] = "claimed"
        run["claimed_at"] = self._now()

        self.runs[run_id] = json.dumps(run)
        self.void_rewards[run_id] = json.dumps(reward_data)

        return json.dumps({
            "ok": True,
            "run_id": run_id,
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
    def get_total_runs(self) -> str:
        return str(self.run_count)

    @gl.public.view
    def get_room_types(self) -> str:
        return json.dumps(ROOM_TYPES)

    @gl.public.view
    def get_puzzle_templates(self) -> str:
        return json.dumps(PUZZLE_TEMPLATES)

    @gl.public.view
    def get_run(self, run_id: str) -> str:
        if run_id not in self.runs:
            return json.dumps({"error": "not found"})

        return self.runs[run_id]

    @gl.public.view
    def get_room(self, run_id: str, room_index: u256) -> str:
        idx = self._safe_int(room_index, 0)
        key = self._room_key(run_id, idx)

        if key not in self.rooms:
            return json.dumps({"error": "room not found"})

        return self.rooms[key]

    @gl.public.view
    def get_current_room(self, run_id: str) -> str:
        if run_id not in self.runs:
            return json.dumps({"error": "run not found"})

        run = json.loads(self.runs[run_id])
        idx = self._safe_int(run.get("current_room", 0), 0)
        key = self._room_key(run_id, idx)

        if key not in self.rooms:
            return json.dumps({"error": "room not generated yet"})

        return self.rooms[key]

    @gl.public.view
    def get_puzzle_judgement(self, run_id: str, room_index: u256) -> str:
        idx = self._safe_int(room_index, 0)
        key = self._room_key(run_id, idx)

        if key not in self.puzzle_judgements:
            return json.dumps({"error": "judgement not found"})

        return self.puzzle_judgements[key]

    @gl.public.view
    def get_void_reward(self, run_id: str) -> str:
        if run_id not in self.void_rewards:
            return json.dumps({"error": "reward not found"})

        return self.void_rewards[run_id]

    @gl.public.view
    def get_player_run_ids(self, passport_id: str) -> str:
        return json.dumps(self._array_get(self.player_runs, passport_id))

    @gl.public.view
    def get_player_runs(self, passport_id: str) -> str:
        run_ids = self._array_get(self.player_runs, passport_id)
        result = []

        for run_id in run_ids:
            if run_id in self.runs:
                result.append(json.loads(self.runs[run_id]))

        return json.dumps(result)