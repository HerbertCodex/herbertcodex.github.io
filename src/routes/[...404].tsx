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
      <NotFoundPage />
    </>
  );
}
