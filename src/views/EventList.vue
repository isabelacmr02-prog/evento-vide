<template>
  <div class="page">
    <!-- Header -->
    <header class="app-header">
      <div class="header-inner">
        <div class="flex items-center gap-3">
          <span class="header-logo">⛺</span>
          <span class="header-brand">Organizador de Eventos</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="user-chip">
            <span class="user-avatar">{{ userInitial }}</span>
            <span class="user-email">{{ auth.session?.user?.email }}</span>
          </div>
          <button class="btn btn-ghost btn-sm" @click="auth.logout()">Sair</button>
        </div>
      </div>
    </header>

    <main class="main-content">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Meus Eventos</h1>
          <p class="page-subtitle">Gerencie seus acampamentos, retiros e encontros</p>
        </div>
        <button class="btn btn-primary" @click="abrirModal()">
          <span>+</span> Novo Evento
        </button>
      </div>

      <!-- Skeleton Loading -->
      <div v-if="loading" class="eventos-grid">
        <div v-for="i in 3" :key="i" class="skeleton-card">
          <div class="skeleton skeleton-bar-top"></div>
          <div style="padding: 1rem 1.1rem">
            <div class="skeleton skeleton-h2 mb-2"></div>
            <div class="skeleton skeleton-text mb-1"></div>
            <div class="skeleton skeleton-text-sm mt-3 mb-3"></div>
            <div style="display:flex;gap:.5rem">
              <div class="skeleton" style="height:24px;width:110px;border-radius:99px"></div>
              <div class="skeleton" style="height:24px;width:80px;border-radius:99px"></div>
            </div>
          </div>
          <div style="padding: .85rem 1.1rem; border-top: 1px solid var(--border-light)">
            <div class="skeleton" style="height:34px;width:100%;border-radius:8px"></div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="store.lista.length === 0" class="empty-card">
        <div class="empty-icon-wrap">⛺</div>
        <h3 class="empty-title">Nenhum evento ainda</h3>
        <p class="empty-desc">Crie seu primeiro evento para começar a planejar</p>
        <button class="btn btn-primary" @click="abrirModal()">+ Criar primeiro evento</button>
      </div>

      <!-- Grid de Eventos -->
      <div v-else class="eventos-grid stagger">
        <div v-for="ev in store.lista" :key="ev.id" class="evento-card">
          <div class="card-accent-bar"></div>
          <div class="evento-card-header">
            <div class="evento-info">
              <h3 class="evento-nome">{{ ev.nome }}</h3>
              <p class="evento-data">📅 {{ formatarDatas(ev.data_inicio, ev.data_fim) }}</p>
            </div>
            <div class="card-actions">
              <button class="btn-icon" title="Duplicar" @click.stop="duplicar(ev.id)">📋</button>
              <button class="btn-icon btn-icon-danger" title="Excluir" @click.stop="excluir(ev)">🗑</button>
            </div>
          </div>

          <div class="evento-card-body" @click="$router.push(`/eventos/${ev.id}`)">
            <p v-if="ev.objetivo" class="evento-objetivo">{{ ev.objetivo }}</p>
            <div class="evento-chips">
              <span class="chip">👥 {{ ev.participantes_estimados || 0 }} participantes</span>
              <span v-if="ev.publico_alvo" class="chip">🎯 {{ ev.publico_alvo }}</span>
            </div>
          </div>

          <div class="evento-card-footer">
            <button class="btn btn-primary w-full" @click="$router.push(`/eventos/${ev.id}`)">
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
              <label class="form-label">Litros de água / pessoa / dia</label>
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
import { ref, computed, onMounted } from 'vue'
import { useEventosStore } from '@/stores/eventos'
import { useAuthStore } from '@/stores/auth'

const store = useEventosStore()
const auth = useAuthStore()
const loading = ref(false)
const showModal = ref(false)
const salvando = ref(false)
const erroForm = ref('')
const editando = ref(null)

const userInitial = computed(() => {
  const email = auth.session?.user?.email || ''
  return email.charAt(0).toUpperCase()
})

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

/* Header */
.app-header {
  background: rgba(255,255,255,.92);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 50;
}
.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: .85rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.header-logo { font-size: 1.5rem; }
.header-brand { font-size: 1rem; font-weight: 700; color: var(--text); letter-spacing: -.01em; }
.user-chip {
  display: flex;
  align-items: center;
  gap: .5rem;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 99px;
  padding: .3rem .75rem .3rem .35rem;
}
.user-avatar {
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: .7rem;
  font-weight: 700;
  flex-shrink: 0;
}
.user-email { font-size: .78rem; color: var(--text-muted); max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Main */
.main-content { max-width: 1200px; margin: 0 auto; padding: 2rem 1.5rem; }

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 2rem;
  gap: 1rem;
  flex-wrap: wrap;
}
.page-title { font-size: 1.6rem; font-weight: 800; color: var(--text); letter-spacing: -.025em; }
.page-subtitle { color: var(--text-muted); font-size: .9rem; margin-top: .2rem; }

.skeleton-bar-top {
  height: 4px;
  width: 100%;
  border-radius: 0;
  margin-bottom: 0;
}

/* Empty State */
.empty-card {
  text-align: center;
  padding: 5rem 2rem;
  background: #fff;
  border-radius: var(--radius-lg);
  border: 2px dashed var(--border);
}
.empty-icon-wrap { font-size: 3.5rem; margin-bottom: 1rem; display: block; }
.empty-title { font-size: 1.25rem; font-weight: 700; margin-bottom: .5rem; }
.empty-desc { color: var(--text-muted); margin-bottom: 1.75rem; }

/* Grid */
.eventos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.25rem;
}

/* Card */
.evento-card {
  background: #fff;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: all .22s cubic-bezier(.4,0,.2,1);
  cursor: default;
  display: flex;
  flex-direction: column;
}
.evento-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-muted);
}
.card-accent-bar {
  height: 4px;
  background: linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%);
}
.evento-card-header {
  padding: 1rem 1.1rem .7rem;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: .5rem;
}
.evento-nome { font-size: .95rem; font-weight: 700; color: var(--text); margin-bottom: .2rem; }
.evento-data { font-size: .78rem; color: var(--text-muted); }
.card-actions { display: flex; gap: .2rem; flex-shrink: 0; }
.btn-icon-danger:hover { background: var(--danger-light); color: var(--danger); }

.evento-card-body {
  padding: .4rem 1.1rem .9rem;
  cursor: pointer;
  flex: 1;
}
.evento-objetivo {
  font-size: .85rem;
  color: var(--text-muted);
  margin-bottom: .7rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}
.evento-chips { display: flex; flex-wrap: wrap; gap: .4rem; }
.chip {
  display: inline-flex;
  align-items: center;
  gap: .25rem;
  font-size: .76rem;
  color: var(--text-muted);
  background: var(--bg);
  padding: .25rem .65rem;
  border-radius: 99px;
  border: 1px solid var(--border);
  font-weight: 500;
}

.evento-card-footer { padding: .85rem 1.1rem; border-top: 1px solid var(--border-light); }
</style>
