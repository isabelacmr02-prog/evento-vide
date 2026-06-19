<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h2>🔧 {{ secaoNome || 'Seção Personalizada' }}</h2>
        <button class="btn-icon" @click="$emit('close')">✕</button>
      </div>
      <div class="modal-body">
        <p class="text-muted mb-3" style="font-size:.85rem">Campos personalizados para dados fora do padrão. Aparecem no dashboard e nos relatórios.</p>

        <!-- Adicionar campo -->
        <div class="card mb-3" style="padding:1rem">
          <h3 class="mb-2">+ Adicionar campo</h3>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Seção *</label>
              <input v-model="form.secao" class="form-control" :placeholder="secaoNome || 'Ex.: Documentação'" />
            </div>
            <div class="form-group">
              <label class="form-label">Rótulo do campo *</label>
              <input v-model="form.rotulo" class="form-control" placeholder="Ex.: Número do seguro" />
            </div>
            <div class="form-group">
              <label class="form-label">Tipo</label>
              <select v-model="form.tipo_campo" class="form-control">
                <option value="texto">Texto</option>
                <option value="numero">Número</option>
                <option value="data">Data</option>
                <option value="booleano">Sim/Não</option>
                <option value="lista">Lista (separar por vírgula)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Valor inicial</label>
              <input v-if="form.tipo_campo !== 'booleano'" v-model="form.valor" :type="form.tipo_campo === 'numero' ? 'number' : form.tipo_campo === 'data' ? 'date' : 'text'" class="form-control" />
              <select v-else v-model="form.valor" class="form-control">
                <option value="true">Sim</option>
                <option value="false">Não</option>
              </select>
            </div>
          </div>
          <button class="btn btn-primary btn-sm mt-1" :disabled="salvando" @click="adicionar">{{ salvando ? '...' : 'Adicionar' }}</button>
        </div>

        <!-- Campos existentes agrupados por seção -->
        <div v-for="(campos, sec) in store.customFieldsSecoes" :key="sec" class="mb-3">
          <h3 class="mb-2">{{ sec }}</h3>
          <div v-for="cf in campos" :key="cf.id" class="cf-item">
            <div class="cf-info">
              <span class="cf-rotulo">{{ cf.rotulo }}</span>
              <span class="badge badge-pendente" style="font-size:.7rem">{{ cf.tipo_campo }}</span>
            </div>
            <div class="cf-valor">
              <input v-model="cf.valor" class="form-control" style="font-size:.85rem" @blur="atualizar(cf)" />
            </div>
            <button class="btn-icon btn-sm" @click="excluir(cf.id)">🗑</button>
          </div>
        </div>
        <div v-if="Object.keys(store.customFieldsSecoes).length === 0" class="empty-state">
          Nenhum campo personalizado cadastrado
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('close')">Fechar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useEventoDataStore } from '@/stores/eventoData'
import { supabase } from '@/services/supabase'

const props = defineProps({ secaoNome: String })
const emit = defineEmits(['close'])
const store = useEventoDataStore()
const salvando = ref(false)
const form = ref({ secao: props.secaoNome || '', rotulo: '', tipo_campo: 'texto', valor: '' })

async function adicionar() {
  if (!form.value.secao || !form.value.rotulo) return
  salvando.value = true
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase.from('custom_fields').insert({
    ...form.value, evento_id: store.eventoId, owner_id: user.id
  }).select().single()
  if (!error) {
    store.addCustomField(data)
    form.value = { secao: props.secaoNome || '', rotulo: '', tipo_campo: 'texto', valor: '' }
  }
  salvando.value = false
}

async function atualizar(cf) {
  const { data, error } = await supabase.from('custom_fields').update({ valor: cf.valor }).eq('id', cf.id).select().single()
  if (!error) store.updateCustomField(data)
}

async function excluir(id) {
  if (!confirm('Excluir campo?')) return
  const { error } = await supabase.from('custom_fields').delete().eq('id', id)
  if (!error) store.removeCustomField(id)
}
</script>

<style scoped>
.cf-item { display: flex; align-items: center; gap: .75rem; padding: .4rem 0; border-bottom: 1px solid #f1f5f9; }
.cf-info { display: flex; align-items: center; gap: .4rem; min-width: 160px; }
.cf-rotulo { font-size: .85rem; font-weight: 500; }
.cf-valor { flex: 1; }
</style>
