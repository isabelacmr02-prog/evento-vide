<template>
  <div class="input-group">
    <span class="input-prefix">R$</span>
    <input
      type="text"
      inputmode="decimal"
      :value="displayValue"
      :placeholder="placeholder || '0,00'"
      :disabled="disabled"
      class="form-control currency-field"
      v-bind="$attrs"
      @focus="onFocus"
      @blur="onBlur"
      @input="onInput"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  modelValue: { type: Number, default: null },
  placeholder: String,
  disabled: Boolean
})
const emit = defineEmits(['update:modelValue'])

const focused = ref(false)
const rawText = ref('')

const displayValue = computed(() => {
  if (focused.value) return rawText.value
  if (props.modelValue == null || props.modelValue === '') return ''
  return Number(props.modelValue).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
})

function onFocus() {
  focused.value = true
  rawText.value = props.modelValue != null ? String(props.modelValue).replace('.', ',') : ''
}

function onInput(e) {
  rawText.value = e.target.value
}

function onBlur() {
  focused.value = false
  let val = rawText.value.trim()
  if (!val) { emit('update:modelValue', null); return }
  // Handle both "1.234,56" (pt-BR) and "1234.56" (en)
  if (val.includes(',')) {
    val = val.replace(/\./g, '').replace(',', '.')
  }
  const num = parseFloat(val)
  emit('update:modelValue', isNaN(num) ? null : Math.round(num * 100) / 100)
  rawText.value = ''
}

watch(() => props.modelValue, (val) => {
  if (!focused.value) rawText.value = val != null ? String(val) : ''
}, { immediate: true })
</script>

<style scoped>
.currency-field { min-width: 0; }
</style>
