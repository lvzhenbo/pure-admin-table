import type { TableProps as ElTableProps } from "element-plus";
import type { CSSProperties } from "vue";
import type { PaginationProps } from "./pagination";
import type { TableColumns } from "./table-column";
import type { Align, DefaultRow } from "./base";

/**
 * @description 撑满内容区自适应高度相关配置
 */
export type AdaptiveConfig = {
  /** 表格距离页面底部的偏移量，默认值为 `96` */
  offsetBottom?: number;
  /** 是否固定表头，默认值为 `true` */
  fixHeader?: boolean;
  /** 页面 `resize` 时的防抖时间，默认值为 `60` ms */
  timeout?: number;
  /** 表头的 `z-index`，默认值为 `3` */
  zIndex?: number;
};

/**
 * @description 拓展 `element-plus` 的 `Table` 属性
 * @see {@link https://element-plus.org/zh-CN/component/table.html#table-%E5%B1%9E%E6%80%A7}
 * @template T 表格数据行类型，默认为 `DefaultRow`
 */
export interface PureTableProps<
  T extends DefaultRow = DefaultRow
> extends ElTableProps<T> {
  /** `Table-column` 配置 */
  columns?: Array<TableColumns>;
  /** 对齐方式，默认值 `left` */
  alignWhole?: Align;
  /** 表头对齐方式，若不设置该项，则使用表格的对齐方式 */
  headerAlign?: Align;
  /** 当内容过长被隐藏时显示 `tooltip`，默认值 `false` */
  showOverflowTooltip?: boolean;
  /** 鼠标经过行时，行的背景色，默认 `--el-table-row-hover-bg-color`，具体看 https://github.com/element-plus/element-plus/blob/dev/packages/theme-chalk/src/table.scss#L602-L606 */
  rowHoverBgColor?: string;
  /** 分页相关配置 */
  pagination?: PaginationProps;
  /** 表格是否撑满内容区自适应高度，默认 `false` */
  adaptive?: boolean;
  /** 撑满内容区自适应高度相关配置 */
  adaptiveConfig?: AdaptiveConfig;
  /** 表格的自定义类名（替代透传的 class） */
  tableClass?: string;
  /** 表格的自定义样式（替代透传的 style） */
  tableStyle?: CSSProperties;
  /** 是否允许拖动最后一列，默认值为 `true` */
  allowDragLastColumn?: boolean;
  /** 在折叠后是否在 `DOM` 中保留展开行内容，默认值为 `false` */
  preserveExpandedContent?: boolean;
}
