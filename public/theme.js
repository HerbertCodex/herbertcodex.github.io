/*
 * Pose le theme choisi AVANT la premiere peinture.
 *
 * Le site est prerendu : le HTML servi est le meme pour tout le monde et ne
 * connait pas le lecteur. Le choix ne peut donc etre lu que dans le
 * navigateur, et il doit l'etre avant que la page ne s'affiche. Un effet
 * apres l'hydratation arriverait apres la premiere peinture, ce qui donne
 * exactement le clignotement blanc que cette issue existe pour empecher.
 *
 * Ce fichier est servi tel quel, hors du bundle : il ne peut rien importer,
 * et c'est pourquoi le nom de la cle est ecrit ici une seconde fois. Le seul
 * autre endroit ou il est ecrit est `THEME_KEY` dans src/shared/theme.ts, et
 * la suite navigateur tient les deux ensemble : elle enregistre le choix par
 * le bouton, puis le relit par ce fichier apres un rechargement complet.
 *
 * Rien n'est pose quand le lecteur n'a pas choisi : sans attribut, les jetons
 * suivent `prefers-color-scheme`, y compris s'il change page ouverte.
 */
(() => {
  try {
    const chosen = globalThis.localStorage.getItem("portfolio-theme");
    if (chosen === "light" || chosen === "dark") {
      globalThis.document.documentElement.setAttribute("data-theme", chosen);
    }
  } catch {
    /* Un navigateur qui refuse le stockage rend simplement le theme du systeme. */
  }
})();
