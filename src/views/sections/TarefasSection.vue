<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal modal-lg">
      <div class="modal-header">
        <h2>✅ Tarefas / Plano de Ação</h2>
        <button class="btn-icon" @click="$emit('close')">✕</button>
      </div>
      <div class="modal-body">
        <!-- Kanban summary -->
        <div class="kanban-stats mb-3">
          <div v-for="s in statusList" :key="s.value" class="kanban-stat">
            <span class="k-num">{{ store.tarefas.filter(t=>t.status===s.value).length }}</span>
            <span :class="`badge badge-${s.value}`">{{ s.label }}</span>
          </div>
        </div>

        <!-- Formulário -->
        <div class="card mb-3" style="padding:1rem">
          <h3 class="mb-2">{{ editando ? 'Editar tarefa' : '+ Adicionar tarefa' }}</h3>
          <div v-if="erroForm" class="alert alert-erro mb-2">{{ erroForm }}</div>
          <div class="grid-2">
            <div class="form-group" style="grid-column:1/-1">
              <label class="form-label">O que fazer? *</label>
              <input v-model="form.o_que" class="form-control" placeholder="Ex.: Confirmar disponibilidade do barco" />
            </div>
            <div class="form-group" style="grid-column:1/-1">
              <label class="form-label">Como fazer?</label>
              <textarea v-model="form.como" class="form-control" rows="2"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Responsável</label>
              <select v-model="form.responsavel_id" class="form-control">
                <option value="">— Nenhum —</option>
                <option v-for="p in store.pessoas" :key="p.id" :value="p.id">{{ p.nome }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Equipe</label>
              <select v-model="form.equipe_id" class="form-control">
                <option value="">— Nenhuma —</option>
                <option v-for="eq in store.equipes" :key="eq.id" :value="eq.id">{{ eq.nome }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Prazo</label>
              <input v-model="form.prazo" type="date" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Prioridade</label>
              <select v-model="form.prioridade" class="form-control">
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <select v-model="form.status" class="form-control">
                <option v-for="s in statusList" :key="s.value" :value="s.value">{{ s.label }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Depende de</label>
              <select v-model="form.depende_de" class="form-control">
                <option value="">— Nenhuma —</option>
                <option v-for="t in store.tarefas.filter(t=>t.id !== editando?.id)" :key="t.id" :value="t.id">{{ t.o_que }}</option>
              </select>
            </div>
            <div class="form-group" style="grid-column:1/-1">
              <label class="form-label">Observações</label>
              <textarea v-model="form.observacoes" class="form-control" rows="1"></textarea>
            </div>
          </div>
          <div class="flex gap-2 mt-1">
            <button class="btn btn-primary btn-sm" :disabled="salvando" @click="salvar">{{ salvando ? '...' : (editando ? 'Atualizar' : 'Adicionar') }}</button>
            <button v-if="editando" class="btn btn-secondary btn-sm" @click="cancelar">Cancelar</button>
          </div>
        </div>

        <!-- Filtros -->
        <div class="flex gap-2 mb-3 flex-wrap">
          <button v-for="s in [{value:'', label:'Todas'},...statusList]" :key="s.value" class="btn btn-secondary btn-sm" :class="{active: filtroStatus === s.value}" @click="filtroStatus = s.value">{{ s.label }}</button>
        </div>

        <!-- Lista de tarefas -->
        <table v-if="tarefasFiltradas.length > 0" class="table">
          <thead>
            <tr><th>Tarefa</th><th>Responsável</th><th>Prazo</th><th>Prioridade</th><th>Status</th><th>Depende</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="t in tarefasFiltradas" :key="t.id" :class="isVencida(t) ? 'row-alerta' : ''">
              <td>
                <div><strong>{{ t.o_que }}</strong></div>
                <div v-if="t.como" class="text-muted" style="font-size:.78rem">{{ t.como }}</div>
              </td>
              <td>{{ t.pessoas?.nome || (store.equipes.find(e=>e.id===t.equipe_id)?.nome) || '—' }}</td>
              <td :class="isVencida(t) ? 'text-danger fw-bold' : ''">
                {{ t.prazo ? formatarData(t.prazo) : '—' }}
                <span v-if="isVencida(t)" class="badge badge-alta ml-1">Vencida</span>
              </td>
              <td><span :class="`badge badge-${t.prioridade}`">{{ t.prioridade }}</span></td>
              <td>
                <select :value="t.status" class="form-control" style="font-size:.78rem;padding:.2rem .4rem" @change="atualizarStatus(t.id, $event.target.value)">
                  <option v-for="s in statusList" :key="s.value" :value="s.value">{{ s.label }}</option>
                </select>
              </td>
              <td style="font-size:.78rem">{{ store.tarefas.find(x=>x.id===t.depende_de)?.o_que || '—' }}</td>
              <td>
                <div class="flex gap-1">
                  <button class="btn-icon" @click="iniciarEdicao(t)">✏️</button>
                  <button class="btn-icon" @click="excluir(t.id)">🗑</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">Nenhuma tarefa</div>
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
const filtroStatus = ref('')

const statusList = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'concluida', label: 'Concluída' },
  { value: 'bloqueada', label: 'Bloqueada' },
  { value: 'cancelada', label: 'Cancelada' }
]

const formDefault = () => ({ o_que: '', como: '', responsavel_id: '', equipe_id: '', prazo: '', prioridade: 'media', status: 'pendente', depende_de: '', observacoes: '' })
const form = ref(formDefault())

const tarefasFiltradas = computed(() => filtroStatus.value ? store.tarefas.filter(t => t.status === filtroStatus.value) : store.tarefas)

function iniciarEdicao(t) { editando.value = t; form.value = { ...t, responsavel_id: t.responsavel_id || '', equipe_id: t.equipe_id || '', depende_de: t.depende_de || '' } }
function cancelar() { editando.value = null; form.value = formDefault() }
function isVencida(t) { return t.prazo && t.status !== 'concluida' && t.status !== 'cancelada' && new Date(t.prazo) < new Date() }

async function salvar() {
  if (!form.value.o_que) { erroForm.value = 'Tarefa obrigatória'; return }
  salvando.value = true; erroForm.value = ''
  const { data: { user } } = await supabase.auth.getUser()
  const payload = { ...form.value, responsavel_id: form.value.responsavel_id || null, equipe_id: form.value.equipe_id || null, depende_de: form.value.depende_de || null, evento_id: store.eventoId, owner_id: user.id }
  delete payload.id; delete payload.created_at; delete payload.pessoas

  if (editando.value) {
    const { data, error } = await supabase.from('tarefas').update(payload).eq('id', editando.value.id).select('*, pessoas(nome)').single()
    if (error) { erroForm.value = error.message; salvando.value = false; return }
    store.updateTarefa(data); cancelar()
  } else {
    const { data, error } = await supabase.from('tarefas').insert(payload).select('*, pessoas(nome)').single()
    if (error) { erroForm.value = error.message; salvando.value = false; return }
    store.addTarefa(data); form.value = formDefault()
  }
  salvando.value = false
}

async function atualizarStatus(id, status) {
  const { data, error } = await supabase.from('tarefas').update({ status }).eq('id', id).select('*, pessoas(nome)').single()
  if (!error) store.updateTarefa(data)
}

async function excluir(id) {
  if (!confirm('Excluir tarefa?')) return
  const { error } = await supabase.from('tarefas').delete().eq('id', id)
  if (!error) store.removeTarefa(id)
}

function formatarData(d) { return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') }
</script>

<style scoped>
.kanban-stats { display: flex; gap: .75rem; flex-wrap: wrap; }
.kanban-stat { display: flex; flex-direction: column; align-items: center; gap: .2rem; }
.k-num { font-size: 1.25rem; font-weight: 700; }
.row-alerta td { background: #fff7ed; }
.btn.active { background: var(--primary); color: #fff; }
</style>
