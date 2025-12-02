<script
  setup
  lang="ts"
  generic="
    T extends Record<PropertyKey, unknown> = Record<PropertyKey, unknown>
  "
>
/**
 * PureTable 组件
 * 二次封装 Element Plus Table 组件，提供更灵活的配置
 *
 * 重构说明：
 * 1. 取消组件内透传，不再使用 v-bind="{ ...props, ...$attrs }" 方式
 * 2. 将 props 一个一个显式添加到对应的组件上
 * 3. 将事件也一个一个显式添加到对应组件上
 * 4. 需要透传的样式改成 props，如 tableClass 和 tableStyle
 * 5. 使用泛型组件，支持类型推断
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
  type TableColumns,
  type AdaptiveConfig
} from "../../types";
import { ElTable, ElTableColumn, ElPagination } from "element-plus";
import { isFunction, isBoolean, debounce } from "@pureadmin/utils";
import type { TableColumnCtx } from "element-plus";

/**
 * @description 使用 withDefaults 为 props 添加默认值
 */
const props = withDefaults(defineProps<PureTableProps<T>>(), {
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
  select: [selection: T[], row: T];
  /** 当用户手动勾选全选 Checkbox 时触发的事件 */
  "select-all": [selection: T[]];
  /** 当选择项发生变化时会触发该事件 */
  "selection-change": [selection: T[]];
  /** 当单元格 hover 进入时会触发该事件 */
  "cell-mouse-enter": [
    row: T,
    column: TableColumnCtx<T>,
    cell: HTMLTableCellElement,
    event: MouseEvent
  ];
  /** 当单元格 hover 退出时会触发该事件 */
  "cell-mouse-leave": [
    row: T,
    column: TableColumnCtx<T>,
    cell: HTMLTableCellElement,
    event: MouseEvent
  ];
  /** 当某个单元格被点击时会触发该事件 */
  "cell-click": [
    row: T,
    column: TableColumnCtx<T>,
    cell: HTMLTableCellElement,
    event: PointerEvent
  ];
  /** 当某个单元格被双击击时会触发该事件 */
  "cell-dblclick": [
    row: T,
    column: TableColumnCtx<T>,
    cell: HTMLTableCellElement,
    event: PointerEvent
  ];
  /** 当某个单元格被鼠标右键点击时会触发该事件 */
  "cell-contextmenu": [
    row: T,
    column: TableColumnCtx<T>,
    cell: HTMLTableCellElement,
    event: PointerEvent
  ];
  /** 当某一行被点击时会触发该事件 */
  "row-click": [row: T, column: TableColumnCtx<T>, event: PointerEvent];
  /** 当某一行被鼠标右键点击时会触发该事件 */
  "row-contextmenu": [row: T, column: TableColumnCtx<T>, event: PointerEvent];
  /** 当某一行被双击时会触发该事件 */
  "row-dblclick": [row: T, column: TableColumnCtx<T>, event: PointerEvent];
  /** 当某一列的表头被点击时会触发该事件 */
  "header-click": [column: TableColumnCtx<T>, event: PointerEvent];
  /** 当某一列的表头被鼠标右键点击时触发该事件 */
  "header-contextmenu": [column: TableColumnCtx<T>, event: PointerEvent];
  /** 当表格的排序条件发生变化的时候会触发该事件 */
  "sort-change": [
    data: { column: TableColumnCtx<T>; prop: string; order: string | null }
  ];
  /** 当表格的筛选条件发生变化的时候会触发该事件 */
  "filter-change": [filters: Record<string, unknown[]>];
  /** 当表格的当前行发生变化的时候会触发该事件 */
  "current-change": [currentRow: T | undefined, oldCurrentRow: T | undefined];
  /** 当拖动表头改变了列的宽度的时候会触发该事件 */
  "header-dragend": [
    newWidth: number,
    oldWidth: number,
    column: TableColumnCtx<T>,
    event: MouseEvent
  ];
  /** 当用户对某一行展开或者关闭的时候会触发该事件 */
  "expand-change": [row: T, expandedRows: T[] | boolean];
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
      @select="(selection, row) => emit('select', selection, row)"
      @select-all="selection => emit('select-all', selection)"
      @selection-change="selection => emit('selection-change', selection)"
      @cell-mouse-enter="
        (row, column, cell, event) =>
          emit('cell-mouse-enter', row, column, cell, event)
      "
      @cell-mouse-leave="
        (row, column, cell, event) =>
          emit('cell-mouse-leave', row, column, cell, event)
      "
      @cell-click="
        (row, column, cell, event) =>
          emit('cell-click', row, column, cell, event)
      "
      @cell-dblclick="
        (row, column, cell, event) =>
          emit('cell-dblclick', row, column, cell, event)
      "
      @cell-contextmenu="
        (row, column, cell, event) =>
          emit('cell-contextmenu', row, column, cell, event)
      "
      @row-click="(row, column, event) => emit('row-click', row, column, event)"
      @row-contextmenu="
        (row, column, event) => emit('row-contextmenu', row, column, event)
      "
      @row-dblclick="
        (row, column, event) => emit('row-dblclick', row, column, event)
      "
      @header-click="(column, event) => emit('header-click', column, event)"
      @header-contextmenu="
        (column, event) => emit('header-contextmenu', column, event)
      "
      @sort-change="data => emit('sort-change', data)"
      @filter-change="filters => emit('filter-change', filters)"
      @current-change="
        (currentRow, oldCurrentRow) =>
          emit('current-change', currentRow, oldCurrentRow)
      "
      @header-dragend="
        (newWidth, oldWidth, column, event) =>
          emit('header-dragend', newWidth, oldWidth, column, event)
      "
      @expand-change="
        (row, expandedRows) => emit('expand-change', row, expandedRows)
      "
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
      :class="['pure-pagination', pagination?.class]"
      :style="getStyle"
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
