<template>
  <v-dialog
    transition="dialog-bottom-transition"
    width="800"
  >
    <v-card class="rounded-lg">
      <v-card-title class="d-flex align-center">
        {{ $t('actions.' + title) + " " + $t('objects.outbound') }}
        <v-spacer />
        <DocLink
          section="outbound"
          :type="outbound.type"
        />
      </v-card-title>
      <v-divider />
      <v-card-text class="card-text--standard">
        <v-container class="pa-0">
          <v-tabs
            v-model="tab"
            density="compact"
            align-tabs="center"
          >
            <v-tab value="t1">
              {{ $t('client.basics') }}
            </v-tab>
            <v-tab value="t2">
              {{ $t('client.external') }}
            </v-tab>
          </v-tabs>
          <v-window
            v-model="tab"
            class="mt-2"
          >
            <v-window-item value="t1">
              <v-row>
                <v-col
                  cols="12"
                  sm="6"
                  md="4"
                >
                  <v-select
                    v-model="outbound.type"
                    hide-details
                    :label="$t('type')"
                    :items="Object.keys(outTypes).map((key,index) => ({title: key, value: Object.values(outTypes)[index]}))"
                    @update:model-value="changeType"
                  />
                </v-col>
                <v-col
                  cols="12"
                  sm="6"
                  md="4"
                >
                  <v-text-field
                    v-model="outbound.tag"
                    :label="$t('objects.tag')"
                    hide-details
                    :error="tagError.length > 0"
                  />
                </v-col>
              </v-row>
              <v-row v-if="tagError.length > 0">
                <v-col
                  cols="12"
                  class="text-error text-caption"
                >
                  {{ tagError }}
                </v-col>
              </v-row>
              <v-row v-if="!NoServer.includes(outbound.type) && !viaRealm">
                <v-col
                  cols="12"
                  sm="6"
                  md="4"
                >
                  <v-text-field
                    v-model="outbound.server"
                    :label="$t('out.addr')"
                    hide-details
                  />
                </v-col>
                <v-col
                  cols="12"
                  sm="6"
                  md="4"
                >
                  <v-text-field
                    v-model.number="outbound.server_port"
                    :label="$t('out.port')"
                    type="number"
                    min="0"
                    hide-details
                  />
                </v-col>
              </v-row>
              <Socks
                v-if="outbound.type == outTypes.SOCKS"
                :data="outbound"
              />
              <Http
                v-if="outbound.type == outTypes.HTTP"
                :data="outbound"
              />
              <Shadowsocks
                v-if="outbound.type == outTypes.Shadowsocks"
                direction="out"
                :data="outbound"
              />
              <Snell
                v-if="outbound.type == outTypes.Snell"
                direction="out"
                :data="outbound"
              />
              <Bridge
                v-if="outbound.type == outTypes.Bridge"
                direction="out"
                :data="outbound"
              />
              <Vmess
                v-if="outbound.type == outTypes.VMess"
                :data="outbound"
              />
              <Trojan
                v-if="outbound.type == outTypes.Trojan"
                :data="outbound"
              />
              <Hysteria
                v-if="outbound.type == outTypes.Hysteria"
                direction="out"
                :data="outbound"
              />
              <Naive
                v-if="outbound.type == outTypes.Naive"
                direction="out"
                :data="outbound"
              />
              <ShadowTls
                v-if="outbound.type == outTypes.ShadowTLS"
                :data="outbound"
              />
              <Vless
                v-if="outbound.type == outTypes.VLESS"
                :data="outbound"
              />
              <Tuic
                v-if="outbound.type == outTypes.TUIC"
                direction="out"
                :data="outbound"
              />
              <Hysteria2
                v-if="outbound.type == outTypes.Hysteria2"
                direction="out"
                :data="outbound"
              />
              <AnyTls
                v-if="outbound.type == outTypes.AnyTls"
                :data="outbound"
                direction="out"
              />
              <Tor
                v-if="outbound.type == outTypes.Tor"
                :data="outbound"
              />
              <Ssh
                v-if="outbound.type == outTypes.SSH"
                :data="outbound"
              />
              <Selector
                v-if="outbound.type == outTypes.Selector"
                :data="outbound"
                :tags="tags"
              />
              <UrlTest
                v-if="outbound.type == outTypes.URLTest"
                :data="outbound"
                :tags="tags"
              />

              <Transport
                v-if="Object.hasOwn(outbound,'transport')"
                :data="outbound"
              />
              <OutTLS
                v-if="Object.hasOwn(outbound,'tls')"
                :outbound="outbound"
              />
              <Multiplex
                v-if="Object.hasOwn(outbound,'multiplex')"
                direction="out"
                :data="outbound"
              />
              <Dial
                v-if="!NoDial.includes(outbound.type)"
                :dial="outbound"
              />
            </v-window-item>
            <v-window-item value="t2">
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="link"
                    :label="$t('client.external')"
                    hide-details
                  />
                </v-col>
                <v-col
                  cols="12"
                  class="text-center"
                >
                  <v-btn
                    variant="tonal"
                    :loading="loading"
                    @click="linkConvert"
                  >
                    {{ $t('submit') }}
                  </v-btn>
                </v-col>
              </v-row>
            </v-window-item>
          </v-window>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          color="primary"
          variant="outlined"
          @click="closeModal"
        >
          {{ $t('actions.close') }}
        </v-btn>
        <v-btn
          color="primary"
          variant="tonal"
          :loading="loading"
          :disabled="!validate"
          @click="saveChanges"
        >
          {{ $t('actions.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { PropType } from 'vue'
import { OutTypes, createOutbound, Outbound } from '@/types/outbounds'
import DocLink from '@/components/DocLink.vue'
import RandomUtil from '@/plugins/randomUtil'
import Dial from '@/components/Dial.vue'
import Multiplex from '@/components/Multiplex.vue'
import Transport from '@/components/Transport.vue'
import OutTLS from '@/components/tls/OutTLS.vue'
import Socks from '@/components/protocols/Socks.vue'
import Http from '@/components/protocols/Http.vue'
import Shadowsocks from '@/components/protocols/Shadowsocks.vue'
import Snell from '@/components/protocols/Snell.vue'
import Bridge from '@/components/protocols/Bridge.vue'
import Vmess from '@/components/protocols/Vmess.vue'
import Trojan from '@/components/protocols/Trojan.vue'
import Hysteria from '@/components/protocols/Hysteria.vue'
import Naive from '@/components/protocols/Naive.vue'
import ShadowTls from '@/components/protocols/OutShadowTls.vue'
import Vless from '@/components/protocols/Vless.vue'
import Tuic from '@/components/protocols/Tuic.vue'
import Hysteria2 from '@/components/protocols/Hysteria2.vue'
import Tor from '@/components/protocols/Tor.vue'
import Ssh from '@/components/protocols/Ssh.vue'
import Selector from '@/components/protocols/Selector.vue'
import UrlTest from '@/components/protocols/UrlTest.vue'
import HttpUtils from '@/plugins/httputil'
import AnyTls from '@/components/protocols/AnyTls.vue'
import { i18n } from '@/locales'
import Data from '@/store/modules/data'
export default {
  components: { DocLink, Dial, Multiplex, Transport, OutTLS,
    Socks, Http, Shadowsocks, Vmess, Trojan,
    Hysteria, Naive, ShadowTls, Vless, Tuic,
    Hysteria2, AnyTls, Tor, Ssh, Selector, UrlTest, Snell, Bridge },
  props: {
    visible: { type: Boolean, required: true },
    // A JSON string of the outbound being edited, empty when adding a new one.
    data: { type: String, default: '' },
    id: { type: Number, required: true },
    tags: { type: Array as PropType<string[]>, default: () => [] },
  },
  emits: ['close'],
  data() {
    return {
      outbound: createOutbound("direct",{ "tag": "" }),
      title: "add",
      tab: "t1",
      link: "",
      loading: false,
      outTypes: OutTypes,
      NoDial: [OutTypes.Selector, OutTypes.URLTest],
      NoServer: [OutTypes.Direct, OutTypes.Selector, OutTypes.URLTest, OutTypes.Tor],
    }
  },
  computed: {
    // A hysteria2 outbound on a realm finds the server there and names none.
    viaRealm(): boolean {
      return (this.outbound as { realm?: object }).realm != undefined
    },
    tagError(): string {
      const tag = this.outbound.tag?.trim() ?? ''
      if (tag.length == 0) return i18n.global.t('error.invalidData') + ": " + i18n.global.t('objects.tag')
      return ''
    },
    validate(): boolean {
      if (!this.outbound) return false
      if (this.tagError.length > 0) return false
      // Server-based types need a usable port; direct/selector/urltest/tor and
      // realm-based outbounds have no server_port field to validate.
      if (!this.NoServer.includes(this.outbound.type) && !this.viaRealm) {
        const port = Number(this.outbound.server_port)
        if (!Number.isInteger(port) || port < 1 || port > 65535) return false
      }
      return true
    },
  },
  watch: {
    visible(newValue) {
      if (newValue) {
        this.updateData(this.$props.id)
      }
    },
  },
  methods: {
    updateData(id: number) {
      if (id > 0) {
        const newData = JSON.parse(this.$props.data)
        this.outbound = createOutbound(newData.type, newData)
        this.title = "edit"
      }
      else {
        this.outbound = createOutbound("direct",{ tag: "direct-" + RandomUtil.randomSeq(3) })
        this.title = "add"
      }
      this.tab = "t1"
      this.link = ""
    },
    changeType() {
      // Tag change only in add outbound
      const tag = this.$props.id > 0 ? this.outbound.tag : this.outbound.type + "-" + RandomUtil.randomSeq(3)
      // Use previous data
      const prevConfig = { id: this.outbound.id, tag: tag, listen: this.outbound.listen, listen_port: this.outbound.listen_port }
      this.outbound = createOutbound(this.outbound.type, prevConfig)
    },
    closeModal() {
      this.updateData(0) // reset
      this.$emit('close')
    },
    async saveChanges() {
      if (!this.$props.visible) return
      // check duplicate tag
      const isDuplicatedTag = Data().checkTag("outbound",this.$props.id, this.outbound.tag)
      if (isDuplicatedTag) return

      // save data
      this.loading = true
      const success = await Data().save("outbounds", this.$props.id == 0 ? "new" : "edit", this.outbound)
      if (success) this.closeModal()
      this.loading = false
    },
    async linkConvert() {
      if (this.link.length>0){
        this.loading = true
        const msg = await HttpUtils.post<Outbound>('api/linkConvert', { link: this.link })
        this.loading = false
        if (msg.success) {
          this.outbound = msg.obj
          if (this.$props.id > 0) this.outbound.id = this.$props.id
          this.tab = "t1"
          this.link = ""
        }
      }
    }
  }
}
</script>