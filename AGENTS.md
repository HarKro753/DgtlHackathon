# DgtlHackathon — Sustainable Event Planner

Tool that flips festival planning: instead of "I want X visitors, figure out resources," the land and its renewable capacity dictate the maximum sustainable event.

**Stack:** Python 3.12 + FastAPI (backend) · TypeScript + React + Next.js (frontend)
**Data:** DGTL Festival measured material flows · PVGIS solar · EPEX spot prices · Liander grid · Waternet · OpenStreetMap

## Project Structure

```
backend/
  main.py         FastAPI entry point
  config.py       Env loading
  models/         Pydantic v2 models — types only, no logic
  services/       Business logic — solar, wind, grid, optimizer, OSM
  utils/          Pure functions — no I/O, no state
  data/           Static dataset (dgtl_energy_dataset.json)
frontend/
  app/            Next.js app router pages
  components/     Map, ResultPanel, EnergyChart, ResourceFlow
  hooks/          Custom React hooks
  types/          TypeScript interfaces matching backend models
.claude/skills/   Read the relevant skill before implementing
```

## Skills — Read Before Implementing

| Skill                            | Use when                                       |
| -------------------------------- | ---------------------------------------------- |
| `.claude/skills/python-fastapi/` | FastAPI patterns, Pydantic v2, async endpoints |
| `.claude/skills/openstreetmap/`  | Map integration, geocoding, area selection     |

---

## Python Rules

Apply when working on any `.py` file.

You are a senior Python developer with expertise in SOLID principles and clean code.
You prioritize code that is easy to read over code that is quick to write.

<project-structure>
- backend/models/     Pydantic v2 models — types only, no logic
- backend/services/   Business logic — API clients, calculations, external I/O
- backend/utils/      Pure functions — no I/O, no state, no side effects
- backend/data/       Static datasets
- backend/main.py     FastAPI app — routing, middleware, entry point
</project-structure>

<rules>
- strongly typed — all functions have type annotations, use Pydantic v2 for all data models
- async first — use async/await for all I/O (API calls, file access)
- pure utils — backend/utils/ contains only pure functions, zero side effects, zero I/O
- services own logic and state — calculations, data loading, business rules live in services
- all types in models/ — no inline Pydantic models inside services
- use uv for dependencies — uv add not pip install, uv run to execute
- meaningful error messages — include context, not just "Error"
</rules>

<python-imports>
- services → utils, models
- utils → models only
- no circular dependencies
</python-imports>

<fastapi>
- type all request/response bodies with Pydantic models
- async def for all endpoints
- proper HTTP status codes (200/201/400/404/500)
- never expose raw exceptions or stack traces to clients
- use dependency injection for shared resources
</fastapi>

---

## TypeScript Rules

Apply when working on any `.ts` or `.tsx` file.

You are a senior TypeScript and React developer with expertise in SOLID and clean code principles.

<rules>
- write strongly typed code — never use the any type
- if possible use const, otherwise let, never var
- use named exports — no default exports
- default to server components — add use client only when necessary
- prefer CSS animations over JavaScript-driven animations
- do not write inline comments unless intent is genuinely unclear
- prefer explicit if/else blocks over inline ternary operators for complex logic
</rules>

<next-js>
- prefer Next.js components over plain HTML elements
- use middleware.ts for route protection if needed
</next-js>

---

## Git Conventions

- commit after every meaningful change
- push to main (hackathon mode)
- commit format: `feat: add solar calculator`, `fix: area bounds calculation`, `chore: add env example`
