# What each gate was proven to refuse

Installed 2026-09-04. A green gate on a healthy repository proves nothing: it may be
green because it measures nothing. Every gate below was made to fail on a deliberate
defect, and the defect was then restored. The bench that ran them checked each break
actually landed — a replacement pattern matching nothing leaves a gate green and proves
nothing.

| Gate             | Deliberate defect                                          | Result               |
| ---------------- | ---------------------------------------------------------- | -------------------- |
| `check`          | `const wrong: number = "a string"`                         | exit 2               |
| `lint`           | an exported `(value: any) => value`                        | exit 1               |
| `format`         | hand-spaced function signature                             | exit 1               |
| `build`          | route that does not compile                                | exit 1               |
| `test_unit`      | inverted assertion, 0 becomes 42                           | exit 1               |
| `coverage`       | a module in scope no test exercises                        | exit 1               |
| `test_e2e`       | `<h1>` replaced by a `<span>`                              | exit 1               |
| `accessibility`  | image with no `alt`, link with no name                     | exit 1               |
| `smoke`          | prerendered `/about` removed from the artefact             | exit 1               |
| `architecture`   | `src/shared` importing a feature                           | exit 1               |
| `design_tokens`  | `background: #0a0a0f` outside the token file               | exit 1               |
| `dead_code`      | unused export / unused file / unused dependency            | exit 1, three times  |
| `duplication`    | a component copied under a second name                     | exit 1               |
| `design_limits`  | a function taking five parameters                          | exit 1               |
| `comment_policy` | `// returns the main element`                              | exit 1               |
| `doc_lint`       | export with no contract / contract naming a gone parameter | exit 1, twice        |
| `sast`           | `eval(input)`                                              | exit 1               |
| `secrets_scan`   | AWS documentation example key in a source file             | exit 1               |
| `audit`          | `minimist@1.2.0` installed                                 | exit 1, one critical |
| `project_map`    | an export added without regenerating                       | exit 1               |
| `map_coverage`   | a source file absent from the rendered map                 | exit 1               |

The architecture declaration was checked the same way: setting `architecture.id` to
`hexagonal` on this `frontend` project makes `apply-profile --check` exit 1.

## Two proofs that had to be redone, and why

**`audit` first stayed green.** The break removed the overrides from
`pnpm-workspace.yaml`, but `pnpm audit` reads the lockfile, and the lockfile still
carried the patched versions. A break that does not reach what the gate reads is not a
break. It was replaced by installing a genuinely vulnerable release.

**`doc_lint` first stayed green.** The break deleted an `@returns` line from a function
that takes no parameters, which the tool has no reason to refuse. What it actually
checks is the presence of the contract and the agreement between its `@param` entries
and the real signature, so the break was rewritten to defeat each of those.

Both are the failure mode this table exists to catch: a reassuring green produced by a
defect the gate was never looking at.

## This page set off its own gate

Written out in full, the AWS example key made `secrets_scan` refuse this document —
correctly, since the scan reads the working tree and cannot know a key is an
illustration. The key is described rather than quoted here. `scripts/scan-secrets.mjs`
also accepts a `pipeline:allow-secret` marker on a line that genuinely needs a
key-shaped string; without such an exit the gate gets switched off wholesale the first
time a fixture needs one, and a disabled gate protects nothing.
