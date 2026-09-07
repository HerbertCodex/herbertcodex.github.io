# 0012 — L'aplat et l'accent sont deux jetons, pas un

- **Date** : 2026-09-06
- **Statut** : accepté, signalé par l'opérateur sur capture
- **Portée** : `src/shared/tokens.css` et tout aplat d'accent du site

## Le défaut

En thème sombre, le bloc de contact s'affichait en **noir sur orange vif**. Le
même bloc, en thème clair, est du texte clair sur un vermillon profond. Le
rapport était inversé, et le panneau se lisait comme une bande d'alerte au lieu
d'une affiche.

## Pourquoi un seul jeton ne pouvait pas suffire

`--accent` sert deux métiers que le thème sombre oppose. Mesuré :

```
accent en TEXTE sur la page sombre
  #e04a33 sur #100f0e ........... 4,74  passe
  #c93a24 sur #100f0e ........... 3,75  echoue pour du texte

accent en APLAT sous du texte clair
  #e04a33 sous #f8f7f3 .......... 3,77  echoue
  #c93a24 sous #f8f7f3 .......... 4,76  passe
```

L'accent avait été éclairci pour rester lisible **comme texte** sur la page
noire. Employé comme **aplat**, il devient une surface claire, et seul du texte
sombre y passe — d'où le noir sur orange. Aucune valeur unique ne satisfait les
deux contraintes.

## Décision

Deux jetons nouveaux, à côté de `--accent` :

- `--accent-plate` — la couleur d'un aplat plein. `#b3271a` en clair,
  `#c93a24` en sombre.
- `--on-accent` — le texte posé dessus. `#f8f7f3` dans les deux thèmes.

**La règle vaut dans les deux thèmes : du texte clair sur un aplat saturé.**
C'est ce que le genre suisse fait d'une plaque de couleur, et ce que le thème
sombre ne doit pas inverser.

`--ink-inverse` reprend son seul métier : le texte posé sur un aplat d'**encre**,
où il est juste dans les deux thèmes — sombre sur clair en thème sombre, clair
sur sombre en thème clair.

## Ce que cela a touché

`ContactPage.css` pour le panneau entier et ses deux filets intérieurs,
`JourneyPage.css` pour la pastille du poste en cours, et dans la maquette la
sélection de texte, le fait « CDI ou freelance » et les étiquettes de
technologie principale.

Vérifié : `#c93a24` reste à 3,75 sur la page sombre, au-dessus du seuil de 3 que
WCAG 1.4.11 demande d'un élément non textuel, donc l'aplat se distingue toujours
nettement du fond.

## La maquette ne porte toujours qu'un thème

Les valeurs sombres n'ont pas été ajoutées à `mockups/portfolio-v1.html`, et une
tentative en ce sens a été refusée par `mockup-check` : son parseur ne retient
que la dernière déclaration de chaque nom, donc un second thème effacerait le
premier. Une maquette montre un assemblage ; le thème sombre est porté par les
jetons et se vérifie dans l'application, en la rendant.
