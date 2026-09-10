import { defineConfig } from "vite";
import { nitro } from "nitro/vite";

import { solidStart } from "@solidjs/start/config";
import { PRERENDERED } from "./scripts/routes.mjs";

export default defineConfig({
  plugins: [
    solidStart(),
    nitro({
      prerender: {
        crawlLinks: true,
        routes: [...PRERENDERED],
      },
      hooks: {
        "prerender:generate"(route: { route: string; error?: unknown; skip?: boolean }) {
          if (route.route === "/404.html") {
            route.error = undefined;
            route.skip = false;
          }
        },
      },
    }),
  ],
});
