<template>
  <h1 style="text-align: center">自定义命名空间</h1>
  <el-config-provider namespace="ep" :locale="zhCn">
    <pure-table border :data="tableData" :columns="columns" :pagination="pagination" />
  </el-config-provider>
</template>

<script lang="ts" setup>
import { reactive } from "vue"
import type { TableColumns } from "@pureadmin/table"
import zhCn from "element-plus/dist/locale/zh-cn.mjs"

const columns: Array<TableColumns> = [{
  label: "日期",
  prop: "date",
}, {
  label: "姓名",
  prop: "name",
}, {
  label: "地址",
  prop: "address",
}]

const tableData = [
  {
    date: '2030-05-01',
    name: '张三',
    address: '上海市浦东新区',
  },
  {
    date: '2030-05-02',
    name: '李四',
    address: '北京市朝阳区',
  },
  {
    date: '2030-05-03',
    name: '王五',
    address: '深圳市南山区',
  },
  {
    date: '2030-05-04',
    name: '赵六',
    address: '广州市天河区',
  },
]

const pagination = reactive({
  pageSize: 5,
  currentPage: 1,
  background: true,
  total: tableData.length
})
</script>

