<template>
  <div class="login-page">
    <div class="login-card card">
      <div class="login-logo">⛺</div>
      <h1>Organizador de Eventos</h1>
      <p class="text-muted mb-4">Faça login para acessar seus eventos</p>

      <div v-if="erro" class="alert alert-erro mb-3">{{ erro }}</div>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="form-label">E-mail</label>
          <input v-model="email" type="email" class="form-control" placeholder="seu@email.com" required />
        </div>
        <div class="form-group">
          <label class="form-label">Senha</label>
          <input v-model="senha" type="password" class="form-control" placeholder="••••••••" required />
        </div>

        <button type="submit" class="btn btn-primary w-full" :disabled="loading">
          {{ loading ? 'Aguarde...' : (modo === 'login' ? 'Entrar' : 'Criar conta') }}
        </button>
      </form>

      <p class="mt-3 text-center text-muted" style="font-size:.85rem">
        {{ modo === 'login' ? 'Não tem conta?' : 'Já tem conta?' }}
        <button class="btn btn-ghost btn-sm" @click="toggleModo">
          {{ modo === 'login' ? 'Criar conta' : 'Fazer login' }}
        </button>
      </p>
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
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}
.login-card {
  width: 100%;
  max-width: 420px;
  padding: 2.5rem 2rem;
  text-align: center;
}
.login-logo { font-size: 3rem; margin-bottom: .5rem; }
</style>
