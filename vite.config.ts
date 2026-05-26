// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";

// Production: Nitro preset "vercel" (SSR + server functions on Vercel).
// Dev: pas de plugin Cloudflare au build — cloudflare: false ci-dessous.
export default defineConfig({
  cloudflare: false,
  plugins: [
    nitro({
      preset: "vercel",
    }),
  ],
  // Wrapper Cloudflare (src/server.ts) : uniquement si build Worker local, pas sur Vercel
  tanstackStart: process.env.VERCEL
    ? {}
    : {
        server: { entry: "server" },
      },
});
