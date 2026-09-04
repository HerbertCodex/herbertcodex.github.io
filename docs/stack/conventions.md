# Stack conventions

The standards QA reviews against, for this stack and this repository. Each one names the
gate that refuses it, or says plainly that no gate does — a rule nothing can refuse is
a rule that will be skipped in silence, and the reader cannot tell the two apart unless
it is written down.

## Solid components

Components are functions returning JSX, declared with `export default function` and
carrying a contract. Props are read, never destructured at the parameter: Solid's
reactivity is lost the moment a prop is pulled out of its object, and the loss is
silent — the component simply stops updating. No gate catches that one; it is read in
review.

State stays local until a second consumer proves otherwise. `createSignal` in the
component that owns it, and a shared store only once sharing is demonstrated rather
than anticipated.

## Where a file goes

`src/shared/` holds what more than one feature uses. Everything else under `src/` is a
feature, and `src/routes/` is the feature SolidStart's file routing owns.

A file moves into `src/shared/` at its **second** proven consumer, not at the first
guess that it might be reused. Moving it early is what turns a shared directory into a
catch-all, and a catch-all is invisible to `architecture`, which checks direction and
not cohesion. (`architecture` for the direction; the rest is read.)

## Styling

Every colour, length and font traces back to `src/shared/tokens.css` through
`var(--token)`. A component's own stylesheet sits beside it and states no literal.
(`design_tokens`)

Adding a token is a design decision, not a convenience: the file is in
`human_review_paths` for that reason. Prefer reusing a step of the existing scale over
adding a step between two that exist — a scale with a step nobody can distinguish is a
scale nobody uses correctly.

## Accessibility

Interactive elements are the real element: a `button` for an action, an `a[href]` for a
destination. A `div` with a click handler is not reachable by keyboard and announces
nothing, and this is the single most common way an interface becomes unusable to
somebody without a mouse. (`accessibility`)

Focus is never removed, only restyled: the `:focus-visible` rule in `src/app.css` is the
one place that decides how focus looks. (`accessibility`)

## Tests

Unit tests render the component and assert what a user perceives — the label, the state,
the announced role — rather than internal calls. Query by role first: a test that finds
its button by role fails when the button stops being a button, which is exactly when it
should. (`test_unit`)

Browser tests run against the built site, never the dev server. What the dev server
proves is that Vite compiles, and `build` already answers that. (`test_e2e`)

## Documentation and comments

Every exported symbol carries a contract naming its parameters and what it returns.
(`doc_lint`)

Inside a function, a comment carries a reason — why this order, why this exception —
never a restatement of the line below it. A comment that narrates goes stale at the
first edit, and a stale comment is believed. (`comment_policy`)

## Écriture du contenu

**Pas de tiret cadratin.** Ni dans le contenu du site, ni dans les libellés
d'interface. Quand deux idées sont séparées par un tiret cadratin, c'est presque
toujours qu'elles auraient dû être deux éléments distincts : l'employeur et le
poste occupé ne sont pas une phrase, ce sont deux informations que la mise en
forme sépare mieux qu'une ponctuation. Ailleurs, une virgule, un deux-points ou
un point font le travail.

Le demi-cadratin reste utilisé pour ce à quoi il sert : une plage de valeurs,
`2024–2026`. Aucun gate ne vérifie cette règle ; elle se lit en revue.

## Dependencies

Installing one is the operator's decision, not an agent's. The lockfile is pnpm's and is
authoritative; `pnpm-workspace.yaml` carries the security overrides, which are pins away
from known advisories and never suppressions of them. (`audit`, `dead_code`)
