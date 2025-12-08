import { dataMock } from "./mock";
import { ElDivider, type ComponentSize } from "element-plus";
import { type Ref, h, ref, reactive, onMounted, watch } from "vue";
import type { Align, TableColumns, PaginationProps } from "../packages";

import empty from "./svg/empty.svg?component";

let srcList: Array<string> = [];
const { BASE_URL } = import.meta.env;

for (let i = 1; i <= 11; i++) {
  srcList.push(`${BASE_URL}/imgs/${i}.jpg`);
}

export function useColumns(tableRef: Ref) {
  const columns: Array<TableColumns> = [
    {
      type: "selection",
      align: "left"
    },
    {
      label: "部门名称",
      prop: "name",
      align: "left"
    },
    {
      label: "Sort",
      prop: "sort",
      children: [
        {
          label: "Remark",
          prop: "remark",
          children: [
            {
              label: "Creation Time",
              prop: "createTime"
            },
            {
              label: "Status",
              prop: "status",
              cellRenderer: ({ row, props }) => (
                <el-tag
                  size={props.size}
                  type={row.status === 1 ? "danger" : "success"}
                  effect="plain"
                >
                  {row.status === 0 ? "关闭" : "开启"}
                </el-tag>
              )
            }
          ]
        },
        {
          prop: "createTime",
          headerRenderer: () => <p>headerRenderer 😉</p>,
          cellRenderer: ({
            index,
            props: {
              pagination: { currentPage, pageSize }
            }
          }) => {
            let currentIndex = (currentPage - 1) * pageSize + index;
            return (
              <el-image
                fit="cover"
                loading="lazy"
                preview-teleported={true}
                initial-index={currentIndex}
                src={srcList[currentIndex]}
                preview-src-list={srcList}
                style="width: 80px; height: 80px; border-radius: 6px"
              />
            );
          }
        }
      ]
    },
    {
      headerSlot: "operateHeader",
      fixed: "right",
      slot: "operation"
    }
  ];

  const spacer = h(ElDivider, { direction: "vertical" });

  const tableHeight = ref(687);
  const tableSize = ref<ComponentSize>("default");
  const paginationAlign = ref("right");

  let dataList = ref<any>([]);

  /** 分页相关配置 */
  const pagination = reactive<PaginationProps>({
    pageSize: 5,
    currentPage: 1,
    background: true,
    align: "right",
    size: "default",
    total: dataList.value.length
  });

  function onChange(val) {
    pagination.size = val;
  }

  function onRefresh() {
    dataList.value = dataMock;
    pagination.total = dataMock.length;
  }

  function onEmpty() {
    dataList.value = [];
    pagination.pageSize = 5;
    pagination.currentPage = 1;
    pagination.total = 0;
  }

  function getTableMethods() {
    console.log("methods", tableRef.value.getTableRef());
  }

  function handleUpdate(row) {
    console.log(row);
  }

  function handleDelete(row) {
    console.log(row);
  }

  function handleSelectionChange(val) {
    console.log("handleSelectionChange", val);
  }

  function rowClick(row, column, event) {
    console.log("rowClick", row, column, event);
  }

  function pageSizeChange(val) {
    console.log("pageSizeChange", val);
  }

  function pageCurrentChange(page) {
    console.log("pageCurrentChange", page);
  }

  watch(paginationAlign, (align: Align) => {
    pagination.align = align;
  });

  watch(tableSize, size => {
    switch (size) {
      case "small":
        tableHeight.value = 622.5;
        break;
      case "default":
        tableHeight.value = 687;
        break;
      case "large":
        tableHeight.value = 751;
        break;
    }
  });

  onMounted(() => {
    onRefresh();
  });

  return {
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
  };
}
