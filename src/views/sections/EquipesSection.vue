<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal modal-lg">
      <div class="modal-header">
        <h2>🤝 Equipes</h2>
        <button class="btn-icon" @click="$emit('close')">✕</button>
      </div>
      <div class="modal-body">
        <!-- Criar equipe -->
        <div class="card mb-3" style="padding:1rem">
          <h3 class="mb-2">+ Nova Equipe</h3>
          <div v-if="erroEq" class="alert alert-erro mb-2">{{ erroEq }}</div>
          <div class="flex gap-2">
            <input v-model="novaEquipe.nome" class="form-control" placeholder="Nome da equipe (ex.: Coordenação, Alimentação)" />
            <input v-model="novaEquipe.descricao" class="form-control" placeholder="Descrição (opcional)" />
            <button class="btn btn-primary btn-sm" :disabled="salvandoEq" @click="criarEquipe">{{ salvandoEq ? '...' : 'Criar' }}</button>
          </div>
        </div>

        <!-- Equipes existentes -->
        <div v-for="eq in store.equipes" :key="eq.id" class="card mb-3">
          <div class="equipe-header">
            <div>
              <strong>{{ eq.nome }}</strong>
              <span class="text-muted ml-1" style="font-size:.82rem">{{ eq.descricao }}</span>
            </div>
            <div class="flex gap-1">
              <span class="badge badge-pendente">{{ membrosDeEquipe(eq.id).length }} membro(s)</span>
              <button class="btn-icon btn-sm" @click="excluirEquipe(eq.id)">🗑</button>
            </div>
          </div>
          <div class="equipe-body">
            <!-- Membros -->
            <div v-for="m in membrosDeEquipe(eq.id)" :key="m.id" class="membro-item">
              <span>{{ m.pessoas?.nome || m.pessoa_id }}</span>
              <span class="text-muted" style="font-size:.8rem">{{ m.responsabilidade }}</span>
              <button class="btn-icon btn-sm" @click="removerMembro(m.id)">✕</button>
            </div>
            <!-- Adicionar membro -->
            <div class="add-membro-row mt-2">
              <select v-model="novoMembro[eq.id].pessoa_id" class="form-control" style="flex:2">
                <option value="">Selecionar pessoa...</option>
                <option v-for="p in pessoasDisponiveisParaEquipe(eq.id)" :key="p.id" :value="p.id">{{ p.nome }} ({{ p.papel }})</option>
              </select>
              <input v-model="novoMembro[eq.id].responsabilidade" class="form-control" placeholder="Responsabilidade" style="flex:2" />
              <button class="btn btn-secondary btn-sm" @click="adicionarMembro(eq.id)">+ Membro</button>
            </div>
          </div>
        </div>
        <div v-if="store.equipes.length === 0" class="empty-state">Nenhuma equipe criada</div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('close')">Fechar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useEventoDataStore } from '@/stores/eventoData'
import { supabase } from '@/services/supabase'

const emit = defineEmits(['close'])
const store = useEventoDataStore()
const salvandoEq = ref(false)
const erroEq = ref('')
const novaEquipe = ref({ nome: '', descricao: '' })
const novoMembro = reactive({})
store.equipes.forEach(eq => { novoMembro[eq.id] = { pessoa_id: '', responsabilidade: '' } })

function membrosDeEquipe(eqId) { return store.equipesMembros.filter(m => m.equipe_id === eqId) }
function pessoasDisponiveisParaEquipe(eqId) {
  const jaEstao = new Set(membrosDeEquipe(eqId).map(m => m.pessoa_id))
  return store.pessoas.filter(p => !jaEstao.has(p.id))
}

async function criarEquipe() {
  if (!novaEquipe.value.nome) { erroEq.value = 'Nome obrigatório'; return }
  salvandoEq.value = true; erroEq.value = ''
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase.from('equipes').insert({ ...novaEquipe.value, evento_id: store.eventoId, owner_id: user.id }).select().single()
  if (error) { erroEq.value = error.message; salvandoEq.value = false; return }
  store.addEquipe(data)
  novoMembro[data.id] = { pessoa_id: '', responsabilidade: '' }
  novaEquipe.value = { nome: '', descricao: '' }
  salvandoEq.value = false
}

async function excluirEquipe(id) {
  if (!confirm('Excluir equipe e todos os membros?')) return
  const { error } = await supabase.from('equipes').delete().eq('id', id)
  if (!error) store.removeEquipe(id)
}

async function adicionarMembro(eqId) {
  const m = novoMembro[eqId]
  if (!m.pessoa_id) return
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase.from('equipe_membros').insert({
    equipe_id: eqId, pessoa_id: m.pessoa_id, responsabilidade: m.responsabilidade, owner_id: user.id
  }).select('*, pessoas(nome)').single()
  if (!error) { store.addMembro(data); novoMembro[eqId] = { pessoa_id: '', responsabilidade: '' } }
}

async function removerMembro(id) {
  const { error } = await supabase.from('equipe_membros').delete().eq('id', id)
  if (!error) store.removeMembro(id)
}
</script>

<style scoped>
.equipe-header { padding: .75rem 1rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; background: #f8fafc; }
.equipe-body { padding: .75rem 1rem; }
.membro-item { display: flex; align-items: center; gap: .75rem; padding: .3rem 0; font-size: .85rem; border-bottom: 1px solid #f8fafc; }
.membro-item span:first-child { flex: 1; font-weight: 500; }
.membro-item span:nth-child(2) { flex: 2; }
.add-membro-row { display: flex; gap: .5rem; align-items: center; }
</style>
