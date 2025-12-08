/**
 * 公共基础类型
 */
export type Size = "large" | "default" | "small";
export type Align = "left" | "center" | "right";
export type Effect = "dark" | "light";
export type Layout = "fixed" | "auto";
export type DefaultRow = Record<PropertyKey, unknown>;

/**
 * 导出分页相关类型
 */
export type { PaginationProps } from "./pagination";

/**
 * 导出表格列相关类型
 */
export type {
  TableColumnFilterPlacement,
  TableColumnSortOrders,
  TableColumnSortable,
  TableColumnRenderer,
  TableColumnFixed,
  TableColumnScope,
  TableColumnType,
  TableColumns,
  TableColumn
} from "./table-column";

/**
 * 导出表格属性相关类型
 */
export type { PureTableProps, AdaptiveConfig } from "./table-props";
