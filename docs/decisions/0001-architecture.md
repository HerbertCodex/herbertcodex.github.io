# 0001 — feature-modules, and a frontend project type

- **Date**: 2026-09-04
- **Status**: accepted, validated by the operator
- **Deciders**: operator, installing agent

## Context

The repository carried the SolidStart `example-basic` scaffold: a proven stack
(SolidStart 2, Vite 8, Nitro 3, TypeScript strict, pnpm) with no product decided. The
pipeline refuses to render without an architecture, because a layout that lives only in
a rendered page binds nobody: each agent lays the code out its own way, and the drift
is undetectable because nothing states what it drifts from.

The product was settled first: a personal portfolio, a showcase. It owns no data —
no database, no accounts, no persisted form. That answer is what fixes `project_type`
to `frontend`: a web interface reads data it does not own, and a project holding its
own database would have been `fullstack`.

## Options considered

The catalogue filtered to a frontend project offers four.

- **feature-sliced** — pages, features, entities, shared. It assumes a domain the
  portfolio does not have, and its `pages` layer duplicates a boundary SolidStart's file
  routing already owns in `src/routes`.
- **mvvm** — screens, viewmodels, model. Solid's signals and stores already separate
  state from rendering; a viewmodel layer on top would be ceremony every component pays.
- **mvi** — screens, state, model. Answers a rich application state. A showcase site
  has almost none.
- **feature-modules** — shared and features, one allowed direction.

## Decision

`feature-modules`, with `project_type: frontend`.

```
shared   → src/shared/**   may reach: nothing
features → src/*/**        may reach: shared
```

Two layers, one direction. It is the smallest declaration that still refuses something
real, and it does not fight SolidStart for a name the framework has already taken.

## Consequence

`scripts/check-architecture.mjs` reads `architecture.layers` and `architecture.allowed`
out of `pipeline.config.json` and enforces them, so the rule enforced and the rule
written down cannot diverge. The composition root — `src/app.tsx` and the two entry
points — is exempt: the file assembling the application legitimately imports everyone,
and counting it as coupling would produce a permanent alarm.

Revisit if the portfolio grows a domain: something it must refuse for a reason coming
from the real world. Today it refuses nothing, which is precisely why ports would have
been insurance with no payout.
