import { resolve } from "node:path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import svgLoader from "vite-svg-loader";
import dts from "vite-plugin-dts";

const isLibMode = process.env.npm_lifecycle_event === "lib";

// https://cn.vitejs.dev/guide/build.html#library-mode
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    svgLoader(),
    ...(isLibMode
      ? [
          dts({
            include: ["packages/**/*"],
            rollupTypes: false,
            logLevel: "silent"
          })
        ]
      : [])
  ],

  define: {
    "process.env.NODE_ENV": '"production"',
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false
  },

  server: {
    host: "0.0.0.0"
  },

  ...(isLibMode
    ? {
        publicDir: false,
        build: {
          lib: {
            entry: resolve(__dirname, "packages/index.ts"),
            formats: ["es"],
            fileName: () => "index.js"
          },
          rollupOptions: {
            external: ["vue", "element-plus"],
            output: {
              assetFileNames: assetInfo => {
                // 将 CSS 文件统一命名为 style.css
                if (assetInfo.name?.endsWith(".css")) {
                  return "style.css";
                }
                return "[name].[ext]";
              }
            }
          },
          minify: false
        }
      }
    : {
        base: "/pure-admin-table/",
        build: {
          sourcemap: false,
          chunkSizeWarningLimit: 4000
        }
      })
});
