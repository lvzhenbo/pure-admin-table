<template>
  <h1 style="text-align: center">按需引入示例</h1>
  <pure-table border :loading="loading" :data="tableData" :columns="columns" :pagination="pagination" />
</template>

<script lang="ts" setup>
import { ref, reactive } from "vue"
import type { TableColumns } from "@pureadmin/table"

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

let loading = ref(true)
const pagination = reactive({
  pageSize: 5,
  currentPage: 1,
  background: true,
  total: tableData.length
})

setTimeout(() => {
  loading.value = false
}, 1500)
</script>

