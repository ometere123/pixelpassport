# v0.2.17
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json


CONTRACT_NAME = "PixelPassport ItemRegistry"
CONTRACT_VERSION = "1.0.1"


class ItemRegistry(gl.Contract):
    items: TreeMap[str, str]
    owner_items: TreeMap[str, str]
    item_translations: TreeMap[str, str]
    translation_history: TreeMap[str, str]
    authorised_games: TreeMap[str, str]
    item_challenges: TreeMap[str, str]

    item_count: u256
    challenge_count: u256

    def __init__(self) -> None:
        self.items = TreeMap()
        self.owner_items = TreeMap()
        self.item_translations = TreeMap()
        self.translation_history = TreeMap()
        self.authorised_games = TreeMap()
        self.item_challenges = TreeMap()

        self.item_count = u256(0)
        self.challenge_count = u256(0)

    # -------------------------------------------------------------------------
    # Internal helpers
    # -------------------------------------------------------------------------

    def _now(self) -> str:
        try:
            return str(gl.message.timestamp)
        except Exception:
            return "0"

    def _sender(self) -> str:
        try:
            return str(gl.message.sender_address)
        except Exception:
            return ""

    def _safe_json_object(self, raw: str):
        try:
            data = json.loads(raw)
            if isinstance(data, dict):
                return data
            return {}
        except Exception:
            return {}

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

    def _remove_from_array_store(
        self,
        store: TreeMap[str, str],
        key: str,
        value: str,
    ) -> None:
        arr = self._array_get(store, key)
        new_arr = []

        for item in arr:
            if str(item) != value:
                new_arr.append(item)

        self._array_set(store, key, new_arr)

    # -------------------------------------------------------------------------
    # Write functions
    # -------------------------------------------------------------------------

    @gl.public.write
    def create_item(
        self,
        item_id: str,
        owner_passport_id: str,
        origin_game: str,
        item_json: str,
    ) -> str:
        if item_id == "":
            return json.dumps({"error": "item_id required"})

        if owner_passport_id == "":
            return json.dumps({"error": "owner_passport_id required"})

        if origin_game == "":
            return json.dumps({"error": "origin_game required"})

        if item_id in self.items:
            return json.dumps({"error": "item_id already exists"})

        item_data = self._safe_json_object(item_json)

        required = ["name", "class", "rarity", "power_level", "traits"]

        for field in required:
            if field not in item_data:
                return json.dumps({"error": "missing field: " + field})

        traits = item_data.get("traits", [])
        if not isinstance(traits, list):
            traits = []

        power_level = self._safe_int(item_data.get("power_level", 1), 1)

        if power_level < 1:
            power_level = 1

        if power_level > 100:
            power_level = 100

        item = {
            "id": item_id,
            "name": str(item_data.get("name", "")),
            "class": str(item_data.get("class", "")),
            "rarity": str(item_data.get("rarity", "common")),
            "power_level": power_level,
            "traits": traits,
            "lore": str(item_data.get("lore", "")),
            "origin_game": origin_game,
            "owner_passport_id": owner_passport_id,
            "metadata_uri": str(item_data.get("metadata_uri", "")),
            "usage_history": [],
            "created_by": self._sender(),
            "created_at": self._now(),
        }

        self.items[item_id] = json.dumps(item)

        self._add_unique_to_array_store(
            self.owner_items,
            owner_passport_id,
            item_id,
        )

        self.translation_history[item_id] = json.dumps([])

        self.item_count = self.item_count + u256(1)

        return json.dumps({
            "ok": True,
            "item_id": item_id,
            "owner_passport_id": owner_passport_id,
        })

    @gl.public.write
    def assign_item(self, item_id: str, new_passport_id: str) -> str:
        if item_id not in self.items:
            return json.dumps({"error": "item not found"})

        if new_passport_id == "":
            return json.dumps({"error": "new_passport_id required"})

        item = json.loads(self.items[item_id])
        old_owner = str(item.get("owner_passport_id", ""))

        if old_owner != "":
            self._remove_from_array_store(
                self.owner_items,
                old_owner,
                item_id,
            )

        item["owner_passport_id"] = new_passport_id
        item["transferred_at"] = self._now()

        self.items[item_id] = json.dumps(item)

        self._add_unique_to_array_store(
            self.owner_items,
            new_passport_id,
            item_id,
        )

        return json.dumps({
            "ok": True,
            "item_id": item_id,
            "old_owner": old_owner,
            "new_owner": new_passport_id,
        })

    @gl.public.write
    def authorise_game(self, game_id: str, game_contract: str, rules_json: str) -> str:
        if game_id == "":
            return json.dumps({"error": "game_id required"})

        rules = self._safe_json_object(rules_json)

        self.authorised_games[game_id] = json.dumps({
            "game_id": game_id,
            "contract": str(game_contract),
            "rules": rules,
            "authorised_by": self._sender(),
            "authorised_at": self._now(),
        })

        return json.dumps({
            "ok": True,
            "game_id": game_id,
        })

    @gl.public.write
    def translate_item(
        self,
        item_id: str,
        target_game: str,
        target_context_json: str,
    ) -> str:
        if item_id not in self.items:
            return json.dumps({"error": "item not found"})

        if target_game == "":
            return json.dumps({"error": "target_game required"})

        item = json.loads(self.items[item_id])
        target_context = self._safe_json_object(target_context_json)

        allowed_classes = target_context.get("allowed_classes", [])
        if not isinstance(allowed_classes, list):
            allowed_classes = []

        if len(allowed_classes) == 0:
            allowed_classes = ["relic"]

        max_power_level = self._safe_int(
            target_context.get("max_power_level", 100),
            100,
        )

        max_power_level = self._clamp_int(max_power_level, 1, 100)

        prompt = """
You are the PixelPassport cross-game item translation engine.

Your job is to translate a canonical item from one game world into another game world.

Canonical item:
""" + json.dumps(item) + """

Target game:
""" + target_game + """

Target context:
""" + json.dumps(target_context) + """

Rules:
- The translated_class must be one of the allowed target classes.
- The translated_power_level must not exceed the target max power level.
- Preserve the spirit, core traits, and lore of the source item.
- Do not merely rename the item.
- Make the translated form meaningful for the target game's mechanics.
- Return only valid JSON.

Allowed target classes:
""" + json.dumps(allowed_classes) + """

Maximum target power level:
""" + str(max_power_level) + """

Required JSON format:
{
  "translated_name": "string",
  "translated_class": "string",
  "translated_power_level": 1,
  "abilities": ["string", "string"],
  "visual_direction": "string",
  "reasoning": "string",
  "balance_notes": "string",
  "source_traits_used": ["string"]
}
"""

        raw_result = gl.eq_principle.prompt_non_comparative(prompt)

        try:
            translation_data = json.loads(raw_result)
            if not isinstance(translation_data, dict):
                translation_data = {}
        except Exception:
            translation_data = {}

        if len(translation_data) == 0:
            translation_data = {
                "translated_name": str(item.get("name", "Item")) + " (" + target_game + " Form)",
                "translated_class": str(allowed_classes[0]),
                "translated_power_level": self._clamp_int(
                    self._safe_int(item.get("power_level", 1), 1),
                    1,
                    max_power_level,
                ),
                "abilities": [
                    "Adapted power from " + str(item.get("name", "the original item")),
                    "Contextual resonance in " + target_game,
                ],
                "visual_direction": "A contextual form of the original item suited to " + target_game + ".",
                "reasoning": "Fallback translation based on item class, traits, and target game limits.",
                "balance_notes": "Power level capped to target game maximum.",
                "source_traits_used": item.get("traits", []),
            }

        translated_class = str(translation_data.get("translated_class", allowed_classes[0]))

        class_allowed = False
        for allowed_class in allowed_classes:
            if translated_class == str(allowed_class):
                class_allowed = True

        if not class_allowed:
            translated_class = str(allowed_classes[0])

        translated_power_level = self._safe_int(
            translation_data.get("translated_power_level", item.get("power_level", 1)),
            1,
        )

        translated_power_level = self._clamp_int(
            translated_power_level,
            1,
            max_power_level,
        )

        abilities = translation_data.get("abilities", [])
        if not isinstance(abilities, list):
            abilities = []

        source_traits_used = translation_data.get("source_traits_used", [])
        if not isinstance(source_traits_used, list):
            source_traits_used = item.get("traits", [])

        translation_data["translated_name"] = str(
            translation_data.get(
                "translated_name",
                str(item.get("name", "Item")) + " (" + target_game + " Form)",
            )
        )
        translation_data["translated_class"] = translated_class
        translation_data["translated_power_level"] = translated_power_level
        translation_data["abilities"] = abilities
        translation_data["visual_direction"] = str(
            translation_data.get("visual_direction", "")
        )
        translation_data["reasoning"] = str(
            translation_data.get("reasoning", "")
        )
        translation_data["balance_notes"] = str(
            translation_data.get("balance_notes", "")
        )
        translation_data["source_traits_used"] = source_traits_used

        translation_record = {
            "item_id": item_id,
            "source_game": str(item.get("origin_game", "")),
            "target_game": target_game,
            "translation": translation_data,
            "translated_at": self._now(),
        }

        translation_key = item_id + ":" + target_game
        self.item_translations[translation_key] = json.dumps(translation_record)

        history = self._array_get(self.translation_history, item_id)
        history.append(translation_record)
        self._array_set(self.translation_history, item_id, history)

        return json.dumps({
            "ok": True,
            "item_id": item_id,
            "target_game": target_game,
            "translation": translation_data,
        })

    @gl.public.write
    def record_item_use(
        self,
        item_id: str,
        passport_id: str,
        game_id: str,
        usage_json: str,
    ) -> str:
        if item_id not in self.items:
            return json.dumps({"error": "item not found"})

        item = json.loads(self.items[item_id])

        owner = str(item.get("owner_passport_id", ""))

        if owner != passport_id:
            return json.dumps({
                "error": "passport does not own this item",
                "owner_passport_id": owner,
            })

        usage = self._safe_json_object(usage_json)

        usage["game_id"] = game_id
        usage["passport_id"] = passport_id
        usage["used_at"] = self._now()

        history = item.get("usage_history", [])
        if not isinstance(history, list):
            history = []

        history.append(usage)
        item["usage_history"] = history

        self.items[item_id] = json.dumps(item)

        return json.dumps({
            "ok": True,
            "item_id": item_id,
            "game_id": game_id,
        })

    @gl.public.write
    def challenge_translation(
        self,
        item_id: str,
        target_game: str,
        reason: str,
    ) -> str:
        if item_id not in self.items:
            return json.dumps({"error": "item not found"})

        translation_key = item_id + ":" + target_game

        if translation_key not in self.item_translations:
            return json.dumps({"error": "translation not found"})

        challenge_id = "challenge_" + str(self.challenge_count)

        challenge = {
            "id": challenge_id,
            "item_id": item_id,
            "target_game": target_game,
            "translation_key": translation_key,
            "reason": reason,
            "challenger": self._sender(),
            "status": "open",
            "created_at": self._now(),
            "resolved_at": "",
            "resolution": {},
        }

        self.item_challenges[challenge_id] = json.dumps(challenge)
        self.challenge_count = self.challenge_count + u256(1)

        return json.dumps({
            "ok": True,
            "challenge_id": challenge_id,
        })

    @gl.public.write
    def resolve_translation_challenge(self, challenge_id: str) -> str:
        if challenge_id not in self.item_challenges:
            return json.dumps({"error": "challenge not found"})

        challenge = json.loads(self.item_challenges[challenge_id])

        if challenge.get("status") != "open":
            return json.dumps({
                "error": "challenge is not open",
                "status": challenge.get("status", ""),
            })

        translation_key = str(challenge.get("translation_key", ""))

        if translation_key not in self.item_translations:
            return json.dumps({"error": "translation record not found"})

        translation_record = json.loads(self.item_translations[translation_key])

        prompt = """
You are the PixelPassport translation dispute judge.

A user has challenged a cross-game item translation.

Challenge:
""" + json.dumps(challenge) + """

Translation record:
""" + json.dumps(translation_record) + """

Evaluate whether the challenge is valid.

Consider:
- Did the translation respect target game balance?
- Did it preserve the source item's core traits?
- Did it use an allowed translated class?
- Was the translated power level fair?
- Was the reasoning contextually appropriate?

Return only valid JSON:
{
  "resolved": true,
  "upheld": false,
  "explanation": "short explanation"
}
"""

        raw = gl.eq_principle.prompt_non_comparative(prompt)

        try:
            resolution = json.loads(raw)
            if not isinstance(resolution, dict):
                resolution = {}
        except Exception:
            resolution = {}

        if len(resolution) == 0:
            resolution = {
                "resolved": True,
                "upheld": False,
                "explanation": "Fallback decision: challenge evaluated and dismissed.",
            }

        resolution["resolved"] = bool(resolution.get("resolved", True))
        resolution["upheld"] = bool(resolution.get("upheld", False))
        resolution["explanation"] = str(resolution.get("explanation", ""))

        challenge["status"] = "resolved"
        challenge["resolved_at"] = self._now()
        challenge["resolution"] = resolution

        self.item_challenges[challenge_id] = json.dumps(challenge)

        return json.dumps({
            "ok": True,
            "challenge_id": challenge_id,
            "resolution": resolution,
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
    def get_total_items(self) -> str:
        return str(self.item_count)

    @gl.public.view
    def get_total_challenges(self) -> str:
        return str(self.challenge_count)

    @gl.public.view
    def get_item(self, item_id: str) -> str:
        if item_id not in self.items:
            return json.dumps({"error": "not found"})

        return self.items[item_id]

    @gl.public.view
    def get_owner_item_ids(self, passport_id: str) -> str:
        return json.dumps(self._array_get(self.owner_items, passport_id))

    @gl.public.view
    def get_owner_items(self, passport_id: str) -> str:
        item_ids = self._array_get(self.owner_items, passport_id)
        result = []

        for item_id in item_ids:
            if item_id in self.items:
                result.append(json.loads(self.items[item_id]))

        return json.dumps(result)

    @gl.public.view
    def get_item_translation(self, item_id: str, target_game: str) -> str:
        key = item_id + ":" + target_game

        if key not in self.item_translations:
            return json.dumps({"error": "translation not found"})

        return self.item_translations[key]

    @gl.public.view
    def get_translation_history(self, item_id: str) -> str:
        return json.dumps(self._array_get(self.translation_history, item_id))

    @gl.public.view
    def get_item_usage_history(self, item_id: str) -> str:
        if item_id not in self.items:
            return json.dumps([])

        item = json.loads(self.items[item_id])
        history = item.get("usage_history", [])

        if not isinstance(history, list):
            history = []

        return json.dumps(history)

    @gl.public.view
    def get_authorised_game(self, game_id: str) -> str:
        if game_id not in self.authorised_games:
            return json.dumps({"error": "not found"})

        return self.authorised_games[game_id]

    @gl.public.view
    def get_challenge(self, challenge_id: str) -> str:
        if challenge_id not in self.item_challenges:
            return json.dumps({"error": "not found"})

        return self.item_challenges[challenge_id]