<script setup lang="ts">
/**
 * PureTable 组件
 * 二次封装 Element Plus Table 组件，提供更灵活的配置
 *
 * 重构说明：
 * 1. 取消组件内透传，不再使用 v-bind="{ ...props, ...$attrs }" 方式
 * 2. 将 props 一个一个显式添加到对应的组件上
 * 3. 将事件也一个一个显式添加到对应组件上
 * 4. 需要透传的样式改成 props，如 tableClass 和 tableStyle
 */
import {
  ref,
  computed,
  nextTick,
  onMounted,
  onBeforeUnmount,
  useTemplateRef,
  type CSSProperties
} from "vue";
import Renderer from "../renderer.vue";
import {
  type PureTableProps,
  type TableColumnScope,
  type TableColumns,
  type PaginationProps,
  type AdaptiveConfig,
  type Align,
  type Size
} from "../../types";
import { ElTable, ElTableColumn, ElPagination } from "element-plus";
import { isFunction, isBoolean, debounce } from "@pureadmin/utils";
import type {
  TableColumnCtx,
  SummaryMethod,
  ColumnStyle,
  ColumnCls,
  CellStyle,
  TreeNode,
  CellCls,
  Sort
} from "element-plus";
import type { TableOverflowTooltipOptions } from "element-plus/es/components/table/src/util";
import type { VNode, Component } from "vue";

type DefaultRow = Record<PropertyKey, any>;

/**
 * @description 定义组件的 props 接口
 * 不再继承 Element Plus Table 的 props 类型，而是显式定义每个属性
 */
export interface PureTableComponentProps<T extends DefaultRow = DefaultRow> {
  // ==================== PureTable 自定义属性 ====================
  /** 列配置 */
  columns?: Array<TableColumns>;
  /** 整体对齐方式 */
  alignWhole?: Align;
  /** 表头对齐方式，若不设置该项，则使用表格的对齐方式 */
  headerAlign?: Align;
  /** 当内容过长被隐藏时显示 tooltip */
  showOverflowTooltip?: boolean;
  /** 鼠标经过行时，行的背景色 */
  rowHoverBgColor?: string;
  /** 分页相关配置 */
  pagination?: Partial<PaginationProps>;
  /** 表格是否撑满内容区自适应高度 */
  adaptive?: boolean;
  /** 撑满内容区自适应高度相关配置 */
  adaptiveConfig?: AdaptiveConfig;
  /** 表格的自定义类名（替代透传的 class） */
  tableClass?: string;
  /** 表格的自定义样式（替代透传的 style） */
  tableStyle?: CSSProperties;

  // ==================== Element Plus Table 属性 ====================
  /** 显示的数据 */
  data?: Array<T>;
  /** Table 的高度 */
  height?: string | number;
  /** Table 的最大高度 */
  maxHeight?: string | number;
  /** 是否为斑马纹 table */
  stripe?: boolean;
  /** 是否带有纵向边框 */
  border?: boolean;
  /** Table 的尺寸 */
  size?: Size;
  /** 列的宽度是否自撑开 */
  fit?: boolean;
  /** 是否显示表头 */
  showHeader?: boolean;
  /** 是否要高亮当前行 */
  highlightCurrentRow?: boolean;
  /** 当前行的 key，只写属性 */
  currentRowKey?: string | number;
  /** 行的 className 的回调方法 */
  rowClassName?: ColumnCls<T>;
  /** 行的 style 的回调方法 */
  rowStyle?: ColumnStyle<T>;
  /** 单元格的 className 的回调方法 */
  cellClassName?: CellCls<T>;
  /** 单元格的 style 的回调方法 */
  cellStyle?: CellStyle<T>;
  /** 表头行的 className 的回调方法 */
  headerRowClassName?: ColumnCls<T>;
  /** 表头行的 style 的回调方法 */
  headerRowStyle?: ColumnStyle<T>;
  /** 表头单元格的 className 的回调方法 */
  headerCellClassName?: CellCls<T>;
  /** 表头单元格的 style 的回调方法 */
  headerCellStyle?: CellStyle<T>;
  /** 行数据的 Key */
  rowKey?: string | ((row: T) => string);
  /** 空数据时显示的文本内容 */
  emptyText?: string;
  /** 是否默认展开所有行 */
  defaultExpandAll?: boolean;
  /** 可以通过该属性设置 Table 目前的展开行 */
  expandRowKeys?: any[];
  /** 默认的排序列的 prop 和顺序 */
  defaultSort?: Sort;
  /** tooltip effect 属性 */
  tooltipEffect?: "dark" | "light";
  /** 溢出 tooltip 的选项 */
  tooltipOptions?: TableOverflowTooltipOptions;
  /** 挂载到哪个 DOM 元素 */
  appendFilterPanelTo?: string;
  /** 是否在表尾显示合计行 */
  showSummary?: boolean;
  /** 合计行第一列的文本 */
  sumText?: string;
  /** 自定义的合计计算方法 */
  summaryMethod?: SummaryMethod<T>;
  /** 合并行或列的计算方法 */
  spanMethod?: (data: {
    row: T;
    rowIndex: number;
    column: TableColumnCtx<T>;
    columnIndex: number;
  }) =>
    | number[]
    | {
        rowspan: number;
        colspan: number;
      }
    | undefined;
  /** 在多选表格中，当仅有部分行被选中时，点击表头的多选框时的行为 */
  selectOnIndeterminate?: boolean;
  /** 展示树形数据时，树节点的缩进 */
  indent?: number;
  /** 是否懒加载子节点数据 */
  lazy?: boolean;
  /** 加载子节点数据的函数 */
  load?: (row: T, treeNode: TreeNode, resolve: (data: T[]) => void) => void;
  /** 渲染嵌套数据的配置选项 */
  treeProps?: {
    hasChildren?: string;
    children?: string;
    checkStrictly?: boolean;
  };
  /** 设置表格单元、行和列的布局方式 */
  tableLayout?: "fixed" | "auto";
  /** 总是显示滚动条 */
  scrollbarAlwaysOn?: boolean;
  /** 确保主轴的最小尺寸 */
  flexible?: boolean;
  /** body 的滚动条的包裹容器 tabindex */
  scrollbarTabindex?: string | number;
  /** 是否允许拖动最后一列 */
  allowDragLastColumn?: boolean;
  /** 自定义 show-overflow-tooltip 时的 tooltip 内容 */
  tooltipFormatter?: (data: {
    row: T;
    column: any;
    cellValue: any;
  }) => VNode | string;
  /** 在折叠后是否在 DOM 中保留展开行内容 */
  preserveExpandedContent?: boolean;
  /** 是否使用原生滚动条 */
  nativeScrollbar?: boolean;
}

/**
 * @description 使用 withDefaults 为 props 添加默认值
 */
const props = withDefaults(defineProps<PureTableComponentProps>(), {
  // PureTable 自定义属性默认值
  columns: () => [],
  alignWhole: "left",
  showOverflowTooltip: false,
  rowHoverBgColor: "",
  adaptive: false,
  adaptiveConfig: () => ({
    offsetBottom: 96,
    fixHeader: true,
    timeout: 60,
    zIndex: 3
  }),
  tableClass: "",
  tableStyle: () => ({}),
  // Element Plus Table 的默认值
  data: () => [],
  fit: true,
  stripe: false,
  border: false,
  showHeader: true,
  highlightCurrentRow: false,
  defaultExpandAll: false,
  selectOnIndeterminate: true,
  indent: 16,
  treeProps: () => ({
    hasChildren: "hasChildren",
    children: "children",
    checkStrictly: false
  }),
  lazy: false,
  tableLayout: "fixed",
  scrollbarAlwaysOn: false,
  flexible: false,
  allowDragLastColumn: true,
  preserveExpandedContent: false,
  showSummary: false,
  nativeScrollbar: false
});

const {
  columns,
  adaptive,
  pagination,
  alignWhole,
  headerAlign,
  adaptiveConfig,
  rowHoverBgColor,
  showOverflowTooltip
} = props;

/**
 * @description 定义组件的 emits 事件
 * 包含 PureTable 自定义事件和 Element Plus Table 的所有事件
 */
const emit = defineEmits<{
  // ==================== PureTable 自定义事件 ====================
  /** 分页大小改变事件 */
  "page-size-change": [value: number];
  /** 当前页改变事件 */
  "page-current-change": [value: number];

  // ==================== Element Plus Table 事件 ====================
  /** 当用户手动勾选数据行的 Checkbox 时触发的事件 */
  select: [selection: any[], row: any];
  /** 当用户手动勾选全选 Checkbox 时触发的事件 */
  "select-all": [selection: any[]];
  /** 当选择项发生变化时会触发该事件 */
  "selection-change": [selection: any[]];
  /** 当单元格 hover 进入时会触发该事件 */
  "cell-mouse-enter": [
    row: any,
    column: TableColumnCtx<any>,
    cell: HTMLTableCellElement,
    event: MouseEvent
  ];
  /** 当单元格 hover 退出时会触发该事件 */
  "cell-mouse-leave": [
    row: any,
    column: TableColumnCtx<any>,
    cell: HTMLTableCellElement,
    event: MouseEvent
  ];
  /** 当某个单元格被点击时会触发该事件 */
  "cell-click": [
    row: any,
    column: TableColumnCtx<any>,
    cell: HTMLTableCellElement,
    event: PointerEvent
  ];
  /** 当某个单元格被双击击时会触发该事件 */
  "cell-dblclick": [
    row: any,
    column: TableColumnCtx<any>,
    cell: HTMLTableCellElement,
    event: PointerEvent
  ];
  /** 当某个单元格被鼠标右键点击时会触发该事件 */
  "cell-contextmenu": [
    row: any,
    column: TableColumnCtx<any>,
    cell: HTMLTableCellElement,
    event: PointerEvent
  ];
  /** 当某一行被点击时会触发该事件 */
  "row-click": [row: any, column: TableColumnCtx<any>, event: PointerEvent];
  /** 当某一行被鼠标右键点击时会触发该事件 */
  "row-contextmenu": [
    row: any,
    column: TableColumnCtx<any>,
    event: PointerEvent
  ];
  /** 当某一行被双击时会触发该事件 */
  "row-dblclick": [row: any, column: TableColumnCtx<any>, event: PointerEvent];
  /** 当某一列的表头被点击时会触发该事件 */
  "header-click": [column: TableColumnCtx<any>, event: PointerEvent];
  /** 当某一列的表头被鼠标右键点击时触发该事件 */
  "header-contextmenu": [column: TableColumnCtx<any>, event: PointerEvent];
  /** 当表格的排序条件发生变化的时候会触发该事件 */
  "sort-change": [
    data: { column: TableColumnCtx<any>; prop: string; order: string | null }
  ];
  /** 当表格的筛选条件发生变化的时候会触发该事件 */
  "filter-change": [filters: Record<string, any[]>];
  /** 当表格的当前行发生变化的时候会触发该事件 */
  "current-change": [currentRow: any, oldCurrentRow: any];
  /** 当拖动表头改变了列的宽度的时候会触发该事件 */
  "header-dragend": [
    newWidth: number,
    oldWidth: number,
    column: TableColumnCtx<any>,
    event: MouseEvent
  ];
  /** 当用户对某一行展开或者关闭的时候会触发该事件 */
  "expand-change": [row: any, expandedRows: any[] | boolean];
}>();

const isClient = ref(false);
/** 表格实例引用 */
const tableRef = useTemplateRef("tableRef");

// 判断是否需要显示分页
const conditions = computed(
  () => pagination && pagination?.currentPage && pagination?.pageSize
);

// 分页样式
const getStyle = computed((): CSSProperties => {
  return Object.assign(
    {
      justifyContent:
        pagination?.align === "left"
          ? "flex-start"
          : pagination?.align === "center"
            ? "center"
            : "flex-end"
    },
    pagination?.style ?? {}
  );
});

// 分页大小改变处理
const handleSizeChange = (val: number) => {
  if (pagination) {
    pagination.pageSize = val;
  }
  emit("page-size-change", val);
};

// 当前页改变处理
const handleCurrentChange = (val: number) => {
  if (pagination) {
    pagination.currentPage = val;
  }
  emit("page-current-change", val);
};

// 判断列是否隐藏
const isColumnHidden = (hide: any, attrs: any): boolean => {
  if (isFunction(hide) && hide(attrs)) {
    return true;
  }
  if (isBoolean(hide) && hide) {
    return true;
  }
  return false;
};

// 获取列的prop值
const getColumnProp = (prop: any, index: number) => {
  return isFunction(prop) && prop(index) ? prop(index) : prop;
};

// 获取列的绑定属性（排除Vue和自定义属性）
const getColumnBindProps = (column: any, index: number) => {
  const {
    cellRenderer,
    slot,
    headerRenderer,
    headerSlot,
    filterIconSlot,
    expandSlot,
    hide,
    children,
    prop,
    align,
    headerAlign,
    showOverflowTooltip,
    ...rest
  } = column;

  return {
    ...rest,
    prop: getColumnProp(prop, index),
    align: align || alignWhole,
    headerAlign: headerAlign || props.headerAlign,
    showOverflowTooltip:
      showOverflowTooltip !== undefined
        ? showOverflowTooltip
        : props.showOverflowTooltip
  };
};

// 获取表格实例引用
const getTableRef = () => tableRef.value;

// 获取表格DOM元素
const getTableDoms = () => tableRef.value?.$refs as Record<string, any>;

// 设置自适应高度
const setAdaptive = async () => {
  await nextTick();
  const tableWrapper = getTableDoms().tableWrapper;
  const offsetBottom = adaptiveConfig.offsetBottom ?? 96;
  tableWrapper.style.height = `${
    window.innerHeight - tableWrapper.getBoundingClientRect().top - offsetBottom
  }px`;
};

// 防抖设置自适应
const debounceSetAdaptive = debounce(setAdaptive, adaptiveConfig.timeout ?? 60);

// 设置表头固定
const setHeaderSticky = async (zIndex = 3) => {
  await nextTick();
  const headerStyle = getTableDoms().tableHeaderRef.$el.style;
  headerStyle.position = "sticky";
  headerStyle.top = 0;
  headerStyle.zIndex = zIndex;
};

// 组件挂载
onMounted(() => {
  isClient.value = true;
  nextTick(() => {
    if (rowHoverBgColor) {
      getTableDoms().tableWrapper.style.setProperty(
        "--el-table-row-hover-bg-color",
        rowHoverBgColor,
        "important"
      );
    }

    if (adaptive) {
      setAdaptive();
      window.addEventListener("resize", debounceSetAdaptive);
      const hasFixHeader = Reflect.has(adaptiveConfig, "fixHeader");
      if (hasFixHeader && !adaptiveConfig.fixHeader) {
        return;
      } else {
        setHeaderSticky(adaptiveConfig.zIndex ?? 3);
      }
    }
  });
});

// 组件卸载前
onBeforeUnmount(() => {
  if (adaptive) {
    window.removeEventListener("resize", debounceSetAdaptive);
  }
});

// 暴露方法
defineExpose({
  /** 获取表格实例 */
  getTableRef,
  /** 获取表格多个DOM元素 */
  getTableDoms,
  /** 设置表格自适应高度 */
  setAdaptive,
  /** 设置表头为 sticky 布局 */
  setHeaderSticky
});
</script>

<template>
  <div class="pure-table" style="width: 100%">
    <!-- 表格：显式绑定每个 prop 和事件，不使用透传 -->
    <ElTable
      ref="tableRef"
      :data="props.data"
      :height="props.height"
      :max-height="props.maxHeight"
      :stripe="props.stripe"
      :border="props.border"
      :size="props.size"
      :fit="props.fit"
      :show-header="props.showHeader"
      :highlight-current-row="props.highlightCurrentRow"
      :current-row-key="props.currentRowKey"
      :row-class-name="props.rowClassName"
      :row-style="props.rowStyle"
      :cell-class-name="props.cellClassName"
      :cell-style="props.cellStyle"
      :header-row-class-name="props.headerRowClassName"
      :header-row-style="props.headerRowStyle"
      :header-cell-class-name="props.headerCellClassName"
      :header-cell-style="props.headerCellStyle"
      :row-key="props.rowKey"
      :empty-text="props.emptyText"
      :default-expand-all="props.defaultExpandAll"
      :expand-row-keys="props.expandRowKeys"
      :default-sort="props.defaultSort"
      :tooltip-effect="props.tooltipEffect"
      :tooltip-options="props.tooltipOptions"
      :append-filter-panel-to="props.appendFilterPanelTo"
      :show-summary="props.showSummary"
      :sum-text="props.sumText"
      :summary-method="props.summaryMethod"
      :span-method="props.spanMethod"
      :select-on-indeterminate="props.selectOnIndeterminate"
      :indent="props.indent"
      :lazy="props.lazy"
      :load="props.load"
      :tree-props="props.treeProps"
      :table-layout="props.tableLayout"
      :scrollbar-always-on="props.scrollbarAlwaysOn"
      :flexible="props.flexible"
      :scrollbar-tabindex="props.scrollbarTabindex"
      :allow-drag-last-column="props.allowDragLastColumn"
      :tooltip-formatter="props.tooltipFormatter"
      :preserve-expanded-content="props.preserveExpandedContent"
      :native-scrollbar="props.nativeScrollbar"
      :class="props.tableClass"
      :style="props.tableStyle"
      @select="(...args) => emit('select', ...args)"
      @select-all="(...args) => emit('select-all', ...args)"
      @selection-change="(...args) => emit('selection-change', ...args)"
      @cell-mouse-enter="(...args) => emit('cell-mouse-enter', ...args)"
      @cell-mouse-leave="(...args) => emit('cell-mouse-leave', ...args)"
      @cell-click="(...args) => emit('cell-click', ...args)"
      @cell-dblclick="(...args) => emit('cell-dblclick', ...args)"
      @cell-contextmenu="(...args) => emit('cell-contextmenu', ...args)"
      @row-click="(...args) => emit('row-click', ...args)"
      @row-contextmenu="(...args) => emit('row-contextmenu', ...args)"
      @row-dblclick="(...args) => emit('row-dblclick', ...args)"
      @header-click="(...args) => emit('header-click', ...args)"
      @header-contextmenu="(...args) => emit('header-contextmenu', ...args)"
      @sort-change="(...args) => emit('sort-change', ...args)"
      @filter-change="(...args) => emit('filter-change', ...args)"
      @current-change="(...args) => emit('current-change', ...args)"
      @header-dragend="(...args) => emit('header-dragend', ...args)"
      @expand-change="(...args) => emit('expand-change', ...args)"
    >
      <!-- 动态渲染列 -->
      <template v-for="(column, index) in columns" :key="index">
        <ElTableColumn
          v-if="!isColumnHidden(column.hide, props)"
          v-bind="getColumnBindProps(column, index)"
        >
          <!-- 默认插槽：单元格渲染器或插槽 -->
          <template v-if="column.cellRenderer || column.slot" #default="scope">
            <!-- 单元格渲染器 -->
            <Renderer
              v-if="column.cellRenderer"
              :render="column.cellRenderer"
              :params="{
                ...scope,
                index: scope.$index,
                props
              }"
            />
            <!-- 单元格插槽 -->
            <slot
              v-else-if="column.slot"
              :name="column.slot"
              v-bind="{
                ...scope,
                index: scope.$index,
                props
              }"
            />
          </template>

          <!-- 嵌套子列 -->
          <template v-if="column.children && column.children.length > 0">
            <ElTableColumn
              v-for="(child, childIndex) in column.children"
              :key="childIndex"
              v-bind="getColumnBindProps(child, childIndex)"
            >
              <!-- 子列默认插槽 -->
              <template
                v-if="child.cellRenderer || child.slot"
                #default="childScope"
              >
                <Renderer
                  v-if="child.cellRenderer"
                  :render="child.cellRenderer"
                  :params="{
                    ...childScope,
                    index: childScope.$index,
                    props
                  }"
                />
                <slot
                  v-else-if="child.slot"
                  :name="child.slot"
                  v-bind="{
                    ...childScope,
                    index: childScope.$index,
                    props
                  }"
                />
              </template>
              <!-- 子列表头插槽 -->
              <template
                v-if="child.headerRenderer || child.headerSlot"
                #header="childScope"
              >
                <Renderer
                  v-if="child.headerRenderer"
                  :render="child.headerRenderer"
                  :params="{
                    ...childScope,
                    index: childScope.$index,
                    props
                  }"
                />
                <slot
                  v-else-if="child.headerSlot"
                  :name="child.headerSlot"
                  v-bind="{
                    ...childScope,
                    index: childScope.$index,
                    props
                  }"
                />
              </template>
            </ElTableColumn>
          </template>

          <!-- 表头插槽 -->
          <template
            v-if="column.headerRenderer || column.headerSlot"
            #header="scope"
          >
            <Renderer
              v-if="column.headerRenderer"
              :render="column.headerRenderer"
              :params="{
                ...scope,
                index: scope.$index,
                props
              }"
            />
            <slot
              v-else-if="column.headerSlot"
              :name="column.headerSlot"
              v-bind="{
                ...scope,
                index: scope.$index,
                props
              }"
            />
          </template>

          <!-- 过滤图标插槽 -->
          <template v-if="column.filterIconSlot" #filter-icon="scope">
            <slot
              :name="column.filterIconSlot"
              v-bind="{
                ...scope,
                index: scope.$index,
                props
              }"
            />
          </template>

          <!-- 展开插槽 -->
          <template v-if="column.expandSlot" #expand="scope">
            <slot
              :name="column.expandSlot"
              v-bind="{
                ...scope,
                index: scope.$index,
                props
              }"
            />
          </template>
        </ElTableColumn>
      </template>

      <!-- 追加内容插槽 -->
      <template v-if="$slots.append" #append>
        <slot name="append" />
      </template>

      <!-- 空数据插槽 -->
      <template v-if="$slots.empty" #empty>
        <slot name="empty" />
      </template>
    </ElTable>

    <!-- 分页：显式绑定每个 prop 和事件，不使用透传 -->
    <ElPagination
      v-if="conditions"
      class="pure-pagination"
      :style="getStyle"
      :class="pagination?.class"
      :size="pagination?.size"
      :background="pagination?.background"
      :page-size="pagination?.pageSize"
      :default-page-size="pagination?.defaultPageSize"
      :total="pagination?.total"
      :page-count="pagination?.pageCount"
      :pager-count="pagination?.pagerCount"
      :current-page="pagination?.currentPage"
      :default-current-page="pagination?.defaultCurrentPage"
      :layout="pagination?.layout ?? 'total, sizes, prev, pager, next, jumper'"
      :page-sizes="pagination?.pageSizes ?? [5, 10, 15, 20]"
      :popper-class="pagination?.popperClass"
      :prev-text="pagination?.prevText"
      :next-text="pagination?.nextText"
      :disabled="pagination?.disabled"
      :hide-on-single-page="pagination?.hideOnSinglePage"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<style scoped>
.pure-table {
  width: 100%;
}

.pure-pagination {
  width: 100%;
  margin: 16px 0;
  display: flex;
  flex-wrap: wrap;
}
</style>
