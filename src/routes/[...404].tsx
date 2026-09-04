import { Title } from "@solidjs/meta";
import { HttpStatusCode } from "@solidjs/start";
import StarterNote from "~/shared/StarterNote";

/**
 * The catch-all route, answering 404 for an address that matches nothing.
 *
 * @returns the not-found page, with the HTTP status set on the response
 */
export default function NotFound() {
  return (
    <main>
      <Title>Not Found</Title>
      <HttpStatusCode code={404} />
      <h1>Page Not Found</h1>
      <StarterNote />
    </main>
  );
}
