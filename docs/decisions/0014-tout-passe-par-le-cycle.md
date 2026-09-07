# 0014 — Tout passe par le cycle, y compris ce qui paraît petit

- **Date** : 2026-09-06
- **Statut** : accepté, tranché par l'opérateur après mesure
- **Portée** : toute modification de ce dépôt

## La question posée

Le bouton de thème a coûté une heure quarante d'agents pour 183 lignes de
source. L'opérateur a demandé, à juste titre, si ce n'était pas censé être
rapide.

Répartition mesurée :

```
Produit, les criteres ......... 14 min
Implementeur, la livraison .... 45 min
QA, la revue .................. 27 min
Correction du defaut .......... 22 min
```

## Décision

**Toute modification passe par le cycle complet** — Produit définit,
l'implémenteur écrit après un rouge observé, QA valide sans écrire. Y compris
un libellé, une couleur, un espacement.

L'alternative proposée était de traiter les petites choses en direct. Elle a
été écartée en connaissance du coût : compter environ une heure par demande.

## Ce qui a fondé le choix

Trois défauts réels ont été trouvés dans la même journée, et **aucun n'était
détectable par un outil** :

- **Le débordement à 320 px** sur la page des réalisations, sous un `axe-core`
  vert. axe n'implémente pas WCAG 2.1 AA 1.4.10 (Reflow) : le vert d'un outil
  n'est pas le vert du critère.
- **L'exclusion de couverture par motif de nom**, qui exemptait `SiteBar.tsx`
  sans que rien ne le signale. QA l'avait parquée en la nommant une issue avant
  qu'elle morde.
- **L'annonce du bouton de thème**, qui mentait à un lecteur d'écran sur une
  machine dont le système est sombre. Le test existant ne prouvait que le
  basculement, jamais l'état de départ : le défaut vivait dans le trou entre
  les deux.

Chacun aurait été livré par une version rapide, et aucun n'aurait été vu.

## Ce qui reste à améliorer, et qui n'est pas le cycle

Une partie de l'attente n'était pas due au cycle mais à l'orchestration :

- une exploration de `light-dark()` menée jusqu'au bout avant de découvrir que
  `mockup-check` ne sait pas la lire. **Vérifier le lecteur avant d'écrire pour
  lui** aurait économisé le détour ;
- des remises refusées pour des champs qu'un agent ne pouvait pas mesurer,
  faute de `date` dans ses outils, décision 0007 ;
- des vagues parallèles qui ont coûté plus qu'elles n'ont fait gagner,
  décision 0011.

Le cycle n'est pas ce qui ralentit. Ce qui ralentit, c'est ce qu'on lui donne
mal.
