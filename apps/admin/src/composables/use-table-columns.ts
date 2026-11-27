import { onBeforeUnmount, onMounted, reactive, type Ref } from 'vue';
import type { TableInstance } from 'element-plus';

export interface TableColumnConfig {
  /** 列标识，与表头 label 一致 */
  label: string;
  /** 基准宽度，同时作为窗口尺寸变化时按比例分摊的权重 */
  width: number;
  /** 允许压缩到的最小宽度 */
  minWidth?: number;
}

const DEFAULT_MIN_WIDTH = 70;
const ABSOLUTE_MIN_WIDTH = 60;

/**
 * 列宽接管方案：
 * - 初始与窗口尺寸变化时，按基准宽度比例把容器宽度分摊到各列，表格始终铺满。
 * - 拖动表头分隔线结束后，把宽度差值完整转移给紧邻列，其余列保持不变。
 */
export function useTableColumns(
  columns: TableColumnConfig[],
  tableRef: Ref<TableInstance | undefined>,
) {
  const columnWidths = reactive<Record<string, number>>(
    Object.fromEntries(columns.map((column) => [column.label, column.width])),
  );

  function minWidthOf(label: string) {
    return Math.max(
      columns.find((column) => column.label === label)?.minWidth ?? DEFAULT_MIN_WIDTH,
      ABSOLUTE_MIN_WIDTH,
    );
  }

  function redistribute() {
    const el = tableRef.value?.$el as HTMLElement | undefined;
    const available = el?.clientWidth ?? 0;

    if (!available) {
      return;
    }

    let total = 0;

    for (const column of columns) {
      total += columnWidths[column.label];
    }

    if (total <= 0) {
      return;
    }

    const factor = available / total;

    for (const column of columns) {
      columnWidths[column.label] = Math.max(
        minWidthOf(column.label),
        Math.round(columnWidths[column.label] * factor),
      );
    }
  }

  function handleHeaderDragend(newWidth: number, oldWidth: number, column: { label?: string }) {
    const label = column?.label;

    if (!label || !(label in columnWidths)) {
      return;
    }

    const index = columns.findIndex((item) => item.label === label);

    if (index === -1) {
      return;
    }

    columnWidths[label] = Math.max(minWidthOf(label), newWidth);

    const transferred = oldWidth - columnWidths[label];
    const neighborIndex = index < columns.length - 1 ? index + 1 : index - 1;
    const neighbor = columns[neighborIndex];

    columnWidths[neighbor.label] = Math.max(
      minWidthOf(neighbor.label),
      columnWidths[neighbor.label] + transferred,
    );
  }

  function handleWindowResize() {
    redistribute();
  }

  onMounted(() => {
    redistribute();
    window.addEventListener('resize', handleWindowResize);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleWindowResize);
  });

  return { columnWidths, handleHeaderDragend };
}
