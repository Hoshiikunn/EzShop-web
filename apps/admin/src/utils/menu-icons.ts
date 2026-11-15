import { ref } from 'vue';
import type { Component } from 'vue';

export interface MenuIconOption {
  name: string;
  component: Component;
}

const iconMap = ref(new Map<string, Component>());

let iconOptionsCache: MenuIconOption[] | null = null;

function toIconName(pascalName: string): string {
  return pascalName
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([a-z])(\d)/g, '$1-$2')
    .toLowerCase();
}

// lucide-vue-next 通过动态 import 懒加载，全量图标打包为独立 chunk，不拖慢首屏。
export async function loadMenuIconOptions(): Promise<MenuIconOption[]> {
  if (iconOptionsCache) {
    return iconOptionsCache;
  }

  const lucideModule = await import('lucide-vue-next');
  const options: MenuIconOption[] = [];
  const seenNames = new Set<string>();

  for (const [exportName, exportValue] of Object.entries(lucideModule)) {
    if (!/^[A-Z][A-Za-z0-9]*$/.test(exportName)) {
      continue;
    }

    // lucide 同时导出 Xxx 与 XxxIcon 两个同形组件，跳过 Icon 后缀避免重复。
    if (exportName.endsWith('Icon')) {
      continue;
    }

    const valueType = typeof exportValue;

    if (valueType !== 'function' && valueType !== 'object') {
      continue;
    }

    const name = toIconName(exportName);

    if (seenNames.has(name)) {
      continue;
    }

    seenNames.add(name);
    options.push({ name, component: exportValue as Component });
  }

  iconOptionsCache = options;
  iconMap.value = new Map(options.map((option) => [option.name, option.component]));

  return options;
}

export function resolveMenuIcon(name?: string | null): Component | undefined {
  if (!name) {
    return undefined;
  }

  return iconMap.value.get(name);
}
