# PixelPassport

**One identity. Three worlds. Zero permission to forget who you are.**

PixelPassport is a cross-game identity and item translation protocol built on GenLayer. Your passport follows you across RuneArena, ChainFarm, and VoidRun — and when you carry an item from one world into another, GenLayer's AI reasoning engine re-contextualises it so it fits the new world's rules and lore without losing its history.

This is a protocol, not a game. The games are demonstrations of what a protocol can do.

---

## Why This Exists

Every blockchain game today gives you a wallet. None of them give you an identity. Items stay locked in the game that minted them. Your reputation resets every time you cross a border. PixelPassport fixes that: one passport, one XP history, items that travel and transform, and a GenLayer ledger that remembers everything.

---

## Architecture

```
User Wallet (wagmi/viem)
       │
       ▼
Next.js 16 Frontend (App Router)
       │
   ┌───┴───┐
   │       │
Supabase  GenLayer
(cache)   (truth)
```

| Layer | Purpose | Wins when conflict |
|---|---|---|
| **GenLayer** | Passport ownership, item canonical state, translation records, adjudication results | Always |
| **Supabase** | UX cache, activity feeds, leaderboards, real-time UI state | Never |

If Supabase and GenLayer disagree, GenLayer wins.

---

## The Six LLM Jobs

GenLayer's Intelligent Contracts run these AI reasoning tasks on-chain:

| # | Contract | LLM Job |
|---|---|---|
| 1 | ItemRegistry | **Item translation** — re-contextualise an item for a target game world |
| 2 | ItemRegistry | **Lore generation** — write origin story for newly minted items |
| 3 | RuneArena | **Battle adjudication** — narrate turns, calculate damage, generate rewards |
| 4 | ChainFarm | **Farm item evaluation** — judge what a translated item does to crops |
| 5 | VoidRun | **Puzzle judging** — evaluate free-text player answers with semantic understanding |
| 6 | EcosystemGovernance | **Dispute resolution** — rule on item translation challenges |

---

## The Three Games

### RuneArena (Combat)
A tactical arena of ancient runes and combat magic. Bring weapons, armor, and runes into battle. GenLayer narrates each turn and determines outcomes. Win battles to earn canonical items.

Allowed item classes: `weapon`, `armor`, `rune`, `combat_relic`

### ChainFarm (Farming)
A blockchain-powered pastoral land where magic meets agriculture. Plant crops, apply translated items to boost yields, harvest at maturity. GenLayer evaluates what a fire-sword does to ember grain.

Allowed item classes: `tool`, `seed`, `fertilizer`, `harvest_relic`

### VoidRun (Puzzle Dungeon)
A surreal dimension of shifting puzzles and cosmic trials. Navigate procedurally generated rooms. Answer puzzles in free text — GenLayer judges your reasoning, not just your answer.

Allowed item classes: `relic`, `puzzle_tool`, `void_artifact`, `navigator`

---

## The Core Product Moment

1. Play RuneArena → win a battle → earn **Ember Blade** (weapon, PL 72, fire_affinity trait)
2. Translate Ember Blade to ChainFarm → GenLayer reasons: *"fire-affinity + cutting_edge maps to agricultural ploughing; heat trait boosts fire-aligned crops"*
3. Result: **Flame Plough** (tool, PL 45, abilities: Fire Till + Heat Boost) — capped to ChainFarm balance rules
4. Apply Flame Plough to Ember Grain plot → 40% yield boost
5. View item lineage: Ember Blade → Flame Plough, full GenLayer reasoning preserved forever

The same Ember Blade translated to VoidRun becomes a **Burning Dash Relic** (relic, PL 62) — a completely different form for a completely different world, but the same underlying item.

---

## GenLayer Contracts

| Contract | File | Key Functions |
|---|---|---|
| PassportRegistry | `contracts/genlayer/PassportRegistry.py` | `create_passport`, `award_xp`, `award_achievement`, `update_reputation` |
| ItemRegistry | `contracts/genlayer/ItemRegistry.py` | `mint_item`, `translate_item`, `get_item`, `get_translation` |
| RuneArena | `contracts/genlayer/RuneArena.py` | `create_battle`, `resolve_turn`, `claim_battle_reward` |
| ChainFarm | `contracts/genlayer/ChainFarm.py` | `create_farm`, `plant_crop`, `use_farm_item`, `harvest_crop` |
| VoidRun | `contracts/genlayer/VoidRun.py` | `start_run`, `generate_room`, `judge_puzzle_answer`, `complete_run` |
| EcosystemGovernance | `contracts/genlayer/EcosystemGovernance.py` | `register_game`, `create_proposal`, `vote`, `resolve_dispute` |

### How Item Translation Works

The `translate_item()` function in ItemRegistry builds this prompt for the LLM:

```
You are a cross-game item translation engine for the PixelPassport protocol.

SOURCE ITEM:
- Name: Ember Blade
- Class: weapon
- Rarity: rare
- Power Level: 72
- Traits: fire_affinity, cutting_edge, combat_heat, elemental_edge
- Lore: Forged in the eternal flame pits of the Runic Mountains...

TARGET GAME CONTEXT:
- Game: ChainFarm
- World: A blockchain-powered pastoral land where magic meets agriculture
- Allowed Classes: tool, seed, fertilizer, harvest_relic
- Max Power Level: 60
- Balance Rules: yield_boost_cap: 3.0, growth_speed_cap: 2.0, plot_limit: 8

Translate this item...
```

The LLM returns structured JSON. The contract parses it, enforces the power level cap, and stores the translation immutably.

---

## Setup

### Prerequisites

- Node.js 18+
- A Supabase project
- A GenLayer Studio account (or local GenLayer node)
- MetaMask or any injected wallet

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
cp .env.local.example .env.local
```

### 3. Run Supabase migrations

```bash
# In your Supabase project, run these SQL files in order:
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_seed_data.sql
```

Or use the Supabase dashboard SQL editor.

### 4. Deploy GenLayer contracts

In GenLayer Studio, deploy each contract from the `contracts/genlayer/` directory. Copy each contract address to your `.env.local`.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-only, never expose) |
| `NEXT_PUBLIC_GENLAYER_RPC_URL` | Yes | GenLayer RPC endpoint |
| `NEXT_PUBLIC_CHAIN_ID` | Yes | GenLayer chain ID (default: 61999) |
| `NEXT_PUBLIC_PASSPORT_REGISTRY_ADDRESS` | Yes | Deployed PassportRegistry contract address |
| `NEXT_PUBLIC_ITEM_REGISTRY_ADDRESS` | Yes | Deployed ItemRegistry contract address |
| `NEXT_PUBLIC_RUNE_ARENA_ADDRESS` | Yes | Deployed RuneArena contract address |
| `NEXT_PUBLIC_CHAIN_FARM_ADDRESS` | Yes | Deployed ChainFarm contract address |
| `NEXT_PUBLIC_VOID_RUN_ADDRESS` | Yes | Deployed VoidRun contract address |
| `NEXT_PUBLIC_ECOSYSTEM_GOVERNANCE_ADDRESS` | Yes | Deployed EcosystemGovernance contract address |

`SUPABASE_SERVICE_ROLE_KEY` is used only in server-side API routes via `createAdminClient()`. It is never exposed to the browser.

---

## Adding a New Game

1. Write a new GenLayer contract in `contracts/genlayer/YourGame.py`
2. Add the game to `lib/games/registry.ts`
3. Add the game ID to `types/index.ts` (`GameId` union type)
4. Add item class context to `lib/genlayer/client.ts` (`buildTranslationContext`)
5. Create the Supabase game row via migration or dashboard
6. Build the game UI under `app/your-game/`
7. Create governance proposal to register the new game on-chain

No changes to existing contracts required. The ItemRegistry translation engine picks up new target contexts automatically.

---

## MVP Trust Model

In this MVP, the frontend uses mock translation results from `parseMockTranslation()` in `lib/genlayer/client.ts` for the Ember Blade demo flow. Live GenLayer contract calls are wired up but require deployed contracts.

The architecture is production-ready: swap `parseMockTranslation` for the live `callContractRead` to `translate_item` once contracts are deployed.

---

## Known Limitations

- GenLayer contracts require the GenLayer Studio testnet; mainnet is not yet available
- Wallet connection uses injected provider only (MetaMask, Rabby, etc.) — WalletConnect not included
- VoidRun puzzle judging uses deterministic fallback in the API route; live GenLayer adjudication requires deployed VoidRun contract
- Governance voting threshold is 3 votes for MVP (production would use stake-weighted quorum)

---

## Future Upgrade Path

- **Live contract calls** — Replace mock adapters with live `callContractRead`/`callContractWrite`
- **Realtime sync** — Use Supabase Realtime to push GenLayer confirmation events to the UI
- **WalletConnect** — Add `walletConnect()` connector to wagmi config
- **Item provenance graph** — Full lineage DAG visualisation: one item, all its translations, all games it has touched
- **Dispute resolution UI** — Frontend for challenging translations and viewing EcosystemGovernance rulings
- **Cross-game tournaments** — RuneArena seasons where translated items from all three games compete

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Database | Supabase (Postgres + RLS) |
| Auth | Supabase SSR + wallet address |
| Blockchain | GenLayer (Python Intelligent Contracts) |
| Wallet | wagmi + viem (injected + MetaMask) |
| State | Zustand (passport) + TanStack Query (server) |
| Fonts | Geist Sans + Geist Mono |
| Contracts | Python (GenLayer Intelligent Contracts) |
