# 0008 — La CI installe les navigateurs, et personne ne l'avait regardée

- **Date** : 2026-09-05
- **Statut** : accepté, corrigé
- **Origine** : QA a refusé de clore `i-3388` faute de pouvoir lire le run

## Ce qui s'est passé

QA a vérifié les quatre critères de `i-3388` et a quand même refusé de clore.
Sa raison :

> `ci.provider: "github"`, le SHA validé 58d3901 est bien poussé, mais je n'ai
> aucun moyen de lire le run. `gh` est refusé, aucune variable `GH_*` n'existe
> dans l'environnement, et le dépôt est privé.

Il a routé une faute d'infrastructure au lieu de clore sans preuve. C'était le
bon geste : la clôture exige un run vert observé, et il ne pouvait pas
l'observer.

L'orchestrateur, lui, a `gh`. Le run existait — et il était **rouge**.

## La cause

```
Error: browserType.launch: Executable doesn't exist at
/home/runner/.cache/ms-playwright/chromium_headless_shell-1234/...
Looks like Playwright was just installed or updated.
Please run: pnpm exec playwright install
```

Quinze tests navigateur en échec, aucun pour un défaut de code.
`pnpm install --frozen-lockfile` installe les paquets, pas les navigateurs :
Playwright les télécharge dans un cache hors `node_modules`, par une commande
séparée que la CI n'exécutait jamais.

## La correction

Le cœur n'expose qu'un levier, `ci.install`, et c'est le bon :

```
corepack enable && pnpm install --frozen-lockfile
  && pnpm exec playwright install --with-deps chromium
```

`chromium` seul, parce que `playwright.config.ts` ne déclare que ce projet.
Installer les trois moteurs allongerait chaque run pour deux navigateurs que
rien ne joue.

Puis `apply-profile`, sans quoi rien ne change — la leçon du piège 1 de la
décision 0007, appliquée pour la troisième fois.

## Ce que cet épisode dit vraiment

**La CI était rouge depuis sa première exécution, et trois poussées sont
passées dessus sans que personne regarde.** Le run rouge de la maquette date
du 2026-09-05 à 12:47 ; celui de `i-3388` de 14:28. Aucun n'a été lu.

C'est exactement le défaut que ce cadre existe pour empêcher, et il a fallu un
agent qui refuse de clore sans preuve pour le révéler. Les portes locales
étaient toutes vertes : `test:e2e` passe ici parce que les navigateurs sont
dans le cache de la machine. Vert en local, rouge en CI, et l'écart invisible
tant que personne n'ouvre le run.

**La règle qui en découle** : un run rouge que personne ne lit ne vaut pas
mieux qu'une porte absente. La clôture d'une issue confronte désormais le run
au SHA validé, ce que la remise de QA rend obligatoire — c'est le mécanisme qui
a fonctionné ici, pas la vigilance.

## Conséquence ouverte

QA ne peut toujours pas lire un run. Deux voies existent : lui accorder `gh`
dans `agent_runtime.args`, ou laisser cette vérification à l'orchestrateur, qui
l'a par construction. La seconde a l'avantage de garder le contrôle du côté qui
persiste la clôture. Rien n'est tranché ici : le cas ne se represente qu'à la
prochaine clôture.
