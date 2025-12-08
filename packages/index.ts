import type { App, Component } from "vue";
import Table from "./components/table/index.vue";

import "element-plus/es/components/table/style/css";
import "element-plus/es/components/pagination/style/css";

/**
 * PureTable 组件导出
 * 支持作为 Vue 组件使用，也支持通过 install 方法全局注册
 */
export const PureTable: Component & {
  install: (app: App) => void;
} = Object.assign(Table, {
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

// 为Vue提供全局组件类型声明
declare module "vue" {
  export interface GlobalComponents {
    PureTable: typeof PureTable;
  }
}
