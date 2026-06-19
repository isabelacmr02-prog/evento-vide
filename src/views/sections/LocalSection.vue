<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal modal-lg">
      <div class="modal-header">
        <h2>📍 Local do Evento</h2>
        <button class="btn-icon" @click="$emit('close')">✕</button>
      </div>
      <div class="modal-body">
        <div v-if="erro" class="alert alert-erro mb-3">{{ erro }}</div>
        <div class="grid-2">
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label">Nome do local</label>
            <input v-model="form.nome_local" class="form-control" placeholder="Ex.: Rancho Brisas do Araguaia" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label">Endereço / Município</label>
            <input v-model="form.endereco" class="form-control" placeholder="Ex.: Caseara-TO" />
          </div>
          <div class="form-group">
            <label class="form-label">Distância (km)</label>
            <input v-model.number="form.distancia_km" type="number" class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">Custo da diária (R$)</label>
            <input v-model.number="form.custo_diaria" type="number" class="form-control" />
          </div>

          <hr class="divider" style="grid-column:1/-1">

          <div class="form-group">
            <label class="form-check">
              <input v-model="form.tem_banheiro" type="checkbox" />
              Tem banheiro
            </label>
            <input v-if="form.tem_banheiro" v-model.number="form.qtd_banheiros" type="number" class="form-control mt-2" placeholder="Quantidade de banheiros" />
          </div>
          <div class="form-group">
            <label class="form-check">
              <input v-model="form.tem_cozinha" type="checkbox" />
              Tem cozinha
            </label>
          </div>
          <div class="form-group">
            <label class="form-check">
              <input v-model="form.tem_energia" type="checkbox" />
              Tem energia elétrica
            </label>
            <input v-if="form.tem_energia" v-model="form.fonte_energia" class="form-control mt-2" placeholder="Fonte: rede / gerador..." />
          </div>
          <div class="form-group">
            <label class="form-check">
              <input v-model="form.tem_agua_potavel" type="checkbox" />
              Tem água potável no local
            </label>
          </div>
          <div class="form-group">
            <label class="form-check">
              <input v-model="form.tem_estacionamento" type="checkbox" />
              Tem estacionamento
            </label>
          </div>

          <hr class="divider" style="grid-column:1/-1">

          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label">Pontos de risco no local</label>
            <textarea v-model="form.pontos_de_risco" class="form-control" placeholder="Ex.: rio (afogamento), animais peçonhentos, mosquitos" rows="2"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Unidade de saúde próxima <span class="text-danger">*</span></label>
            <input v-model="form.unidade_saude_proxima" class="form-control" placeholder="Nome e cidade" />
          </div>
          <div class="form-group">
            <label class="form-label">Contato de saúde / emergência</label>
            <input v-model="form.contato_saude" class="form-control" placeholder="Telefone ou endereço" />
          </div>
          <div class="form-group">
            <label class="form-label">Acessibilidade</label>
            <input v-model="form.acessibilidade" class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">Área coberta</label>
            <input v-model="form.area_coberta" class="form-control" />
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
const form = ref({ tem_banheiro: false, tem_cozinha: false, tem_energia: false, tem_agua_potavel: false, tem_estacionamento: false })

onMounted(() => { if (store.local) form.value = { ...store.local } })

async function salvar() {
  salvando.value = true
  erro.value = ''
  const { data: { user } } = await supabase.auth.getUser()
  const payload = { ...form.value, evento_id: store.eventoId, owner_id: user.id }
  delete payload.id; delete payload.created_at

  let data, error
  if (store.local?.id) {
    ({ data, error } = await supabase.from('locais').update(payload).eq('id', store.local.id).select().single())
  } else {
    ({ data, error } = await supabase.from('locais').insert(payload).select().single())
  }
  if (error) { erro.value = error.message; salvando.value = false; return }
  store.upsertLocal(data)
  emit('close')
  salvando.value = false
}
</script>
