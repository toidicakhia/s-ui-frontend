<template>
  <v-dialog
    transition="dialog-bottom-transition"
    width="400"
  >
    <v-card
      id="qrcode-modal"
      class="rounded-lg"
      :loading="loading"
    >
      <v-card-title>
        <v-row>
          <v-col>{{ $t('qr.title') }}</v-col>
          <v-spacer />
          <v-col cols="auto">
            <v-icon
              :aria-label="$t('actions.close')"
              icon="mdi-close-box"
              @click="$emit('close')"
            />
          </v-col>
        </v-row>
      </v-card-title>
      <v-divider />
      <v-skeleton-loader
        v-if="loading"
        class="mx-auto border"
        width="80%"
        type="text, image, divider, text, image"
      />
      <v-card-text
        class="card-text--standard"
        :hidden="loading"
      >
        <v-tabs
          v-model="tab"
          density="compact"
          fixed-tabs
          align-tabs="center"
        >
          <v-tab value="sub">
            {{ $t('setting.sub') }}
          </v-tab>
          <v-tab value="link">
            {{ $t('client.links') }}
          </v-tab>
        </v-tabs>
        <v-window
          v-model="tab"
          class="mt-2"
        >
          <v-window-item value="sub">
            <v-row>
              <v-col class="text-center">
                <v-chip>{{ $t('setting.sub') }}</v-chip><br>
                <QrcodeVue
                  :value="clientSub"
                  :size="size"
                  :margin="1"
                  class="qr-code"
                  @click="copyToClipboard(clientSub)"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col class="text-center">
                <v-chip>{{ $t('setting.jsonSub') }}</v-chip><br>
                <QrcodeVue
                  :value="clientSub + '?format=json'"
                  :size="size"
                  :margin="1"
                  class="qr-code"
                  @click="copyToClipboard(clientSub + '?format=json')"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col class="text-center">
                <v-chip>{{ $t('setting.clashSub') }}</v-chip><br>
                <QrcodeVue
                  :value="clientSub + '?format=clash'"
                  :size="size"
                  :margin="1"
                  class="qr-code"
                  @click="copyToClipboard(clientSub + '?format=clash')"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col class="text-center">
                <v-chip>{{ $t('qr.singboxScanOnly') }}</v-chip><br>
                <v-select
                  v-if="singboxProfiles.length > 1"
                  v-model="singboxProfile"
                  class="mx-auto mt-2"
                  density="compact"
                  hide-details
                  :items="singboxProfiles"
                  :label="$t('qr.singboxProfile')"
                  style="max-width: 300px;"
                />
                <QrcodeVue
                  :value="singbox"
                  :size="size"
                  :margin="1"
                  class="qr-code--static"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col class="text-center">
                <v-chip>{{ $t('qr.happScanOnly') }}</v-chip><br>
                <QrcodeVue
                  :value="happ"
                  :size="size"
                  :margin="1"
                  class="qr-code--static"
                />
              </v-col>
            </v-row>
          </v-window-item>
          <v-window-item value="link">
            <v-row
              v-for="(l, index) in clientLinks"
              :key="index"
            >
              <v-col class="text-center">
                <v-chip>{{ l.remark?? $t('client.' + l.type) }}</v-chip><br>
                <QrcodeVue
                  :value="l.uri"
                  :size="size"
                  :margin="1"
                  class="qr-code"
                  @click="copyToClipboard(l.uri)"
                />
              </v-col>
            </v-row>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import QrcodeVue from 'qrcode.vue'
import Data from '@/store/modules/data'
import Clipboard from 'clipboard'
import { i18n } from '@/locales'
import { push } from 'notivue'
import { Client } from '@/types/clients'
import { Inbound } from '@/types/inbounds'

export default {
  components: { QrcodeVue },
  props: {
    id: { type: Number, required: true },
    visible: { type: Boolean, required: true },
  },
  emits: ['close'],
  data() {
    return {
      tab: "sub",
      client: <Client>{},
      inbounds: <Inbound[]>[],
      // 0 means the combined profile; any other value is an inbound id.
      singboxProfile: 0,
      loading: false,
      // Reactive so the QR size recomputes on resize/rotation. innerWidth itself
      // is not reactive, so keep a copy updated by a resize listener.
      windowWidth: window.innerWidth,
    }
  },
  computed: {
    clientSub() {
      return Data().subURI + this.client.name
    },
    singboxProfiles() {
      const profiles: { title: string; value: number }[] = []
      if (this.inbounds.length == 0) {
        return profiles
      }
      profiles.push({ title: i18n.global.t('qr.singboxAllInbounds'), value: 0 })
      for (const inbound of this.inbounds) {
        if (inbound.enable === false) continue
        profiles.push({ title: inbound.tag, value: inbound.id })
      }
      return profiles
    },
    singboxProfileName() {
      if (this.singboxProfile == 0) {
        return this.client.name
      }
      const inbound = this.inbounds.find(i => i.id == this.singboxProfile)
      return inbound ? this.client.name + ' - ' + inbound.tag : this.client.name
    },
    singbox() {
      let url = Data().subURI + this.client.name + "?format=json"
      if (this.singboxProfile > 0) {
        url += "&inbound=" + this.singboxProfile
      }
      return "sing-box://import-remote-profile?url=" +  encodeURIComponent(url) + "#" + encodeURIComponent(this.singboxProfileName)
    },
    // Happ takes the subscription URL as it is, unencoded, after happ://add/.
    happ() {
      return "happ://add/" + this.clientSub + "?format=happ"
    },
    clientLinks() {
      return this.client.links?? []
    },
    size() {
      if (this.windowWidth > 380) return 300
      if (this.windowWidth > 330) return 280
      return 250
    }
  },
  watch: {
    visible(v) {
      if (v) {
        this.tab = "sub"
        this.singboxProfile = 0
        this.load()
      }
    },
  },
  mounted() {
    window.addEventListener('resize', this.updateWindowWidth)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.updateWindowWidth)
  },
  methods: {
    updateWindowWidth() {
      this.windowWidth = window.innerWidth
    },
    async load() {
      this.loading = true
      const newData = await Data().loadClients(this.$props.id)
      this.client = newData
      // loadInbounds treats an empty list as "all inbounds", so a client with
      // none must not ask for its (empty) assignment.
      this.inbounds = newData.inbounds?.length
        ? await Data().loadInbounds(newData.inbounds)
        : []
      this.loading = false
    },
    copyToClipboard(txt:string) {
      const hiddenButton = document.createElement('button')
      hiddenButton.className = 'clipboard-btn'
      document.body.appendChild(hiddenButton)

      const clipboard = new Clipboard('.clipboard-btn', {
        text: () => txt,
        container: document.getElementById('qrcode-modal')?? undefined
      });

      clipboard.on('success', () => {
        clipboard.destroy()
        push.success({
          message: i18n.global.t('success') + ": " + i18n.global.t('copyToClipboard'),
          duration: 5000,
        })
      })

      clipboard.on('error', () => {
        clipboard.destroy()
        push.error({
          message: i18n.global.t('failed') + ": " + i18n.global.t('copyToClipboard'),
          duration: 5000,
        })
      })

      // Perform click on hidden button to trigger copy
      hiddenButton.click()
      document.body.removeChild(hiddenButton)
    }
  }
}
</script>