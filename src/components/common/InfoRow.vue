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
.info-row { display: flex; justify-content: space-between; align-items: flex-start; gap: .5rem; padding: .25rem 0; border-bottom: 1px solid #f8fafc; font-size: .85rem; }
.info-label { color: var(--text-muted); flex-shrink: 0; }
.info-value { text-align: right; }
.info-missing { color: #cbd5e1; font-style: italic; text-align: right; }
</style>
