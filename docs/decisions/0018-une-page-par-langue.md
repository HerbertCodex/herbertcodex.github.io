# 0018 — Une page par langue, les sections en ancres

- **Date** : 2026-09-10
- **Statut** : accepté, tranché par l'opérateur
- **Portée** : tout le site ; annule une partie du périmètre signé du round 2 du rythme vertical

## Contexte

La maquette de référence, `mockups/portfolio-v1.html`, déclarée dans
`design_system.mockup`, se contredit — et le site avait suivi la moitié qui
n'était pas la bonne.

- **Son document est une page unique** : un `h1`, un chapô, la rangée de faits,
  puis cinq sections numérotées `01` à `05` — Réalisations, Expérience,
  Formation, Compétences, Contact. Son lien d'évitement dit « Aller aux
  réalisations » et pointe vers `#realisations`, c'est-à-dire vers un contenu
  du même document.
- **Son menu déclare quatre adresses** : `/fr/realisations`, `/fr/parcours`,
  `/fr/contact`, avec `aria-current="page"` sur la première.

Le site a été construit sur le menu : quatre pages par langue, huit adresses,
une liste de trois cellules sur l'accueil pour conduire aux trois autres.

Deux conséquences mesurées :

- cette liste de cellules, `.entries`, **n'est dessinée par aucune des deux
  maquettes** — ni `portfolio-v1.html`, ni la planche `accueil-contact.html`.
  Elle existait uniquement parce qu'il y avait quatre pages ;
- un visiteur qui ouvrait `/fr` voyait un titre, une phrase, quatre faits et
  trois liens. Il ne voyait **pas une seule réalisation** avant d'avoir cliqué.

## Décision

**Le site publie une page par langue, et les trois autres parties en sont des
sections atteintes par une ancre.**

```
/fr                 toute la page : ouverture, 01 à 05
/en                 idem en anglais
menu                #realisations  #parcours  #contact   (#work #about #contact)

/fr/realisations    document de renvoi vers /fr#realisations
...six au total
```

Ce qui est tranché, point par point :

1. **Les noms de `src/shared/pages.ts` deviennent des ancres.** La table reste
   la source unique ; `addressOf` rend `/fr#realisations` au lieu de
   `/fr/realisations`, et `anchorOf` donne l'identifiant que la section porte.
2. **Les six anciennes adresses répondent encore**, comme documents de renvoi.
   Un lien déjà partagé ne se rappelle pas : le CV et le profil LinkedIn les
   portent dehors. L'hébergeur est statique et n'offre aucune redirection, donc
   le renvoi est le document lui-même, et il porte trois choses — un
   rafraîchissement à délai nul, un lien canonique vers l'ancre, et un lien
   visible pour qui refuse le saut automatique ou n'a pas de script.
3. **La composition vit dans la route**, `src/routes/[locale]/index.tsx`, et non
   dans une fonctionnalité : la porte d'architecture refuse qu'une
   fonctionnalité importe une autre, et assembler la page est le travail d'une
   route.
4. **La numérotation est calculée**, jamais écrite : les certifications
   n'apparaissent que s'il en existe une, donc le rang du contact ne peut pas
   être fixé d'avance.
5. **Les écrans deviennent des sections, et leurs fichiers le disent** :
   `HomePage` → `Opening`, `WorksPage` → `WorksSection`, `JourneyPage` →
   `JourneySection`, `ContactPage` → `ContactSection`. Un titre de carte de
   réalisation passe de `h2` à `h3` ; la maquette met les groupes de
   compétences en `h4` sous un `h2`, et ce **saut de niveau n'est pas repris** —
   ils restent en `h3`.
6. **La liste `.entries` est retirée**, avec ses règles. Aucune maquette ne la
   dessine et le menu conduit aux sections qu'elle listait.
7. **Le menu ne dit plus sur quelle page on est.** Il n'y en a qu'une. Un
   marqueur qui suivrait la section visible serait une fonctionnalité de plus :
   la maquette n'en dessine aucun, et son unique script n'animer que les
   schémas. La règle CSS qui peignait le lien en cours est retirée plutôt que
   laissée sans sujet.
8. **Le sélecteur de langue ne reporte pas l'endroit où le lecteur a défilé.**
   Un document prérendu ne peut pas le savoir ; l'y renvoyer au hasard serait
   pire que de l'accueillir en haut.
9. **Le menu de la maquette est corrigé** vers les ancres : la contradiction qui
   a produit ce détour ne doit pas rester dans le document de référence.

## Ce que cette décision annule

Le périmètre signé du round 2 du rythme vertical — `docs/decisions/perimetre-approuve-rythme-vertical-round2.json` — portait
ce critère :

> l'accueil et le contact tiennent sans défilement vertical dans une fenêtre de
> 640 px de hauteur utile

**Il est annulé** : une page qui porte tout défile par construction. Le document
signé porte l'amendement qui le dit, daté, avec sa cause.

Ce qui reste de son intention est mesuré autrement, et l'est :
`tests/e2e/rythme-accueil.spec.ts` exige que **le premier bandeau de section
soit visible dans 640 px de fenêtre**, aux deux largeurs et dans les deux
thèmes. Une ouverture qui pousserait les réalisations sous la ligne de
flottaison referait exactement le vide que le critère refusait.

Le tableau des plafonds de hauteur de `tests/e2e/rythme-vertical.spec.ts` est
retiré pour une autre raison, consignée en 0016 : la hauteur d'une page qui
porte tout ne peut pas être remesurée sur cette station, qui ne résout aucune
des quatre faces de `--font-grotesk`. Un plafond mesuré ici contredirait la CI
et le visiteur.

## Conséquences

- `PRERENDERED` compte toujours dix documents : deux pages, six renvois, la
  racine et l'écran introuvable. La porte `smoke` ne change pas de chiffre.
- Huit suites navigateur itéraient les huit adresses. Elles itèrent les deux
  pages publiées, lues dans la table par `publishedAddresses`.
- `src/shared/identity.ts` déclare `SITE`, l'origine de publication, pour les
  adresses qui doivent être absolues — le lien canonique en est une.
- Les clefs `nav.home`, `home.title`, `works.title`, `journey.title` et
  `contact.title` sont retirées des dictionnaires : plus rien ne les dit. Le
  titre de l'onglet est composé du nom et du rôle, deux valeurs déjà déclarées.
