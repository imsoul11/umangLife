# UMANG Life Journey

An AI concierge for Indian citizens: you describe a life event in plain words — "I changed jobs and moved from Maharashtra to Karnataka" — and it turns that into an **ordered graph of government actions** (PF transfer, address updates, vehicle re-registration, benefit eligibility, grievance escalation), with deadlines and mock DigiLocker autofill.

## Features

- **Chat journey builder** — a tool-calling LLM agent detects life events and materializes a task DAG (job change, new child, vehicle purchase, home purchase, marriage)
- **Journey graph** — interactive React Flow DAG showing what's locked / ready / done, animated as tasks unlock
- **Mock government forms** — a per-task wizard with DigiLocker-based autofill, submission receipts, SLA tracking
- **My Benefits** — deterministic scheme eligibility (rules engine, never the LLM), with per-criterion "why"
- **Government Calendar** — SLA deadlines per application, month/timeline views, CPGRAMS grievance drafting for overdue cases
- **Hindi / English** — full UI + chat replies via a language toggle
- **Accounts-free persistence** — server-side SQLite store keyed by an anonymous per-browser device cookie

## Stack

- Next.js (App Router) · React 19 · TypeScript
- Tailwind CSS 4 · @xyflow/react (journey graph)
- OpenAI SDK pointed at Gemini's OpenAI-compatible endpoint (`AI_PROVIDER=gemini|openai`)
- `node:sqlite` for server-side persistence — zero external DB dependencies

## Getting started

```bash
cp .env.example .env.local   # add GEMINI_API_KEY (or OPENAI_API_KEY)
npm install
npm run dev                  # http://localhost:3000
```

Other scripts:

```bash
npm test       # vitest unit tests (engine, prompts, repository, rate limiting, kv store)
npm run smoke  # end-to-end sanity of the deterministic engine + eligibility
npm run build  # production build
```

## Architecture

The core principle: **the LLM never decides anything consequential**.

```
src/
  lib/
    engine.ts      PURE functions: task statuses, predicates, eligibility, urgency, SLA calendar (fully unit-tested)
    chat.ts        LLM agent loop (tool calling, max 3 rounds) — detect_life_event, lookup_kb, get_journey_state, suggest_actions
    ai.ts          single AI entry point (Gemini via OpenAI-compatible endpoint)
    prompts.ts     system prompt builder (incl. language directive)
    types.ts       FROZEN CONTRACT shared by engine, server and UI
    repository.ts  the only persistence facade (async API client over the session store)
    db.ts          SQLite key-value store via node:sqlite (swap point for hosted DBs)
    identity.ts    anonymous per-browser owner via httpOnly device cookie
    rateLimit.ts   in-memory token bucket guarding the AI routes
    i18n.ts        EN/HI dictionaries with {var} interpolation
    taskStyle.ts   shared task-status styling (badge / node / list)
  data/            hand-authored journey templates, schemes, knowledge base, mocks
  app/             routes: / (dashboard), /benefits, /calendar, /about + API routes
  components/      JourneyProvider (state), Dashboard, ChatPanel, JourneyGraph, TaskWizard, ProfileEditor…
```

**AI safety model**: the LLM only *detects*, *explains* and *proposes*. Eligibility, urgency and task ordering come from pure functions in `engine.ts`; chat-proposed action chips are server-validated against live task state (a "hallucination firewall"); grievance letters are drafted strictly from real journey facts.

## Data & persistence

- Journeys, chat history, profile and DigiLocker documents persist server-side in `.data/umang.db` (gitignored), keyed by an anonymous device cookie — no sign-up needed.
- The locale preference is device-local.
- Swapping to a hosted database later means reimplementing `src/lib/db.ts` + the `/api/session` handlers; the repository contract stays the same.

## Roadmap

- [ ] SLA deadline notifications beyond the in-app banner (email digest)
- [ ] Real DigiLocker / government API sandboxes to replace mocks
- [ ] More languages beyond Hindi
- [ ] E2E tests (Playwright) over the chat → journey → complete-task flow

## Demo reset

Use the "reset demo" link in the header (clears your device's stored data), or delete `.data/umang.db`.