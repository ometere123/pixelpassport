# v0.2.17
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json


CONTRACT_NAME = "PixelPassport EcosystemGovernance"
CONTRACT_VERSION = "1.0.1"


class EcosystemGovernance(gl.Contract):
    proposals: TreeMap[str, str]          # proposal_id -> JSON
    votes: TreeMap[str, str]              # "{proposal_id}:{voter}" -> JSON
    approved_games: TreeMap[str, str]     # game_id -> JSON
    item_classes: TreeMap[str, str]       # item_class -> JSON rules
    translation_rules: TreeMap[str, str]  # game_id -> JSON rules

    proposal_votes: TreeMap[str, str]     # proposal_id -> JSON array of vote keys
    game_index: TreeMap[str, str]         # "all" -> JSON array of game_ids
    proposal_index: TreeMap[str, str]     # "all" -> JSON array of proposal_ids

    proposal_count: u256

    def __init__(self) -> None:
        self.proposals = TreeMap()
        self.votes = TreeMap()
        self.approved_games = TreeMap()
        self.item_classes = TreeMap()
        self.translation_rules = TreeMap()
        self.proposal_votes = TreeMap()
        self.game_index = TreeMap()
        self.proposal_index = TreeMap()
        self.proposal_count = u256(0)

        core_games = [
            ["rune-arena", "RuneArena", "tactical_combat"],
            ["chain-farm", "ChainFarm", "farming_economy"],
            ["void-run", "VoidRun", "puzzle_survival"],
        ]

        game_ids = []

        for game in core_games:
            gid = game[0]
            gname = game[1]
            gtype = game[2]

            entry = {
                "id": gid,
                "name": gname,
                "type": gtype,
                "status": "approved",
                "contract": "",
                "adapter": {},
                "registered_at": "genesis",
            }

            self.approved_games[gid] = json.dumps(entry)
            game_ids.append(gid)

        self.game_index["all"] = json.dumps(game_ids)
        self.proposal_index["all"] = json.dumps([])

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
    def create_proposal(
        self,
        proposal_id: str,
        proposal_type: str,
        proposal_json: str,
    ) -> str:
        if proposal_id == "":
            return json.dumps({"error": "proposal_id required"})

        if proposal_type == "":
            return json.dumps({"error": "proposal_type required"})

        if proposal_id in self.proposals:
            return json.dumps({"error": "proposal_id already exists"})

        allowed_types = [
            "add_game",
            "item_class",
            "translation_rule",
            "general",
        ]

        if proposal_type not in allowed_types:
            return json.dumps({
                "error": "unsupported proposal type",
                "allowed_types": allowed_types,
            })

        proposal_data = self._safe_json_object(proposal_json)

        proposal = {
            "id": proposal_id,
            "type": proposal_type,
            "title": str(proposal_data.get("title", "Untitled Proposal")),
            "description": str(proposal_data.get("description", "")),
            "payload": proposal_data.get("payload", {}),
            "proposer": self._sender(),
            "status": "pending",
            "votes_for": 0,
            "votes_against": 0,
            "created_at": self._now(),
            "executed_at": "",
        }

        self.proposals[proposal_id] = json.dumps(proposal)
        self.proposal_votes[proposal_id] = json.dumps([])

        self._add_unique_to_array_store(
            self.proposal_index,
            "all",
            proposal_id,
        )

        self.proposal_count = self.proposal_count + u256(1)

        return json.dumps({
            "ok": True,
            "proposal_id": proposal_id,
            "proposal_type": proposal_type,
        })

    @gl.public.write
    def vote(self, proposal_id: str, support: bool, reason: str) -> str:
        if proposal_id not in self.proposals:
            return json.dumps({"error": "proposal not found"})

        proposal = json.loads(self.proposals[proposal_id])

        if proposal.get("status") != "pending":
            return json.dumps({
                "error": "proposal is not open for voting",
                "status": proposal.get("status", ""),
            })

        voter = self._sender()

        if voter == "":
            return json.dumps({"error": "sender unavailable"})

        vote_key = proposal_id + ":" + voter

        if vote_key in self.votes:
            return json.dumps({"error": "already voted"})

        vote_record = {
            "proposal_id": proposal_id,
            "voter": voter,
            "support": bool(support),
            "reason": reason,
            "voted_at": self._now(),
        }

        self.votes[vote_key] = json.dumps(vote_record)

        self._add_unique_to_array_store(
            self.proposal_votes,
            proposal_id,
            vote_key,
        )

        votes_for = self._safe_int(proposal.get("votes_for", 0), 0)
        votes_against = self._safe_int(proposal.get("votes_against", 0), 0)

        if support:
            votes_for = votes_for + 1
        else:
            votes_against = votes_against + 1

        proposal["votes_for"] = votes_for
        proposal["votes_against"] = votes_against

        if votes_for >= 3:
            proposal["status"] = "passed"

        if votes_against >= 3:
            proposal["status"] = "rejected"

        self.proposals[proposal_id] = json.dumps(proposal)

        return json.dumps({
            "ok": True,
            "proposal_id": proposal_id,
            "support": bool(support),
            "votes_for": votes_for,
            "votes_against": votes_against,
            "status": proposal["status"],
        })

    @gl.public.write
    def execute_proposal(self, proposal_id: str) -> str:
        if proposal_id not in self.proposals:
            return json.dumps({"error": "proposal not found"})

        proposal = json.loads(self.proposals[proposal_id])

        if proposal.get("status") != "passed":
            return json.dumps({
                "error": "proposal has not passed",
                "status": proposal.get("status", ""),
            })

        p_type = str(proposal.get("type", ""))
        payload = proposal.get("payload", {})

        if not isinstance(payload, dict):
            payload = {}

        executed_action = ""

        if p_type == "add_game":
            game_id = str(payload.get("game_id", ""))

            if game_id == "":
                return json.dumps({"error": "payload.game_id required"})

            entry = {
                "id": game_id,
                "name": str(payload.get("name", game_id)),
                "type": str(payload.get("game_type", "external")),
                "status": "approved",
                "contract": str(payload.get("contract", "")),
                "adapter": payload.get("adapter", {}),
                "registered_at": self._now(),
            }

            self.approved_games[game_id] = json.dumps(entry)

            self._add_unique_to_array_store(
                self.game_index,
                "all",
                game_id,
            )

            executed_action = "game_approved"

        elif p_type == "item_class":
            item_class = str(payload.get("class", ""))

            if item_class == "":
                return json.dumps({"error": "payload.class required"})

            rules = payload.get("rules", {})

            self.item_classes[item_class] = json.dumps({
                "class": item_class,
                "rules": rules,
                "approved_at": self._now(),
                "approved_by_proposal": proposal_id,
            })

            executed_action = "item_class_approved"

        elif p_type == "translation_rule":
            game_id = str(payload.get("game_id", ""))

            if game_id == "":
                return json.dumps({"error": "payload.game_id required"})

            rules = payload.get("rules", {})

            self.translation_rules[game_id] = json.dumps({
                "game_id": game_id,
                "rules": rules,
                "set_at": self._now(),
                "set_by_proposal": proposal_id,
            })

            executed_action = "translation_rule_set"

        elif p_type == "general":
            executed_action = "general_proposal_recorded"

        else:
            return json.dumps({"error": "unsupported proposal type"})

        proposal["status"] = "executed"
        proposal["executed_at"] = self._now()
        proposal["executed_action"] = executed_action

        self.proposals[proposal_id] = json.dumps(proposal)

        return json.dumps({
            "ok": True,
            "proposal_id": proposal_id,
            "executed": p_type,
            "action": executed_action,
        })

    @gl.public.write
    def register_external_game(
        self,
        game_id: str,
        game_contract: str,
        adapter_json: str,
    ) -> str:
        if game_id == "":
            return json.dumps({"error": "game_id required"})

        if game_id in self.approved_games:
            return json.dumps({"error": "game already registered"})

        adapter = self._safe_json_object(adapter_json)

        entry = {
            "id": game_id,
            "contract": str(game_contract),
            "name": str(adapter.get("name", game_id)),
            "type": str(adapter.get("type", "external")),
            "status": "pending_approval",
            "adapter": adapter,
            "registered_by": self._sender(),
            "registered_at": self._now(),
        }

        self.approved_games[game_id] = json.dumps(entry)

        self._add_unique_to_array_store(
            self.game_index,
            "all",
            game_id,
        )

        return json.dumps({
            "ok": True,
            "game_id": game_id,
            "status": "pending_approval",
        })

    @gl.public.write
    def approve_item_class(self, item_class: str, rules_json: str) -> str:
        if item_class == "":
            return json.dumps({"error": "item_class required"})

        rules = self._safe_json_object(rules_json)

        self.item_classes[item_class] = json.dumps({
            "class": item_class,
            "rules": rules,
            "approved_by": self._sender(),
            "approved_at": self._now(),
        })

        return json.dumps({
            "ok": True,
            "item_class": item_class,
        })

    @gl.public.write
    def set_translation_rule(self, game_id: str, rule_json: str) -> str:
        if game_id == "":
            return json.dumps({"error": "game_id required"})

        rules = self._safe_json_object(rule_json)

        self.translation_rules[game_id] = json.dumps({
            "game_id": game_id,
            "rules": rules,
            "set_by": self._sender(),
            "set_at": self._now(),
        })

        return json.dumps({
            "ok": True,
            "game_id": game_id,
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
    def get_total_proposals(self) -> str:
        return str(self.proposal_count)

    @gl.public.view
    def get_proposal(self, proposal_id: str) -> str:
        if proposal_id not in self.proposals:
            return json.dumps({"error": "not found"})

        return self.proposals[proposal_id]

    @gl.public.view
    def get_vote(self, proposal_id: str, voter: str) -> str:
        vote_key = proposal_id + ":" + voter

        if vote_key not in self.votes:
            return json.dumps({"error": "not found"})

        return self.votes[vote_key]

    @gl.public.view
    def get_votes(self, proposal_id: str) -> str:
        vote_keys = self._array_get(self.proposal_votes, proposal_id)
        result = []

        for vote_key in vote_keys:
            if vote_key in self.votes:
                result.append(json.loads(self.votes[vote_key]))

        return json.dumps(result)

    @gl.public.view
    def get_proposal_ids(self) -> str:
        return json.dumps(self._array_get(self.proposal_index, "all"))

    @gl.public.view
    def get_all_proposals(self) -> str:
        proposal_ids = self._array_get(self.proposal_index, "all")
        result = []

        for proposal_id in proposal_ids:
            if proposal_id in self.proposals:
                result.append(json.loads(self.proposals[proposal_id]))

        return json.dumps(result)

    @gl.public.view
    def get_game(self, game_id: str) -> str:
        if game_id not in self.approved_games:
            return json.dumps({"error": "not found"})

        return self.approved_games[game_id]

    @gl.public.view
    def get_approved_games(self) -> str:
        game_ids = self._array_get(self.game_index, "all")
        result = []

        for game_id in game_ids:
            if game_id in self.approved_games:
                result.append(json.loads(self.approved_games[game_id]))

        return json.dumps(result)

    @gl.public.view
    def get_game_ids(self) -> str:
        return json.dumps(self._array_get(self.game_index, "all"))

    @gl.public.view
    def get_item_class(self, item_class: str) -> str:
        if item_class not in self.item_classes:
            return json.dumps({"error": "not found"})

        return self.item_classes[item_class]

    @gl.public.view
    def get_translation_rule(self, game_id: str) -> str:
        if game_id not in self.translation_rules:
            return json.dumps({"error": "not found"})

        return self.translation_rules[game_id]