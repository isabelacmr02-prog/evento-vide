<template>
  <div class="card section-card">
    <div class="card-header">
      <div class="flex items-center gap-2">
        <span>{{ icon }}</span>
        <h3>{{ title }}</h3>
      </div>
      <button class="btn btn-secondary btn-sm" @click="$emit('edit')">Editar</button>
    </div>
    <div class="card-body">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({ title: String, icon: String })
defineEmits(['edit'])
</script>

<style scoped>
.section-card { height: 100%; }
</style>
