import { defineConfig } from "tsdown";
import Vue from "unplugin-vue/rolldown";

export default defineConfig({
  entry: ["./packages/index.ts"],
  format: "esm",
  platform: "neutral",
  external: ["vue", "element-plus"],
  plugins: [Vue({ isProduction: true })],
  dts: { vue: true },
  clean: true,
  outDir: "dist"
});
