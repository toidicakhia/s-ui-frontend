<template>
  <v-container class="h-screen d-flex align-center justify-center">
    <v-row
      justify="center"
      align="center"
    >
      <v-col
        cols="12"
        sm="8"
        md="4"
      >
        <v-card>
          <v-card-title class="headline">
            {{ $t('login.title') }}
          </v-card-title>
          <v-card-text>
            <v-form
              ref="form"
              @submit.prevent="login"
            >
              <v-text-field
                v-model="username"
                :label="$t('login.username')"
                :rules="usernameRules"
                required
              />
              <v-text-field
                v-model="password"
                :label="$t('login.password')"
                :rules="passwordRules"
                type="password"
                required
              />
              <v-btn
                :loading="loading"
                type="submit"
                color="primary"
                block
                class="mt-2"
              >
                {{ $t('actions.submit') }}
              </v-btn>
            </v-form>
            <div class="d-flex align-center mt-2">
              <v-select
                v-model="$i18n.locale"
                :aria-label="$t('a11y.language')"
                density="compact"
                hide-details
                variant="solo"
                :items="languages"
                class="flex-grow-1"
                @update:model-value="changeLocale"
              />
              <v-menu>
                <template #activator="{ props }">
                  <v-btn
                    :aria-label="$t('a11y.theme')"
                    icon
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
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
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
