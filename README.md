# ⛺ Organizador de Acampamentos e Eventos

App web para planejar e gerenciar acampamentos, retiros, encontros religiosos e eventos ao ar livre.

## Stack

- **Frontend:** Vue.js 3 (Composition API + `<script setup>`) + Vite
- **Estado:** Pinia
- **Roteamento:** Vue Router 4
- **Backend/Banco:** Supabase (PostgreSQL + Auth + RLS)
- **Estilos:** CSS puro (sem dependência de UI lib)

---

## Configuração do Supabase

### 1. Criar projeto no Supabase

Acesse [supabase.com](https://supabase.com) e crie um projeto gratuito.

### 2. Executar o schema SQL

No painel do Supabase → **SQL Editor**, cole e execute o conteúdo de `supabase_schema.sql`.

Isso cria:
- Todos os ENUMs (prob_nivel, impacto_nivel, severidade, etc.)
- Todas as 14 tabelas com PKs uuid, RLS e trigger `updated_at`
- Trigger automático de cálculo de **severidade** nos riscos (matriz Prob × Impacto)
- Policies de Row Level Security (cada usuário vê apenas seus dados)

### 3. Configurar variáveis de ambiente

Copie `.env.example` para `.env` e preencha com as chaves do seu projeto:

```bash
cp .env.example .env
```

No painel do Supabase → **Project Settings → API**:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Executar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173`

---

## Seed — Acampamento SV

Para popular o banco com dados de exemplo do Acampamento SV:

1. Faça login no app
2. Acesse `/seed`
3. Clique em **Executar Seed**

O seed cria todos os dados brutos e o sistema calcula automaticamente:
- **176 L de água** (4L × 22 pessoas × 2 dias)
- **9 galões de 20L**
- **Severidades dos riscos** (ex.: Afogamento → Prob: média × Impacto: crítico = **CRÍTICA**)
- **Lista de compras consolidada** com folga de 10%
- **Alertas** (saldo negativo, sem receita, coletes insuficientes, unidade de saúde não informada, etc.)
- **% de completude** do planejamento

---

## Estrutura do projeto

```
src/
  assets/
    main.css              # Estilos globais
  router/
    index.js              # Vue Router com guard de auth
  services/
    supabase.js           # Cliente Supabase
    calculations.js       # Todos os cálculos derivados (água, viagens, saldo, etc.)
    alerts.js             # Geração automática de alertas
    seed.js               # Dados de exemplo (Acampamento SV)
  stores/
    auth.js               # Autenticação (Pinia)
    eventos.js            # CRUD de eventos
    eventoData.js         # Dados completos do evento aberto + computed
  views/
    Login.vue             # Tela de login/cadastro
    EventList.vue         # Lista de eventos
    Dashboard.vue         # Dashboard principal com todos os cards
    Relatorios.vue        # 7 tipos de relatório (Executivo, Plano, Cronograma, etc.)
    SeedPage.vue          # Página para executar o seed
    sections/
      GeralSection.vue        # Informações gerais
      LocalSection.vue        # Local e estrutura física
      HospedagemSection.vue   # Hospedagem e barracas
      PessoasSection.vue      # Lista de pessoas (fonte única de contagem)
      AlimentacaoSection.vue  # Refeições, cardápio e lista de compras calculada
      ProgramacaoSection.vue  # Cronograma
      TransporteSection.vue   # Veículos e viagens calculadas
      EquipesSection.vue      # Equipes e membros
      MateriaisSection.vue    # Materiais e equipamentos
      OrcamentoSection.vue    # Receitas, despesas, saldo
      RiscosSection.vue       # Riscos com severidade calculada
      TarefasSection.vue      # Plano de ação
      CustomSection.vue       # Campos/seções personalizadas
  components/
    dashboard/
      SectionCard.vue     # Card de seção do dashboard
    common/
      InfoRow.vue         # Linha de informação label/valor
```

---

## Cálculos automáticos

| Cálculo | Fórmula |
|---|---|
| Total de pessoas | `COUNT(pessoas WHERE evento_id = X)` |
| Duração | `(data_fim - data_inicio) + 1` |
| Água (L) | `litros_por_pessoa_dia × total_pessoas × dias` |
| Água (galões) | `CEIL(litros / 20)` |
| Qtd. compras | `qtd_por_pessoa × total_pessoas × (1 + folga%)` |
| Viagens transporte | `CEIL(total_pessoas / capacidade)` |
| Saldo | `sum(receitas) - sum(despesas)` |
| Custo/pessoa | `total_despesas / total_pessoas` |
| Severidade risco | Matriz Prob × Impacto |
| % Planejamento | Campos obrigatórios preenchidos / total |

---

## Relatórios

Acessíveis em `/eventos/:id/relatorios` — com botão de impressão:

1. **Executivo** — resumo + indicadores + alertas críticos
2. **Plano de Ação** — o que / como / responsável / prazo / status
3. **Cronograma** — atividades por dia e horário
4. **Checklist** — por equipe/setor com caixas marcáveis
5. **Matriz de Responsabilidades** — pessoa × equipe × tarefas
6. **Controle Financeiro** — receitas, despesas, saldo, custo/pessoa
7. **Lista de Materiais/Compras** — quantidades calculadas consolidadas

---

## Alertas automáticos

O sistema verifica e exibe alertas coloridos (🔴 erro / 🟡 atenção):

- Capacidade de transporte < total de pessoas
- Coletes < total de pessoas (quando há risco de afogamento)
- Saldo negativo
- Despesas sem receita
- Risco alta/crítica sem plano de contingência
- Tarefa vencida não concluída
- Equipe essencial (Coordenação, Alimentação, Segurança) sem membros
- Campo faltando (ex.: unidade de saúde)
- Restrições alimentares cadastradas

---

## Build para produção

```bash
npm run build
```

Gera a pasta `dist/` pronta para deploy (Vercel, Netlify, etc.).
