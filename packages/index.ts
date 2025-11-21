import type { App } from "vue";
import Table from "./components/table";

import "element-plus/es/components/table/style/css";
import "element-plus/es/components/loading/style/css";
import "element-plus/es/components/pagination/style/css";

export const PureTable = Object.assign(Table, {
  install: (app: App) => {
    app.component(Table.name, Table);
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
  LoadingConfig,
  TableColumns,
  TableColumn,
  TableProps,
  Layout,
  Effect,
  Align,
  Size
} from "./types";
