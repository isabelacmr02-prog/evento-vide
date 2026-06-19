<template>
  <div class="page">
    <header class="app-header">
      <div class="header-inner">
        <div class="flex items-center gap-2">
          <button class="btn btn-ghost btn-sm" @click="$router.push(`/eventos/${id}`)">← Dashboard</button>
          <span class="text-muted">/</span>
          <span class="fw-bold">Relatórios</span>
          <span class="text-muted">— {{ store.evento?.nome }}</span>
        </div>
        <button class="btn btn-primary btn-sm no-print" @click="window.print()">🖨 Imprimir</button>
      </div>
    </header>

    <main class="main-content">
      <!-- Seletor de relatório -->
      <div class="relatorio-tabs no-print mb-4">
        <button v-for="r in relatorios" :key="r.id" class="tab-btn" :class="{ active: ativo === r.id }" @click="ativo = r.id">
          {{ r.icon }} {{ r.nome }}
        </button>
      </div>

      <!-- 1. Relatório Executivo -->
      <div v-if="ativo === 'executivo'" class="relatorio-body">
        <div class="rel-header">
          <h1>{{ store.evento?.nome }}</h1>
          <p>Relatório Executivo — gerado em {{ hoje }}</p>
        </div>
        <div class="grid-2 mb-4">
          <div class="info-section">
            <h3>Informações Gerais</h3>
            <table class="rel-table">
              <tbody>
                <tr><td>Datas</td><td>{{ formatarDatas(store.evento?.data_inicio, store.evento?.data_fim) }}</td></tr>
                <tr><td>Duração</td><td>{{ store.dias }} dia(s)</td></tr>
                <tr><td>Total de pessoas</td><td>{{ store.totalPessoas }}</td></tr>
                <tr><td>Objetivo</td><td>{{ store.evento?.objetivo || '—' }}</td></tr>
                <tr><td>Público</td><td>{{ store.evento?.publico_alvo || '—' }}</td></tr>
                <tr v-if="store.local"><td>Local</td><td>{{ store.local.nome_local }} — {{ store.local.endereco }}</td></tr>
              </tbody>
            </table>
          </div>
          <div class="info-section">
            <h3>Financeiro</h3>
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

        <div class="info-section mb-4">
          <h3>Dados Calculados</h3>
          <table class="rel-table">
            <tbody>
              <tr><td>Água necessária</td><td>{{ store.aguaLitros }} L ({{ store.aguaGaloes }} galões de 20L)</td></tr>
              <tr><td>Barracas esperadas</td><td>{{ store.barracasEsperadas }}</td></tr>
              <tr><td>Capacidade de transporte</td><td>{{ store.capacidadeTransporte }} assentos</td></tr>
              <tr><td>Completude do planejamento</td><td>{{ store.completude.pct }}%</td></tr>
            </tbody>
          </table>
        </div>

        <div v-if="store.alertas.length > 0" class="info-section mb-4">
          <h3>Alertas Críticos</h3>
          <div v-for="a in store.alertas.filter(x=>x.nivel==='erro')" :key="a.msg" class="alert alert-erro mb-1">
            <strong>{{ a.secao }}:</strong> {{ a.msg }}
          </div>
          <div v-for="a in store.alertas.filter(x=>x.nivel==='atencao')" :key="a.msg" class="alert alert-atencao mb-1">
            <strong>{{ a.secao }}:</strong> {{ a.msg }}
          </div>
        </div>
      </div>

      <!-- 2. Plano de Ação -->
      <div v-if="ativo === 'plano'" class="relatorio-body">
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
      <div v-if="ativo === 'cronograma'" class="relatorio-body">
        <div class="rel-header"><h1>{{ store.evento?.nome }} — Cronograma</h1></div>
        <div v-for="(ativs, dia) in atividadesPorDia" :key="dia" class="mb-4">
          <h2 class="dia-header-rel">{{ formatarDataLong(dia) }}</h2>
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

      <!-- 4. Checklist por setor -->
      <div v-if="ativo === 'checklist'" class="relatorio-body">
        <div class="rel-header"><h1>{{ store.evento?.nome }} — Checklist por Setor</h1></div>
        <div v-for="eq in store.equipes" :key="eq.id" class="mb-4">
          <h2>{{ eq.nome }}</h2>
          <div v-for="t in store.tarefas.filter(x=>x.equipe_id===eq.id || membrosEquipe(eq.id).some(m=>m.pessoa_id===x.responsavel_id))" :key="t.id" class="checklist-item">
            <div class="check-box" :class="t.status === 'concluida' ? 'checked' : ''">{{ t.status === 'concluida' ? '✓' : '' }}</div>
            <div class="check-text">
              <strong>{{ t.o_que }}</strong>
              <span v-if="t.prazo" class="text-muted"> — Prazo: {{ formatarData(t.prazo) }}</span>
            </div>
          </div>
          <div v-if="store.tarefas.filter(x=>x.equipe_id===eq.id).length === 0" class="text-muted" style="font-size:.82rem">Sem tarefas atribuídas a esta equipe</div>
        </div>
        <div class="mb-4">
          <h2>Materiais — Status</h2>
          <div v-for="m in store.materiais" :key="m.id" class="checklist-item">
            <div class="check-box" :class="m.status === 'no_local' || m.status === 'confirmado' ? 'checked' : ''">{{ m.status === 'no_local' ? '✓' : m.status === 'confirmado' ? '✓' : '' }}</div>
            <div class="check-text">
              {{ m.nome }} <span class="text-muted">({{ m.qtd_necessaria }} {{ m.unidade }})</span>
              <span :class="`badge badge-${m.status} ml-1`" style="font-size:.7rem">{{ labelStatusMat(m.status) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 5. Matriz de Responsabilidades -->
      <div v-if="ativo === 'responsabilidades'" class="relatorio-body">
        <div class="rel-header"><h1>{{ store.evento?.nome }} — Matriz de Responsabilidades</h1></div>
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

      <!-- 6. Controle Financeiro -->
      <div v-if="ativo === 'financeiro'" class="relatorio-body">
        <div class="rel-header"><h1>{{ store.evento?.nome }} — Controle Financeiro</h1></div>
        <div class="resumo-grid-rel mb-4">
          <div class="res-card res-verde"><span>Receitas</span><strong>R$ {{ fmt(store.resumoFinanceiro.receitas) }}</strong></div>
          <div class="res-card res-vermelho"><span>Despesas</span><strong>R$ {{ fmt(store.resumoFinanceiro.despesas) }}</strong></div>
          <div class="res-card" :class="store.resumoFinanceiro.saldo >= 0 ? 'res-verde' : 'res-vermelho'"><span>Saldo</span><strong>R$ {{ fmt(store.resumoFinanceiro.saldo) }}</strong></div>
          <div class="res-card res-neutro"><span>Custo/pessoa</span><strong>R$ {{ fmt(store.custoPorPessoa) }}</strong></div>
        </div>
        <div class="grid-2">
          <div>
            <h3 class="mb-2 text-success">Receitas</h3>
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
            <h3 class="mb-2 text-danger">Despesas</h3>
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

      <!-- 7. Lista de Materiais / Compras -->
      <div v-if="ativo === 'compras'" class="relatorio-body">
        <div class="rel-header"><h1>{{ store.evento?.nome }} — Lista de Materiais e Compras</h1></div>
        <div class="alert alert-atencao mb-3" style="font-size:.82rem">
          Água necessária: <strong>{{ store.aguaLitros }} L ({{ store.aguaGaloes }} galões de 20L)</strong>
          — {{ store.totalPessoas }} pessoas × {{ store.dias }} dias × {{ store.evento?.litros_agua_pessoa_dia }}L/pessoa/dia
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
            <tr v-if="store.listaCompras.length === 0"><td colspan="3" class="text-muted">Nenhum item com quantidade por pessoa cadastrado</td></tr>
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
.app-header { background: #fff; border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 50; }
.header-inner { max-width: 1200px; margin: 0 auto; padding: .65rem 1.5rem; display: flex; align-items: center; justify-content: space-between; }
.main-content { max-width: 1100px; margin: 0 auto; padding: 1.5rem; }
.relatorio-tabs { display: flex; gap: .5rem; flex-wrap: wrap; border-bottom: 2px solid var(--border); padding-bottom: .75rem; }
.tab-btn { padding: .4rem .9rem; border-radius: 6px; border: 1px solid var(--border); background: #fff; cursor: pointer; font-size: .85rem; transition: all .15s; }
.tab-btn.active { background: var(--primary); color: #fff; border-color: var(--primary); }
.relatorio-body { background: #fff; border-radius: var(--radius); border: 1px solid var(--border); padding: 2rem; }
.rel-header { margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid var(--primary); }
.rel-header h1 { color: var(--primary); margin-bottom: .25rem; }
.rel-header p { color: var(--text-muted); font-size: .85rem; }
.info-section { margin-bottom: 1rem; }
.info-section h3 { margin-bottom: .5rem; padding-bottom: .3rem; border-bottom: 1px solid var(--border); color: var(--text-muted); font-size: .85rem; text-transform: uppercase; letter-spacing: .05em; }
.rel-table { width: 100%; border-collapse: collapse; font-size: .875rem; margin-bottom: .5rem; }
.rel-table th { padding: .5rem .75rem; text-align: left; font-size: .75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: .04em; border-bottom: 2px solid var(--border); }
.rel-table td { padding: .5rem .75rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
.rel-table tr:last-child td { border-bottom: none; }
.dia-header-rel { color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: .3rem; margin-bottom: .75rem; font-size: 1rem; }
.checklist-item { display: flex; align-items: flex-start; gap: .75rem; padding: .4rem 0; border-bottom: 1px solid #f8fafc; font-size: .875rem; }
.check-box { width: 20px; height: 20px; border: 2px solid var(--border); border-radius: 4px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: .75rem; color: var(--success); font-weight: 700; }
.check-box.checked { border-color: var(--success); background: #f0fdf4; }
.row-alerta td { background: #fff7ed; }
.resumo-grid-rel { display: grid; grid-template-columns: repeat(4, 1fr); gap: .75rem; }
@media (max-width: 768px) { .resumo-grid-rel { grid-template-columns: 1fr 1fr; } }
.res-card { border-radius: 8px; padding: .75rem 1rem; display: flex; flex-direction: column; gap: .25rem; border: 1px solid transparent; }
.res-card span { font-size: .75rem; font-weight: 600; text-transform: uppercase; letter-spacing: .03em; }
.res-card strong { font-size: 1.3rem; }
.res-verde { background: #f0fdf4; border-color: #bbf7d0; color: #166534; }
.res-vermelho { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
.res-neutro { background: #f8fafc; border-color: var(--border); color: var(--text); }
</style>
