<script setup lang="ts">
import { ChevronDown, ChevronRight } from 'lucide-vue-next';
import { RouterLink } from 'vue-router';
import { resolveMenuIcon } from '@/utils/menu-icons';
import type { SidebarMenuItem } from '@/utils/dynamic-routes';

defineOptions({
  name: 'SidebarMenu',
});

const props = defineProps<{
  items: SidebarMenuItem[];
  activePath: string;
  expandedIds: Set<string>;
}>();

const emit = defineEmits<{
  toggle: [id: string];
}>();

function hasActiveChild(item: SidebarMenuItem): boolean {
  return (
    item.path === props.activePath ||
    item.children.some((child) => hasActiveChild(child))
  );
}
</script>

<template>
  <ul class="sidebar-menu">
    <template v-for="item in items" :key="item.id">
      <li v-if="item.children.length > 0" class="sidebar-menu-group">
        <button
          type="button"
          class="sidebar-link sidebar-group-toggle"
          :class="{ 'is-active-ancestor': hasActiveChild(item) }"
          :aria-expanded="expandedIds.has(item.id)"
          @click="emit('toggle', item.id)"
        >
          <component :is="resolveMenuIcon(item.icon)" :size="18" />
          <span>{{ item.menuName }}</span>
          <component
            :is="expandedIds.has(item.id) ? ChevronDown : ChevronRight"
            :size="16"
          />
        </button>

        <SidebarMenu
          v-show="expandedIds.has(item.id)"
          :items="item.children"
          :active-path="activePath"
          :expanded-ids="expandedIds"
          @toggle="emit('toggle', $event)"
        />
      </li>

      <li v-else>
        <RouterLink
          v-if="item.path"
          :to="item.path"
          class="sidebar-link"
          :class="{ active: item.path === activePath }"
          :aria-current="item.path === activePath ? 'page' : undefined"
        >
          <component :is="resolveMenuIcon(item.icon)" :size="18" />
          <span>{{ item.menuName }}</span>
        </RouterLink>
      </li>
    </template>
  </ul>
</template>

<style scoped>
.sidebar-menu {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.sidebar-menu-group {
  display: grid;
  gap: 4px;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 0 12px;
  border: 0;
  border-radius: 10px;
  color: #626f8a;
  text-align: left;
  text-decoration: none;
  background: transparent;
  cursor: pointer;
  transition:
    background 0.18s ease,
    color 0.18s ease;
}

.sidebar-link > span:first-of-type {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-link:hover,
.sidebar-link.active {
  color: var(--ez-primary-dark);
  background: #eef3ff;
}

.sidebar-group-toggle {
  width: 100%;
}

.sidebar-group-toggle > svg:last-child {
  margin-left: auto;
}

.sidebar-group-toggle.is-active-ancestor {
  color: var(--ez-primary-dark);
  background: #f0f5ff;
}

.sidebar-menu .sidebar-menu {
  padding-left: 18px;
}
</style>
