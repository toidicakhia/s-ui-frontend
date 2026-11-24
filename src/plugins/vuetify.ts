/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles/main.css'

import colors from 'vuetify/util/colors'
import { fa, en, vi, zhHans, zhHant, ru } from 'vuetify/locale'

// Composables
import { createVuetify } from 'vuetify'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  defaults: {
    VRow: { density: 'compact' },
    // Outlined fields with a 48px control height read more clearly on the
    // light and dark surfaces than the old filled blocks, and leave room for
    // the floating label without eating into dense forms.
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
    },
    VCombobox: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
    },
    VAutocomplete: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
    },
    VTextarea: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
    },
    VFileInput: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
    },
  },
  theme: {
    defaultTheme: localStorage.getItem('theme') ?? 'system',
    themes: {
      light: {
        colors: {
          error: colors.red.accent2,
          background: colors.grey.lighten4,
        },
      },
      dark: {
        colors: {
          error: colors.red.accent2,
        },
      },
    },
  },
  locale: {
    locale: localStorage.getItem("locale") ?? 'en',
    fallback: 'en',
    messages: { en, fa, vi, zhHans, zhHant, ru },
    rtl: { fa: true },
  },
})
