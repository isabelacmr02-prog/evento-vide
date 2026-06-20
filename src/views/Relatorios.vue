<template>
  <div class="page">
    <header class="app-header">
      <div class="header-inner">
        <div class="flex items-center gap-2">
          <button class="btn btn-ghost btn-sm" @click="$router.push(`/eventos/${id}`)">← Dashboard</button>
          <span class="breadcrumb-sep">/</span>
          <span class="breadcrumb-current">Relatórios</span>
          <span class="breadcrumb-sep">—</span>
          <span class="breadcrumb-event">{{ store.evento?.nome }}</span>
        </div>
        <button class="btn btn-primary btn-sm no-print" @click="window.print()">
          🖨 Imprimir
        </button>
      </div>
    </header>

    <main class="main-content">
      <!-- Tabs -->
      <div class="rel-tabs no-print">
        <button
          v-for="r in relatorios"
          :key="r.id"
          class="tab-btn"
          :class="{ active: ativo === r.id }"
          @click="ativo = r.id"
        >
          <span class="tab-icon">{{ r.icon }}</span>
          <span>{{ r.nome }}</span>
        </button>
      </div>

      <!-- Corpo do relatório -->
      <div class="relatorio-body">

        <!-- 1. Executivo -->
        <div v-if="ativo === 'executivo'">
          <div class="rel-header">
            <h1>{{ store.evento?.nome }}</h1>
            <p>Relatório Executivo · gerado em {{ hoje }}</p>
          </div>
          <div class="grid-2 mb-4">
            <div class="rel-section">
              <h3 class="rel-section-title">Informações Gerais</h3>
              <table class="rel-table">
                <tbody>
                  <tr><td>Datas</td><td>{{ formatarDatas(store.evento?.data_inicio, store.evento?.data_fim) }}</td></tr>
                  <tr><td>Duração</td><td>{{ store.dias }} dia(s)</td></tr>
                  <tr><td>Total de pessoas</td><td>{{ store.totalPessoas }}</td></tr>
                  <tr><td>Objetivo</td><td>{{ store.evento?.objetivo || '—' }}</td></tr>
                  <tr><td>Público</td><td>{{ store.evento?.publico_alvo || '—' }}</td></tr>
                  <tr v-if="store.local"><td>Local</td><td>{{ store.local.nome_local }}</td></tr>
                </tbody>
              </table>
            </div>
            <div class="rel-section">
              <h3 class="rel-section-title">Financeiro</h3>
              <table class="rel-table">
                <tbody>
                  <tr><td>Total receitas</td><td class="text-success fw-bold">R$ {{ fmt(store.resumoFinanceiro.receitas) }}</td></tr>
                  <tr><td>Total despesas</td><td class="text-danger fw-bold">R$ {{ fmt(store.resumoFinanceiro.despesas) }}</td></tr>
                  <tr><td>Saldo</td><td :class="store.resumoFinanceiro.saldo >= 0 ? 'text-success fw-bold' : 'text-danger fw-bold'">R$ {{ fmt(store.resumoFinanceiro.saldo) }}</td></tr>
                  <tr><td>Custo por pessoa</td><td>R$ {{ fmt(store.custoPorPessoa) }}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="rel-section mb-4">
            <h3 class="rel-section-title">Dados Calculados</h3>
            <table class="rel-table">
              <tbody>
                <tr><td>Água necessária</td><td>{{ store.aguaLitros }} L ({{ store.aguaGaloes }} galões de 20L)</td></tr>
                <tr><td>Barracas esperadas</td><td>{{ store.barracasEsperadas }}</td></tr>
                <tr><td>Capacidade de transporte</td><td>{{ store.capacidadeTransporte }} assentos</td></tr>
                <tr><td>Completude do planejamento</td><td>{{ store.completude.pct }}%</td></tr>
              </tbody>
            </table>
          </div>
          <div v-if="store.alertas.length > 0" class="rel-section">
            <h3 class="rel-section-title">Alertas</h3>
            <div v-for="a in store.alertas.filter(x=>x.nivel==='erro')" :key="a.msg" class="alert alert-erro mb-2">
              <strong>{{ a.secao }}:</strong> {{ a.msg }}
            </div>
            <div v-for="a in store.alertas.filter(x=>x.nivel==='atencao')" :key="a.msg" class="alert alert-atencao mb-2">
              <strong>{{ a.secao }}:</strong> {{ a.msg }}
            </div>
          </div>
        </div>

        <!-- 2. Plano de Ação -->
        <div v-if="ativo === 'plano'">
          <div class="rel-header"><h1>{{ store.evento?.nome }} — Plano de Ação</h1></div>
          <table class="rel-table">
            <thead>
              <tr><th>O que</th><th>Como</th><th>Responsável</th><th>Prazo</th><th>Prioridade</th><th>Status</th></tr>
            </thead>
            <tbody>
              <tr v-for="t in store.tarefas" :key="t.id" :class="isVencida(t) ? 'row-alerta' : ''">
                <td><strong>{{ t.o_que }}</strong></td>
                <td style="font-size:.82rem">{{ t.como || '—' }}</td>
                <td>{{ t.pessoas?.nome || nomeEquipe(t.equipe_id) || '—' }}</td>
                <td :class="isVencida(t) ? 'text-danger' : ''">{{ t.prazo ? formatarData(t.prazo) : '—' }}</td>
                <td><span :class="`badge badge-${t.prioridade}`">{{ t.prioridade }}</span></td>
                <td><span :class="`badge badge-${t.status}`">{{ labelStatusTarefa(t.status) }}</span></td>
              </tr>
            </tbody>
          </table>
          <div v-if="store.tarefas.length === 0" class="empty-state">Nenhuma tarefa cadastrada</div>
        </div>

        <!-- 3. Cronograma -->
        <div v-if="ativo === 'cronograma'">
          <div class="rel-header"><h1>{{ store.evento?.nome }} — Cronograma</h1></div>
          <div v-for="(ativs, dia) in atividadesPorDia" :key="dia" class="mb-4">
            <div class="dia-header">{{ formatarDataLong(dia) }}</div>
            <table class="rel-table">
              <thead><tr><th>Horário</th><th>Atividade</th><th>Tipo</th><th>Local</th><th>Equipe</th></tr></thead>
              <tbody>
                <tr v-for="a in ativs" :key="a.id">
                  <td class="text-primary fw-bold" style="white-space:nowrap">{{ formatHora(a.inicio) }}<span v-if="a.fim"> – {{ formatHora(a.fim) }}</span></td>
                  <td><strong>{{ a.titulo }}</strong></td>
                  <td>{{ a.tipo || '—' }}</td>
                  <td>{{ a.local || '—' }}</td>
                  <td>{{ nomeEquipe(a.equipe_responsavel_id) || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="store.programacao.length === 0" class="empty-state">Nenhuma atividade</div>
        </div>

        <!-- 4. Checklist -->
        <div v-if="ativo === 'checklist'">
          <div class="rel-header"><h1>{{ store.evento?.nome }} — Checklist por Setor</h1></div>
          <div v-for="eq in store.equipes" :key="eq.id" class="mb-4">
            <h2 class="mb-2">{{ eq.nome }}</h2>
            <div v-for="t in store.tarefas.filter(x=>x.equipe_id===eq.id || membrosEquipe(eq.id).some(m=>m.pessoa_id===x.responsavel_id))" :key="t.id" class="checklist-item">
              <div class="check-box" :class="t.status === 'concluida' ? 'checked' : ''">{{ t.status === 'concluida' ? '✓' : '' }}</div>
              <div class="check-text">
                <strong>{{ t.o_que }}</strong>
                <span v-if="t.prazo" class="text-muted"> — Prazo: {{ formatarData(t.prazo) }}</span>
              </div>
            </div>
            <div v-if="store.tarefas.filter(x=>x.equipe_id===eq.id).length === 0" class="text-muted" style="font-size:.82rem;padding:.35rem 0">Sem tarefas atribuídas</div>
          </div>
          <div class="mb-4">
            <h2 class="mb-2">Materiais — Status</h2>
            <div v-for="m in store.materiais" :key="m.id" class="checklist-item">
              <div class="check-box" :class="m.status === 'no_local' || m.status === 'confirmado' ? 'checked' : ''">{{ m.status === 'no_local' || m.status === 'confirmado' ? '✓' : '' }}</div>
              <div class="check-text">
                {{ m.nome }} <span class="text-muted">({{ m.qtd_necessaria }} {{ m.unidade }})</span>
                <span :class="`badge badge-${m.status}`" style="margin-left:.4rem;font-size:.7rem">{{ labelStatusMat(m.status) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 5. Responsabilidades -->
        <div v-if="ativo === 'responsabilidades'">
          <div class="rel-header"><h1>{{ store.evento?.nome }} — Matriz de Responsabilidades</h1></div>
          <div style="overflow-x:auto">
            <table class="rel-table">
              <thead>
                <tr>
                  <th>Pessoa</th>
                  <th>Papel</th>
                  <th v-for="eq in store.equipes" :key="eq.id">{{ eq.nome }}</th>
                  <th>Tarefas</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in store.pessoas" :key="p.id">
                  <td><strong>{{ p.nome }}</strong></td>
                  <td><span class="badge badge-pendente">{{ labelPapel(p.papel) }}</span></td>
                  <td v-for="eq in store.equipes" :key="eq.id" style="text-align:center">
                    <span v-if="store.equipesMembros.some(m=>m.equipe_id===eq.id&&m.pessoa_id===p.id)">
                      ✓ <span class="text-muted" style="font-size:.75rem">{{ store.equipesMembros.find(m=>m.equipe_id===eq.id&&m.pessoa_id===p.id)?.responsabilidade }}</span>
                    </span>
                    <span v-else class="text-muted">—</span>
                  </td>
                  <td style="font-size:.78rem">{{ store.tarefas.filter(t=>t.responsavel_id===p.id).map(t=>t.o_que).join(', ') || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 6. Financeiro -->
        <div v-if="ativo === 'financeiro'">
          <div class="rel-header"><h1>{{ store.evento?.nome }} — Controle Financeiro</h1></div>
          <div class="fin-summary mb-4">
            <div class="fin-card fin-verde"><span>Receitas</span><strong>R$ {{ fmt(store.resumoFinanceiro.receitas) }}</strong></div>
            <div class="fin-card fin-vermelho"><span>Despesas</span><strong>R$ {{ fmt(store.resumoFinanceiro.despesas) }}</strong></div>
            <div class="fin-card" :class="store.resumoFinanceiro.saldo >= 0 ? 'fin-verde' : 'fin-vermelho'"><span>Saldo</span><strong>R$ {{ fmt(store.resumoFinanceiro.saldo) }}</strong></div>
            <div class="fin-card fin-neutro"><span>Custo/pessoa</span><strong>R$ {{ fmt(store.custoPorPessoa) }}</strong></div>
          </div>
          <div class="grid-2">
            <div>
              <h3 class="mb-2 text-success">↑ Receitas</h3>
              <table class="rel-table">
                <thead><tr><th>Descrição</th><th>Categoria</th><th>Valor</th><th>Status</th></tr></thead>
                <tbody>
                  <tr v-for="f in store.financeiro.filter(x=>x.tipo==='receita')" :key="f.id">
                    <td>{{ f.descricao || '—' }}</td><td>{{ f.categoria }}</td>
                    <td class="text-success fw-bold">R$ {{ fmt(f.valor) }}</td>
                    <td>{{ labelStatus(f.status) }}</td>
                  </tr>
                  <tr v-if="!store.financeiro.some(f=>f.tipo==='receita')"><td colspan="4" class="text-muted">Nenhuma receita</td></tr>
                </tbody>
              </table>
            </div>
            <div>
              <h3 class="mb-2 text-danger">↓ Despesas</h3>
              <table class="rel-table">
                <thead><tr><th>Descrição</th><th>Categoria</th><th>Valor</th><th>Status</th></tr></thead>
                <tbody>
                  <tr v-for="f in store.financeiro.filter(x=>x.tipo==='despesa')" :key="f.id">
                    <td>{{ f.descricao || '—' }}</td><td>{{ f.categoria }}</td>
                    <td class="text-danger fw-bold">R$ {{ fmt(f.valor) }}</td>
                    <td>{{ labelStatus(f.status) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 7. Materiais/Compras -->
        <div v-if="ativo === 'compras'">
          <div class="rel-header"><h1>{{ store.evento?.nome }} — Materiais e Compras</h1></div>
          <div class="alert alert-atencao mb-3" style="font-size:.85rem">
            💧 Água necessária: <strong>{{ store.aguaLitros }} L ({{ store.aguaGaloes }} galões de 20L)</strong>
            — {{ store.totalPessoas }} pessoas × {{ store.dias }} dias × {{ store.evento?.litros_agua_pessoa_dia }} L/pessoa/dia
          </div>
          <h3 class="mb-2">🛒 Lista de compras (alimentação)</h3>
          <table class="rel-table mb-4">
            <thead><tr><th>Item</th><th>Quantidade necessária</th><th>Unidade</th></tr></thead>
            <tbody>
              <tr v-for="item in store.listaCompras" :key="item.nome">
                <td>{{ item.nome }}</td>
                <td><strong>{{ item.qtd }}</strong></td>
                <td>{{ item.unidade || '—' }}</td>
              </tr>
              <tr v-if="store.listaCompras.length === 0"><td colspan="3" class="text-muted">Nenhum item cadastrado</td></tr>
            </tbody>
          </table>
          <h3 class="mb-2">🎒 Materiais e equipamentos</h3>
          <table class="rel-table">
            <thead><tr><th>Item</th><th>Categoria</th><th>Qtd necessária</th><th>Qtd disponível</th><th>Origem</th><th>Custo est.</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="m in store.materiais" :key="m.id">
                <td><strong>{{ m.nome }}</strong></td>
                <td>{{ m.categoria || '—' }}</td>
                <td>{{ m.qtd_necessaria != null ? `${m.qtd_necessaria} ${m.unidade || ''}` : '—' }}</td>
                <td :class="m.qtd_disponivel < m.qtd_necessaria ? 'text-danger' : ''">{{ m.qtd_disponivel != null ? `${m.qtd_disponivel} ${m.unidade || ''}` : '—' }}</td>
                <td>{{ m.origem || '—' }}</td>
                <td>{{ m.custo_estimado ? `R$ ${fmt(m.custo_estimado)}` : '—' }}</td>
                <td><span :class="`badge badge-${m.status}`">{{ labelStatusMat(m.status) }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useEventoDataStore } from '@/stores/eventoData'

const props = defineProps({ id: String })
const store = useEventoDataStore()
const ativo = ref('executivo')
const window = globalThis

const relatorios = [
  { id: 'executivo', icon: '📊', nome: 'Executivo' },
  { id: 'plano', icon: '✅', nome: 'Plano de Ação' },
  { id: 'cronograma', icon: '🗓', nome: 'Cronograma' },
  { id: 'checklist', icon: '☑️', nome: 'Checklist' },
  { id: 'responsabilidades', icon: '🤝', nome: 'Responsabilidades' },
  { id: 'financeiro', icon: '💰', nome: 'Financeiro' },
  { id: 'compras', icon: '🛒', nome: 'Materiais/Compras' }
]

const hoje = new Date().toLocaleDateString('pt-BR')

onMounted(() => { if (!store.evento) store.carregar(props.id) })

const atividadesPorDia = computed(() => {
  const grupos = {}
  for (const a of store.programacao) {
    const dia = a.inicio.substring(0, 10)
    if (!grupos[dia]) grupos[dia] = []
    grupos[dia].push(a)
  }
  return grupos
})

function membrosEquipe(eqId) { return store.equipesMembros.filter(m => m.equipe_id === eqId) }
function nomeEquipe(id) { return store.equipes.find(e => e.id === id)?.nome || '' }
function isVencida(t) { return t.prazo && t.status !== 'concluida' && t.status !== 'cancelada' && new Date(t.prazo) < new Date() }
function fmt(n) { return Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function formatarDatas(ini, fim) { if (!ini) return ''; const opts = { day: '2-digit', month: '2-digit', year: 'numeric' }; return `${new Date(ini + 'T12:00:00').toLocaleDateString('pt-BR', opts)} – ${new Date(fim + 'T12:00:00').toLocaleDateString('pt-BR', opts)}` }
function formatarData(d) { return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') }
function formatarDataLong(d) { return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }
function formatHora(ts) { if (!ts) return ''; return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
function labelPapel(p) { return { participante: 'Participante', organizador: 'Organizador', voluntario: 'Voluntário', convidado: 'Convidado' }[p] || p }
function labelStatusTarefa(s) { return { pendente: 'Pendente', em_andamento: 'Em andamento', concluida: 'Concluída', bloqueada: 'Bloqueada', cancelada: 'Cancelada' }[s] || s }
function labelStatusMat(s) { return { a_providenciar: 'Providenciar', reservado: 'Reservado', confirmado: 'Confirmado', no_local: 'No local' }[s] || s }
function labelStatus(s) { return { previsto: 'Previsto', confirmado: 'Confirmado', pago_recebido: 'Pago/Recebido' }[s] || s }
</script>

<style scoped>
.page { min-height: 100vh; background: var(--bg); }

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
  max-width: 1100px;
  margin: 0 auto;
  padding: .75rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.breadcrumb-sep { color: var(--border); }
.breadcrumb-current { font-weight: 700; color: var(--text); font-size: .88rem; }
.breadcrumb-event { color: var(--text-muted); font-size: .85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }

.main-content { max-width: 1100px; margin: 0 auto; padding: 1.75rem 1.5rem; }

/* Tabs */
.rel-tabs {
  display: flex;
  gap: .4rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
  background: #fff;
  padding: .5rem;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
}
.tab-btn {
  display: flex;
  align-items: center;
  gap: .4rem;
  padding: .45rem .9rem;
  border-radius: var(--radius-sm);
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: .83rem;
  font-weight: 600;
  color: var(--text-muted);
  transition: all .15s;
  white-space: nowrap;
}
.tab-btn:hover { background: var(--bg); color: var(--text); }
.tab-btn.active { background: var(--primary); color: #fff; box-shadow: 0 2px 8px rgba(79,70,229,.25); }
.tab-icon { font-size: .9rem; }

/* Relatório */
.relatorio-body {
  background: #fff;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  padding: 2rem;
  box-shadow: var(--shadow-sm);
}

.rel-header {
  margin-bottom: 1.75rem;
  padding-bottom: 1.25rem;
  border-bottom: 3px solid var(--primary);
}
.rel-header h1 { color: var(--primary); font-size: 1.4rem; margin-bottom: .25rem; }
.rel-header p { color: var(--text-muted); font-size: .85rem; }

.rel-section { margin-bottom: 1.25rem; }
.rel-section-title {
  font-size: .72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--text-muted);
  margin-bottom: .6rem;
  padding-bottom: .4rem;
  border-bottom: 1px solid var(--border);
}

.rel-table { width: 100%; border-collapse: collapse; font-size: .875rem; margin-bottom: .5rem; }
.rel-table th {
  padding: .55rem .85rem;
  text-align: left;
  font-size: .72rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: .05em;
  border-bottom: 2px solid var(--border);
  background: var(--bg);
}
.rel-table td { padding: .55rem .85rem; border-bottom: 1px solid var(--border-light); vertical-align: middle; }
.rel-table tr:last-child td { border-bottom: none; }
.rel-table tbody tr:hover td { background: var(--primary-light); }

.dia-header {
  font-size: .9rem;
  font-weight: 700;
  color: var(--primary);
  border-left: 3px solid var(--primary);
  padding: .3rem .75rem;
  background: var(--primary-light);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  margin-bottom: .75rem;
}

.checklist-item {
  display: flex;
  align-items: flex-start;
  gap: .75rem;
  padding: .45rem 0;
  border-bottom: 1px solid var(--border-light);
  font-size: .875rem;
}
.check-box {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-radius: 5px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: .72rem;
  color: var(--success);
  font-weight: 700;
  transition: all .15s;
}
.check-box.checked { border-color: var(--success); background: var(--success-light); }

.row-alerta td { background: var(--warning-light); }

/* Financial summary cards */
.fin-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: .75rem; }
@media (max-width: 768px) { .fin-summary { grid-template-columns: 1fr 1fr; } }
.fin-card {
  border-radius: var(--radius-sm);
  padding: .9rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: .3rem;
  border: 1px solid transparent;
}
.fin-card span { font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; }
.fin-card strong { font-size: 1.25rem; }
.fin-verde { background: var(--success-light); border-color: #bbf7d0; color: #166534; }
.fin-vermelho { background: var(--danger-light); border-color: #fecaca; color: #991b1b; }
.fin-neutro { background: var(--bg); border-color: var(--border); color: var(--text); }
</style>
