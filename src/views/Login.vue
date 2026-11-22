<template>
  <div class="login-page">
    <div class="login-page__glow login-page__glow--one" />
    <div class="login-page__glow login-page__glow--two" />

    <div class="login-shell">
      <v-img
        src="@/assets/logo.svg"
        alt="S-UI"
        class="login-logo"
        width="72"
        height="72"
      />

      <v-card
        class="login-card"
        rounded="xl"
        elevation="8"
      >
        <v-card-title class="login-card__title">
          {{ $t('login.title') }}
        </v-card-title>

        <v-card-text class="login-card__body">
          <v-form
            ref="form"
            @submit.prevent="login"
          >
            <v-text-field
              v-model="username"
              :label="$t('login.username')"
              :rules="usernameRules"
              prepend-inner-icon="mdi-account-outline"
              hide-details="auto"
              required
            />
            <v-text-field
              v-model="password"
              class="mt-3"
              :label="$t('login.password')"
              :rules="passwordRules"
              type="password"
              prepend-inner-icon="mdi-lock-outline"
              hide-details="auto"
              required
            />
            <v-btn
              :loading="loading"
              type="submit"
              color="primary"
              block
              size="large"
              rounded="lg"
              class="mt-5"
            >
              {{ $t('actions.submit') }}
            </v-btn>
          </v-form>
        </v-card-text>

        <v-divider />

        <div class="login-card__footer">
          <v-select
            v-model="$i18n.locale"
            :aria-label="$t('a11y.language')"
            density="compact"
            hide-details
            variant="plain"
            prepend-inner-icon="mdi-translate"
            :items="languages"
            class="login-locale"
            @update:model-value="changeLocale"
          />
          <v-spacer />
          <v-menu>
            <template #activator="{ props }">
              <v-btn
                :aria-label="$t('a11y.theme')"
                icon
                variant="text"
                v-bind="props"
              >
                <v-icon>mdi-theme-light-dark</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item
                v-for="th in themes"
                :key="th.value"
                :prepend-icon="th.icon"
                :active="isActiveTheme(th.value)"
                @click="changeTheme(th.value)"
              >
                <v-list-item-title>{{ $t(`theme.${th.value}`) }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </v-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue"
import type { VForm } from 'vuetify/components'
import { useLocale } from 'vuetify'
import { i18n, languages } from '@/locales'
import { useRouter } from 'vue-router'
import HttpUtil from '@/plugins/httputil'
import { setAuthenticated } from '@/plugins/auth'
import { useThemeSwitcher } from '@/composables/useThemeSwitcher'


const locale = useLocale()
const { themes, changeTheme, isActiveTheme } = useThemeSwitcher()

const form = ref<VForm | null>(null)
const username = ref('')
const usernameRules = [
  (value: string) => {
    if (value?.length > 0) return true
    return i18n.global.t('login.unRules')
  },
]

const password = ref('')
const passwordRules = [
  (value: string) => {
    if (value?.length > 0) return true
    return i18n.global.t('login.pwRules')
  },
]

const loading = ref(false)
const router = useRouter()

const login = async () => {
  if (!form.value) return
  const { valid } = await form.value.validate()
  if (!valid) return
  loading.value = true
  const response = await HttpUtil.post('api/login',{user: username.value, pass: password.value})
  if(response.success){
    setAuthenticated()
    setTimeout(() => {
      loading.value=false
      router.push('/')
    }, 500)
  } else {
    loading.value=false
  }
}
const changeLocale = (l: string | null) => {
  const value = l ?? 'en'
  // v-model="$i18n.locale" already switched vue-i18n; keep Vuetify in step.
  locale.current.value = value
  localStorage.setItem('locale', value)
  // locales/index.ts only sets the page language on load; reloading keeps
  // document.documentElement.lang and the derived locale constant in sync.
  window.location.reload()
}
</script>

<style scoped>
.login-page {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  padding: 32px 24px;
  overflow: hidden;
}

/* Soft colour washes keep the page from reading as an empty theme background
   without adding an image or a second surface behind the card. */
.login-page__glow {
  position: absolute;
  width: min(480px, 80vw);
  height: min(480px, 80vw);
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.55;
  pointer-events: none;
}

.login-page__glow--one {
  top: -180px;
  inset-inline-start: -140px;
  background: rgba(var(--v-theme-primary), 0.22);
}

.login-page__glow--two {
  bottom: -200px;
  inset-inline-end: -160px;
  background: rgba(var(--v-theme-info), 0.18);
}

.login-shell {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100%;
  max-width: 420px;
}

.login-logo {
  filter: drop-shadow(0 10px 24px rgba(0, 0, 0, 0.18));
}

.login-card {
  width: 100%;
  overflow: hidden;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
}

.login-card__title {
  padding: 28px 28px 6px;
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
  letter-spacing: 0.01em;
}

.login-card__body {
  padding: 10px 28px 26px;
}

.login-card__footer {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px 6px 18px;
}

.login-locale {
  flex: 0 1 170px;
  min-width: 0;
}

@media (max-width: 480px) {
  .login-page {
    padding: 20px 16px;
  }

  .login-shell {
    gap: 16px;
  }

  .login-logo {
    width: 60px !important;
    height: 60px !important;
  }

  .login-card__title {
    padding: 24px 20px 4px;
    font-size: 1.35rem;
  }

  .login-card__body {
    padding: 8px 20px 22px;
  }

  .login-card__footer {
    padding: 4px 10px 4px 14px;
  }
}
</style>
