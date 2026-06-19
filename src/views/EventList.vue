<template>
  <div class="page">
    <!-- Header -->
    <header class="app-header">
      <div class="header-inner">
        <div class="flex items-center gap-2">
          <span style="font-size:1.5rem">⛺</span>
          <h1 style="font-size:1.2rem">Organizador de Eventos</h1>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-muted" style="font-size:.85rem">{{ auth.session?.user?.email }}</span>
          <button class="btn btn-secondary btn-sm" @click="auth.logout()">Sair</button>
        </div>
      </div>
    </header>

    <main class="main-content">
      <div class="page-header">
        <div>
          <h2>Meus Eventos</h2>
          <p class="text-muted">Gerencie seus acampamentos, retiros e encontros</p>
        </div>
        <button class="btn btn-primary" @click="abrirModal()">+ Novo Evento</button>
      </div>

      <div v-if="loading" class="empty-state">Carregando...</div>

      <div v-else-if="store.lista.length === 0" class="empty-state card">
        <div class="icon">⛺</div>
        <h3>Nenhum evento cadastrado</h3>
        <p class="text-muted mt-2">Crie seu primeiro evento para começar a planejar</p>
        <button class="btn btn-primary mt-3" @click="abrirModal()">+ Criar Evento</button>
      </div>

      <div v-else class="eventos-grid">
        <div v-for="ev in store.lista" :key="ev.id" class="card evento-card">
          <div class="evento-card-header">
            <div>
              <h3>{{ ev.nome }}</h3>
              <p class="text-muted" style="font-size:.8rem">{{ formatarDatas(ev.data_inicio, ev.data_fim) }}</p>
            </div>
            <div class="flex gap-2">
              <button class="btn-icon" title="Duplicar" @click.stop="duplicar(ev.id)">📋</button>
              <button class="btn-icon" title="Excluir" @click.stop="excluir(ev)">🗑</button>
            </div>
          </div>
          <div class="evento-card-body" @click="$router.push(`/eventos/${ev.id}`)">
            <p v-if="ev.objetivo" class="text-muted" style="font-size:.85rem;margin-bottom:.5rem">{{ ev.objetivo }}</p>
            <div class="evento-meta">
              <span>👥 {{ ev.participantes_estimados || 0 }} participantes estimados</span>
              <span v-if="ev.publico_alvo">🎯 {{ ev.publico_alvo }}</span>
            </div>
          </div>
          <div class="evento-card-footer">
            <button class="btn btn-primary btn-sm w-full" @click="$router.push(`/eventos/${ev.id}`)">
              Abrir Dashboard →
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal criar/editar -->
    <div v-if="showModal" class="modal-overlay" @click.self="fecharModal">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editando ? 'Editar Evento' : 'Novo Evento' }}</h2>
          <button class="btn-icon" @click="fecharModal">✕</button>
        </div>
        <div class="modal-body">
          <div v-if="erroForm" class="alert alert-erro mb-3">{{ erroForm }}</div>
          <div class="grid-2">
            <div class="form-group" style="grid-column:1/-1">
              <label class="form-label">Nome do evento *</label>
              <input v-model="form.nome" class="form-control" placeholder="Ex.: Acampamento SV" required />
            </div>
            <div class="form-group">
              <label class="form-label">Data de início *</label>
              <input v-model="form.data_inicio" type="date" class="form-control" required />
            </div>
            <div class="form-group">
              <label class="form-label">Data de fim *</label>
              <input v-model="form.data_fim" type="date" class="form-control" required />
            </div>
            <div class="form-group" style="grid-column:1/-1">
              <label class="form-label">Objetivo</label>
              <input v-model="form.objetivo" class="form-control" placeholder="Ex.: Comunhão, lazer e descanso" />
            </div>
            <div class="form-group">
              <label class="form-label">Público-alvo</label>
              <input v-model="form.publico_alvo" class="form-control" placeholder="Ex.: Jovens" />
            </div>
            <div class="form-group">
              <label class="form-label">Participantes estimados</label>
              <input v-model.number="form.participantes_estimados" type="number" min="0" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Litros de água/pessoa/dia</label>
              <input v-model.number="form.litros_agua_pessoa_dia" type="number" step="0.5" min="1" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Folga alimentação (%)</label>
              <input v-model.number="form.folga_alimentacao_pct" type="number" min="0" max="50" class="form-control" />
            </div>
            <div class="form-group" style="grid-column:1/-1">
              <label class="form-label">Observações</label>
              <textarea v-model="form.observacoes" class="form-control" rows="2"></textarea>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="fecharModal">Cancelar</button>
          <button class="btn btn-primary" :disabled="salvando" @click="salvar">
            {{ salvando ? 'Salvando...' : 'Salvar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useEventosStore } from '@/stores/eventos'
import { useAuthStore } from '@/stores/auth'

const store = useEventosStore()
const auth = useAuthStore()
const loading = ref(false)
const showModal = ref(false)
const salvando = ref(false)
const erroForm = ref('')
const editando = ref(null)

const formDefault = () => ({
  nome: '', objetivo: '', data_inicio: '', data_fim: '',
  publico_alvo: '', participantes_estimados: 0,
  litros_agua_pessoa_dia: 4, folga_alimentacao_pct: 10, observacoes: ''
})
const form = ref(formDefault())

onMounted(async () => {
  loading.value = true
  await store.carregar()
  loading.value = false
})

function abrirModal(ev = null) {
  editando.value = ev
  form.value = ev ? { ...ev } : formDefault()
  erroForm.value = ''
  showModal.value = true
}

function fecharModal() { showModal.value = false }

async function salvar() {
  if (!form.value.nome || !form.value.data_inicio || !form.value.data_fim) {
    erroForm.value = 'Preencha nome e datas'
    return
  }
  if (form.value.data_fim < form.value.data_inicio) {
    erroForm.value = 'Data de fim deve ser >= data de início'
    return
  }
  salvando.value = true
  erroForm.value = ''
  const { nome, objetivo, data_inicio, data_fim, publico_alvo, participantes_estimados, litros_agua_pessoa_dia, folga_alimentacao_pct, observacoes } = form.value
  const payload = { nome, objetivo, data_inicio, data_fim, publico_alvo, participantes_estimados, litros_agua_pessoa_dia, folga_alimentacao_pct, observacoes }
  const { error } = editando.value
    ? await store.atualizar(editando.value.id, payload)
    : await store.criar(payload)
  if (error) { erroForm.value = error.message; salvando.value = false; return }
  fecharModal()
  salvando.value = false
}

async function duplicar(id) {
  if (!confirm('Duplicar este evento?')) return
  const { error } = await store.duplicar(id)
  if (error) alert('Erro ao duplicar: ' + error)
}

async function excluir(ev) {
  if (!confirm(`Excluir "${ev.nome}"? Esta ação não pode ser desfeita.`)) return
  const { error } = await store.excluir(ev.id)
  if (error) alert('Erro: ' + error.message)
}

function formatarDatas(ini, fim) {
  if (!ini) return ''
  const opts = { day: '2-digit', month: '2-digit', year: 'numeric' }
  const a = new Date(ini + 'T12:00:00').toLocaleDateString('pt-BR', opts)
  const b = new Date(fim + 'T12:00:00').toLocaleDateString('pt-BR', opts)
  return ini === fim ? a : `${a} – ${b}`
}
</script>

<style scoped>
.page { min-height: 100vh; background: var(--bg); }
.app-header { background: #fff; border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 10; }
.header-inner { max-width: 1200px; margin: 0 auto; padding: .75rem 1.5rem; display: flex; align-items: center; justify-content: space-between; }
.main-content { max-width: 1200px; margin: 0 auto; padding: 2rem 1.5rem; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem; gap: 1rem; flex-wrap: wrap; }
.eventos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem; }
.evento-card { cursor: default; overflow: hidden; }
.evento-card-header { padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); display: flex; align-items: flex-start; justify-content: space-between; gap: .5rem; }
.evento-card-body { padding: 1rem 1.25rem; cursor: pointer; }
.evento-card-body:hover { background: #fafafa; }
.evento-card-footer { padding: .75rem 1.25rem; border-top: 1px solid var(--border); }
.evento-meta { display: flex; flex-wrap: wrap; gap: .75rem; font-size: .8rem; color: var(--text-muted); }
</style>
