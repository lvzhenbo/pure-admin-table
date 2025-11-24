import { mount } from "@vue/test-utils";
import { describe, expect, it, test } from "vitest";
import { nextTick, reactive, ref, h } from "vue";
import { PureTable, type PaginationProps } from "../packages";

describe("PureTable", () => {
  const columns = [
    {
      label: "Department Name",
      prop: "name"
    }
  ];
  const dataList = [{ name: "Tom" }];

  it("should work with import on demand", () => {
    const wrapper = mount(PureTable, {
      attachTo: document.body
    });
    wrapper.unmount();
  });

  test("table `append` slot", async () => {
    const wrapper = mount(PureTable, {
      props: {
        columns,
        data: []
      },
      slots: {
        append: () => h("p", { class: "append" }, "Append")
      },
      attachTo: document.body
    });
    await nextTick();
    expect(wrapper.find(".append").text()).toEqual("Append");
    wrapper.unmount();
  });

  test("table `empty` slot", async () => {
    const wrapper = mount(PureTable, {
      props: {
        columns,
        data: []
      },
      slots: {
        empty: () => h("div", { class: "empty" }, "Empty")
      },
      attachTo: document.body
    });
    await nextTick();
    expect(wrapper.find(".empty").exists()).toEqual(true);
    wrapper.unmount();
  });

  test("table `pagination` prop", async () => {
    const pagination = reactive<PaginationProps>({
      pageSize: 10,
      currentPage: 1,
      background: true,
      class: "testClassName",
      total: 1
    });
    const wrapper = mount(PureTable, {
      props: {
        columns,
        data: dataList,
        pagination
      },
      attachTo: document.body
    });
    await nextTick();
    expect(wrapper.find(".testClassName").exists()).toEqual(true);
    wrapper.unmount();
  });

  test("table `getTableRef` methods", async () => {
    const tableRef = ref();
    const wrapper = mount(PureTable, {
      props: {
        columns,
        data: dataList
      },
      attachTo: document.body
    });
    await nextTick();
    tableRef.value = wrapper.vm;
    expect(tableRef.value.getTableRef()).toBeDefined();
    wrapper.unmount();
  });
});
