<template>
  <AdminModal 
    v-model="editModal.visible"
    :visible="editModal.visible"
    :user="editModal.user"
    @close="closeEditModal"
    @save="saveEditModal"
  />
  <ChangeModal 
    v-model="changesModal.visible"
    :visible="changesModal.visible"
    :admins="users.map((u:any) => u.username)"
    :actor="changesModal.actor"
    @close="closeChangesModal"
  />
  <TokenModal 
    v-model="tokenModal.visible"
    :visible="tokenModal.visible"
    @close="closeTokenModal"
  />
  <v-row
    justify="center"
    align="center"
  >
    <v-col cols="auto">
      <v-btn
        color="primary"
        @click="showChangesModal('')"
      >
        {{ $t('admin.changes') }}
      </v-btn>
    </v-col>
    <v-col cols="auto">
      <v-btn
        color="primary"
        @click="showTokenModal()"
      >
        {{ $t('admin.api.token') }}
      </v-btn>
    </v-col>
  </v-row>
  <v-row>
    <v-col
      v-for="item in <any[]>users"
      :key="item.id"
      cols="12"
      sm="4"
      md="3"
      lg="2"
    >
      <v-card
        rounded="xl"
        elevation="5"
        min-width="200"
        :title="item.username"
      >
        <v-card-subtitle class="card-subtitle--compact">
          {{ $t('admin.lastLogin') }}
        </v-card-subtitle>
        <v-card-text>
          <v-row>
            <v-col>{{ $t('admin.date') }}</v-col>
            <v-col>
              {{ item.loginDate }}
            </v-col>
          </v-row>
          <v-row>
            <v-col>{{ $t('admin.time') }}</v-col>
            <v-col>
              {{ item.loginTime }}
            </v-col>
          </v-row>
          <v-row>
            <v-col>IP</v-col>
            <v-col>
              {{ item.ip }}
            </v-col>
          </v-row>
        </v-card-text>
        <v-divider />
        <v-card-actions class="card-actions--flush">
          <v-btn
            :aria-label="$t('actions.edit')"
            icon="mdi-account-edit"
            @click="showEditModal(item)"
          >
            <v-icon />
            <v-tooltip
              activator="parent"
              location="top"
              :text="$t('actions.edit')"
            />
          </v-btn>
          <v-btn
            :aria-label="$t('admin.changes')"
            class="action-btn--flush"
            icon="mdi-list-box-outline"
            @click="showChangesModal(item.username)"
          >
            <v-icon />
            <v-tooltip
              activator="parent"
              location="top"
              :text="$t('admin.changes')"
            />
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import AdminModal from '@/layouts/modals/Admin.vue'
import ChangeModal  from '@/layouts/modals/Changes.vue'
import TokenModal from '@/layouts/modals/Token.vue'
import { i18n } from '@/locales'
import HttpUtils from '@/plugins/httputil'
import { Ref, ref, inject, onMounted } from 'vue'

const loading:Ref = inject('loading')?? ref(false)

// One admin as api/users answers it. lastLogin is the date, the time and the
// address in a single space separated string.
interface AdminAccount {
  id: number
  username: string
  lastLogin: string
}

// A card on this page: the last login already split into its parts.
interface AdminRow {
  id: number
  username: string
  loginDate: string
  loginTime: string
  ip: string
}

// What the credential modal emits.
interface CredentialChange {
  id?: number
  oldPass: string
  newUsername: string
  newPass: string
}

const users = ref(<AdminRow[]>[])

onMounted(async () => {
  loading.value = true
  await loadData()
  loading.value = false
})

const loadData = async () => {
  loading.value = true
  try {
    const msg = await HttpUtils.get<AdminAccount[]>('api/users')
    if (msg.success) {
      // Rebuild the list instead of appending: loadData also runs after a
      // credential change, so pushing would duplicate every card.
      users.value = msg.obj.map(u => {
        const lastLogin = u.lastLogin.split(" ")
        const local = lastLogin.length > 2 ? localDateTime(lastLogin[0] + " " + lastLogin[1]) : null
        return {
          id: u.id,
          username: u.username,
          loginDate: local?.date ?? "- -",
          loginTime: local?.time ?? "- -",
          ip: lastLogin[2] ?? "-",
        }
      })
    }
  } finally {
    loading.value = false
  }
}

// Format date and time separately: a single toLocaleString() split on spaces
// leaves a trailing comma on the date and drops the AM/PM marker.
const localDateTime = (value: string): { date: string; time: string } | null => {
  const locale = i18n.global.locale.value.replace('zh', 'zh-')
  const date = new Date(Date.parse(value))
  if (Number.isNaN(date.getTime())) return null
  return { date: date.toLocaleDateString(locale), time: date.toLocaleTimeString(locale) }
}

const editModal = ref<{ visible: boolean, user: Partial<AdminRow> }>({
  visible: false,
  user: {},
})

const showEditModal = (user: AdminRow) => {
  editModal.value.user = user
  editModal.value.visible = true
}
const closeEditModal = () => {
  editModal.value.visible = false
  editModal.value.user = {}
}
const saveEditModal = async (data:CredentialChange) => {
  loading.value=true
  const response = await HttpUtils.post('api/changePass',data)
  if(response.success){
    // A username can be changed here, so refresh the cards before closing.
    await loadData()
    setTimeout(() => {
      loading.value=false
      editModal.value.visible = false
    }, 500)
  } else {
    loading.value=false
  }
}

const changesModal = ref({
  visible: false,
  actor: '',
})
const showChangesModal = (actor: string) => {
  changesModal.value.actor = actor
  changesModal.value.visible = true
}
const closeChangesModal = () => {
  changesModal.value.visible = false
  changesModal.value.actor = ''
}

const tokenModal = ref({
  visible: false,
})
const showTokenModal = () => {
  tokenModal.value.visible = true
}
const closeTokenModal = () => {
  tokenModal.value.visible = false
}
</script>