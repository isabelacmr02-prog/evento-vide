<template>
  <div class="input-group">
    <span class="input-prefix">R$</span>
    <input
      ref="inputRef"
      type="text"
      inputmode="numeric"
      :value="displayValue"
      :placeholder="placeholder || '0,00'"
      :disabled="disabled"
      class="form-control currency-field"
      v-bind="$attrs"
      @input="onInput"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  modelValue: { type: Number, default: null },
  placeholder: String,
  disabled: Boolean
})
const emit = defineEmits(['update:modelValue'])

const inputRef = ref(null)
const internalDigits = ref('')

const displayValue = computed(() => {
  if (!internalDigits.value) return ''
  const num = parseInt(internalDigits.value, 10)
  return isNaN(num) ? '' : (num / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
})

function onInput(e) {
  const digits = e.target.value.replace(/\D/g, '')
  internalDigits.value = digits

  const numVal = digits ? parseInt(digits, 10) / 100 : null
  emit('update:modelValue', numVal)

  // Force format on DOM and push cursor to end
  nextTick(() => {
    if (!inputRef.value) return
    const formatted = displayValue.value
    inputRef.value.value = formatted
    inputRef.value.setSelectionRange(formatted.length, formatted.length)
  })
}

watch(() => props.modelValue, (val) => {
  if (val == null) { internalDigits.value = ''; return }
  // Convert modelValue back to cents-string to keep internal state consistent
  internalDigits.value = String(Math.round(val * 100))
}, { immediate: true })
</script>

<style scoped>
.currency-field { min-width: 0; }
</style>
