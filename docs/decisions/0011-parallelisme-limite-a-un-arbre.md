# 0011 — Le parallélisme est borné par l'arbre de travail, pas par les réservations

- **Date** : 2026-09-06
- **Statut** : accepté, tranché par l'opérateur après mesure
- **Origine** : la vague de quatre issues `i-9dqd`, `i-802r`, `i-2wjm`, `i-hxac`

## Ce qui a été mesuré

`next-issues` a déclaré quatre issues parallélisables et elles l'étaient au
sens qu'il calcule : leurs chemins réservés ne s'intersectent pas. Lancées
ensemble sur **un seul arbre de travail**, elles ont produit du code correct —
toutes les portes vertes, le site rempli dans les deux langues — et trois
défauts de traçabilité.

**Un commit porte le travail de deux issues.** `fd6af2f`, étiqueté
`test(i-802r)`, contient aussi les fichiers de test de `i-hxac`. Deux agents
qui lancent `git commit` en même temps sur le même index : le premier ramasse
ce que le second a préparé.

**Un test a bougé entre le rouge et le vert.** `i-hxac` a réécrit
`tests/unit/contact-links.test.ts` dans son commit `feat:`, parce que
`i-2wjm` avait entre-temps introduit `src/shared/resume.ts` dont son test
devait dépendre. Un test modifié après avoir été vu rouge ne prouve plus rien
sur le code qui le rend vert, et c'est l'invariant que la séparation
`test:` / `feat:` existe pour tenir.

**Une issue a dépassé ses réservations.** `i-2wjm` en réservait quatre et a
touché neuf fichiers, dont `content.ts` et `i18n.ts` qui appartiennent à des
issues closes.

## Ce que `next-issues` sait et ne sait pas

Il calcule l'intersection des **chemins réservés**. Il ne sait rien de l'index
git partagé, ni du fait que `git add` ramasse ce qui est présent et pas ce qui
appartient à celui qui l'appelle. Deux issues aux fichiers disjoints partagent
quand même un index, une tête de branche et un répertoire `.output`.

Une quatrième conséquence l'a montré dès la vague précédente et un agent l'a
signalée : `smoke` est sorti en 1 avec six routes en 404 alors que la suite
navigateur venait de passer sur le même artefact, parce qu'un autre agent
avait lancé `pnpm run build`, dont la première étape `clean-output.mjs`
supprime le répertoire de sortie sous les pieds du premier.

## Décision

**Le parallélisme s'arrête à deux issues, et seulement quand aucune ne
construit.** Au-delà, ou dès qu'une issue lance `build`, `smoke` ou
`test:e2e`, les issues se dispatchent en série.

La vraie réponse est un arbre de travail par agent — `git worktree` par issue,
index et répertoire de sortie séparés. Elle n'est pas prise ici parce qu'elle
demande de modifier `dispatch.mjs`, qui est dans le cœur, et que le cœur ne se
modifie pas depuis ce dépôt.

## La dette assumée sur cette vague

L'opérateur a choisi de passer les quatre en revue plutôt que de refaire la
vague. Ce qui est prouvé reste prouvé : le rouge de `i-hxac` est rejouable sur
`fd6af2f` et échoue sur assertion, pas au chargement.

Ce qui ne l'est pas et qui est consigné plutôt que masqué : `i-802r` a un
commit `test:` qui ne contient pas que ses tests, `i-hxac` n'a pas de commit
`test:` à son nom et son test a changé entre le rouge et le vert, `i-2wjm` a
écrit hors de ses réservations. QA juge le code en connaissant ces trois
faits ; il ne les redécouvre pas comme des défauts d'agent.

**L'erreur d'orchestration est nommée** : la vague précédente, à deux issues,
avait déjà montré des commits entrelacés et des SHA intermédiaires cassés. La
conséquence n'en a pas été tirée, et la mise a été doublée à quatre.
