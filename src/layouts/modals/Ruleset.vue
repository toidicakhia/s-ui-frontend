<template>
  <AppDialog
    :visible="visible"
    :title="$t('actions.' + title) + ' ' + $t('objects.ruleset')"
    icon="mdi-file-tree-outline"
    :width="760"
    @close="closeModal"
  >
    <template #header-actions>
      <DocLink section="ruleset" />
    </template>

    <FormSection
      :title="$t('objects.ruleset')"
      icon="mdi-tag-outline"
    >
      <div class="form-grid">
        <v-select
          v-model="rule_set.type"
          hide-details
          :label="$t('type')"
          :items="[{title: $t('ruleset.local'), value: 'local'},{ title: $t('ruleset.remote'), value: 'remote'}]"
          @update:model-value="updateType($event)"
        />
        <v-text-field
          v-model="rule_set.tag"
          :label="$t('objects.tag')"
          hide-details
        />
        <v-select
          v-model="rule_set.format"
          hide-details
          :label="$t('ruleset.format')"
          :items="['source', 'binary']"
        />
      </div>
    </FormSection>

    <FormSection
      :title="rule_set.type == 'remote' ? $t('ruleset.remote') : $t('ruleset.local')"
      icon="mdi-link-variant"
    >
      <div class="form-grid">
        <v-text-field
          v-if="rule_set.type == 'local'"
          v-model="rule_set.path"
          class="form-grid__full"
          :label="$t('transport.path')"
          hide-details
        />
        <template v-else>
          <v-text-field
            v-model="rule_set.url"
            class="form-grid__full"
            label="URL"
            hide-details
          />
          <!-- Download over a shared client, or over a single outbound. The
               two are alternatives, so choosing one clears the other. -->
          <v-select
            v-model="http_client"
            hide-details
            :label="$t('basic.httpClient.title')"
            :items="httpClients"
            :no-data-text="$t('basic.httpClient.none')"
            clearable
          />
          <v-select
            v-model="download_detour"
            hide-details
            :label="$t('objects.outbound')"
            :items="outTags"
            clearable
          />
          <v-text-field
            v-model.number="update_intervals"
            :suffix="$t('date.d')"
            type="number"
            min="0"
            :label="$t('ruleset.interval')"
            hide-details
          />
        </template>
      </div>
    </FormSection>

    <template #actions>
      <v-btn
        variant="text"
        @click="closeModal"
      >
        {{ $t('actions.close') }}
      </v-btn>
      <v-btn
        color="primary"
        variant="flat"
        :loading="loading"
        :disabled="!validate"
        @click="saveChanges"
      >
        {{ $t('actions.save') }}
      </v-btn>
    </template>
  </AppDialog>
</template>

<script lang="ts">
import AppDialog from '@/components/ui/AppDialog.vue'
import FormSection from '@/components/ui/FormSection.vue'
import RandomUtil from '@/plugins/randomUtil'
import { ruleset } from '@/types/rules'
import DocLink from '@/components/DocLink.vue'
import { downloadHttpClient, httpClientTags, refDetour, refTag } from '@/plugins/httpClient'
import Data from '@/store/modules/data'
import { i18n } from '@/locales'
import { push } from 'notivue'
import type { PropType } from 'vue'
export default {
  components: { AppDialog, FormSection, DocLink },
  props: {
    visible: { type: Boolean, required: true },
    data: { type: String, required: true },
    index: { type: Number, required: true },
    outTags: { type: Array as PropType<string[]>, required: true },
  },
  emits: ['close', 'save'],
  data() {
    return {
      title: "add",
      loading: false,
      rule_set: <ruleset>{},
    }
  },
  computed: {
    // The route's rulesets, minus the one being edited. A tag is how rules
    // reference a set, so a second one with the same tag would be ambiguous.
    takenTags(): string[] {
      const sets = Data().config.route?.rule_set ?? []
      return sets.filter((_, i) => i != this.$props.index).map(s => s.tag)
    },
    validate(): boolean {
      const tag = this.rule_set.tag ?? ''
      if (tag.trim().length == 0) return false
      return !this.takenTags.includes(tag)
    },
    httpClients(): string[] {
      return httpClientTags()
    },
    // Naming a shared client replaces any inline options, since http_client
    // holds one or the other.
    http_client: {
      get() { return refTag(this.rule_set.http_client) },
      set(v: string | undefined) {
        if (v) this.rule_set.http_client = v
        else delete this.rule_set.http_client
      }
    },
    // The inline form, carrying just the outbound to download over. An empty
    // choice drops http_client entirely rather than leaving an empty transport.
    download_detour: {
      get() { return refDetour(this.rule_set.http_client) },
      set(v: string | undefined) {
        const httpClient = v ? downloadHttpClient(v) : undefined
        if (httpClient) this.rule_set.http_client = httpClient
        else delete this.rule_set.http_client
      }
    },
    update_intervals: {
      get() { return this.rule_set.update_interval != undefined ? parseInt(this.rule_set.update_interval.replace('d','')) : 0 },
      set(v:number) { this.rule_set.update_interval = v>0 ?  v + 'd' : undefined }
    },
  },
  watch: {
    visible(newValue) {
      if (newValue) {
        this.updateData()
      }
    },
  },
  methods: {
    updateData() {
      if (this.$props.index != -1) {
        this.title = "edit"
        this.rule_set = <ruleset>JSON.parse(this.$props.data)
      }
      else {
        this.title = "add"
        this.rule_set = <ruleset>{type: 'local', tag: "rs-" + RandomUtil.randomSeq(3), format: 'binary'}
      }
    },
    updateType(t:string) {
      if (t == 'local') {
        delete this.rule_set.url
        delete this.rule_set.http_client
        delete this.rule_set.update_interval
      } else {
        delete this.rule_set.path
      }
    },
    closeModal() {
      this.$emit('close')
    },
    saveChanges() {
      if (!this.$props.visible) return
      // check duplicate tag
      if (this.takenTags.includes(this.rule_set.tag)) {
        push.error({ message: i18n.global.t('error.dplData') + ': ' + i18n.global.t('objects.tag') })
        return
      }
      this.loading = true
      this.$emit('save', this.rule_set)
      this.loading = false
    }
  },
}
</script>
