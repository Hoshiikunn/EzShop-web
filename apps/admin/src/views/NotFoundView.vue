<template>
  <section class="not-found">
    <h2>页面不存在或无权访问</h2>
    <p>请确认页面地址，或返回有权限的后台页面。</p>
  </section>
</template>

<style scoped>
.not-found {
  display: grid;
  justify-items: center;
  gap: 10px;
  min-height: 240px;
  align-content: center;
  color: var(--ez-muted);
}

.not-found h2 {
  margin: 0;
  color: var(--ez-ink);
}

.not-found p {
  margin: 0;
}
</style>
