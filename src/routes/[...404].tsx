import { Meta } from "@solidjs/meta";
import { HttpStatusCode } from "@solidjs/start";
import NotFoundPage from "~/features/not-found/NotFoundPage";

/**
 * The catch-all route, answering 404 for an address that matches nothing.
 *
 * @returns the not-found page, with the HTTP status set on the response
 */
export default function NotFound() {
  return (
    <>
      <HttpStatusCode code={404} />
      {/*
       * La marque a laquelle le point d'entree reconnait ce document. GitHub
       * Pages sert `404.html` sous l'adresse tapee, quelle qu'elle soit : le
       * document rendu et l'adresse demandee ne disent alors pas le meme
       * ecran, et une hydratation les confronterait. Le point d'entree rend a
       * neuf plutot que d'hydrater, et il a besoin de le savoir AVANT de
       * demarrer, donc depuis la page elle-meme.
       *
       * `tests/e2e/introuvable-servie.spec.ts` nomme ce couple : la renommer
       * d'un cote sans l'autre rougit, au lieu de ramener en silence la
       * violation de politique que cette marque existe pour eviter.
       */}
      <Meta name="x-served" content="not-found" />
      <NotFoundPage />
    </>
  );
}
