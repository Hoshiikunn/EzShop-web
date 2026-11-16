<script setup lang="ts">
import { computed, ref } from 'vue';
import { ElMessage, type PopoverInstance } from 'element-plus';
import { Search, X } from 'lucide-vue-next';
import { loadMenuIconOptions, resolveMenuIcon } from '@/utils/menu-icons';
import type { MenuIconOption } from '@/utils/menu-icons';

const model = defineModel<string>({
  required: true,
});

const popoverRef = ref<PopoverInstance>();
const options = ref<MenuIconOption[]>([]);
const optionsLoading = ref(false);
const search = ref('');

const filteredOptions = computed(() => {
  const query = search.value.trim().toLowerCase();

  if (!query) {
    return options.value;
  }

  return options.value.filter((option) => option.name.includes(query));
});

const selectedComponent = computed(() => resolveMenuIcon(model.value));

async function loadOptions() {
  if (options.value.length > 0) {
    return;
  }

  optionsLoading.value = true;

  try {
    options.value = await loadMenuIconOptions();
  } catch {
    ElMessage.error('图标加载失败');
  } finally {
    optionsLoading.value = false;
  }
}

function select(name: string) {
  model.value = name;
  popoverRef.value?.hide();
}

function clear() {
  model.value = '';
}
</script>

<template>
  <el-popover
    ref="popoverRef"
    placement="bottom-start"
    :width="360"
    trigger="click"
    @after-enter="loadOptions"
  >
    <template #reference>
      <button class="icon-trigger" type="button">
        <component v-if="selectedComponent" :is="selectedComponent" :size="16" />
        <span :class="{ 'icon-placeholder': !model }">{{ model || '选择图标' }}</span>
        <X v-if="model" :size="14" @click.stop="clear" />
      </button>
    </template>

    <div v-loading="optionsLoading" class="icon-picker">
      <el-input v-model="search" :prefix-icon="Search" placeholder="搜索图标名称" clearable />

      <div class="icon-grid">
        <button
          v-for="option in filteredOptions"
          :key="option.name"
          class="icon-option"
          :class="{ selected: option.name === model }"
          type="button"
          :title="option.name"
          @click="select(option.name)"
        >
          <component :is="option.component" :size="18" />
        </button>
      </div>
    </div>
  </el-popover>
</template>

<style scoped>
.icon-trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--ez-line);
  border-radius: 7px;
  color: var(--ez-ink);
  background: #fff;
  cursor: pointer;
}

.icon-placeholder {
  color: var(--ez-muted);
}

.icon-picker {
  display: grid;
  gap: 10px;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
  max-height: 280px;
  overflow: auto;
}

.icon-option {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 1px solid transparent;
  border-radius: 7px;
  color: var(--ez-ink);
  background: transparent;
  cursor: pointer;
}

.icon-option:hover {
  color: var(--ez-primary-dark);
  background: #f5f8ff;
}

.icon-option.selected {
  color: var(--ez-primary-dark);
  border-color: var(--ez-primary);
  background: #eef3ff;
}
</style>
