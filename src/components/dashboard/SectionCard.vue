<template>
  <div class="section-card">
    <div class="section-card-header">
      <div class="section-card-title">
        <span class="section-icon">{{ icon }}</span>
        <h3>{{ title }}</h3>
      </div>
      <button class="edit-btn" @click="$emit('edit')" title="Editar seção">
        ✏️
      </button>
    </div>
    <div class="section-card-body">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({ title: String, icon: String })
defineEmits(['edit'])
</script>

<style scoped>
.section-card {
  background: #fff;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all .2s cubic-bezier(.4,0,.2,1);
}
.section-card:hover {
  box-shadow: var(--shadow);
  border-color: #d0d7f0;
  transform: translateY(-1px);
}

.section-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: .9rem 1.1rem;
  border-bottom: 1px solid var(--border-light);
  gap: .5rem;
  background: linear-gradient(to right, #fafbff, #fff);
}
.section-card-title {
  display: flex;
  align-items: center;
  gap: .6rem;
}
.section-icon {
  font-size: 1.05rem;
  width: 30px;
  height: 30px;
  background: var(--primary-light);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.section-card-title h3 {
  font-size: .88rem;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -.01em;
}

.edit-btn {
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: .85rem;
  color: var(--text-muted);
  transition: all .15s;
  flex-shrink: 0;
}
.edit-btn:hover {
  background: var(--primary-light);
}

.section-card-body {
  padding: 1rem 1.1rem;
  flex: 1;
}
</style>
