# 0004 — Quiet editorial, tokens owned, primitives written here

- **Date**: 2026-09-04
- **Status**: accepted

## Context

`apply-profile` refuses a frontend project with no `design_system` block, and the
reason is the architecture's reason one level down: tokens, primitives, components and
screens form an order that cannot be reversed afterwards. Left undeclared, the agent
taking the first issue settles all of it alone — it needs a colour and a spacing to
write anything — and every issue after inherits a decision nobody approved.

## Decision

```json
{ "tokens": "src/shared/tokens.css", "primitives": "own", "direction": { "genre": "éditorial sobre" } }
```

**Genre**: quiet editorial. This genre suits the product because a portfolio is read
before it is admired: what has to carry is the work presented, not the interface
presenting it. Hierarchy is carried by type and whitespace, which keeps holding as the
content grows.

Naming it is also what stops the convergence. An agent with no direction reaches for a
plausible value, and plausible converges — the same near-black `#0a0a0f`, the same blue
`#3b82f6`, the same Inter. The palette here is a warm paper and a burnt-sienna accent,
on a serif stack, because those were chosen against a stated genre rather than reached
for.

**Primitives: own.** There are almost none yet, and a component library would arrive
with an accessibility contract this project would then have to verify anyway. When a
button and a link primitive earn their place they are written here, above the tokens.

**Tokens: one file.** `src/shared/tokens.css`, and `check:tokens` refuses any colour,
length or font-family stated anywhere else, because two sources of truth drift apart in
silence and the drift is only ever found in a screenshot.

## Consequence

`src/shared/tokens.css` is in `human_review_paths`: a change to the palette or the
spacing scale is not approved by a machine alone.

The tokens have not yet been read on the rendered contrast page
(`render-tokens.mjs`) against a real design review. The values were chosen to pass
`accessibility` on the current pages, and axe confirms no violation on both routes —
which is a floor, not a design review.
