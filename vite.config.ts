import { defineConfig, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    chromeWebContainerPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

// Plugin para configurar headers necessários para WebContainer
function chromeWebContainerPlugin() {
  return {
    name: 'chrome-webcontainer-plugin',
    configureServer(server: ViteDevServer) {
      server.middlewares.use((_req, res, next) => {
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
        next();
      });
    },
  };
}
