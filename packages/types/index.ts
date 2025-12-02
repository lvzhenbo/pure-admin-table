import {
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
import { PureTableProps, AdaptiveConfig, DefaultRow } from "./table-props";
import { PaginationProps } from "./pagination";

type Size = "large" | "default" | "small";
type Align = "left" | "center" | "right";
type Effect = "dark" | "light";
type Layout = "fixed" | "auto";

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
};
