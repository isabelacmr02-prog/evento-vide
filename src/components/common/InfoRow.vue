<template>
  <div class="info-row">
    <span class="info-label">{{ label }}</span>
    <span v-if="value !== null && value !== undefined && value !== ''" class="info-value">{{ value }}</span>
    <span v-else class="info-missing">{{ missingLabel || '—' }}</span>
  </div>
</template>

<script setup>
defineProps({ label: String, value: [String, Number, Boolean], missingLabel: String })
</script>

<style scoped>
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: .75rem;
  padding: .3rem 0;
  border-bottom: 1px solid var(--border-light);
  font-size: .83rem;
}
.info-row:last-child { border-bottom: none; }
.info-label { color: var(--text-muted); flex-shrink: 0; font-weight: 500; }
.info-value { text-align: right; color: var(--text); font-weight: 500; }
.info-missing { color: var(--border); font-style: italic; text-align: right; }
</style>
