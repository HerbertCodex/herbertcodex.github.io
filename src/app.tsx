import { MetaProvider } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import "./app.css";

/**
 * The application shell: metadata provider and route outlet.
 *
 * It is the composition root, so it is the one place allowed to reach into
 * every layer; the architecture gate exempts it for that reason.
 *
 * @returns the router wrapping every route
 */
export default function App() {
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <Suspense>{props.children}</Suspense>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
