<template>
  <v-dialog
    :model-value="visible"
    max-width="720"
    @update:model-value="close"
  >
    <v-card>
      <v-card-title>{{ $t('wgImport.title') }}</v-card-title>
      <v-card-subtitle class="card-subtitle--compact">
        {{ $t('wgImport.hint') }}
      </v-card-subtitle>
      <v-card-text class="card-text--standard">
        <v-textarea
          v-model="text"
          :label="$t('wgImport.text')"
          placeholder="[Interface]&#10;PrivateKey = ...&#10;Address = 10.0.0.2/32&#10;&#10;[Peer]&#10;PublicKey = ...&#10;Endpoint = vpn.example.com:51820&#10;AllowedIPs = 0.0.0.0/0"
          rows="12"
          auto-grow
          spellcheck="false"
          hide-details
        />
        <v-file-input
          class="mt-4"
          accept=".conf,text/plain"
          :label="$t('wgImport.file')"
          density="compact"
          hide-details
          @update:model-value="onFileChange"
        />
        <v-alert
          v-if="error.length > 0"
          class="mt-4"
          type="error"
          density="compact"
          variant="tonal"
        >
          {{ error }}
        </v-alert>
        <v-alert
          v-else-if="preview"
          class="mt-4"
          type="success"
          density="compact"
          variant="tonal"
        >
          {{ preview.tag }} · {{ preview.address ?? '-' }} · {{ preview.peers }} {{ $t('types.wg.peers').toLowerCase() }}
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="close">
          {{ $t('actions.close') }}
        </v-btn>
        <v-btn
          color="primary"
          :loading="loading"
          :disabled="text.trim().length == 0"
          @click="importConfig"
        >
          {{ $t('actions.import') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import HttpUtils from '@/plugins/httputil'
import { i18n } from '@/locales'
import { WgConfigError, parseWireguardConf } from '@/plugins/wgConfig'
import RandomUtil from '@/plugins/randomUtil'
import type { Endpoint } from '@/types/endpoints'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  imported: [endpoint: Endpoint]
  'update:visible': [value: boolean]
}>()

const text = ref('')
const loading = ref(false)
const error = ref('')
// One tag per dialog session: the preview and the imported endpoint must show
// the same tag, otherwise the user is told one thing and saved another.
const tag = ref('')

watch(() => props.visible, (visible) => {
  if (!visible) return
  text.value = ''
  error.value = ''
  tag.value = 'wireguard-' + RandomUtil.randomSeq(3)
})

const preview = computed(() => {
  try {
    const endpoint = parseWireguardConf(text.value, tag.value)
    return {
      tag: endpoint.tag,
      address: endpoint.address?.[0],
      peers: endpoint.peers?.length ?? 0,
    }
  } catch {
    return null
  }
})

function close() {
  error.value = ''
  emit('update:visible', false)
}

async function onFileChange(value: File[] | File | null) {
  const file = Array.isArray(value) ? value[0] : value
  if (!file) return
  error.value = ''
  text.value = await file.text()
}

function errorText(e: unknown): string {
  if (e instanceof WgConfigError) {
    return i18n.global.t('wgImport.err.' + e.code)
  }
  return i18n.global.t('wgImport.failed')
}

async function importConfig() {
  error.value = ''
  let endpoint: Endpoint
  try {
    endpoint = parseWireguardConf(text.value, tag.value)
  } catch (e) {
    error.value = errorText(e)
    return
  }

  loading.value = true
  try {
    // The form shows the public key derived from the imported private key;
    // deriving it here keeps the imported endpoint consistent with one added
    // through the panel form.
    const msg = await HttpUtils.get<string[]>('api/keypairs', { k: 'wireguard', o: endpoint.private_key })
    if (msg.success && msg.obj[0]) endpoint.ext.public_key = msg.obj[0]
  } finally {
    loading.value = false
  }

  // The parent decides whether to dismiss: it only closes on a successful
  // save, so a duplicate tag or a failed request keeps the dialog open.
  emit('imported', endpoint)
}
</script>
