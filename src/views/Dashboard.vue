<template>
  <div class="page" v-if="!store.loading || store.evento">
    <!-- HEADER -->
    <header class="app-header">
      <div class="header-inner">
        <div class="flex items-center gap-2">
          <button class="btn btn-ghost btn-sm" @click="$router.push('/eventos')">← Eventos</button>
          <span class="text-muted">/</span>
          <span class="fw-bold">{{ store.evento?.nome }}</span>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn btn-secondary btn-sm" @click="$router.push(`/eventos/${id}/relatorios`)">📄 Relatórios</button>
          <button class="btn btn-ghost btn-sm" @click="auth.logout()">Sair</button>
        </div>
      </div>
    </header>

    <!-- BANNER DO EVENTO -->
    <div class="evento-banner">
      <div class="banner-inner">
        <div>
          <h1>{{ store.evento?.nome }}</h1>
          <p class="text-muted">{{ formatarDatas(store.evento?.data_inicio, store.evento?.data_fim) }} · {{ store.dias }} dia{{ store.dias !== 1 ? 's' : '' }}</p>
          <p v-if="store.evento?.objetivo" class="mt-1" style="font-size:.9rem">{{ store.evento.objetivo }}</p>
        </div>
        <div class="banner-stats">
          <div class="stat-pill">
            <span class="stat-val">{{ store.totalPessoas }}</span>
            <span class="stat-lbl">pessoas</span>
          </div>
          <div class="stat-pill" :class="store.resumoFinanceiro.saldo >= 0 ? 'stat-ok' : 'stat-danger'">
            <span class="stat-val">R$ {{ formatNum(store.resumoFinanceiro.saldo) }}</span>
            <span class="stat-lbl">saldo</span>
          </div>
          <div class="stat-pill" :class="store.completude.pct >= 80 ? 'stat-ok' : store.completude.pct >= 50 ? 'stat-warn' : 'stat-danger'">
            <span class="stat-val">{{ store.completude.pct }}%</span>
            <span class="stat-lbl">planejado</span>
          </div>
          <div class="stat-pill" :class="store.alertas.length === 0 ? 'stat-ok' : errosCount > 0 ? 'stat-danger' : 'stat-warn'">
            <span class="stat-val">{{ store.alertas.length }}</span>
            <span class="stat-lbl">alertas</span>
          </div>
        </div>
      </div>
      <!-- Barra de progresso -->
      <div style="max-width:1200px;margin:0 auto;padding:0 1.5rem .75rem">
        <div class="flex items-center gap-2" style="font-size:.8rem;color:#6b7280;margin-bottom:.35rem">
          <span>Completude do planejamento: {{ store.completude.pct }}%</span>
        </div>
        <div class="progress"><div class="progress-bar" :style="`width:${store.completude.pct}%`"></div></div>
      </div>
    </div>

    <main class="main-content">
      <!-- ALERTAS -->
      <div v-if="store.alertas.length > 0" class="alertas-section mb-4">
        <h3 class="mb-2">⚠️ Alertas ({{ store.alertas.length }})</h3>
        <div v-for="(a, i) in store.alertas" :key="i" class="alert" :class="`alert-${a.nivel}`">
          <span>{{ a.nivel === 'erro' ? '🔴' : '🟡' }}</span>
          <div><strong>{{ a.secao }}:</strong> {{ a.msg }}</div>
        </div>
      </div>

      <!-- GRADE DE CARDS -->
      <div class="dashboard-grid">
        <!-- 1. Informações Gerais -->
        <SectionCard title="Informações Gerais" icon="📋" @edit="abrirSecao('geral')">
          <InfoRow label="Nome" :value="store.evento?.nome" />
          <InfoRow label="Datas" :value="formatarDatas(store.evento?.data_inicio, store.evento?.data_fim)" />
          <InfoRow label="Objetivo" :value="store.evento?.objetivo" />
          <InfoRow label="Público" :value="store.evento?.publico_alvo" />
          <InfoRow label="Total de pessoas" :value="`${store.totalPessoas} (${store.pessoas.filter(p=>p.papel==='participante').length} participantes + ${store.pessoas.filter(p=>p.papel!=='participante').length} org./vol.)`" />
          <InfoRow label="Duração" :value="`${store.dias} dia(s)`" />
        </SectionCard>

        <!-- 2. Local -->
        <SectionCard title="Local" icon="📍" @edit="abrirSecao('local')">
          <template v-if="store.local">
            <InfoRow label="Local" :value="store.local.nome_local" />
            <InfoRow label="Endereço" :value="store.local.endereco" />
            <InfoRow label="Distância" :value="store.local.distancia_km ? `${store.local.distancia_km} km` : null" />
            <InfoRow label="Banheiros" :value="store.local.tem_banheiro ? `${store.local.qtd_banheiros || '?'} banheiro(s)` : 'Sem banheiro'" />
            <InfoRow label="Água potável" :value="store.local.tem_agua_potavel ? 'Disponível no local' : 'Deve ser levada'" />
            <InfoRow label="Energia" :value="store.local.tem_energia ? (store.local.fonte_energia || 'Sim') : 'Sem energia'" />
            <InfoRow label="Unidade de saúde" :value="store.local.unidade_saude_proxima" missing-label="⚠️ Não informada" />
            <InfoRow label="Riscos no local" :value="store.local.pontos_de_risco" />
          </template>
          <div v-else class="empty-state" style="padding:1rem">Local não cadastrado</div>
        </SectionCard>

        <!-- 3. Hospedagem -->
        <SectionCard title="Hospedagem" icon="🏕" @edit="abrirSecao('hospedagem')">
          <template v-if="store.hospedagem">
            <InfoRow label="Modelo" :value="store.hospedagem.modelo" />
            <InfoRow label="Barracas esperadas" :value="`${store.barracasEsperadas} (pessoas que levam barraca)`" />
            <InfoRow label="Barracas disponíveis" :value="store.hospedagem.barracas_disponiveis" />
            <InfoRow label="Colchões" :value="store.hospedagem.colchoes" />
            <InfoRow label="Redes" :value="store.hospedagem.redes" />
            <InfoRow label="Cobertores" :value="store.hospedagem.cobertores" />
          </template>
          <div v-else class="empty-state" style="padding:1rem">Hospedagem não cadastrada</div>
        </SectionCard>

        <!-- 4. Pessoas -->
        <SectionCard title="Pessoas" icon="👥" @edit="abrirSecao('pessoas')">
          <div class="pessoas-mini">
            <div class="pessoas-count">
              <span class="big-num">{{ store.totalPessoas }}</span>
              <span class="text-muted">total</span>
            </div>
            <div class="pessoas-breakdown">
              <div v-for="papel in ['participante','organizador','voluntario','convidado']" :key="papel">
                <span class="text-muted">{{ labelPapel(papel) }}:</span>
                <strong>{{ store.pessoas.filter(p=>p.papel===papel).length }}</strong>
              </div>
            </div>
          </div>
          <div v-if="store.pessoas.filter(p=>p.restricoes_alimentares).length > 0" class="alert alert-atencao mt-2" style="font-size:.8rem">
            🍽 {{ store.pessoas.filter(p=>p.restricoes_alimentares).length }} pessoa(s) com restrições alimentares
          </div>
        </SectionCard>

        <!-- 5. Alimentação -->
        <SectionCard title="Alimentação" icon="🍽" @edit="abrirSecao('alimentacao')">
          <InfoRow label="Refeições cadastradas" :value="store.refeicoes.length" />
          <InfoRow label="Água necessária" :value="`${store.aguaLitros} L (${store.aguaGaloes} galões de 20L)`" />
          <div v-if="store.listaCompras.length > 0">
            <p class="form-label mt-2">Top compras calculadas:</p>
            <div v-for="item in store.listaCompras.slice(0, 4)" :key="item.nome" class="flex justify-between" style="font-size:.82rem;padding:.2rem 0">
              <span>{{ item.nome }}</span>
              <span class="text-muted">{{ item.qtd }} {{ item.unidade }}</span>
            </div>
            <button v-if="store.listaCompras.length > 4" class="btn btn-ghost btn-sm mt-1" @click="abrirSecao('alimentacao')">ver tudo ({{ store.listaCompras.length }} itens)</button>
          </div>
        </SectionCard>

        <!-- 6. Programação -->
        <SectionCard title="Programação" icon="🗓" @edit="abrirSecao('programacao')">
          <InfoRow label="Atividades" :value="store.programacao.length" />
          <div v-if="store.programacao.length > 0" class="prog-mini">
            <div v-for="ativ in store.programacao.slice(0, 4)" :key="ativ.id" class="prog-item">
              <span class="prog-hora">{{ formatHora(ativ.inicio) }}</span>
              <span class="prog-titulo">{{ ativ.titulo }}</span>
            </div>
            <span v-if="store.programacao.length > 4" class="text-muted" style="font-size:.78rem">+ {{ store.programacao.length - 4 }} atividades</span>
          </div>
          <div v-else class="empty-state" style="padding:.5rem">Nenhuma atividade</div>
        </SectionCard>

        <!-- 7. Transporte -->
        <SectionCard title="Transporte" icon="🚗" @edit="abrirSecao('transporte')">
          <InfoRow label="Veículos" :value="store.transporte.length" />
          <InfoRow label="Capacidade total" :value="`${store.capacidadeTransporte} assentos`" />
          <div v-if="store.capacidadeTransporte < store.totalPessoas && store.transporte.length > 0" class="alert alert-erro mt-2" style="font-size:.8rem">
            Faltam {{ store.totalPessoas - store.capacidadeTransporte }} assentos
          </div>
          <div v-for="v in store.viagensTransporte" :key="v.id" style="font-size:.82rem;padding:.15rem 0">
            {{ v.identificacao || v.tipo }}: {{ v.capacidade_pessoas }} assentos
            <span v-if="v.viagens" class="text-muted">({{ v.viagens }} viagem{{ v.viagens !== 1 ? 's' : '' }})</span>
          </div>
        </SectionCard>

        <!-- 8. Equipes -->
        <SectionCard title="Equipes" icon="🤝" @edit="abrirSecao('equipes')">
          <div v-for="eq in store.equipes" :key="eq.id" style="margin-bottom:.4rem">
            <div class="flex justify-between" style="font-size:.85rem">
              <strong>{{ eq.nome }}</strong>
              <span class="text-muted">{{ store.equipesMembros.filter(m=>m.equipe_id===eq.id).length }} membro(s)</span>
            </div>
          </div>
          <div v-if="store.equipes.length === 0" class="empty-state" style="padding:.5rem">Nenhuma equipe</div>
        </SectionCard>

        <!-- 9. Materiais -->
        <SectionCard title="Materiais" icon="🎒" @edit="abrirSecao('materiais')">
          <InfoRow label="Total de itens" :value="store.materiais.length" />
          <div v-for="m in store.materiais.slice(0, 5)" :key="m.id" class="flex justify-between" style="font-size:.82rem;padding:.15rem 0">
            <span>{{ m.nome }}</span>
            <span :class="`badge badge-${m.status}`">{{ labelStatus(m.status) }}</span>
          </div>
          <span v-if="store.materiais.length > 5" class="text-muted" style="font-size:.78rem">+ {{ store.materiais.length - 5 }} itens</span>
          <!-- Água automática -->
          <div class="flex justify-between mt-2" style="font-size:.82rem;padding:.15rem 0;border-top:1px solid var(--border);margin-top:.5rem">
            <span>💧 Água potável (calculada)</span>
            <span class="text-muted">{{ store.aguaLitros }} L</span>
          </div>
        </SectionCard>

        <!-- 10. Orçamento -->
        <SectionCard title="Orçamento" icon="💰" @edit="abrirSecao('orcamento')">
          <div class="fin-resumo">
            <div class="fin-item">
              <span class="text-success">↑ Receitas</span>
              <strong class="text-success">R$ {{ formatNum(store.resumoFinanceiro.receitas) }}</strong>
            </div>
            <div class="fin-item">
              <span class="text-danger">↓ Despesas</span>
              <strong class="text-danger">R$ {{ formatNum(store.resumoFinanceiro.despesas) }}</strong>
            </div>
            <div class="fin-item" :class="store.resumoFinanceiro.saldo >= 0 ? '' : 'fin-negativo'">
              <span :class="store.resumoFinanceiro.saldo >= 0 ? 'text-success' : 'text-danger'">=  Saldo</span>
              <strong :class="store.resumoFinanceiro.saldo >= 0 ? 'text-success' : 'text-danger'">R$ {{ formatNum(store.resumoFinanceiro.saldo) }}</strong>
            </div>
          </div>
          <p v-if="store.totalPessoas > 0" class="text-muted mt-2" style="font-size:.8rem">
            Custo por pessoa: R$ {{ formatNum(store.custoPorPessoa) }}
          </p>
        </SectionCard>

        <!-- 11. Riscos -->
        <SectionCard title="Riscos" icon="⚠️" @edit="abrirSecao('riscos')">
          <div v-for="r in store.riscos" :key="r.id" class="risco-item">
            <span class="risco-desc">{{ r.descricao }}</span>
            <span :class="`badge badge-${r.severidade}`">{{ r.severidade }}</span>
          </div>
          <div v-if="store.riscos.length === 0" class="empty-state" style="padding:.5rem">Nenhum risco cadastrado</div>
        </SectionCard>

        <!-- 12. Tarefas -->
        <SectionCard title="Tarefas / Plano de Ação" icon="✅" @edit="abrirSecao('tarefas')">
          <div class="tarefas-mini">
            <div v-for="status in ['pendente','em_andamento','concluida','bloqueada']" :key="status" class="tarefa-stat">
              <span class="tarefa-num">{{ store.tarefas.filter(t=>t.status===status).length }}</span>
              <span :class="`badge badge-${status}`">{{ labelStatusTarefa(status) }}</span>
            </div>
          </div>
          <div v-for="t in store.tarefas.filter(t=>t.status!=='concluida'&&t.status!=='cancelada').slice(0,3)" :key="t.id" style="font-size:.82rem;padding:.15rem 0">
            <span :class="`badge badge-${t.prioridade}`" style="font-size:.7rem">{{ t.prioridade }}</span>
            {{ t.o_que }}
          </div>
        </SectionCard>

        <!-- 13. Seções Personalizadas -->
        <template v-for="(campos, secao) in secoesCustomExtras" :key="secao">
          <SectionCard :title="secao" icon="🔧" @edit="abrirSecao('custom', secao)">
            <div v-for="cf in campos" :key="cf.id" class="flex justify-between" style="font-size:.85rem;padding:.2rem 0">
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

  <div v-else class="empty-state" style="min-height:100vh;display:flex;align-items:center;justify-content:center">
    Carregando...
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
.app-header { background: #fff; border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 50; }
.header-inner { max-width: 1200px; margin: 0 auto; padding: .65rem 1.5rem; display: flex; align-items: center; justify-content: space-between; }
.evento-banner { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #fff; padding: 1.5rem 0 0; }
.banner-inner { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem 1rem; display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.banner-inner h1 { font-size: 1.6rem; color: #fff; }
.banner-inner .text-muted { color: rgba(255,255,255,.7); }
.banner-inner p { color: rgba(255,255,255,.9); }
.banner-stats { display: flex; gap: .75rem; flex-wrap: wrap; }
.stat-pill { background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.25); border-radius: 10px; padding: .5rem .9rem; text-align: center; min-width: 80px; }
.stat-ok { background: rgba(22,163,74,.2); border-color: rgba(22,163,74,.4); }
.stat-warn { background: rgba(217,119,6,.2); border-color: rgba(217,119,6,.4); }
.stat-danger { background: rgba(220,38,38,.2); border-color: rgba(220,38,38,.4); }
.stat-val { display: block; font-size: 1.25rem; font-weight: 700; color: #fff; }
.stat-lbl { display: block; font-size: .7rem; color: rgba(255,255,255,.8); text-transform: uppercase; letter-spacing: .04em; }
.main-content { max-width: 1200px; margin: 0 auto; padding: 1.5rem; }
.alertas-section .alert { margin-bottom: .4rem; }
.dashboard-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1rem; }
@media (max-width: 768px) { .dashboard-grid { grid-template-columns: 1fr; } }
.fin-resumo { display: flex; flex-direction: column; gap: .3rem; }
.fin-item { display: flex; justify-content: space-between; padding: .3rem 0; border-bottom: 1px solid #f1f5f9; font-size: .88rem; }
.risco-item { display: flex; justify-content: space-between; align-items: center; padding: .25rem 0; font-size: .82rem; border-bottom: 1px solid #f8fafc; gap: .5rem; }
.risco-desc { flex: 1; }
.tarefas-mini { display: flex; gap: .5rem; flex-wrap: wrap; margin-bottom: .5rem; }
.tarefa-stat { display: flex; flex-direction: column; align-items: center; gap: .2rem; }
.tarefa-num { font-size: 1.1rem; font-weight: 700; }
.prog-mini { display: flex; flex-direction: column; gap: .2rem; margin-top: .5rem; }
.prog-item { display: flex; gap: .5rem; font-size: .82rem; }
.prog-hora { color: var(--primary); font-weight: 600; min-width: 45px; }
.prog-titulo { flex: 1; }
.pessoas-mini { display: flex; gap: 1rem; align-items: center; }
.big-num { font-size: 2rem; font-weight: 700; color: var(--primary); }
.pessoas-count { display: flex; flex-direction: column; align-items: center; }
.pessoas-breakdown { display: flex; flex-direction: column; gap: .2rem; font-size: .82rem; }
</style>
