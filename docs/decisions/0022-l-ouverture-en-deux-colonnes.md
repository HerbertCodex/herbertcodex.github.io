# 0022 — L'ouverture pose le chapô et les faits côte à côte

- **Date** : 2026-09-11
- **Statut** : accepté, tranché par l'opérateur sur trois propositions
- **Portée** : l'ouverture de la page ; la maquette de référence suit

## Contexte

L'opérateur a montré l'ouverture sur un écran large et dit qu'il y avait **trop
d'espace à côté**.

Mesuré sur le site publié, à 1440 px puis à 1920 px :

|                                 | largeur    |
| ------------------------------- | ---------- |
| la colonne de page              | 1392 px    |
| le titre, les faits, les cartes | 1392 px    |
| **le chapô**                    | **896 px** |

Le chapô s'arrête à `--measure`, sa ligne de lecture de 64 caractères, et
laissait donc **près de 500 px de vide à sa droite** — dans une page dont tout
le reste prend la largeur entière.

## Décision

**Les faits passent à droite du chapô** dès que la place existe.

Trois propositions ont été mises devant l'opérateur ; il a retenu celle-ci.

- _Élargir le chapô_ — écarté : la ligne de lecture de 64 caractères est une
  règle écrite du dépôt, et un critère l'exige déjà.
- _Resserrer toute la page_ — écarté : c'est le seul choix qui aurait rétréci
  les schémas des réalisations, alors que le défaut ne porte que sur
  l'ouverture.
- **Les faits à droite** — retenu : le vide se remplit avec ce que la page dit
  déjà, et le rythme répond à celui des cartes de réalisation, elles aussi en
  deux colonnes.

### Ce que la grille déclare

`minmax(0, 2fr) minmax(0, 1fr)` au-delà de `--bp-lg`, et une seule colonne en
deçà.

Deux tiers / un tiers plutôt qu'une seconde piste en `auto` : en `auto`, les
faits se collaient au bord droit et **le vide se déplaçait simplement entre les
deux colonnes** — 300 px mesurés à 1920 px avant correction. Sur la grille, ils
commencent à une ligne, juste après la mesure du chapô : 64 px d'écart à
1440 px, 86 px à 1920 px.

### Qui porte la respiration du bas

**Le bloc**, et ni le chapô ni les faits. Côte à côte, la plus haute des deux
colonnes déciderait sinon du rythme de ce qui suit — et laquelle est la plus
haute dépend de la largeur ET de la langue : le chapô l'emporte jusqu'à 1280 px,
les faits au-delà.

Pour la même raison, **le chapô rend sa marge du bas au bloc** quand les deux
sont côte à côte : elle sépare deux blocs empilés, elle ne sépare plus rien à
côté, et elle gonflait le bloc de 24 px sans que son bord le dise.

## Ce qui le prouve

Deux critères dans `tests/e2e/rythme-accueil.spec.ts` :

1. **les faits sont à côté du chapô à 1024 px et dessous à 900 px**, dans les
   deux langues — les deux largeurs encadrent le jeton `--bp-lg` ;
2. **la dernière ligne de l'ouverture appelle le premier bandeau à
   `--space-6`**, aux deux largeurs et dans les deux langues.

Le second se mesure depuis **la dernière encre des deux colonnes**, non depuis
le bord du bloc, et c'est ce qui le rend mordant : une marge oubliée gonfle le
bloc sans déplacer son bord, alors que l'œil, lui, la voit. Vérifié en remettant
la marge du chapô — 88 px à 1024, 66 px à 1440, au lieu de 64.

Morsure vérifiée aussi sur la grille : en repassant le bloc en `display: block`,
le premier critère tombe et lui seul.

La maquette de référence porte le même dessin, pour ne pas ajouter une
quatrième divergence à celles des deux derniers jours.
