import App from "./App.vue";
import { createApp } from "vue";

import "element-plus/dist/index.css";
import ElementPlus from "element-plus";

import PureTable from "../packages";

const app = createApp(App);

app.use(ElementPlus).use(PureTable).mount("#app");
