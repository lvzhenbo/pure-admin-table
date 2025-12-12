import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import svgLoader from "vite-svg-loader";

// https://cn.vitejs.dev/guide/build.html
export default defineConfig({
  plugins: [vue(), vueJsx(), svgLoader()],

  define: {
    "process.env.NODE_ENV": '"production"',
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false
  },

  server: {
    host: "0.0.0.0"
  },

  base: "/pure-admin-table/",
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 4000
  }
});
