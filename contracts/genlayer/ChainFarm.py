# v0.2.17
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json


CONTRACT_NAME = "PixelPassport ChainFarm"
CONTRACT_VERSION = "1.0.1"


CROP_DEFINITIONS = {
    "ember_grain": {
        "name": "Ember Grain",
        "growth_time": 120,
        "base_yield": 10,
        "requires_fire": True,
        "description": "A heat-loving grain that thrives with fire-affinity items.",
    },
    "moonroot": {
        "name": "Moonroot",
        "growth_time": 240,
        "base_yield": 15,
        "requires_fire": False,
        "description": "A mystical root that grows in moonlight, amplified by void energy.",
    },
    "chain_corn": {
        "name": "Chain Corn",
        "growth_time": 90,
        "base_yield": 8,
        "requires_fire": False,
        "description": "Standard chain-linked corn, reliable and tradeable.",
    },
    "void_mushroom": {
        "name": "Void Mushroom",
        "growth_time": 300,
        "base_yield": 20,
        "requires_fire": False,
        "description": "A rare mushroom that absorbs dimensional energy.",
    },
    "rune_pepper": {
        "name": "Rune Pepper",
        "growth_time": 60,
        "base_yield": 6,
        "requires_fire": True,
        "description": "A spicy pepper infused with combat rune energy.",
    },
}


class ChainFarm(gl.Contract):
    farms: TreeMap[str, str]
    plots: TreeMap[str, str]
    harvests: TreeMap[str, str]
    farm_items: TreeMap[str, str]
    passport_farms: TreeMap[str, str]

    farm_count: u256

    def __init__(self) -> None:
        self.farms = TreeMap()
        self.plots = TreeMap()
        self.harvests = TreeMap()
        self.farm_items = TreeMap()
        self.passport_farms = TreeMap()
        self.farm_count = u256(0)

    # -------------------------------------------------------------------------
    # Internal helpers
    # -------------------------------------------------------------------------

    def _now(self) -> int:
        try:
            return int(str(gl.message.timestamp))
        except Exception:
            return 0

    def _json_array_get(self, store: TreeMap[str, str], key: str):
        if key not in store:
            return []

        try:
            data = json.loads(store[key])
            if isinstance(data, list):
                return data
            return []
        except Exception:
            return []

    def _json_array_set(self, store: TreeMap[str, str], key: str, value) -> None:
        store[key] = json.dumps(value)

    def _normalise_crop_type(self, crop_json: str) -> str:
        try:
            crop_data = json.loads(crop_json)
        except Exception:
            crop_data = {}

        crop_type = str(crop_data.get("type", ""))
        crop_type = crop_type.lower().strip().replace(" ", "_")
        return crop_type

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

    # -------------------------------------------------------------------------
    # Write functions
    # -------------------------------------------------------------------------

    @gl.public.write
    def create_farm(self, farm_id: str, passport_id: str) -> str:
        if farm_id == "":
            return json.dumps({"error": "farm_id required"})

        if passport_id == "":
            return json.dumps({"error": "passport_id required"})

        if farm_id in self.farms:
            return json.dumps({"error": "farm_id already exists"})

        now = self._now()

        farm = {
            "id": farm_id,
            "passport_id": passport_id,
            "name": passport_id + "'s Farm",
            "level": 1,
            "xp": 0,
            "resources": {
                "ember_grain": 0,
                "moonroot": 0,
                "chain_corn": 0,
                "void_mushroom": 0,
                "rune_pepper": 0,
            },
            "plot_count": 4,
            "total_harvests": 0,
            "total_quests_completed": 0,
            "created_at": str(now),
        }

        self.farms[farm_id] = json.dumps(farm)

        for i in range(4):
            plot_id = "plot_" + str(i)

            plot = {
                "id": plot_id,
                "farm_id": farm_id,
                "index": i,
                "status": "empty",
                "crop": "",
                "planted_at": "0",
                "ready_at": "0",
                "applied_item_id": "",
                "yield_modifier_bp": 10000,
            }

            plot_key = farm_id + ":" + plot_id
            self.plots[plot_key] = json.dumps(plot)

        farms_for_passport = self._json_array_get(self.passport_farms, passport_id)
        farms_for_passport.append(farm_id)
        self._json_array_set(self.passport_farms, passport_id, farms_for_passport)

        self.farm_count = self.farm_count + u256(1)

        return json.dumps({
            "ok": True,
            "farm_id": farm_id,
            "passport_id": passport_id,
            "initial_plots": 4,
        })

    @gl.public.write
    def plant_crop(self, farm_id: str, plot_id: str, crop_json: str) -> str:
        if farm_id not in self.farms:
            return json.dumps({"error": "farm not found"})

        plot_key = farm_id + ":" + plot_id

        if plot_key not in self.plots:
            return json.dumps({"error": "plot not found"})

        plot = json.loads(self.plots[plot_key])

        if plot.get("status") != "empty":
            return json.dumps({"error": "plot is not empty"})

        crop_type = self._normalise_crop_type(crop_json)

        if crop_type not in CROP_DEFINITIONS:
            return json.dumps({"error": "unknown crop: " + crop_type})

        crop_def = CROP_DEFINITIONS[crop_type]

        now = self._now()
        ready_at = now + int(crop_def["growth_time"])

        plot["status"] = "planted"
        plot["crop"] = crop_type
        plot["planted_at"] = str(now)
        plot["ready_at"] = str(ready_at)
        plot["applied_item_id"] = ""
        plot["yield_modifier_bp"] = 10000

        self.plots[plot_key] = json.dumps(plot)

        return json.dumps({
            "ok": True,
            "farm_id": farm_id,
            "plot_id": plot_id,
            "crop": crop_def["name"],
            "crop_type": crop_type,
            "ready_at": str(ready_at),
        })

    @gl.public.write
    def use_farm_item(self, farm_id: str, item_id: str, translated_item_json: str) -> str:
        if farm_id not in self.farms:
            return json.dumps({"error": "farm not found"})

        if item_id == "":
            return json.dumps({"error": "item_id required"})

        try:
            translated_item = json.loads(translated_item_json)
        except Exception:
            return json.dumps({"error": "invalid translated_item_json"})

        allowed_classes = [
            "tool",
            "seed",
            "fertilizer",
            "harvest_relic",
            "translated_tool",
        ]

        item_class = str(translated_item.get("translated_class", ""))

        if item_class not in allowed_classes:
            return json.dumps({
                "error": "item class not allowed in ChainFarm",
                "item_class": item_class,
            })

        power_level = self._safe_int(
            translated_item.get("translated_power_level", 0),
            0,
        )

        if power_level > 60:
            return json.dumps({
                "error": "item power level exceeds ChainFarm maximum",
                "max_power_level": 60,
            })

        farm = json.loads(self.farms[farm_id])
        plot_count = self._safe_int(farm.get("plot_count", 4), 4)

        active_plots = []

        for i in range(plot_count):
            plot_id = "plot_" + str(i)
            plot_key = farm_id + ":" + plot_id

            if plot_key in self.plots:
                plot = json.loads(self.plots[plot_key])

                if plot.get("crop", "") != "":
                    active_plots.append(plot)

        item_name = str(translated_item.get("translated_name", "Unknown Item"))
        abilities = translated_item.get("abilities", [])
        traits = translated_item.get("source_traits_used", [])

        prompt = """
You are the ChainFarm ecological judge.

You evaluate how a translated cross-world item affects a blockchain farm.

Farm state:
""" + json.dumps(active_plots) + """

Translated item:
""" + json.dumps(translated_item) + """

Rules:
- Maximum yield modifier is 3.0x.
- Maximum growth speed modifier is 2.0x.
- Fire, ember, flame, heat, forge, or blaze traits should usually affect ember_grain and rune_pepper.
- Void, moon, shadow, cosmic, dark, or dimensional traits should usually affect moonroot and void_mushroom.
- Generic farming tools may affect chain_corn.
- Do not invent crop types outside this list:
  ember_grain, moonroot, chain_corn, void_mushroom, rune_pepper.
- Use basis points:
  10000 means 1.0x
  15000 means 1.5x
  30000 means 3.0x

Return ONLY valid JSON in this format:
{
  "yield_modifier_bp": 10000,
  "growth_speed_modifier_bp": 10000,
  "affected_crops": ["crop_type"],
  "effect_description": "short explanation",
  "duration_turns": 3
}
"""

        raw = gl.eq_principle.prompt_non_comparative(prompt)

        try:
            effects = json.loads(raw)
        except Exception:
            joined = (
                item_name + " " +
                " ".join(abilities) + " " +
                " ".join(traits)
            ).lower()

            affected_crops = ["chain_corn"]
            yield_modifier_bp = 12000
            growth_speed_modifier_bp = 11000

            if (
                "fire" in joined or
                "ember" in joined or
                "flame" in joined or
                "heat" in joined or
                "forge" in joined or
                "blaze" in joined
            ):
                affected_crops = ["ember_grain", "rune_pepper"]
                yield_modifier_bp = 15000
                growth_speed_modifier_bp = 13000

            if (
                "void" in joined or
                "moon" in joined or
                "shadow" in joined or
                "cosmic" in joined or
                "dark" in joined or
                "dimensional" in joined
            ):
                affected_crops = ["moonroot", "void_mushroom"]
                yield_modifier_bp = 16000
                growth_speed_modifier_bp = 12000

            effects = {
                "yield_modifier_bp": yield_modifier_bp,
                "growth_speed_modifier_bp": growth_speed_modifier_bp,
                "affected_crops": affected_crops,
                "effect_description": item_name + " improves the ecology of matching crops.",
                "duration_turns": 3,
            }

        yield_modifier_bp = self._safe_int(
            effects.get("yield_modifier_bp", 10000),
            10000,
        )

        growth_speed_modifier_bp = self._safe_int(
            effects.get("growth_speed_modifier_bp", 10000),
            10000,
        )

        yield_modifier_bp = self._clamp_int(yield_modifier_bp, 10000, 30000)
        growth_speed_modifier_bp = self._clamp_int(growth_speed_modifier_bp, 10000, 20000)

        affected_crops = effects.get("affected_crops", [])

        cleaned_affected = []

        for crop in affected_crops:
            crop_name = str(crop).lower().strip().replace(" ", "_")

            if crop_name in CROP_DEFINITIONS:
                cleaned_affected.append(crop_name)

        effects["yield_modifier_bp"] = yield_modifier_bp
        effects["growth_speed_modifier_bp"] = growth_speed_modifier_bp
        effects["affected_crops"] = cleaned_affected

        applied_plots = []

        for i in range(plot_count):
            plot_id = "plot_" + str(i)
            plot_key = farm_id + ":" + plot_id

            if plot_key not in self.plots:
                continue

            plot = json.loads(self.plots[plot_key])
            crop = plot.get("crop", "")

            if crop in cleaned_affected:
                plot["applied_item_id"] = item_id
                plot["yield_modifier_bp"] = yield_modifier_bp

                self.plots[plot_key] = json.dumps(plot)
                applied_plots.append(plot_id)

        item_history = self._json_array_get(self.farm_items, farm_id)

        item_history.append({
            "item_id": item_id,
            "item_name": item_name,
            "translated_class": item_class,
            "power_level": power_level,
            "effects": effects,
            "applied_plots": applied_plots,
            "applied_at": str(self._now()),
        })

        self._json_array_set(self.farm_items, farm_id, item_history)

        return json.dumps({
            "ok": True,
            "farm_id": farm_id,
            "item_id": item_id,
            "effects": effects,
            "applied_plots": applied_plots,
        })

    @gl.public.write
    def harvest_crop(self, farm_id: str, plot_id: str) -> str:
        if farm_id not in self.farms:
            return json.dumps({"error": "farm not found"})

        plot_key = farm_id + ":" + plot_id

        if plot_key not in self.plots:
            return json.dumps({"error": "plot not found"})

        plot = json.loads(self.plots[plot_key])

        if plot.get("status") not in ["planted", "ready"]:
            return json.dumps({"error": "plot has nothing to harvest"})

        crop_type = plot.get("crop", "")

        if crop_type not in CROP_DEFINITIONS:
            return json.dumps({"error": "invalid crop on plot"})

        now = self._now()
        ready_at = self._safe_int(plot.get("ready_at", "0"), 0)

        if ready_at > 0 and now < ready_at:
            return json.dumps({
                "error": "crop is not ready yet",
                "ready_at": str(ready_at),
                "now": str(now),
            })

        crop_def = CROP_DEFINITIONS[crop_type]

        base_yield = int(crop_def["base_yield"])
        yield_modifier_bp = self._safe_int(
            plot.get("yield_modifier_bp", 10000),
            10000,
        )

        actual_yield = int((base_yield * yield_modifier_bp) // 10000)
        xp_earned = actual_yield * 5

        farm = json.loads(self.farms[farm_id])
        resources = farm.get("resources", {})

        resources[crop_type] = self._safe_int(
            resources.get(crop_type, 0),
            0,
        ) + actual_yield

        farm["resources"] = resources
        farm["total_harvests"] = self._safe_int(
            farm.get("total_harvests", 0),
            0,
        ) + 1

        farm["xp"] = self._safe_int(farm.get("xp", 0), 0) + xp_earned
        farm["level"] = int(farm["xp"] // 300) + 1

        plot["status"] = "empty"
        plot["crop"] = ""
        plot["planted_at"] = "0"
        plot["ready_at"] = "0"
        plot["applied_item_id"] = ""
        plot["yield_modifier_bp"] = 10000

        self.plots[plot_key] = json.dumps(plot)
        self.farms[farm_id] = json.dumps(farm)

        harvest_record = {
            "crop": crop_type,
            "crop_name": crop_def["name"],
            "yield": actual_yield,
            "base_yield": base_yield,
            "yield_modifier_bp": yield_modifier_bp,
            "xp_earned": xp_earned,
            "harvested_at": str(now),
        }

        history = self._json_array_get(self.harvests, farm_id)
        history.append(harvest_record)
        self._json_array_set(self.harvests, farm_id, history)

        return json.dumps({
            "ok": True,
            "farm_id": farm_id,
            "plot_id": plot_id,
            "harvest": harvest_record,
            "farm_level": farm["level"],
            "farm_xp": farm["xp"],
        })

    @gl.public.write
    def complete_farm_quest(self, farm_id: str, quest_json: str) -> str:
        if farm_id not in self.farms:
            return json.dumps({"error": "farm not found"})

        try:
            quest = json.loads(quest_json)
        except Exception:
            return json.dumps({"error": "invalid quest_json"})

        farm = json.loads(self.farms[farm_id])
        item_history = self._json_array_get(self.farm_items, farm_id)

        prompt = """
You are the ChainFarm quest validator.

Evaluate whether the farmer can complete the quest using only the current farm state.

Farm:
""" + json.dumps(farm) + """

Applied translated items:
""" + json.dumps(item_history) + """

Quest:
""" + json.dumps(quest) + """

Validation rules:
- If the quest requires a resource amount, the farm must have enough of that resource.
- If the quest requires a level, the farm level must be high enough.
- If the quest requires harvest count, total_harvests must be high enough.
- Do not approve impossible quests.
- XP reward should be reasonable between 0 and 500.

Return ONLY valid JSON:
{
  "valid": true,
  "reason": "short reason",
  "xp_reward": 100
}
"""

        raw = gl.eq_principle.prompt_non_comparative(prompt)

        try:
            result = json.loads(raw)
        except Exception:
            resource = str(quest.get("resource", ""))
            amount = self._safe_int(quest.get("amount", 0), 0)
            available = self._safe_int(
                farm.get("resources", {}).get(resource, 0),
                0,
            )

            valid = False
            reason = "Quest requirement not met."

            if resource != "" and available >= amount:
                valid = True
                reason = "Required resource amount is available."

            result = {
                "valid": valid,
                "reason": reason,
                "xp_reward": 100 if valid else 0,
            }

        valid = bool(result.get("valid", False))

        xp_reward = self._safe_int(
            result.get("xp_reward", 0),
            0,
        )

        xp_reward = self._clamp_int(xp_reward, 0, 500)
        result["xp_reward"] = xp_reward

        if valid:
            farm["xp"] = self._safe_int(farm.get("xp", 0), 0) + xp_reward
            farm["level"] = int(farm["xp"] // 300) + 1
            farm["total_quests_completed"] = self._safe_int(
                farm.get("total_quests_completed", 0),
                0,
            ) + 1

            self.farms[farm_id] = json.dumps(farm)

        return json.dumps({
            "ok": True,
            "farm_id": farm_id,
            "quest": quest,
            "result": result,
            "farm_level": farm.get("level", 1),
            "farm_xp": farm.get("xp", 0),
        })

    @gl.public.write
    def claim_farm_reward(self, farm_id: str, reward_json: str) -> str:
        if farm_id not in self.farms:
            return json.dumps({"error": "farm not found"})

        try:
            reward = json.loads(reward_json)
        except Exception:
            return json.dumps({"error": "invalid reward_json"})

        farm = json.loads(self.farms[farm_id])

        reward_type = str(reward.get("type", "xp"))
        amount = self._safe_int(reward.get("amount", 0), 0)

        if amount < 0:
            return json.dumps({"error": "invalid reward amount"})

        if reward_type == "xp":
            farm["xp"] = self._safe_int(farm.get("xp", 0), 0) + amount
            farm["level"] = int(farm["xp"] // 300) + 1

            self.farms[farm_id] = json.dumps(farm)

            return json.dumps({
                "ok": True,
                "claimed": True,
                "reward_type": "xp",
                "amount": amount,
                "farm_xp": farm["xp"],
                "farm_level": farm["level"],
            })

        return json.dumps({
            "ok": True,
            "claimed": True,
            "reward_type": reward_type,
            "amount": amount,
            "note": "Non-XP reward acknowledged but not added to farm resources.",
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
    def get_total_farms(self) -> str:
        return str(self.farm_count)

    @gl.public.view
    def get_crop_definitions(self) -> str:
        return json.dumps(CROP_DEFINITIONS)

    @gl.public.view
    def get_farm(self, farm_id: str) -> str:
        if farm_id not in self.farms:
            return json.dumps({"error": "not found"})

        return self.farms[farm_id]

    @gl.public.view
    def get_plot(self, farm_id: str, plot_id: str) -> str:
        key = farm_id + ":" + plot_id

        if key not in self.plots:
            return json.dumps({"error": "not found"})

        return self.plots[key]

    @gl.public.view
    def get_farm_plots(self, farm_id: str) -> str:
        if farm_id not in self.farms:
            return json.dumps({"error": "farm not found"})

        farm = json.loads(self.farms[farm_id])
        plot_count = self._safe_int(farm.get("plot_count", 4), 4)

        plots = []

        for i in range(plot_count):
            plot_id = "plot_" + str(i)
            key = farm_id + ":" + plot_id

            if key in self.plots:
                plots.append(json.loads(self.plots[key]))

        return json.dumps(plots)

    @gl.public.view
    def get_farm_items(self, farm_id: str) -> str:
        return json.dumps(self._json_array_get(self.farm_items, farm_id))

    @gl.public.view
    def get_harvest_history(self, farm_id: str) -> str:
        return json.dumps(self._json_array_get(self.harvests, farm_id))

    @gl.public.view
    def get_farms_by_passport(self, passport_id: str) -> str:
        farm_ids = self._json_array_get(self.passport_farms, passport_id)
        farms = []

        for farm_id in farm_ids:
            if farm_id in self.farms:
                farms.append(json.loads(self.farms[farm_id]))

        return json.dumps(farms)

    @gl.public.view
    def get_farm_stats(self, farm_id: str) -> str:
        if farm_id not in self.farms:
            return json.dumps({"error": "farm not found"})

        farm = json.loads(self.farms[farm_id])
        items = self._json_array_get(self.farm_items, farm_id)
        harvest_history = self._json_array_get(self.harvests, farm_id)

        return json.dumps({
            "farm": farm,
            "active_item_count": len(items),
            "harvest_record_count": len(harvest_history),
        })