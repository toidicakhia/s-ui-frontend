<template>
  <section class="form-section">
    <header
      v-if="title || description || icon || $slots.header || $slots.actions"
      class="form-section__header"
    >
      <span
        v-if="icon"
        class="form-section__icon"
      >
        <v-icon
          :icon="icon"
          size="16"
        />
      </span>
      <div class="form-section__heading">
        <h3
          v-if="title || $slots.header"
          class="form-section__title"
        >
          <slot name="header">
            {{ title }}
          </slot>
        </h3>
        <p
          v-if="description"
          class="form-section__description"
        >
          {{ description }}
        </p>
      </div>
      <div
        v-if="$slots.actions"
        class="form-section__actions"
      >
        <slot name="actions" />
      </div>
    </header>
    <slot />
  </section>
</template>

<script lang="ts" setup>
// A grouped block of related fields inside a dialog. The chrome lives in
// styles/ui.css so the same section can hold a form-grid, a row of switches or
// a custom list without this component knowing about field types.
defineProps<{
  title?: string
  description?: string
  icon?: string
}>()
</script>
