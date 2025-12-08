/**
 * 基础类型定义
 * 所有公共的基础类型都在这里定义，避免在多个文件中重复定义
 */

/** 尺寸类型 */
export type Size = "large" | "default" | "small";

/** 对齐方式类型 */
export type Align = "left" | "center" | "right";

/** 效果类型 */
export type Effect = "dark" | "light";

/** 布局类型 */
export type Layout = "fixed" | "auto";

/** 默认行数据类型 */
export type DefaultRow = Record<PropertyKey, unknown>;
