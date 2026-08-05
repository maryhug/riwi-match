import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// The default config targets Cloudflare Workers. Railway runs the generated
// TanStack Start server as a regular Node process instead.
export default defineConfig({
  nitro: { preset: "node-server" },
  tanstackStart: {
    server: { entry: "server" },
  },
});
