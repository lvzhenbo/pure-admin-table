<script setup lang="ts">
/**
 * PureTable 组件
 * 二次封装 Element Plus Table 组件，提供更灵活的配置
 */
import {
  ref,
  unref,
  toRefs,
  computed,
  nextTick,
  onMounted,
  onBeforeUnmount,
  getCurrentInstance,
  type CSSProperties
} from "vue";
import Renderer from "../renderer.vue";
import { PureTableProps, TableColumnScope } from "../../types";
import { ElTable, ElTableColumn, ElPagination } from "element-plus";
import { isFunction, isBoolean, debounce } from "@pureadmin/utils";
import type { PropType } from "vue";
import defaultProps from "element-plus/es/components/table/src/table/defaults";

// 定义属性
const props = defineProps({
  /** 表格唯一标识 */
  tableKey: {
    type: [String, Number] as PropType<string | number>,
    default: "0"
  },
  /** 列配置 */
  columns: {
    type: Array,
    default: () => []
  },
  /** 整体对齐方式 */
  alignWhole: {
    type: String,
    default: "left"
  },
  /** 表头对齐方式 */
  headerAlign: {
    type: String,
    default: ""
  },
  /** 是否显示溢出提示 */
  showOverflowTooltip: {
    type: Boolean,
    default: false
  },
  /** 行悬停背景色 */
  rowHoverBgColor: {
    type: String,
    default: ""
  },
  /** 分页配置 */
  pagination: {
    type: Object,
    default: () => ({
      total: 0,
      pageSize: 5,
      align: "right",
      size: "default",
      background: false,
      pageSizes: [5, 10, 15, 20],
      layout: "total, sizes, prev, pager, next, jumper"
    })
  },
  /** 是否自适应高度 */
  adaptive: {
    type: Boolean,
    default: false
  },
  /** 自适应配置 */
  adaptiveConfig: {
    type: Object,
    default: () => ({
      offsetBottom: 96,
      fixHeader: true,
      timeout: 60,
      zIndex: 3
    })
  },
  // 继承 Element Plus Table 的所有属性
  ...defaultProps
});

// 定义事件
const emit = defineEmits<{
  /** 分页大小改变事件 */
  "page-size-change": [value: number];
  /** 当前页改变事件 */
  "page-current-change": [value: number];
}>();

// 响应式数据
const {
  columns,
  tableKey,
  adaptive,
  pagination,
  alignWhole,
  headerAlign,
  adaptiveConfig,
  rowHoverBgColor,
  showOverflowTooltip
} = toRefs(props) as unknown as PureTableProps;

const isClient = ref(false);
const instance = getCurrentInstance()!;
const tableRef = ref();

// 判断是否需要显示分页
let conditions =
  unref(pagination) &&
  unref(pagination).currentPage &&
  unref(pagination).pageSize;

// 分页样式
const getStyle = computed((): CSSProperties => {
  return Object.assign(
    {
      width: "100%",
      margin: "16px 0",
      display: "flex",
      flexWrap: "wrap",
      justifyContent:
        unref(pagination).align === "left"
          ? "flex-start"
          : unref(pagination).align === "center"
            ? "center"
            : "flex-end"
    },
    unref(pagination).style ?? {}
  );
});

// 分页大小改变处理
const handleSizeChange = (val: number) => {
  unref(pagination).pageSize = val;
  emit("page-size-change", val);
};

// 当前页改变处理
const handleCurrentChange = (val: number) => {
  unref(pagination).currentPage = val;
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
    align: align || unref(alignWhole),
    headerAlign: headerAlign || unref(headerAlign),
    showOverflowTooltip:
      showOverflowTooltip !== undefined
        ? showOverflowTooltip
        : unref(showOverflowTooltip)
  };
};

// 获取表格实例引用
const getTableRef = () => instance?.proxy?.$refs[`TableRef${unref(tableKey)}`];

// 获取表格DOM元素
const getTableDoms = () => (getTableRef() as any).$refs;

// 设置自适应高度
const setAdaptive = async () => {
  await nextTick();
  const tableWrapper = getTableDoms().tableWrapper;
  const offsetBottom = unref(adaptiveConfig).offsetBottom ?? 96;
  tableWrapper.style.height = `${
    window.innerHeight - tableWrapper.getBoundingClientRect().top - offsetBottom
  }px`;
};

// 防抖设置自适应
const debounceSetAdaptive = debounce(
  setAdaptive,
  unref(adaptiveConfig).timeout ?? 60
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
    if (unref(rowHoverBgColor)) {
      getTableDoms().tableWrapper.style.setProperty(
        "--el-table-row-hover-bg-color",
        unref(rowHoverBgColor),
        "important"
      );
    }

    if (unref(adaptive)) {
      setAdaptive();
      window.addEventListener("resize", debounceSetAdaptive);
      const hasFixHeader = Reflect.has(unref(adaptiveConfig), "fixHeader");
      if (hasFixHeader && !unref(adaptiveConfig).fixHeader) {
        return;
      } else {
        setHeaderSticky(unref(adaptiveConfig).zIndex ?? 3);
      }
    }
  });
});

// 组件卸载前
onBeforeUnmount(() => {
  if (unref(adaptive)) {
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
    <ElTable :ref="`TableRef${tableKey}`" v-bind="{ ...props, ...$attrs }">
      <!-- 动态渲染列 -->
      <template v-for="(column, index) in columns" :key="index">
        <ElTableColumn
          v-if="!isColumnHidden(column.hide, $attrs)"
          v-bind="getColumnBindProps(column, index)"
        >
          <!-- 默认插槽 -->
          <template
            v-if="column.cellRenderer || column.slot || column.children"
            #default="scope"
          >
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
            <!-- 子列 -->
            <template v-else-if="column.children && column.children.length > 0">
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
</style>
