<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h2>📋 Informações Gerais</h2>
        <button class="btn-icon" @click="$emit('close')">✕</button>
      </div>
      <div class="modal-body">
        <div v-if="erro" class="alert alert-erro mb-3">{{ erro }}</div>
        <div class="grid-2">
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label">Nome do evento *</label>
            <input v-model="form.nome" class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">Data de início</label>
            <input v-model="form.data_inicio" type="date" class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">Data de fim</label>
            <input v-model="form.data_fim" type="date" class="form-control" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label">Objetivo</label>
            <textarea v-model="form.objetivo" class="form-control" rows="2"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Público-alvo</label>
            <input v-model="form.publico_alvo" class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">Participantes estimados</label>
            <input v-model.number="form.participantes_estimados" type="number" class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">Litros de água / pessoa / dia</label>
            <input v-model.number="form.litros_agua_pessoa_dia" type="number" step="0.5" class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">Folga alimentação (%)</label>
            <input v-model.number="form.folga_alimentacao_pct" type="number" class="form-control" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label">Observações</label>
            <textarea v-model="form.observacoes" class="form-control" rows="2"></textarea>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('close')">Cancelar</button>
        <button class="btn btn-primary" :disabled="salvando" @click="salvar">{{ salvando ? 'Salvando...' : 'Salvar' }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useEventoDataStore } from '@/stores/eventoData'
import { useEventosStore } from '@/stores/eventos'
import { supabase } from '@/services/supabase'

const emit = defineEmits(['close'])
const store = useEventoDataStore()
const eventosStore = useEventosStore()
const salvando = ref(false)
const erro = ref('')
const form = ref({})

onMounted(() => { form.value = { ...store.evento } })

async function salvar() {
  if (!form.value.nome) { erro.value = 'Nome obrigatório'; return }
  salvando.value = true
  erro.value = ''
  const { nome, objetivo, data_inicio, data_fim, publico_alvo, participantes_estimados, litros_agua_pessoa_dia, folga_alimentacao_pct, observacoes } = form.value
  const { data, error } = await supabase.from('eventos').update({ nome, objetivo, data_inicio, data_fim, publico_alvo, participantes_estimados, litros_agua_pessoa_dia, folga_alimentacao_pct, observacoes }).eq('id', store.eventoId).select().single()
  if (error) { erro.value = error.message; salvando.value = false; return }
  store.evento = data
  emit('close')
  salvando.value = false
}
</script>
