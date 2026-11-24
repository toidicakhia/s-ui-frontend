<template>
  <AppDialog
    :visible="visible"
    :title="$t('admin.changeCred') + ' ' + user.username"
    icon="mdi-shield-account-outline"
    :width="440"
    @close="closeModal"
  >
    <div class="form-stack">
      <v-text-field
        v-model="newData.oldPass"
        :label="$t('admin.oldPass')"
        :rules="passwordRules"
        prepend-inner-icon="mdi-lock-outline"
        type="password"
        autocomplete="current-password"
        hide-details="auto"
        required
      />
      <v-text-field
        v-model="newData.newUsername"
        :label="$t('admin.newUname')"
        :rules="usernameRules"
        prepend-inner-icon="mdi-account-outline"
        autocomplete="username"
        hide-details="auto"
        required
      />
      <v-text-field
        v-model="newData.newPass"
        :label="$t('admin.newPass')"
        :rules="passwordRules"
        prepend-inner-icon="mdi-lock-reset"
        type="password"
        autocomplete="new-password"
        hide-details="auto"
        required
      />
    </div>
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
        :disabled="!canSave"
        @click="saveChanges"
      >
        {{ $t('actions.save') }}
      </v-btn>
    </template>
  </AppDialog>
</template>

<script lang="ts">
import AppDialog from '@/components/ui/AppDialog.vue'
import { i18n } from '@/locales'
import type { PropType } from 'vue'

// The parent hands over a whole admin row; only these two are read here.
interface AdminUser {
  id?: number
  username?: string
}

export default {
  components: { AppDialog },
  props: {
    visible: { type: Boolean, required: true },
    user: { type: Object as PropType<AdminUser>, required: true },
  },
  emits: ['close', 'save'],
  data() {
    return {
      newData: {
        id: <number | undefined>0,
        oldPass: "",
        newUsername: "",
        newPass: ""
      },
      usernameRules: [
        (value: string) => {
          if (value?.length > 0) return true
          return i18n.global.t('login.unRules')
        },
      ],
      passwordRules: [
        (value: string) => {
          if (value?.length > 0) return true
          return i18n.global.t('login.pwRules')
        },
      ]
    }
  },
  computed: {
    canSave(): boolean {
      return this.newData.oldPass != '' && this.newData.newUsername != '' && this.newData.newPass != ''
    },
  },
  watch: {
    visible(newValue) {
      if (newValue) {
        this.resetData()
      }
    },
  },
  methods: {
    resetData() {
      this.newData.id = this.$props.user.id
      this.newData.oldPass = ""
      this.newData.newUsername = ""
      this.newData.newPass = ""
    },
    closeModal() {
      this.resetData() // reset
      this.$emit('close')
    },
    saveChanges() {
      if (!this.canSave) return
      this.$emit('save', this.newData)
    },
  },
}
</script>
