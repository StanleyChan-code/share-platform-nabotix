import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import legacy from "@vitejs/plugin-legacy";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 10025,
  },
  plugins: [
    react(),
    legacy({
      targets: ["ie >= 11"],
      modernPolyfills: true,
    }),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  build: {
    rollupOptions: {
      output: {
        // 在生产构建时移除 console 语句
        ...(mode === 'production' && {
          manualChunks: {
            // 配置手动分块以优化构建
          }
        })
      }
    },
    // 生产构建时压缩代码并移除 console
    minify: mode === 'production' ? 'terser' : false,
    terserOptions: {
      compress: {
        drop_console: mode === 'production', // 生产环境下移除 console
        drop_debugger: mode === 'production', // 生产环境下移除 debugger
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  }
}));