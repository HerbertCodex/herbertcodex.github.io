# 0003 — Static deployment through prerendering, not the static preset

- **Date**: 2026-09-04
- **Status**: accepted, with a known blocker

## Context

The operator asked for a static deployment target. The obvious expression of that is
Nitro's `static` preset.

With `nitro@3.0.260610-beta` and Vite 8, that preset fails. The prerender itself
succeeds — both routes are written to `.output/public` — and the build then stops:

```
rolldownOptions.input should not be an html file when building for SSR.
Please specify a dedicated SSR entry.
```

This is a defect in a beta combination, not a misconfiguration to work around by
loosening something.

## Decision

Leave the preset at its default and declare `prerender` alone:

```ts
nitro({ prerender: { crawlLinks: true, routes: ["/", "/about"] } });
```

The build produces `.output/public`, a complete static artefact. That directory is what
`scripts/serve-static.mjs` serves, what `smoke` checks, what the browser suite runs
against, and what deployment publishes.

## Consequence

The constraint is met — the deployed artefact is static — but by a different route than
intended, and one route less travelled: `.output/server` is still built and simply not
deployed.

Retry `preset: "static"` when Nitro 3 leaves beta. Until then this file is the reason
the preset is absent, so that nobody adds it back and spends an afternoon on the same
error.
