import type { App } from "vue";
import Table from "./components/table/index.vue";

import "element-plus/es/components/table/style/css";
import "element-plus/es/components/pagination/style/css";

export const PureTable = Object.assign(Table, {
  install: (app: App) => {
    app.component("PureTable", Table);
  }
});

export default PureTable;

export type {
  TableColumnFilterPlacement,
  TableColumnSortOrders,
  TableColumnSortable,
  TableColumnRenderer,
  TableColumnScope,
  TableColumnFixed,
  TableColumnType,
  PaginationProps,
  PureTableProps,
  AdaptiveConfig,
  TableColumns,
  TableColumn,
  DefaultRow,
  Layout,
  Effect,
  Align,
  Size
} from "./types";
