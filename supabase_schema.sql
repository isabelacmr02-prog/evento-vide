-- ============================================================
-- SCHEMA COMPLETO — App Organizador de Eventos
-- Execute no SQL Editor do Supabase
-- ============================================================

-- ENUMs
create type prob_nivel     as enum ('baixa','media','alta');
create type impacto_nivel  as enum ('baixo','medio','alto','critico');
create type severidade     as enum ('baixa','media','alta','critica');
create type status_tarefa  as enum ('pendente','em_andamento','concluida','bloqueada','cancelada');
create type prioridade     as enum ('baixa','media','alta','urgente');
create type tipo_financeiro as enum ('receita','despesa');
create type status_financeiro as enum ('previsto','confirmado','pago_recebido');
create type tipo_refeicao  as enum ('cafe_manha','almoco','lanche','jantar','ceia','outro');
create type tipo_transporte as enum ('carro','van','onibus','barco','outro');
create type status_material as enum ('a_providenciar','reservado','confirmado','no_local');
create type papel_pessoa   as enum ('participante','organizador','voluntario','convidado');

-- Função updated_at genérica
create or replace function trigger_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================
-- TABELA: eventos
-- ============================================================
create table eventos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users,
  nome text not null,
  objetivo text,
  data_inicio date not null,
  data_fim date not null,
  publico_alvo text,
  participantes_estimados int default 0,
  observacoes text,
  litros_agua_pessoa_dia numeric default 4,
  folga_alimentacao_pct  numeric default 10,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint eventos_datas_check check (data_fim >= data_inicio)
);

create trigger set_eventos_updated_at before update on eventos
  for each row execute function trigger_set_updated_at();

alter table eventos enable row level security;
create policy "owner full access eventos" on eventos
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ============================================================
-- TABELA: pessoas
-- ============================================================
create table pessoas (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventos on delete cascade,
  owner_id uuid not null references auth.users,
  nome text not null,
  papel papel_pessoa not null default 'participante',
  telefone text,
  contato_emergencia text,
  restricoes_alimentares text,
  leva_barraca boolean default false,
  observacoes text,
  created_at timestamptz default now()
);

alter table pessoas enable row level security;
create policy "owner full access pessoas" on pessoas
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ============================================================
-- TABELA: locais
-- ============================================================
create table locais (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null unique references eventos on delete cascade,
  owner_id uuid not null references auth.users,
  nome_local text,
  endereco text,
  distancia_km numeric,
  tem_banheiro boolean,
  qtd_banheiros int,
  tem_cozinha boolean,
  tem_energia boolean,
  fonte_energia text,
  tem_agua_potavel boolean,
  tem_estacionamento boolean,
  acessibilidade text,
  area_coberta text,
  unidade_saude_proxima text,
  contato_saude text,
  pontos_de_risco text,
  custo_diaria numeric,
  observacoes text
);

alter table locais enable row level security;
create policy "owner full access locais" on locais
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ============================================================
-- TABELA: hospedagem
-- ============================================================
create table hospedagem (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null unique references eventos on delete cascade,
  owner_id uuid not null references auth.users,
  modelo text,
  barracas_disponiveis int,
  colchoes int,
  redes int,
  cobertores int,
  observacoes text
);

alter table hospedagem enable row level security;
create policy "owner full access hospedagem" on hospedagem
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ============================================================
-- TABELA: refeicoes
-- ============================================================
create table refeicoes (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventos on delete cascade,
  owner_id uuid not null references auth.users,
  data date not null,
  tipo tipo_refeicao not null,
  descricao text,
  created_at timestamptz default now()
);

alter table refeicoes enable row level security;
create policy "owner full access refeicoes" on refeicoes
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ============================================================
-- TABELA: cardapio_itens
-- ============================================================
create table cardapio_itens (
  id uuid primary key default gen_random_uuid(),
  refeicao_id uuid not null references refeicoes on delete cascade,
  owner_id uuid not null references auth.users,
  nome text not null,
  qtd_por_pessoa numeric,
  unidade text,
  observacoes text
);

alter table cardapio_itens enable row level security;
create policy "owner full access cardapio_itens" on cardapio_itens
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ============================================================
-- TABELA: equipes (antes de programacao por FK)
-- ============================================================
create table equipes (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventos on delete cascade,
  owner_id uuid not null references auth.users,
  nome text not null,
  descricao text
);

alter table equipes enable row level security;
create policy "owner full access equipes" on equipes
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ============================================================
-- TABELA: programacao
-- ============================================================
create table programacao (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventos on delete cascade,
  owner_id uuid not null references auth.users,
  inicio timestamptz not null,
  fim timestamptz,
  titulo text not null,
  tipo text,
  local text,
  equipe_responsavel_id uuid references equipes,
  observacoes text
);

alter table programacao enable row level security;
create policy "owner full access programacao" on programacao
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ============================================================
-- TABELA: transporte
-- ============================================================
create table transporte (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventos on delete cascade,
  owner_id uuid not null references auth.users,
  tipo tipo_transporte not null,
  identificacao text,
  capacidade_pessoas int,
  capacidade_bagagem text,
  motorista_piloto text,
  habilitado boolean,
  rota text,
  horario text,
  custo_estimado numeric,
  observacoes text
);

alter table transporte enable row level security;
create policy "owner full access transporte" on transporte
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ============================================================
-- TABELA: equipe_membros
-- ============================================================
create table equipe_membros (
  id uuid primary key default gen_random_uuid(),
  equipe_id uuid not null references equipes on delete cascade,
  pessoa_id uuid not null references pessoas on delete cascade,
  owner_id uuid not null references auth.users,
  responsabilidade text,
  unique (equipe_id, pessoa_id)
);

alter table equipe_membros enable row level security;
create policy "owner full access equipe_membros" on equipe_membros
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ============================================================
-- TABELA: materiais
-- ============================================================
create table materiais (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventos on delete cascade,
  owner_id uuid not null references auth.users,
  nome text not null,
  categoria text,
  qtd_necessaria numeric,
  qtd_disponivel numeric default 0,
  unidade text,
  origem text,
  custo_estimado numeric,
  status status_material default 'a_providenciar',
  observacoes text
);

alter table materiais enable row level security;
create policy "owner full access materiais" on materiais
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ============================================================
-- TABELA: financeiro
-- ============================================================
create table financeiro (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventos on delete cascade,
  owner_id uuid not null references auth.users,
  tipo tipo_financeiro not null,
  categoria text,
  descricao text,
  valor numeric not null default 0,
  status status_financeiro default 'previsto',
  observacoes text
);

alter table financeiro enable row level security;
create policy "owner full access financeiro" on financeiro
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ============================================================
-- TABELA: riscos
-- ============================================================
create table riscos (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventos on delete cascade,
  owner_id uuid not null references auth.users,
  descricao text not null,
  categoria text,
  probabilidade prob_nivel not null,
  impacto impacto_nivel not null,
  severidade severidade,
  medidas_preventivas text,
  plano_contingencia text,
  responsavel_id uuid references pessoas,
  observacoes text
);

-- Trigger para calcular severidade automaticamente
create or replace function calc_severidade()
returns trigger as $$
begin
  new.severidade := case
    when new.probabilidade = 'baixa' and new.impacto = 'baixo'    then 'baixa'::severidade
    when new.probabilidade = 'baixa' and new.impacto = 'medio'    then 'baixa'::severidade
    when new.probabilidade = 'baixa' and new.impacto = 'alto'     then 'media'::severidade
    when new.probabilidade = 'baixa' and new.impacto = 'critico'  then 'alta'::severidade
    when new.probabilidade = 'media' and new.impacto = 'baixo'    then 'baixa'::severidade
    when new.probabilidade = 'media' and new.impacto = 'medio'    then 'media'::severidade
    when new.probabilidade = 'media' and new.impacto = 'alto'     then 'alta'::severidade
    when new.probabilidade = 'media' and new.impacto = 'critico'  then 'critica'::severidade
    when new.probabilidade = 'alta'  and new.impacto = 'baixo'    then 'media'::severidade
    when new.probabilidade = 'alta'  and new.impacto = 'medio'    then 'alta'::severidade
    when new.probabilidade = 'alta'  and new.impacto = 'alto'     then 'critica'::severidade
    when new.probabilidade = 'alta'  and new.impacto = 'critico'  then 'critica'::severidade
    else 'media'::severidade
  end;
  return new;
end;
$$ language plpgsql;

create trigger set_severidade before insert or update on riscos
  for each row execute function calc_severidade();

alter table riscos enable row level security;
create policy "owner full access riscos" on riscos
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ============================================================
-- TABELA: tarefas
-- ============================================================
create table tarefas (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventos on delete cascade,
  owner_id uuid not null references auth.users,
  o_que text not null,
  como text,
  responsavel_id uuid references pessoas,
  equipe_id uuid references equipes,
  prazo date,
  prioridade prioridade default 'media',
  status status_tarefa default 'pendente',
  depende_de uuid references tarefas,
  observacoes text,
  created_at timestamptz default now()
);

alter table tarefas enable row level security;
create policy "owner full access tarefas" on tarefas
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ============================================================
-- TABELA: custom_fields
-- ============================================================
create table custom_fields (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventos on delete cascade,
  owner_id uuid not null references auth.users,
  secao text not null,
  rotulo text not null,
  tipo_campo text not null,
  valor text,
  ordem int default 0
);

alter table custom_fields enable row level security;
create policy "owner full access custom_fields" on custom_fields
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
