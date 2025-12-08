<script setup lang="ts">
import { ref } from "vue";

const tableRef = ref();
import { useColumns } from "./columns";
const {
  empty,
  spacer,
  columns,
  dataList,
  tableSize,
  pagination,
  tableHeight,
  paginationAlign,
  rowClick,
  onEmpty,
  onChange,
  onRefresh,
  handleUpdate,
  handleDelete,
  pageSizeChange,
  getTableMethods,
  pageCurrentChange,
  handleSelectionChange
} = useColumns(tableRef);
</script>

<template>
  <el-config-provider size="small">
    <el-space class="pure-space" wrap :spacer="spacer">
      <el-button type="primary" @click="onRefresh">刷新表格</el-button>
      <el-button type="primary" @click="onEmpty">空表格</el-button>
      <el-tooltip content="请打开浏览器控制台查看打印信息">
        <el-button type="primary" @click="getTableMethods">
          获取表格组件实例
        </el-button>
      </el-tooltip>
      <div class="pure-radio">
        <p class="pure-small">表格大小：</p>
        <el-radio-group v-model="tableSize">
          <el-radio-button value="large">large</el-radio-button>
          <el-radio-button value="default">default</el-radio-button>
          <el-radio-button value="small">small</el-radio-button>
        </el-radio-group>
      </div>
      <div class="pure-radio">
        <p class="pure-small">分页大小：</p>
        <el-radio-group v-model="pagination.size" @change="onChange">
          <el-radio-button value="large">large</el-radio-button>
          <el-radio-button value="default">default</el-radio-button>
          <el-radio-button value="small">small</el-radio-button>
        </el-radio-group>
      </div>
      <div class="pure-radio">
        <p class="pure-small">分页的对齐方式：</p>
        <el-radio-group v-model="paginationAlign">
          <el-radio-button value="right">right</el-radio-button>
          <el-radio-button value="center">center</el-radio-button>
          <el-radio-button value="left">left</el-radio-button>
        </el-radio-group>
      </div>
    </el-space>
  </el-config-provider>

  <PureTable
    ref="tableRef"
    :size="tableSize"
    :height="tableHeight"
    border
    row-key="id"
    alignWhole="center"
    showOverflowTooltip
    :data="
      dataList.slice(
        (pagination.currentPage - 1) * pagination.pageSize,
        pagination.currentPage * pagination.pageSize
      )
    "
    :columns="columns"
    :pagination="pagination"
    :header-cell-style="{
      background: 'var(--el-table-row-hover-bg-color)',
      color: 'var(--el-text-color-primary)'
    }"
    @selection-change="handleSelectionChange"
    @row-click="rowClick"
    @page-size-change="pageSizeChange"
    @page-current-change="pageCurrentChange"
  >
    <template #empty>
      <el-empty description="暂无数据" :image-size="60">
        <template #image>
          <empty />
        </template>
      </el-empty>
    </template>
    <template #append>
      <p style="text-align: center">
        <el-link
          type="primary"
          href="https://github.com/pure-admin/pure-admin-table"
          target="_blank"
        >
          MIT License | Copyright (c) 2022-present, pure-admin
        </el-link>
      </p>
    </template>
    <template #operateHeader>操作</template>
    <template #operation="{ row }">
      <el-button link type="primary" @click="handleUpdate(row)">
        编辑
      </el-button>
      <el-popconfirm title="是否确认删除？">
        <template #reference>
          <el-button link type="primary" @click="handleDelete(row)">
            删除
          </el-button>
        </template>
      </el-popconfirm>
    </template>
  </PureTable>
</template>

<style scoped>
:deep(.el-empty__description) {
  margin: 0;
}

.pure-space {
  margin-bottom: 2px;
}

.pure-radio {
  display: flex;
}

.pure-small {
  font-size: 14px;
  line-height: 20px;
}
</style>
