import { resolve } from "node:path";
import vue from "@vitejs/plugin-vue";
import svgLoader from "vite-svg-loader";
import { defineConfig, type UserConfig } from "vite";

const lifecycle = process.env.npm_lifecycle_event;

function getConfigs(): UserConfig {
  return lifecycle === "lib"
    ? {
        publicDir: false,
        build: {
          lib: {
            entry: resolve(__dirname, "packages/index.ts"),
            formats: ["es"],
            fileName: () => "index.js"
          },
          // https://rollupjs.org/guide/en/#big-list-of-options
          rollupOptions: {
            treeshake: true,
            external: ["vue", "element-plus"],
            output: {
              exports: "named"
            }
          }
        }
      }
    : ({
        base: "/pure-admin-table/",
        build: {
          sourcemap: false,
          chunkSizeWarningLimit: 4000
        }
      } as any);
}

// https://cn.vitejs.dev/guide/build.html#library-mode
export default defineConfig({
  plugins: [vue(), svgLoader()],
  // https://cn.vitejs.dev/guide/build.html#library-mode 环境变量
  define: {
    "process.env.NODE_ENV": '"production"',
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false
  },
  server: {
    host: "0.0.0.0"
  },
  ...getConfigs()
});
