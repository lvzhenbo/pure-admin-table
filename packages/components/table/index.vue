<script setup lang="ts">
/**
 * PureTable 组件
 * 二次封装 Element Plus Table 组件，提供更灵活的配置
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
  type Align
} from "../../types";
import { ElTable, ElTableColumn, ElPagination } from "element-plus";
import { isFunction, isBoolean, debounce } from "@pureadmin/utils";
import type { TableProps } from "element-plus";

type DefaultRow = Record<PropertyKey, any>;

/**
 * @description 定义组件的 props 接口，继承 Element Plus Table 的 props 类型
 */
export interface PureTableComponentProps<T extends DefaultRow = DefaultRow>
  extends TableProps<T> {
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
}

/**
 * @description 使用 withDefaults 为 props 添加默认值，包含所有 Element Plus Table 的默认值
 * Vue 3.5+ 支持响应式解构
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
  style: () => ({}),
  className: "",
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
 */
const emit = defineEmits<{
  /** 分页大小改变事件 */
  "page-size-change": [value: number];
  /** 当前页改变事件 */
  "page-current-change": [value: number];
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
const debounceSetAdaptive = debounce(
  setAdaptive,
  adaptiveConfig.timeout ?? 60
);

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
    <!-- 表格 -->
    <ElTable ref="tableRef" v-bind="{ ...props, ...$attrs }">
      <!-- 动态渲染列 -->
      <template v-for="(column, index) in columns" :key="index">
        <ElTableColumn
          v-if="!isColumnHidden(column.hide, $attrs)"
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
                props,
                attrs: $attrs
              }"
            />
            <!-- 单元格插槽 -->
            <slot
              v-else-if="column.slot"
              :name="column.slot"
              v-bind="{
                ...scope,
                index: scope.$index,
                props,
                attrs: $attrs
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
                    props,
                    attrs: $attrs
                  }"
                />
                <slot
                  v-else-if="child.slot"
                  :name="child.slot"
                  v-bind="{
                    ...childScope,
                    index: childScope.$index,
                    props,
                    attrs: $attrs
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
                    props,
                    attrs: $attrs
                  }"
                />
                <slot
                  v-else-if="child.headerSlot"
                  :name="child.headerSlot"
                  v-bind="{
                    ...childScope,
                    index: childScope.$index,
                    props,
                    attrs: $attrs
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
                props,
                attrs: $attrs
              }"
            />
            <slot
              v-else-if="column.headerSlot"
              :name="column.headerSlot"
              v-bind="{
                ...scope,
                index: scope.$index,
                props,
                attrs: $attrs
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
                props,
                attrs: $attrs
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
                props,
                attrs: $attrs
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

    <!-- 分页 -->
    <ElPagination
      v-if="conditions"
      v-bind="{ ...pagination, ...$attrs }"
      class="pure-pagination"
      :style="getStyle"
      :layout="pagination.layout ?? 'total, sizes, prev, pager, next, jumper'"
      :page-sizes="pagination.pageSizes ?? [5, 10, 15, 20]"
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
