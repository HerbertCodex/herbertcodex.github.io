# 0004 — Studio suisse, jetons possédés, primitives écrites ici

- **Date** : 2026-09-05 (remplace la version du 2026-09-04, qui retenait « éditorial sobre »)
- **Statut** : accepté, validé par l'opérateur comme base de travail

## Contexte

`apply-profile` refuse un projet frontend sans bloc `design_system`, et la raison est
celle de l'architecture un niveau plus bas : jetons, primitives, composants et écrans
forment un ordre qu'on ne peut pas inverser après coup. Laissé indéclaré, l'agent qui
prend la première issue tranche tout seul, parce qu'il lui faut une couleur et un
espacement pour écrire quoi que ce soit.

## Décision

```json
{
  "tokens": "src/shared/tokens.css",
  "primitives": "own",
  "direction": { "genre": "studio suisse" },
  "mockup": "mockups/portfolio-v1.html"
}
```

**Genre : studio suisse.** Ce genre convient au produit parce que celui-ci est un
inventaire — des réalisations, un parcours, des compétences — et que la grille suisse
est faite pour ordonner un inventaire sans l'uniformiser. La hiérarchie y passe par
l'échelle typographique et la position dans la grille, jamais par la couleur ni par
l'effet.

Ce qui le caractérise ici : une grille de douze colonnes dont les filets sont visibles à
l'écran, des sections numérotées, un aplat vermillon plein pour le contact, une
grotesque dense avec une forte amplitude d'échelle (84px contre 17px), et un mouvement
mécanique qui part vite, arrive à plat, et ne rebondit jamais.

**Helvetica plutôt qu'une police d'affichage.** L'école suisse composait avec ce que
l'imprimeur avait déjà. Reprendre Syne ou Space Grotesk ici serait le signe d'un
pastiche, pas du genre.

## Huit directions écartées, et pourquoi les nommer

Avant d'arriver ici, huit directions ont été proposées et rejetées : éditorial sobre,
bento technique, rail fixe cuivre, rail avec matière, premium sombre à verre et halos,
sobre monochrome, console à chasse fixe, CV en ligne.

Elles sont listées non par nostalgie mais parce qu'une direction écartée qu'on ne
consigne pas revient : quelqu'un la reproposera dans six mois, avec les mêmes arguments,
et il faudra refaire le chemin. Deux enseignements en sont sortis :

- **Le vide se lit comme un défaut de design.** Les rejets successifs portaient souvent
  le mot « plat » ou « pas pro », sur des maquettes dont les visuels disaient « capture à
  fournir » et les résultats « chiffre à fournir ». Aucune mise en page ne compense
  l'absence de contenu, et chercher à corriger par le style ce qui manque en substance
  fait tourner en rond.
- **Une direction se départage sur une planche, pas en série.** Neuf propositions
  successives n'ont pas convergé ; une planche de quatre directions contrastées sur le
  même extrait a produit une réponse en un tour.

## Conséquences

- `src/shared/tokens.css` est dans `human_review_paths` : une modification de la palette
  ou de l'échelle n'est pas approuvée par une machine seule.
- La maquette `mockups/portfolio-v1.html` est déclarée dans `design_system.mockup` et
  vérifiée par `mockup-check` : 271 valeurs contrôlées contre 48 jetons, aucune valeur
  inventée. Elle est la référence des écrans à venir.
- Le bloc sombre du fichier de jetons est placé **avant** les valeurs claires, pour une
  raison technique documentée dans le fichier lui-même et dans `pitfalls.md`.
- Ce qui manque pour que la base soit complète n'est pas du design : quatre captures
  d'écran et quatre résultats chiffrés. Les emplacements sont visibles dans la maquette
  plutôt que comblés par du texte creux.
