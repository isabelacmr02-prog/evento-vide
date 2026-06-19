<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h2>🏕 Hospedagem</h2>
        <button class="btn-icon" @click="$emit('close')">✕</button>
      </div>
      <div class="modal-body">
        <div v-if="erro" class="alert alert-erro mb-3">{{ erro }}</div>

        <!-- Indicadores calculados -->
        <div class="calc-box mb-3">
          <div class="calc-item">
            <span class="calc-val">{{ store.barracasEsperadas }}</span>
            <span class="calc-lbl">barracas esperadas (pessoas que marcaram "leva barraca")</span>
          </div>
          <div class="calc-item" v-if="store.hospedagem?.barracas_disponiveis">
            <span class="calc-val" :class="store.barracasEsperadas > store.hospedagem.barracas_disponiveis ? 'text-danger' : 'text-success'">
              {{ store.hospedagem.barracas_disponiveis }}
            </span>
            <span class="calc-lbl">barracas disponíveis informadas</span>
          </div>
        </div>

        <div class="grid-2">
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label">Modelo de hospedagem</label>
            <input v-model="form.modelo" class="form-control" placeholder="Ex.: barracas próprias, alojamento, redes" />
          </div>
          <div class="form-group">
            <label class="form-label">Barracas disponíveis no local</label>
            <input v-model.number="form.barracas_disponiveis" type="number" class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">Colchões disponíveis</label>
            <input v-model.number="form.colchoes" type="number" class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">Redes disponíveis</label>
            <input v-model.number="form.redes" type="number" class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">Cobertores disponíveis</label>
            <input v-model.number="form.cobertores" type="number" class="form-control" />
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
import { supabase } from '@/services/supabase'

const emit = defineEmits(['close'])
const store = useEventoDataStore()
const salvando = ref(false)
const erro = ref('')
const form = ref({})

onMounted(() => { if (store.hospedagem) form.value = { ...store.hospedagem } })

async function salvar() {
  salvando.value = true
  const { data: { user } } = await supabase.auth.getUser()
  const payload = { ...form.value, evento_id: store.eventoId, owner_id: user.id }
  delete payload.id; delete payload.created_at

  let data, error
  if (store.hospedagem?.id) {
    ({ data, error } = await supabase.from('hospedagem').update(payload).eq('id', store.hospedagem.id).select().single())
  } else {
    ({ data, error } = await supabase.from('hospedagem').insert(payload).select().single())
  }
  if (error) { erro.value = error.message; salvando.value = false; return }
  store.upsertHospedagem(data)
  emit('close')
  salvando.value = false
}
</script>

<style scoped>
.calc-box { background: #f8fafc; border: 1px solid var(--border); border-radius: 8px; padding: .75rem 1rem; display: flex; gap: 1.5rem; flex-wrap: wrap; }
.calc-item { display: flex; flex-direction: column; }
.calc-val { font-size: 1.5rem; font-weight: 700; color: var(--primary); }
.calc-lbl { font-size: .75rem; color: var(--text-muted); }
</style>
