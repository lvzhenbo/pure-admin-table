<script setup lang="ts">
/**
 * 渲染器组件
 * 用于动态渲染自定义内容
 */
interface RendererProps {
  /** 渲染函数 */
  render?: Function;
  /** 传递给渲染函数的参数 */
  params?: any;
}

const props = defineProps<RendererProps>();
</script>

<template>
  <component :is="render?.(params)" />
</template>
