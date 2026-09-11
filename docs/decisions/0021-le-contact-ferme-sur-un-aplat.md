# 0021 — Le contact ferme la page sur un aplat

- **Date** : 2026-09-11
- **Statut** : accepté, tranché par l'opérateur
- **Portée** : la section contact ; renverse le point 2 du périmètre signé du round 9 de `s-5bjp`

## Contexte

L'opérateur a montré la section contact **telle que la maquette de référence la
dessine** — un aplat vermillon plein, la disponibilité en grand, les conditions
et les liens en encre inverse — et a dit qu'il l'aimait ainsi.

Le site ne la dessinait pas ainsi, et ce n'était pas une dérive : le **round 9
de `s-5bjp`** l'avait tranché en sens inverse, avec sa raison écrite.

> **2. CONTACT EN FICHE.** L'adresse et les liens à gauche sur fond papier, les
> conditions à droite. Le bandeau vermillon plein disparaît. Une pastille
> « Disponible immédiatement » en aplat.
>
> […] au lieu d'un aplat rouge plein qui couvre **les deux tiers de la page** et
> repousse les conditions plus bas.

Un critère de `tests/e2e/mise-en-page.spec.ts` en faisait une règle exécutable :
_« plus aucun aplat vermillon ne fait un bandeau »_.

**La maquette de référence, elle, n'a jamais été mise à jour après ce round.**
C'est la troisième divergence entre elle et le site trouvée en deux jours, après
le menu qui pointait vers quatre adresses et le menu qui nommait trois sections
sur cinq.

## Décision

**Le contact ferme la page sur un aplat plein**, comme la maquette le dessine.
La fiche disparaît : plus de deux colonnes, plus de pastille.

Ce qui rend ce retournement cohérent plutôt que contradictoire :

> La raison écrite au round 9 porte sur **une page de contact**. Depuis la
> décision 0018, le site publie **une page unique** et le contact en est la
> dernière **section**. L'aplat n'y couvre plus une page : il la ferme. Et les
> conditions ne sont pas repoussées « plus bas » — elles sont posées dessus, au
> même endroit.

La prémisse du critère a changé ; le jugement de l'opérateur n'a pas eu à
changer pour que la conclusion s'inverse.

## Ce qui a été mesuré plutôt que supposé

- **Le contraste.** La porte `accessibility` passe axe avec les étiquettes
  `wcag2a`, `wcag2aa`, `wcag21a` et `wcag21aa` sur les deux pages publiées,
  aplat compris. Le couple `--accent-plate` / `--on-accent` est celui que la
  décision 0012 tient distinct de l'accent pour cette raison précise.
- **Un défaut trouvé à l'écran, avant la livraison.** Les libellés des
  conditions — CONTRAT, LIEU, DÉBUT — que `src/app.css` compose en gris,
  **disparaissaient dans le fond**. Ils prennent l'encre inverse, et un critère
  l'exige désormais pour _tout_ texte posé sur l'aplat, pas seulement pour eux.
- **Le filet des liens.** `src/app.css` le pose en `--accent`, qui sur cet aplat
  est la couleur du fond. Il passe en encre inverse, et c'est vérifié.

## Ce qui est retiré

- `.card`, `.reach`, `.reach-call` : les dispositifs de la fiche.
- `.status`, la pastille — y compris son nom dans le vocabulaire partagé de
  `src/app.css`. Sur un aplat, une pastille du même aplat ne signale plus rien.
  Une classe sans porteur se lit comme active.

## Ce qui le prouve

Les trois critères qui décrivaient la fiche sont **retournés à l'endroit même où
ils étaient écrits** : la section entière porte l'aplat et l'encre inverse, rien
de ce qui est posé dessus ne garde une couleur de papier, et le filet des liens
se voit. Ce qui était interdit est désormais exigé.

Morsure vérifiée : en rendant le fond transparent, le premier critère tombe.

Le périmètre signé du round 9 porte l'amendement daté, avec sa cause.

Voir aussi [[0012-aplat-distinct-de-l-accent]] et [[0018-une-page-par-langue]].
