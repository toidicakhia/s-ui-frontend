<template>
  <v-dialog
    v-model="open"
    class="app-dialog"
    :width="width"
    :max-width="maxWidth"
    :persistent="persistent"
    :transition="transition"
    :aria-labelledby="titleId"
    @after-enter="$emit('after-enter')"
  >
    <v-card
      class="app-dialog__card"
      :loading="loading"
    >
      <header class="app-dialog__header">
        <span
          v-if="icon"
          class="app-dialog__badge"
        >
          <v-icon
            :icon="icon"
            size="22"
          />
        </span>
        <div class="app-dialog__heading">
          <span
            v-if="eyebrow"
            class="app-dialog__eyebrow"
          >{{ eyebrow }}</span>
          <h2
            :id="titleId"
            class="app-dialog__title"
          >
            {{ title }}
          </h2>
          <p
            v-if="subtitle"
            class="app-dialog__subtitle"
          >
            {{ subtitle }}
          </p>
        </div>
        <div class="app-dialog__tools">
          <slot name="header-actions" />
          <v-btn
            class="app-dialog__close"
            :aria-label="$t('actions.close')"
            density="comfortable"
            icon="mdi-close"
            variant="text"
            @click="closeDialog"
          />
        </div>
      </header>
      <v-divider class="app-dialog__divider" />
      <v-card-text class="app-dialog__body card-text--standard">
        <slot />
      </v-card-text>
      <template v-if="$slots.actions">
        <v-divider class="app-dialog__divider" />
        <v-card-actions class="app-dialog__actions">
          <slot name="actions" />
        </v-card-actions>
      </template>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { computed, useId } from 'vue'

// Modals in this app grew up with a `visible` prop and a `close` event, while
// the parents also bind v-model. Accept both so a dialog can move to this
// shell without changing how its page opens or closes it.
const props = withDefaults(defineProps<{
  visible?: boolean
  // Null means "not bound"; a plain optional boolean would be cast to false
  // by Vue and hide a dialog that only passes `visible`.
  modelValue?: boolean | null
  title: string
  subtitle?: string
  eyebrow?: string
  icon?: string
  width?: string | number
  maxWidth?: string | number
  loading?: boolean
  persistent?: boolean
  transition?: string
}>(), {
  modelValue: null,
  subtitle: '',
  eyebrow: '',
  icon: '',
  width: 640,
  maxWidth: '',
  transition: 'dialog-bottom-transition',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
  (e: 'after-enter'): void
}>()

const titleId = useId()

const open = computed({
  get: () => props.modelValue ?? props.visible ?? false,
  set: (value: boolean) => {
    emit('update:modelValue', value)
    if (!value) emit('close')
  },
})

function closeDialog() {
  open.value = false
}
</script>
