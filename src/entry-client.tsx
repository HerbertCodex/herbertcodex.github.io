// @refresh reload
import { render } from "solid-js/web";
import { mount, StartClient } from "@solidjs/start/client";

/*
 * Le document que l'hebergeur sert n'est pas toujours celui que l'adresse
 * demande. GitHub Pages rend `404.html` sous l'adresse tapee, quelle qu'elle
 * soit : sous /fr/inconnu, le navigateur recoit l'ecran introuvable bilingue,
 * alors que le routeur veut rendre l'ecran francais. Hydrater confronte les
 * deux, et cela a ete mesure le 2026-09-10 : « TypeError: t is not a
 * function », puis une violation de la politique de contenu, parce que la
 * reprise applique un style en attribut que `style-src` refuse.
 *
 * Ce document se reconnait a la marque que la route attrape-tout y pose. Il
 * est alors rendu A NEUF, pour l'adresse reellement demandee : le visiteur
 * voit l'ecran de sa langue, sous la barre, comme s'il y avait navigue. Le
 * document bilingue se montre une fraction de seconde avant d'etre remplace,
 * sur l'ecran le moins vu du site, et c'est le prix accepte.
 *
 * Partout ailleurs, le document rendu EST celui que l'adresse demande, et
 * l'hydratation reprend le travail deja fait plutot que de le refaire.
 */
const root = document.getElementById("app")!;

if (document.querySelector('meta[name="x-served"][content="not-found"]') === null) {
  mount(() => <StartClient />, root);
} else {
  root.textContent = "";
  render(() => <StartClient />, root);
}
