import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiBase = env.VITE_ADMIN_API_BASE || "http://test.psn.n7s.co";
  const proxy = {
    "/system/api/": {
      target: env.PSN_API_TARGET || apiBase,
      changeOrigin: true,
      headers: { host: new URL(apiBase).host },
    },
  };
  return {
    plugins: [react()],
    build: { outDir: "web" },
    server: {
      host: "127.0.0.1",
      port: 5173,
      strictPort: true,
      proxy,
    },
    preview: { host: "127.0.0.1", port: 5173, strictPort: true, proxy },
    resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  };
});
