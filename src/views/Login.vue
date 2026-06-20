<template>
  <div class="login-page">
    <!-- Painel esquerdo — branding -->
    <div class="login-brand">
      <div class="brand-bg-circle brand-circle-1"></div>
      <div class="brand-bg-circle brand-circle-2"></div>
      <div class="brand-content">
        <div class="brand-icon">⛺</div>
        <h1 class="brand-title">Organizador<br/>de Eventos</h1>
        <p class="brand-desc">Planeje acampamentos, retiros e encontros com facilidade e eficiência.</p>
        <div class="brand-features">
          <div class="feature-item"><span class="feat-check">✓</span> Gestão completa de participantes</div>
          <div class="feature-item"><span class="feat-check">✓</span> Controle financeiro e orçamento</div>
          <div class="feature-item"><span class="feat-check">✓</span> Relatórios automáticos</div>
          <div class="feature-item"><span class="feat-check">✓</span> Cálculos de água, transporte e alimentação</div>
        </div>
      </div>
    </div>

    <!-- Painel direito — formulário -->
    <div class="login-form-side">
      <div class="login-form-wrap">
        <div class="login-form-header">
          <div class="login-form-icon">⛺</div>
          <h2>{{ modo === 'login' ? 'Entrar na conta' : 'Criar conta' }}</h2>
          <p class="text-muted">{{ modo === 'login' ? 'Bem-vindo de volta!' : 'Comece a organizar seus eventos agora' }}</p>
        </div>

        <div v-if="erro" class="alert alert-erro mb-3">{{ erro }}</div>

        <form @submit.prevent="handleSubmit" class="login-form">
          <div class="form-group">
            <label class="form-label">E-mail</label>
            <input v-model="email" type="email" class="form-control" placeholder="seu@email.com" required />
          </div>
          <div class="form-group">
            <label class="form-label">Senha</label>
            <div style="position:relative">
              <input v-model="senha" :type="mostrarSenha ? 'text' : 'password'" class="form-control" placeholder="••••••••" required style="padding-right:2.75rem" />
              <button type="button" class="senha-toggle" @click="mostrarSenha = !mostrarSenha" :title="mostrarSenha ? 'Ocultar' : 'Mostrar'">
                {{ mostrarSenha ? '🙈' : '👁' }}
              </button>
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-lg w-full" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            {{ loading ? 'Aguarde...' : (modo === 'login' ? 'Entrar' : 'Criar conta') }}
          </button>
        </form>

        <div class="login-switch">
          <span>{{ modo === 'login' ? 'Não tem conta?' : 'Já tem conta?' }}</span>
          <button class="switch-link" @click="toggleModo">
            {{ modo === 'login' ? 'Criar conta' : 'Fazer login' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const email = ref('')
const senha = ref('')
const loading = ref(false)
const erro = ref('')
const modo = ref('login')
const mostrarSenha = ref(false)

function toggleModo() {
  modo.value = modo.value === 'login' ? 'signup' : 'login'
  erro.value = ''
}

async function handleSubmit() {
  erro.value = ''
  loading.value = true
  try {
    if (modo.value === 'login') {
      await auth.login(email.value, senha.value)
    } else {
      await auth.signup(email.value, senha.value)
    }
    router.push('/eventos')
  } catch (e) {
    erro.value = e.message || 'Erro ao autenticar'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
}
@media (max-width: 860px) {
  .login-page { grid-template-columns: 1fr; }
  .login-brand { display: none; }
}

/* ── Painel Esquerdo ── */
.login-brand {
  background: linear-gradient(145deg, #4f46e5 0%, #7c3aed 55%, #9333ea 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 2.5rem;
  position: relative;
  overflow: hidden;
}
.brand-bg-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255,255,255,.07);
}
.brand-circle-1 { width: 420px; height: 420px; top: -120px; right: -140px; }
.brand-circle-2 { width: 280px; height: 280px; bottom: -80px; left: -80px; }

.brand-content {
  position: relative;
  z-index: 1;
  color: #fff;
  max-width: 380px;
}
.brand-icon {
  font-size: 3.5rem;
  margin-bottom: 1.5rem;
  display: block;
  filter: drop-shadow(0 4px 12px rgba(0,0,0,.2));
}
.brand-title {
  font-size: 2.6rem;
  font-weight: 800;
  color: #fff;
  line-height: 1.1;
  margin-bottom: 1rem;
  letter-spacing: -.04em;
}
.brand-desc {
  font-size: 1rem;
  color: rgba(255,255,255,.78);
  margin-bottom: 2rem;
  line-height: 1.65;
}
.brand-features {
  display: flex;
  flex-direction: column;
  gap: .7rem;
}
.feature-item {
  display: flex;
  align-items: center;
  gap: .65rem;
  font-size: .9rem;
  color: rgba(255,255,255,.88);
  font-weight: 500;
}
.feat-check {
  width: 22px;
  height: 22px;
  background: rgba(255,255,255,.2);
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: .75rem;
  font-weight: 700;
  flex-shrink: 0;
}

/* ── Painel Direito ── */
.login-form-side {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2.5rem 2rem;
  background: #fff;
}
.login-form-wrap {
  width: 100%;
  max-width: 390px;
}
.login-form-header {
  margin-bottom: 2rem;
  text-align: center;
}
.login-form-icon {
  font-size: 2.5rem;
  margin-bottom: .75rem;
  display: block;
}
.login-form-header h2 {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text);
  margin-bottom: .35rem;
  letter-spacing: -.02em;
}
.login-form-header p {
  font-size: .9rem;
}

.login-form { margin-bottom: 1rem; }

.login-switch {
  margin-top: 1.5rem;
  text-align: center;
  font-size: .875rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .35rem;
}
.switch-link {
  background: none;
  border: none;
  color: var(--primary);
  font-weight: 700;
  cursor: pointer;
  font-size: .875rem;
  text-decoration: underline;
  text-underline-offset: 2px;
  padding: 0;
  transition: color .15s;
}
.switch-link:hover { color: var(--primary-hover); }

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin .6s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

.login-form-wrap { animation: fadeInUp .4s .1s ease both; }

.senha-toggle {
  position: absolute;
  right: .6rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: .25rem;
  line-height: 1;
  z-index: 2;
  opacity: .6;
  transition: opacity .15s;
}
.senha-toggle:hover { opacity: 1; }
</style>
