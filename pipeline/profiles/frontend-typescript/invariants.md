- TypeScript strict mode covers production and test code; no explicit or implicit `any` escapes the compiler. (`check`)
- Imports follow the direction the architecture declares: a feature may reach `src/shared`, and `src/shared` may reach nothing. (`architecture`)
- Colours, typography, spacing and radii originate in `src/shared/tokens.css`; no stylesheet states a literal of its own. (`design_tokens`)
- Interactive elements expose names, focus and keyboard operation to the accessibility tree, on every prerendered page. (`accessibility`)
- Function complexity, length, parameter count and nesting stay below the calibrated limits. (`design_limits`)
- A derived class does not override a method to throw unconditionally, and behaviour is not decided by a chain of `instanceof`. (`design_limits`)
- Unused exports, orphan modules and unused dependencies are refused rather than kept for later. (`dead_code`)
- Repeated component, fixture and test setup blocks are extracted at their first proven reuse. (`duplication`)
- Every module appears in the generated project map, and the map is regenerated in the same change as the export it must cite. (`project_map`, `map_coverage`)
- Every exported symbol carries a contract naming its parameters and what it returns. (`doc_lint`)
- Comments carry a contract or a reason; a comment restating the line below it is refused. (`comment_policy`)
- Each user-visible flow is exercised in a real browser against the built site, not only through isolated functions. (`test_e2e`)
- The prerendered build answers on every declared route before anything is deployed. (`smoke`, `build`)
- No credential is written into the tree, in source or in fixtures. (`secrets_scan`)
- No dependency carrying a high or critical known vulnerability is delivered. (`audit`)
- Source formatting is the formatter's output, never a hand-made variant of it. (`format`, `lint`)

Two limits these gates do not cover, stated here rather than left to be assumed:

- A Liskov violation through a narrowed precondition, or a return that no longer honours the
  contract, is invisible to any syntax query. It stays in human review.
- Two modules applying the same business rule with different code are invisible to `duplication`,
  which compares lines, and to any import graph. That one is found by reading.
