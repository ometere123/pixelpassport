# v0.2.17
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json


CONTRACT_NAME = "PixelPassport PassportRegistry"
CONTRACT_VERSION = "1.0.1"


class PassportRegistry(gl.Contract):
    passports: TreeMap[str, str]
    owner_to_passport: TreeMap[str, str]
    authorised_games: TreeMap[str, str]
    game_index: TreeMap[str, str]

    passport_count: u256

    def __init__(self) -> None:
        self.passports = TreeMap()
        self.owner_to_passport = TreeMap()
        self.authorised_games = TreeMap()
        self.game_index = TreeMap()
        self.passport_count = u256(0)

        self.game_index["all"] = json.dumps([])

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

    # -------------------------------------------------------------------------
    # Write functions
    # -------------------------------------------------------------------------

    @gl.public.write
    def create_passport(
        self,
        passport_id: str,
        username: str,
        metadata_uri: str,
    ) -> str:
        caller = self._sender()

        if caller == "":
            return json.dumps({"error": "sender unavailable"})

        if passport_id == "":
            return json.dumps({"error": "passport_id required"})

        if passport_id in self.passports:
            return json.dumps({"error": "passport_id already exists"})

        if caller in self.owner_to_passport:
            return json.dumps({"error": "wallet already has a passport"})

        if username == "":
            return json.dumps({"error": "username required"})

        if len(username) < 3 or len(username) > 30:
            return json.dumps({"error": "username must be 3-30 characters"})

        passport = {
            "id": passport_id,
            "owner": caller,
            "username": username,
            "metadata_uri": metadata_uri,
            "ecosystem_xp": 0,
            "level": 1,
            "reputation": 100,
            "games": {},
            "achievements": [],
            "created_at": self._now(),
            "updated_at": self._now(),
        }

        self.passports[passport_id] = json.dumps(passport)
        self.owner_to_passport[caller] = passport_id

        self.passport_count = self.passport_count + u256(1)

        return json.dumps({
            "ok": True,
            "passport_id": passport_id,
            "owner": caller,
        })

    @gl.public.write
    def update_profile_metadata(
        self,
        passport_id: str,
        metadata_uri: str,
    ) -> str:
        caller = self._sender()

        if passport_id not in self.passports:
            return json.dumps({"error": "passport not found"})

        passport = json.loads(self.passports[passport_id])

        if str(passport.get("owner", "")) != caller:
            return json.dumps({"error": "not passport owner"})

        passport["metadata_uri"] = metadata_uri
        passport["updated_at"] = self._now()

        self.passports[passport_id] = json.dumps(passport)

        return json.dumps({
            "ok": True,
            "passport_id": passport_id,
        })

    @gl.public.write
    def authorise_game(
        self,
        game_id: str,
        game_contract: str,
        game_type: str,
    ) -> str:
        if game_id == "":
            return json.dumps({"error": "game_id required"})

        entry = {
            "game_id": game_id,
            "contract": str(game_contract),
            "type": game_type,
            "authorised_at": self._now(),
            "authorised_by": self._sender(),
            "status": "authorised",
        }

        self.authorised_games[game_id] = json.dumps(entry)

        self._add_unique_to_array_store(
            self.game_index,
            "all",
            game_id,
        )

        return json.dumps({
            "ok": True,
            "game_id": game_id,
        })

    @gl.public.write
    def revoke_game(self, game_id: str) -> str:
        if game_id not in self.authorised_games:
            return json.dumps({"error": "game not found"})

        entry = json.loads(self.authorised_games[game_id])
        entry["status"] = "revoked"
        entry["revoked_at"] = self._now()
        entry["revoked_by"] = self._sender()

        self.authorised_games[game_id] = json.dumps(entry)

        return json.dumps({
            "ok": True,
            "game_id": game_id,
            "status": "revoked",
        })

    @gl.public.write
    def record_game_join(
        self,
        passport_id: str,
        game_id: str,
    ) -> str:
        if passport_id not in self.passports:
            return json.dumps({"error": "passport not found"})

        if game_id == "":
            return json.dumps({"error": "game_id required"})

        passport = json.loads(self.passports[passport_id])
        games = passport.get("games", {})

        if not isinstance(games, dict):
            games = {}

        if game_id not in games:
            games[game_id] = {
                "xp": 0,
                "level": 1,
                "wins": 0,
                "losses": 0,
                "items_earned": 0,
                "joined_at": self._now(),
                "last_played": self._now(),
            }
        else:
            games[game_id]["last_played"] = self._now()

        passport["games"] = games
        passport["updated_at"] = self._now()

        self.passports[passport_id] = json.dumps(passport)

        return json.dumps({
            "ok": True,
            "passport_id": passport_id,
            "game_id": game_id,
        })

    @gl.public.write
    def award_xp(
        self,
        passport_id: str,
        game_id: str,
        xp: u256,
        reason: str,
    ) -> str:
        if passport_id not in self.passports:
            return json.dumps({"error": "passport not found"})

        xp_int = self._safe_int(xp, 0)

        if xp_int <= 0:
            return json.dumps({"error": "xp must be positive"})

        if xp_int > 10000:
            return json.dumps({"error": "xp award too large"})

        passport = json.loads(self.passports[passport_id])

        current_ecosystem_xp = self._safe_int(
            passport.get("ecosystem_xp", 0),
            0,
        )

        new_ecosystem_xp = current_ecosystem_xp + xp_int

        passport["ecosystem_xp"] = new_ecosystem_xp
        passport["level"] = int(new_ecosystem_xp // 1000) + 1

        games = passport.get("games", {})

        if not isinstance(games, dict):
            games = {}

        if game_id != "":
            if game_id not in games:
                games[game_id] = {
                    "xp": 0,
                    "level": 1,
                    "wins": 0,
                    "losses": 0,
                    "items_earned": 0,
                    "joined_at": self._now(),
                    "last_played": self._now(),
                }

            game_xp = self._safe_int(games[game_id].get("xp", 0), 0) + xp_int
            games[game_id]["xp"] = game_xp
            games[game_id]["level"] = int(game_xp // 500) + 1
            games[game_id]["last_played"] = self._now()

        passport["games"] = games
        passport["updated_at"] = self._now()

        self.passports[passport_id] = json.dumps(passport)

        return json.dumps({
            "ok": True,
            "passport_id": passport_id,
            "game_id": game_id,
            "xp_awarded": xp_int,
            "reason": reason,
            "new_ecosystem_xp": passport["ecosystem_xp"],
            "new_level": passport["level"],
        })

    @gl.public.write
    def record_match_result(
        self,
        passport_id: str,
        game_id: str,
        won: bool,
        xp_reward: u256,
    ) -> str:
        if passport_id not in self.passports:
            return json.dumps({"error": "passport not found"})

        if game_id == "":
            return json.dumps({"error": "game_id required"})

        xp_int = self._safe_int(xp_reward, 0)
        xp_int = self._clamp_int(xp_int, 0, 10000)

        passport = json.loads(self.passports[passport_id])
        games = passport.get("games", {})

        if not isinstance(games, dict):
            games = {}

        if game_id not in games:
            games[game_id] = {
                "xp": 0,
                "level": 1,
                "wins": 0,
                "losses": 0,
                "items_earned": 0,
                "joined_at": self._now(),
                "last_played": self._now(),
            }

        if won:
            games[game_id]["wins"] = self._safe_int(
                games[game_id].get("wins", 0),
                0,
            ) + 1
        else:
            games[game_id]["losses"] = self._safe_int(
                games[game_id].get("losses", 0),
                0,
            ) + 1

        game_xp = self._safe_int(games[game_id].get("xp", 0), 0) + xp_int
        games[game_id]["xp"] = game_xp
        games[game_id]["level"] = int(game_xp // 500) + 1
        games[game_id]["last_played"] = self._now()

        ecosystem_xp = self._safe_int(passport.get("ecosystem_xp", 0), 0) + xp_int
        passport["ecosystem_xp"] = ecosystem_xp
        passport["level"] = int(ecosystem_xp // 1000) + 1
        passport["games"] = games
        passport["updated_at"] = self._now()

        self.passports[passport_id] = json.dumps(passport)

        return json.dumps({
            "ok": True,
            "passport_id": passport_id,
            "game_id": game_id,
            "won": bool(won),
            "xp_awarded": xp_int,
            "game_progress": games[game_id],
            "ecosystem_xp": ecosystem_xp,
            "level": passport["level"],
        })

    @gl.public.write
    def record_item_earned(
        self,
        passport_id: str,
        game_id: str,
        count: u256,
    ) -> str:
        if passport_id not in self.passports:
            return json.dumps({"error": "passport not found"})

        if game_id == "":
            return json.dumps({"error": "game_id required"})

        count_int = self._safe_int(count, 0)

        if count_int <= 0:
            return json.dumps({"error": "count must be positive"})

        if count_int > 100:
            return json.dumps({"error": "count too large"})

        passport = json.loads(self.passports[passport_id])
        games = passport.get("games", {})

        if not isinstance(games, dict):
            games = {}

        if game_id not in games:
            games[game_id] = {
                "xp": 0,
                "level": 1,
                "wins": 0,
                "losses": 0,
                "items_earned": 0,
                "joined_at": self._now(),
                "last_played": self._now(),
            }

        games[game_id]["items_earned"] = self._safe_int(
            games[game_id].get("items_earned", 0),
            0,
        ) + count_int

        games[game_id]["last_played"] = self._now()

        passport["games"] = games
        passport["updated_at"] = self._now()

        self.passports[passport_id] = json.dumps(passport)

        return json.dumps({
            "ok": True,
            "passport_id": passport_id,
            "game_id": game_id,
            "items_earned": games[game_id]["items_earned"],
        })

    @gl.public.write
    def award_achievement(
        self,
        passport_id: str,
        game_id: str,
        achievement_json: str,
    ) -> str:
        if passport_id not in self.passports:
            return json.dumps({"error": "passport not found"})

        achievement = self._safe_json_object(achievement_json)

        name = str(achievement.get("name", ""))

        if name == "":
            return json.dumps({"error": "achievement name required"})

        passport = json.loads(self.passports[passport_id])
        achievements = passport.get("achievements", [])

        if not isinstance(achievements, list):
            achievements = []

        for ach in achievements:
            if str(ach.get("name", "")) == name and str(ach.get("game_id", "")) == game_id:
                return json.dumps({"error": "achievement already awarded"})

        achievement["game_id"] = game_id
        achievement["unlocked_at"] = self._now()

        achievements.append(achievement)

        passport["achievements"] = achievements
        passport["updated_at"] = self._now()

        self.passports[passport_id] = json.dumps(passport)

        return json.dumps({
            "ok": True,
            "passport_id": passport_id,
            "achievement": name,
        })

    @gl.public.write
    def update_reputation(
        self,
        passport_id: str,
        delta_json: str,
    ) -> str:
        if passport_id not in self.passports:
            return json.dumps({"error": "passport not found"})

        delta_data = self._safe_json_object(delta_json)
        delta = self._safe_int(delta_data.get("delta", 0), 0)

        passport = json.loads(self.passports[passport_id])
        current = self._safe_int(passport.get("reputation", 100), 100)

        new_rep = self._clamp_int(current + delta, 0, 1000)

        passport["reputation"] = new_rep
        passport["updated_at"] = self._now()

        self.passports[passport_id] = json.dumps(passport)

        return json.dumps({
            "ok": True,
            "passport_id": passport_id,
            "new_reputation": new_rep,
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
    def get_total_passports(self) -> str:
        return str(self.passport_count)

    @gl.public.view
    def get_passport(self, passport_id: str) -> str:
        if passport_id not in self.passports:
            return json.dumps({"error": "not found"})

        return self.passports[passport_id]

    @gl.public.view
    def get_passport_by_owner(self, owner: str) -> str:
        owner_str = str(owner)

        if owner_str not in self.owner_to_passport:
            return json.dumps({"error": "no passport for this wallet"})

        passport_id = self.owner_to_passport[owner_str]

        if passport_id not in self.passports:
            return json.dumps({"error": "passport missing"})

        return self.passports[passport_id]

    @gl.public.view
    def get_my_passport(self) -> str:
        caller = self._sender()

        if caller not in self.owner_to_passport:
            return json.dumps({"error": "no passport for this wallet"})

        passport_id = self.owner_to_passport[caller]

        if passport_id not in self.passports:
            return json.dumps({"error": "passport missing"})

        return self.passports[passport_id]

    @gl.public.view
    def get_owner(self, passport_id: str) -> str:
        if passport_id not in self.passports:
            return ""

        passport = json.loads(self.passports[passport_id])
        return str(passport.get("owner", ""))

    @gl.public.view
    def get_game_progress(
        self,
        passport_id: str,
        game_id: str,
    ) -> str:
        if passport_id not in self.passports:
            return json.dumps({"error": "not found"})

        passport = json.loads(self.passports[passport_id])
        games = passport.get("games", {})

        if not isinstance(games, dict):
            games = {}

        return json.dumps(games.get(game_id, {}))

    @gl.public.view
    def get_all_game_progress(self, passport_id: str) -> str:
        if passport_id not in self.passports:
            return json.dumps({"error": "not found"})

        passport = json.loads(self.passports[passport_id])
        games = passport.get("games", {})

        if not isinstance(games, dict):
            games = {}

        return json.dumps(games)

    @gl.public.view
    def get_achievements(self, passport_id: str) -> str:
        if passport_id not in self.passports:
            return json.dumps([])

        passport = json.loads(self.passports[passport_id])
        achievements = passport.get("achievements", [])

        if not isinstance(achievements, list):
            achievements = []

        return json.dumps(achievements)

    @gl.public.view
    def get_reputation(self, passport_id: str) -> str:
        if passport_id not in self.passports:
            return json.dumps({"error": "not found"})

        passport = json.loads(self.passports[passport_id])

        return json.dumps({
            "passport_id": passport_id,
            "reputation": passport.get("reputation", 100),
        })

    @gl.public.view
    def is_authorised_game(self, game_id: str) -> bool:
        if game_id not in self.authorised_games:
            return False

        entry = json.loads(self.authorised_games[game_id])
        return str(entry.get("status", "")) == "authorised"

    @gl.public.view
    def get_authorised_game(self, game_id: str) -> str:
        if game_id not in self.authorised_games:
            return json.dumps({"error": "not found"})

        return self.authorised_games[game_id]

    @gl.public.view
    def get_authorised_game_ids(self) -> str:
        return json.dumps(self._array_get(self.game_index, "all"))

    @gl.public.view
    def get_authorised_games(self) -> str:
        game_ids = self._array_get(self.game_index, "all")
        result = []

        for game_id in game_ids:
            if game_id in self.authorised_games:
                result.append(json.loads(self.authorised_games[game_id]))

        return json.dumps(result)