# Project context

<!-- agent:summary -->

A personal portfolio: a showcase site presenting who its author is, the work they have
done and how to reach them. It owns no data of its own — no database, no account, no
persisted form — which is what makes it a `frontend` project rather than a `fullstack`
one, and what removes the whole family of architectures that answer a persistence
constraint it does not have.

Built on the stack the repository already proved: SolidStart 2 with the Vite 8 and
Nitro 3 plugins, TypeScript in strict mode, pnpm as the package manager. The stack was
inherited from the existing scaffold rather than chosen at installation time.

The layout is `feature-modules`: `src/shared/**` holds what more than one feature uses,
every other directory under `src` is a feature, features may reach shared, and shared
reaches nothing. SolidStart's file routing already owns `src/routes`, which is why a
separate pages layer was refused.

<!-- /agent:summary -->

<!-- agent:commands -->

- `pnpm install` — install dependencies; the lockfile is pnpm's and is authoritative.
- `pnpm dev` — development server.
- `pnpm run build` — production build; prerenders `/` and `/about` into `.output/public`.
- `pnpm run check` — TypeScript, no emit.
- `pnpm run lint` / `pnpm run format` — ESLint, then Prettier in write mode.
- `pnpm run test:unit` — Vitest against jsdom; `pnpm run test:coverage` adds the v8 report.
- `pnpm run test:e2e` — Playwright against the built site; `pnpm run test:a11y` runs the
  accessibility subset of that same suite.
- `pnpm run test:smoke` — serves `.output/public` and checks every declared route answers.
- `pnpm run project-map` — regenerates `docs/project-map.md`; never edit that file by hand.
- `node agent-pipeline/scripts/preflight.mjs` — checks every declared gate is executable.

The browser suite and the smoke gate both need a build first: they run against
`.output/public`, not against the dev server.

<!-- /agent:commands -->

<!-- agent:context -->

Accepted limits, so that nobody spends a day rediscovering them:

- **No mutation testing and no visual regression.** Both appear in the reference bundle
  and neither is declared here, because neither has an implementation in this
  repository. A script name with no checker behind it is not a gate. Adding either
  means installing the tool and proving it fails on purpose first.
- **The static preset is not usable yet.** Nitro 3 is a beta here and `preset: "static"`
  fails after prerendering. The static artefact is produced by `prerender` alone. See
  `docs/decisions/0003-static-deployment.md`.
- **TypeScript is held at 5.x deliberately.** The 7.x package drops the JavaScript
  compiler API that `scripts/project-map.mjs` parses with. See
  `docs/decisions/0002-typescript-5.md`.
- **Four transitive advisories are pinned away** through `pnpm-workspace.yaml`
  overrides, not silenced. `pnpm audit` is clean; re-check the overrides whenever the
  Solid or Vite majors move.
- **The content is still the SolidStart starter.** `src/shared/StarterNote.tsx` and the
  counter are scaffolding, not product. They are documented and mapped so the gates are
  honest, and they are the first thing real content should replace.
- **`agent-pipeline/` is vendored and not modified.** Gates that would otherwise scan it
  are bounded to `src`, `scripts` and `tests`.

<!-- /agent:context -->
