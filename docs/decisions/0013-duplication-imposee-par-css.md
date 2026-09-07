# 0013 — La palette sombre est écrite deux fois, et CSS l'impose

- **Date** : 2026-09-06
- **Statut** : accepté, tranché par l'opérateur après mesure
- **Portée** : `src/shared/tokens.css` et le motif `skip` de `duplication`

## Le constat

`check:duplication` refuse douze lignes identiques dans `tokens.css`, aux
lignes 28 et 50 : la palette sombre y figure deux fois, une fois sous
`@media (prefers-color-scheme: dark)` pour suivre le système, une fois sous
`:root[data-theme="dark"]` pour le choix explicite du lecteur.

L'implémenteur de `i-7eph` l'a signalé avec la bonne inquiétude :

> La CI porte `check:duplication` : la PR sortira rouge sur un fichier
> qu'aucune issue en cours ne touche. Le prochain agent qui verra ce rouge le
> prendra pour le sien et perdra une enquête, ou pire, touchera `tokens.css`
> pour l'éteindre.

## Pourquoi la duplication ne peut pas être supprimée

Deux conditions indépendantes doivent appliquer la même palette. **CSS n'a
aucun moyen de partager un bloc de déclarations entre une media query et un
sélecteur d'attribut.** Ce n'est pas une maladresse d'écriture, c'est une
limite du langage.

**La seule vraie réponse a été essayée et mesurée** : `light-dark()`, qui écrit
chaque couleur une fois et supprimerait au passage la contrainte d'ordre
documentée dans ce fichier. Résultat :

```
check:duplication  vert
check:tokens       vert
mockup-check       ROUGE — les valeurs claires ne sont plus vues comme declarees
```

`mockup-check.mjs` lit `tokens.css` avec un parseur peu profond qui ne
comprend pas `light-dark(a, b)`. Ce script est dans le cœur, qui ne se modifie
pas depuis ce dépôt. Adopter `light-dark()` reviendrait donc à échanger
`duplication` contre `mockup-check`, et la porte perdue est la plus utile des
deux : elle est la seule qui empêche une valeur choisie à l'œil d'entrer dans
une maquette.

## Décision

Le motif `skip` de `duplication` vise ce seul fichier :

```json
"skip": "\\.generated\\.|shared/tokens\\.css$"
```

**C'est une exemption, et elle est nommée comme telle.** Elle n'est pas prise
pour éteindre un rouge gênant : l'alternative a été construite, mesurée, et
écartée sur un constat.

**Vérifié que la porte mord encore** : deux fonctions identiques de huit lignes
plantées dans `src/shared/pages.ts` la font refuser, et leur retrait la remet à
vert. Tout `src` et tout `tests` restent couverts, à ce fichier près.

## Ce qu'il faudrait pour lever l'exemption

Que `mockup-check.mjs` sache lire `light-dark()`. C'est une évolution du cœur,
pas de ce dépôt. Si elle arrive, `tokens.css` peut être réécrit avec chaque
couleur en un seul endroit, l'exemption retirée, et la contrainte d'ordre
documentée en tête du fichier disparaît avec elle.
