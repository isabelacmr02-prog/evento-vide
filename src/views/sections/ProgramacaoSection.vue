<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal modal-lg">
      <div class="modal-header">
        <h2>🗓 Programação</h2>
        <button class="btn-icon" @click="$emit('close')">✕</button>
      </div>
      <div class="modal-body">
        <!-- Formulário -->
        <div class="card mb-3" style="padding:1rem">
          <h3 class="mb-2">{{ editando ? 'Editar atividade' : '+ Adicionar atividade' }}</h3>
          <div v-if="erroForm" class="alert alert-erro mb-2">{{ erroForm }}</div>
          <div class="grid-2">
            <div class="form-group" style="grid-column:1/-1">
              <label class="form-label">Título *</label>
              <input v-model="form.titulo" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Início *</label>
              <input v-model="form.inicio" type="datetime-local" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Fim</label>
              <input v-model="form.fim" type="datetime-local" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Tipo</label>
              <input v-model="form.tipo" class="form-control" placeholder="devocional, culto, gincana, trilha, refeição..." />
            </div>
            <div class="form-group">
              <label class="form-label">Local</label>
              <input v-model="form.local" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Equipe responsável</label>
              <select v-model="form.equipe_responsavel_id" class="form-control">
                <option value="">— Nenhuma —</option>
                <option v-for="eq in store.equipes" :key="eq.id" :value="eq.id">{{ eq.nome }}</option>
              </select>
            </div>
            <div class="form-group" style="grid-column:1/-1">
              <label class="form-label">Observações</label>
              <textarea v-model="form.observacoes" class="form-control" rows="2"></textarea>
            </div>
          </div>
          <div class="flex gap-2 mt-1">
            <button class="btn btn-primary btn-sm" :disabled="salvando" @click="salvar">{{ salvando ? '...' : (editando ? 'Atualizar' : 'Adicionar') }}</button>
            <button v-if="editando" class="btn btn-secondary btn-sm" @click="cancelar">Cancelar</button>
          </div>
        </div>

        <!-- Cronograma por dia -->
        <div v-for="(ativs, dia) in atividadesPorDia" :key="dia" class="mb-4">
          <h3 class="mb-2 dia-header">📅 {{ formatarData(dia) }}</h3>
          <div v-for="ativ in ativs" :key="ativ.id" class="ativ-item">
            <div class="ativ-hora">
              <span>{{ formatHora(ativ.inicio) }}</span>
              <span v-if="ativ.fim" class="text-muted" style="font-size:.75rem">{{ formatHora(ativ.fim) }}</span>
            </div>
            <div class="ativ-body">
              <div class="ativ-titulo">{{ ativ.titulo }}</div>
              <div class="ativ-meta">
                <span v-if="ativ.tipo" class="badge badge-pendente">{{ ativ.tipo }}</span>
                <span v-if="ativ.local" class="text-muted">📍 {{ ativ.local }}</span>
                <span v-if="ativ.equipe_responsavel_id" class="text-muted">🤝 {{ nomeEquipe(ativ.equipe_responsavel_id) }}</span>
              </div>
            </div>
            <div class="flex gap-1">
              <button class="btn-icon btn-sm" @click="iniciarEdicao(ativ)">✏️</button>
              <button class="btn-icon btn-sm" @click="excluir(ativ.id)">🗑</button>
            </div>
          </div>
        </div>
        <div v-if="store.programacao.length === 0" class="empty-state">Nenhuma atividade cadastrada</div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('close')">Fechar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useEventoDataStore } from '@/stores/eventoData'
import { supabase } from '@/services/supabase'

const emit = defineEmits(['close'])
const store = useEventoDataStore()
const salvando = ref(false)
const erroForm = ref('')
const editando = ref(null)

const formDefault = () => ({ titulo: '', inicio: '', fim: '', tipo: '', local: '', equipe_responsavel_id: '', observacoes: '' })
const form = ref(formDefault())

const atividadesPorDia = computed(() => {
  const grupos = {}
  for (const a of store.programacao) {
    const dia = a.inicio.substring(0, 10)
    if (!grupos[dia]) grupos[dia] = []
    grupos[dia].push(a)
  }
  return grupos
})

function iniciarEdicao(a) {
  editando.value = a
  form.value = { ...a, inicio: a.inicio?.substring(0, 16) || '', fim: a.fim?.substring(0, 16) || '' }
}
function cancelar() { editando.value = null; form.value = formDefault() }

async function salvar() {
  if (!form.value.titulo || !form.value.inicio) { erroForm.value = 'Título e início obrigatórios'; return }
  salvando.value = true; erroForm.value = ''
  const { data: { user } } = await supabase.auth.getUser()
  const payload = {
    titulo: form.value.titulo, inicio: form.value.inicio, fim: form.value.fim || null,
    tipo: form.value.tipo, local: form.value.local,
    equipe_responsavel_id: form.value.equipe_responsavel_id || null,
    observacoes: form.value.observacoes,
    evento_id: store.eventoId, owner_id: user.id
  }
  if (editando.value) {
    const { data, error } = await supabase.from('programacao').update(payload).eq('id', editando.value.id).select().single()
    if (error) { erroForm.value = error.message; salvando.value = false; return }
    store.updateProg(data)
    cancelar()
  } else {
    const { data, error } = await supabase.from('programacao').insert(payload).select().single()
    if (error) { erroForm.value = error.message; salvando.value = false; return }
    store.addProg(data)
    form.value = formDefault()
  }
  salvando.value = false
}

async function excluir(id) {
  if (!confirm('Excluir atividade?')) return
  const { error } = await supabase.from('programacao').delete().eq('id', id)
  if (!error) store.removeProg(id)
}

function nomeEquipe(id) { return store.equipes.find(e => e.id === id)?.nome || '' }
function formatarData(d) { return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }) }
function formatHora(ts) { if (!ts) return ''; return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
</script>

<style scoped>
.dia-header { color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: .3rem; }
.ativ-item { display: flex; gap: .75rem; align-items: flex-start; padding: .6rem 0; border-bottom: 1px solid #f1f5f9; }
.ativ-hora { min-width: 55px; display: flex; flex-direction: column; align-items: flex-end; font-weight: 600; color: var(--primary); font-size: .85rem; }
.ativ-body { flex: 1; }
.ativ-titulo { font-weight: 500; margin-bottom: .2rem; }
.ativ-meta { display: flex; gap: .5rem; flex-wrap: wrap; font-size: .78rem; }
</style>
