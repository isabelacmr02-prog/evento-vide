<template>
  <div class="page" v-if="!store.loading || store.evento">
    <!-- HEADER -->
    <header class="app-header">
      <div class="header-inner">
        <div class="flex items-center gap-2">
          <button class="btn btn-ghost btn-sm" @click="$router.push('/eventos')">← Eventos</button>
          <span class="breadcrumb-sep">/</span>
          <span class="breadcrumb-current">{{ store.evento?.nome }}</span>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn btn-secondary btn-sm" @click="$router.push(`/eventos/${id}/relatorios`)">
            📄 Relatórios
          </button>
          <button class="btn btn-ghost btn-sm" @click="auth.logout()">Sair</button>
        </div>
      </div>
    </header>

    <!-- BANNER -->
    <div class="evento-banner">
      <div class="banner-bg-orb banner-orb-1"></div>
      <div class="banner-bg-orb banner-orb-2"></div>
      <div class="banner-inner">
        <div class="banner-tag">⛺ Evento</div>
        <h1 class="banner-title">{{ store.evento?.nome }}</h1>
        <p class="banner-meta">
          📅 {{ formatarDatas(store.evento?.data_inicio, store.evento?.data_fim) }}
          · {{ store.dias }} dia{{ store.dias !== 1 ? 's' : '' }}
        </p>
        <p v-if="store.evento?.objetivo" class="banner-objetivo">{{ store.evento.objetivo }}</p>
      </div>

      <!-- Barra de progresso -->
      <div class="banner-progress">
        <div class="progress-info">
          <span>Completude do planejamento</span>
          <span class="progress-pct">{{ store.completude.pct }}%</span>
        </div>
        <div class="progress"><div class="progress-bar" :style="`width:${store.completude.pct}%`"></div></div>
      </div>
    </div>

    <!-- STATS ROW — white cards floating below banner -->
    <div class="stats-row">
      <div class="stat-card">
        <span class="stat-icon">👥</span>
        <span class="stat-num">{{ store.totalPessoas }}</span>
        <span class="stat-label">Pessoas</span>
      </div>
      <div class="stat-card" :class="saldoClass">
        <span class="stat-icon">💰</span>
        <span class="stat-num stat-num-fin">R$ {{ formatNum(store.resumoFinanceiro.saldo) }}</span>
        <span class="stat-label">Saldo</span>
      </div>
      <div class="stat-card" :class="completudeClass">
        <span class="stat-icon">📋</span>
        <span class="stat-num">{{ store.completude.pct }}%</span>
        <span class="stat-label">Planejamento</span>
      </div>
      <div class="stat-card" :class="alertasClass">
        <span class="stat-icon">⚠️</span>
        <span class="stat-num">{{ store.alertas.length }}</span>
        <span class="stat-label">Alertas</span>
      </div>
    </div>

    <main class="main-content">
      <!-- ALERTAS -->
      <div v-if="store.alertas.length > 0" class="alertas-section">
        <div class="alertas-header">
          <span class="alertas-icon">⚠️</span>
          <h3>{{ store.alertas.length }} alerta{{ store.alertas.length !== 1 ? 's' : '' }}</h3>
        </div>
        <div class="alertas-list">
          <div v-for="(a, i) in store.alertas" :key="i" class="alerta-item" :class="`alerta-${a.nivel}`">
            <span class="alerta-dot" :class="`dot-${a.nivel}`"></span>
            <div><strong>{{ a.secao }}:</strong> {{ a.msg }}</div>
          </div>
        </div>
      </div>

      <!-- GRADE DE SEÇÕES -->
      <div class="dashboard-grid stagger">
        <SectionCard title="Informações Gerais" icon="📋" @edit="abrirSecao('geral')">
          <InfoRow label="Nome" :value="store.evento?.nome" />
          <InfoRow label="Datas" :value="formatarDatas(store.evento?.data_inicio, store.evento?.data_fim)" />
          <InfoRow label="Objetivo" :value="store.evento?.objetivo" />
          <InfoRow label="Público" :value="store.evento?.publico_alvo" />
          <InfoRow label="Total de pessoas" :value="`${store.totalPessoas} (${store.pessoas.filter(p=>p.papel==='participante').length} part. + ${store.pessoas.filter(p=>p.papel!=='participante').length} org./vol.)`" />
          <InfoRow label="Duração" :value="`${store.dias} dia(s)`" />
        </SectionCard>

        <SectionCard title="Local" icon="📍" @edit="abrirSecao('local')">
          <template v-if="store.local">
            <InfoRow label="Local" :value="store.local.nome_local" />
            <InfoRow label="Endereço" :value="store.local.endereco" />
            <InfoRow label="Distância" :value="store.local.distancia_km ? `${store.local.distancia_km} km` : null" />
            <InfoRow label="Banheiros" :value="store.local.tem_banheiro ? `${store.local.qtd_banheiros || '?'} banheiro(s)` : 'Sem banheiro'" />
            <InfoRow label="Água potável" :value="store.local.tem_agua_potavel ? 'Disponível no local' : 'Deve ser levada'" />
            <InfoRow label="Energia" :value="store.local.tem_energia ? (store.local.fonte_energia || 'Sim') : 'Sem energia'" />
            <InfoRow label="Unidade de saúde" :value="store.local.unidade_saude_proxima" missing-label="⚠️ Não informada" />
          </template>
          <div v-else class="empty-state" style="padding:.75rem 0">Local não cadastrado</div>
        </SectionCard>

        <SectionCard title="Hospedagem" icon="🏕" @edit="abrirSecao('hospedagem')">
          <template v-if="store.hospedagem">
            <InfoRow label="Modelo" :value="store.hospedagem.modelo" />
            <InfoRow label="Barracas esperadas" :value="`${store.barracasEsperadas} (pessoas que levam barraca)`" />
            <InfoRow label="Barracas disponíveis" :value="store.hospedagem.barracas_disponiveis" />
            <InfoRow label="Colchões" :value="store.hospedagem.colchoes" />
            <InfoRow label="Redes" :value="store.hospedagem.redes" />
            <InfoRow label="Cobertores" :value="store.hospedagem.cobertores" />
          </template>
          <div v-else class="empty-state" style="padding:.75rem 0">Hospedagem não cadastrada</div>
        </SectionCard>

        <SectionCard title="Pessoas" icon="👥" @edit="abrirSecao('pessoas')">
          <div class="pessoas-mini">
            <div class="pessoas-count">
              <span class="big-num">{{ store.totalPessoas }}</span>
              <span class="text-muted" style="font-size:.75rem">total</span>
            </div>
            <div class="pessoas-breakdown">
              <div v-for="papel in ['participante','organizador','voluntario','convidado']" :key="papel" class="role-row">
                <span class="text-muted">{{ labelPapel(papel) }}</span>
                <strong>{{ store.pessoas.filter(p=>p.papel===papel).length }}</strong>
              </div>
            </div>
          </div>
          <div v-if="store.pessoas.filter(p=>p.restricoes_alimentares).length > 0" class="alert alert-atencao mt-2" style="font-size:.8rem">
            🍽 {{ store.pessoas.filter(p=>p.restricoes_alimentares).length }} pessoa(s) com restrições alimentares
          </div>
        </SectionCard>

        <SectionCard title="Alimentação" icon="🍽" @edit="abrirSecao('alimentacao')">
          <InfoRow label="Refeições" :value="store.refeicoes.length" />
          <InfoRow label="Água necessária" :value="`${store.aguaLitros} L (${store.aguaGaloes} galões de 20L)`" />
          <div v-if="store.listaCompras.length > 0" class="mt-2">
            <p class="section-sublabel">Top compras calculadas</p>
            <div v-for="item in store.listaCompras.slice(0, 4)" :key="item.nome" class="compra-row">
              <span>{{ item.nome }}</span>
              <span class="text-muted">{{ item.qtd }} {{ item.unidade }}</span>
            </div>
            <button v-if="store.listaCompras.length > 4" class="btn btn-ghost btn-sm mt-1" @click="abrirSecao('alimentacao')">
              ver tudo ({{ store.listaCompras.length }} itens)
            </button>
          </div>
        </SectionCard>

        <SectionCard title="Programação" icon="🗓" @edit="abrirSecao('programacao')">
          <InfoRow label="Atividades" :value="store.programacao.length" />
          <div v-if="store.programacao.length > 0" class="prog-mini mt-2">
            <div v-for="ativ in store.programacao.slice(0, 4)" :key="ativ.id" class="prog-item">
              <span class="prog-hora">{{ formatHora(ativ.inicio) }}</span>
              <span class="prog-titulo">{{ ativ.titulo }}</span>
            </div>
            <span v-if="store.programacao.length > 4" class="text-muted" style="font-size:.78rem">
              + {{ store.programacao.length - 4 }} atividades
            </span>
          </div>
          <div v-else class="empty-state" style="padding:.5rem 0">Nenhuma atividade</div>
        </SectionCard>

        <SectionCard title="Transporte" icon="🚗" @edit="abrirSecao('transporte')">
          <InfoRow label="Veículos" :value="store.transporte.length" />
          <InfoRow label="Capacidade total" :value="`${store.capacidadeTransporte} assentos`" />
          <div v-if="store.capacidadeTransporte < store.totalPessoas && store.transporte.length > 0" class="alert alert-erro mt-2" style="font-size:.8rem">
            Faltam {{ store.totalPessoas - store.capacidadeTransporte }} assentos
          </div>
          <div v-for="v in store.viagensTransporte" :key="v.id" class="veiculo-row">
            <span>{{ v.identificacao || v.tipo }}</span>
            <span class="text-muted">{{ v.capacidade_pessoas }} assentos<span v-if="v.viagens"> · {{ v.viagens }}x</span></span>
          </div>
        </SectionCard>

        <SectionCard title="Equipes" icon="🤝" @edit="abrirSecao('equipes')">
          <div v-for="eq in store.equipes" :key="eq.id" class="equipe-row">
            <strong>{{ eq.nome }}</strong>
            <span class="badge badge-pendente">{{ store.equipesMembros.filter(m=>m.equipe_id===eq.id).length }} membro(s)</span>
          </div>
          <div v-if="store.equipes.length === 0" class="empty-state" style="padding:.5rem 0">Nenhuma equipe</div>
        </SectionCard>

        <SectionCard title="Materiais" icon="🎒" @edit="abrirSecao('materiais')">
          <InfoRow label="Total de itens" :value="store.materiais.length" />
          <div v-for="m in store.materiais.slice(0, 5)" :key="m.id" class="material-row">
            <span>{{ m.nome }}</span>
            <span :class="`badge badge-${m.status}`">{{ labelStatus(m.status) }}</span>
          </div>
          <span v-if="store.materiais.length > 5" class="text-muted" style="font-size:.78rem">
            + {{ store.materiais.length - 5 }} itens
          </span>
          <div class="material-row mt-2" style="border-top:1px solid var(--border-light);padding-top:.5rem">
            <span>💧 Água potável (calculada)</span>
            <span class="text-muted">{{ store.aguaLitros }} L</span>
          </div>
        </SectionCard>

        <SectionCard title="Orçamento" icon="💰" @edit="abrirSecao('orcamento')">
          <div class="fin-resumo">
            <div class="fin-item">
              <span>↑ Receitas</span>
              <strong class="text-success">R$ {{ formatNum(store.resumoFinanceiro.receitas) }}</strong>
            </div>
            <div class="fin-item">
              <span>↓ Despesas</span>
              <strong class="text-danger">R$ {{ formatNum(store.resumoFinanceiro.despesas) }}</strong>
            </div>
            <div class="fin-item fin-saldo">
              <span :class="store.resumoFinanceiro.saldo >= 0 ? 'text-success' : 'text-danger'">=  Saldo</span>
              <strong :class="store.resumoFinanceiro.saldo >= 0 ? 'text-success' : 'text-danger'">
                R$ {{ formatNum(store.resumoFinanceiro.saldo) }}
              </strong>
            </div>
          </div>
          <p v-if="store.totalPessoas > 0" class="text-muted mt-2" style="font-size:.8rem">
            Custo por pessoa: R$ {{ formatNum(store.custoPorPessoa) }}
          </p>
        </SectionCard>

        <SectionCard title="Riscos" icon="⚠️" @edit="abrirSecao('riscos')">
          <div v-for="r in store.riscos" :key="r.id" class="risco-item">
            <span class="risco-desc">{{ r.descricao }}</span>
            <span :class="`badge badge-${r.severidade}`">{{ r.severidade }}</span>
          </div>
          <div v-if="store.riscos.length === 0" class="empty-state" style="padding:.5rem 0">Nenhum risco cadastrado</div>
        </SectionCard>

        <SectionCard title="Tarefas / Plano de Ação" icon="✅" @edit="abrirSecao('tarefas')">
          <div class="tarefas-mini">
            <div v-for="status in ['pendente','em_andamento','concluida','bloqueada']" :key="status" class="tarefa-stat">
              <span class="tarefa-num">{{ store.tarefas.filter(t=>t.status===status).length }}</span>
              <span :class="`badge badge-${status}`">{{ labelStatusTarefa(status) }}</span>
            </div>
          </div>
          <div v-for="t in store.tarefas.filter(t=>t.status!=='concluida'&&t.status!=='cancelada').slice(0,3)" :key="t.id" class="tarefa-row">
            <span :class="`badge badge-${t.prioridade}`" style="font-size:.68rem">{{ t.prioridade }}</span>
            <span>{{ t.o_que }}</span>
          </div>
        </SectionCard>

        <!-- Seções Personalizadas -->
        <template v-for="(campos, secao) in secoesCustomExtras" :key="secao">
          <SectionCard :title="secao" icon="🔧" @edit="abrirSecao('custom', secao)">
            <div v-for="cf in campos" :key="cf.id" class="custom-row">
              <span class="text-muted">{{ cf.rotulo }}</span>
              <span>{{ cf.valor || '—' }}</span>
            </div>
          </SectionCard>
        </template>
      </div>
    </main>

    <!-- Modais de seção -->
    <LocalSection v-if="secaoAberta === 'local'" @close="secaoAberta = null" />
    <HospedagemSection v-if="secaoAberta === 'hospedagem'" @close="secaoAberta = null" />
    <PessoasSection v-if="secaoAberta === 'pessoas'" @close="secaoAberta = null" />
    <AlimentacaoSection v-if="secaoAberta === 'alimentacao'" @close="secaoAberta = null" />
    <ProgramacaoSection v-if="secaoAberta === 'programacao'" @close="secaoAberta = null" />
    <TransporteSection v-if="secaoAberta === 'transporte'" @close="secaoAberta = null" />
    <EquipesSection v-if="secaoAberta === 'equipes'" @close="secaoAberta = null" />
    <MateriaisSection v-if="secaoAberta === 'materiais'" @close="secaoAberta = null" />
    <OrcamentoSection v-if="secaoAberta === 'orcamento'" @close="secaoAberta = null" />
    <RiscosSection v-if="secaoAberta === 'riscos'" @close="secaoAberta = null" />
    <TarefasSection v-if="secaoAberta === 'tarefas'" @close="secaoAberta = null" />
    <GeralSection v-if="secaoAberta === 'geral'" @close="secaoAberta = null" />
    <CustomSection v-if="secaoAberta === 'custom'" :secao-nome="customSecaoNome" @close="secaoAberta = null" />
  </div>

  <div v-else class="loading-full">
    <div class="loading-spinner"></div>
    <span>Carregando evento...</span>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useEventoDataStore } from '@/stores/eventoData'
import { useAuthStore } from '@/stores/auth'
import SectionCard from '@/components/dashboard/SectionCard.vue'
import InfoRow from '@/components/common/InfoRow.vue'
import LocalSection from '@/views/sections/LocalSection.vue'
import HospedagemSection from '@/views/sections/HospedagemSection.vue'
import PessoasSection from '@/views/sections/PessoasSection.vue'
import AlimentacaoSection from '@/views/sections/AlimentacaoSection.vue'
import ProgramacaoSection from '@/views/sections/ProgramacaoSection.vue'
import TransporteSection from '@/views/sections/TransporteSection.vue'
import EquipesSection from '@/views/sections/EquipesSection.vue'
import MateriaisSection from '@/views/sections/MateriaisSection.vue'
import OrcamentoSection from '@/views/sections/OrcamentoSection.vue'
import RiscosSection from '@/views/sections/RiscosSection.vue'
import TarefasSection from '@/views/sections/TarefasSection.vue'
import GeralSection from '@/views/sections/GeralSection.vue'
import CustomSection from '@/views/sections/CustomSection.vue'

const props = defineProps({ id: String })
const store = useEventoDataStore()
const auth = useAuthStore()
const secaoAberta = ref(null)
const customSecaoNome = ref('')

const errosCount = computed(() => store.alertas.filter(a => a.nivel === 'erro').length)
const saldoClass = computed(() => store.resumoFinanceiro.saldo >= 0 ? 'stat-green' : 'stat-red')
const completudeClass = computed(() => store.completude.pct >= 80 ? 'stat-green' : store.completude.pct >= 50 ? 'stat-yellow' : 'stat-red')
const alertasClass = computed(() => store.alertas.length === 0 ? 'stat-green' : errosCount.value > 0 ? 'stat-red' : 'stat-yellow')

const secoesCustomExtras = computed(() => {
  const secoesPadrao = ['geral','local','hospedagem','pessoas','alimentacao','programacao','transporte','equipes','materiais','orcamento','riscos','tarefas']
  const result = {}
  for (const [secao, campos] of Object.entries(store.customFieldsSecoes)) {
    if (!secoesPadrao.includes(secao.toLowerCase())) result[secao] = campos
  }
  return result
})

onMounted(() => store.carregar(props.id))

function abrirSecao(nome, customNome = '') {
  customSecaoNome.value = customNome
  secaoAberta.value = nome
}

function formatarDatas(ini, fim) {
  if (!ini) return ''
  const opts = { day: '2-digit', month: '2-digit', year: 'numeric' }
  const a = new Date(ini + 'T12:00:00').toLocaleDateString('pt-BR', opts)
  const b = new Date(fim + 'T12:00:00').toLocaleDateString('pt-BR', opts)
  return ini === fim ? a : `${a} – ${b}`
}
function formatNum(n) { return Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function formatHora(ts) { if (!ts) return ''; return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
function labelPapel(p) { return { participante: 'Participante', organizador: 'Organizador', voluntario: 'Voluntário', convidado: 'Convidado' }[p] || p }
function labelStatus(s) { return { a_providenciar: 'Providenciar', reservado: 'Reservado', confirmado: 'Confirmado', no_local: 'No local' }[s] || s }
function labelStatusTarefa(s) { return { pendente: 'Pendente', em_andamento: 'Em andamento', concluida: 'Concluída', bloqueada: 'Bloqueada', cancelada: 'Cancelada' }[s] || s }
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
  padding: .75rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.breadcrumb-sep { color: var(--border); font-size: .9rem; }
.breadcrumb-current { font-weight: 600; color: var(--text); font-size: .9rem; max-width: 280px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Banner */
.evento-banner {
  background: linear-gradient(135deg, #312e81 0%, #4c1d95 45%, #6d28d9 100%);
  color: #fff;
  position: relative;
  overflow: hidden;
  padding: 2.25rem 0 3.5rem;
  animation: fadeIn .4s ease;
}
.banner-bg-orb {
  position: absolute;
  border-radius: 50%;
  background: rgba(255,255,255,.05);
  pointer-events: none;
}
.banner-orb-1 { width: 560px; height: 560px; top: -220px; right: -130px; }
.banner-orb-2 { width: 320px; height: 320px; bottom: -140px; left: 80px; }
.banner-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem 1.25rem;
  position: relative;
  z-index: 1;
}
.banner-tag {
  display: inline-flex;
  align-items: center;
  gap: .35rem;
  font-size: .7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .1em;
  color: rgba(255,255,255,.55);
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 99px;
  padding: .2rem .65rem;
  margin-bottom: .85rem;
}
.banner-title {
  font-size: 2rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: -.03em;
  margin-bottom: .45rem;
  line-height: 1.15;
}
.banner-meta { font-size: .88rem; color: rgba(255,255,255,.65); margin-bottom: .35rem; }
.banner-objetivo { font-size: .9rem; color: rgba(255,255,255,.8); max-width: 560px; margin-top: .1rem; }

/* Progress */
.banner-progress {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem 0;
  position: relative;
  z-index: 1;
}
.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: .78rem;
  color: rgba(255,255,255,.6);
  margin-bottom: .5rem;
}
.progress-pct { font-weight: 700; color: #fff; }
.progress { background: rgba(255,255,255,.15); height: 8px; }
.progress-bar { transition: width .8s cubic-bezier(.4,0,.2,1); }

/* Stats Row — floating white cards below banner */
.stats-row {
  max-width: 1200px;
  margin: -2rem auto 0;
  padding: 0 1.5rem;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  position: relative;
  z-index: 10;
  animation: fadeInUp .45s .12s ease both;
}
@media (max-width: 768px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 480px) { .stats-row { grid-template-columns: 1fr 1fr; } }

.stat-card {
  background: #fff;
  border-radius: 14px;
  border: 1px solid var(--border);
  box-shadow: 0 4px 20px rgba(79,70,229,.10), 0 2px 8px rgba(0,0,0,.05);
  padding: 1.1rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
  overflow: hidden;
  transition: transform .22s cubic-bezier(.4,0,.2,1), box-shadow .22s;
  cursor: default;
}
.stat-card::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  border-radius: 14px 14px 0 0;
}
.stat-green::after { background: linear-gradient(90deg, #16a34a, #22c55e); }
.stat-yellow::after { background: linear-gradient(90deg, #d97706, #f59e0b); }
.stat-red::after { background: linear-gradient(90deg, #dc2626, #ef4444); }
.stat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 28px rgba(79,70,229,.15), 0 4px 12px rgba(0,0,0,.07); }

.stat-icon { font-size: 1.45rem; margin-bottom: .4rem; display: block; line-height: 1; }
.stat-num {
  display: block;
  font-size: 1.55rem;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -.03em;
  line-height: 1.1;
}
.stat-num-fin { font-size: 1.1rem; }
.stat-green .stat-num { color: #16a34a; }
.stat-yellow .stat-num { color: #d97706; }
.stat-red .stat-num { color: #dc2626; }
.stat-label {
  display: block;
  font-size: .67rem;
  text-transform: uppercase;
  letter-spacing: .07em;
  color: var(--text-muted);
  margin-top: .3rem;
  font-weight: 600;
}

/* Main */
.main-content { max-width: 1200px; margin: 1.75rem auto 0; padding: 0 1.5rem 2.5rem; }

/* Alertas */
.alertas-section {
  background: #fff;
  border-radius: var(--radius);
  border: 1px solid #fde68a;
  margin-bottom: 1.75rem;
  overflow: hidden;
}
.alertas-header {
  display: flex;
  align-items: center;
  gap: .5rem;
  padding: .85rem 1.25rem;
  background: var(--warning-light);
  border-bottom: 1px solid #fde68a;
}
.alertas-header h3 { font-size: .9rem; color: #92400e; }
.alertas-icon { font-size: 1rem; }
.alertas-list { padding: .75rem 1.25rem; display: flex; flex-direction: column; gap: .5rem; }
.alerta-item {
  display: flex;
  align-items: flex-start;
  gap: .65rem;
  font-size: .85rem;
  color: var(--text);
  padding: .4rem 0;
}
.alerta-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: .35rem;
  flex-shrink: 0;
}
.dot-erro { background: var(--danger); }
.dot-atencao { background: var(--warning); }

/* Dashboard Grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.1rem;
}
@media (max-width: 768px) { .dashboard-grid { grid-template-columns: 1fr; } }

/* Section content helpers */
.section-sublabel { font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--text-muted); margin-bottom: .4rem; }

.compra-row, .veiculo-row, .material-row, .equipe-row, .risco-item, .tarefa-row, .custom-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: .5rem;
  padding: .25rem 0;
  border-bottom: 1px solid var(--border-light);
  font-size: .83rem;
}
.compra-row:last-child, .veiculo-row:last-child, .material-row:last-child,
.equipe-row:last-child, .risco-item:last-child, .tarefa-row:last-child, .custom-row:last-child { border-bottom: none; }
.risco-desc { flex: 1; }

.tarefa-row { gap: .5rem; justify-content: flex-start; }

.pessoas-mini { display: flex; gap: 1.25rem; align-items: center; margin-bottom: .5rem; }
.big-num { font-size: 2.2rem; font-weight: 800; color: var(--primary); line-height: 1; }
.pessoas-count { display: flex; flex-direction: column; align-items: center; gap: .15rem; }
.pessoas-breakdown { display: flex; flex-direction: column; gap: .25rem; }
.role-row { display: flex; justify-content: space-between; gap: .75rem; font-size: .82rem; min-width: 140px; }

.fin-resumo { display: flex; flex-direction: column; }
.fin-item { display: flex; justify-content: space-between; padding: .35rem 0; border-bottom: 1px solid var(--border-light); font-size: .88rem; }
.fin-saldo { border-bottom: none; font-weight: 700; }

.tarefas-mini { display: flex; gap: .75rem; flex-wrap: wrap; margin-bottom: .6rem; }
.tarefa-stat { display: flex; flex-direction: column; align-items: center; gap: .2rem; }
.tarefa-num { font-size: 1.2rem; font-weight: 800; color: var(--text); }

.prog-mini { display: flex; flex-direction: column; gap: .3rem; }
.prog-item { display: flex; gap: .6rem; font-size: .83rem; align-items: baseline; }
.prog-hora { color: var(--primary); font-weight: 700; min-width: 48px; font-size: .78rem; }
.prog-titulo { flex: 1; }

/* Loading full page */
.loading-full {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .75rem;
  color: var(--text-muted);
}
.loading-spinner {
  width: 22px;
  height: 22px;
  border: 2.5px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
