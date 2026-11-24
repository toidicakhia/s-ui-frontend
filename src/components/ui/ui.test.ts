import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as vuetifyComponents from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { i18n } from '@/locales'
import AppDialog from './AppDialog.vue'
import FormSection from './FormSection.vue'

const vuetify = createVuetify({ components: vuetifyComponents, directives })
const global = { plugins: [vuetify, i18n] }

afterEach(() => {
  document.body.innerHTML = ''
})

describe('AppDialog', () => {
  it('shows the title and header actions while open', async () => {
    const wrapper = mount(AppDialog, {
      props: { visible: true, title: 'Edit client' },
      slots: { 'header-actions': '<span class="header-action">docs</span>' },
      attachTo: document.body,
      global,
    })
    await wrapper.vm.$nextTick()
    await vi.waitFor(() => {
      expect(document.querySelector('.app-dialog__title')).not.toBeNull()
    })

    expect(document.querySelector('.app-dialog__title')?.textContent?.trim()).toBe('Edit client')
    expect(document.querySelector('.header-action')).not.toBeNull()

    wrapper.unmount()
  })

  it('closes through the header control and reports both bindings', async () => {
    const wrapper = mount(AppDialog, {
      props: { visible: true, modelValue: true, title: 'Edit client' },
      attachTo: document.body,
      global,
    })
    await wrapper.vm.$nextTick()
    await vi.waitFor(() => {
      expect(document.querySelector('.app-dialog__close')).not.toBeNull()
    })

    const close = document.querySelector('.app-dialog__close') as HTMLElement | null
    expect(close, 'the header rendered no close control').not.toBeNull()
    close?.dispatchEvent(new Event('click', { bubbles: true }))
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([false])
    expect(wrapper.emitted('close')).toHaveLength(1)

    wrapper.unmount()
  })

  it('only renders the footer when actions are supplied', async () => {
    const bare = mount(AppDialog, {
      props: { visible: true, title: 'Info' },
      attachTo: document.body,
      global,
    })
    await bare.vm.$nextTick()
    await vi.waitFor(() => {
      expect(document.querySelector('.app-dialog__title')).not.toBeNull()
    })
    expect(document.querySelector('.app-dialog__actions')).toBeNull()
    bare.unmount()

    const withActions = mount(AppDialog, {
      props: { visible: true, title: 'Edit' },
      slots: { actions: '<button class="save-action">Save</button>' },
      attachTo: document.body,
      global,
    })
    await withActions.vm.$nextTick()
    await vi.waitFor(() => {
      expect(document.querySelector('.app-dialog__actions .save-action')).not.toBeNull()
    })
    withActions.unmount()
  })
})

describe('FormSection', () => {
  it('renders a titled section around its fields', () => {
    const wrapper = mount(FormSection, {
      props: { title: 'Connection', description: 'How the client connects', icon: 'mdi-link-variant' },
      slots: { default: '<input class="field" />' },
      global,
    })

    expect(wrapper.find('.form-section__title').text()).toBe('Connection')
    expect(wrapper.find('.form-section__description').text()).toBe('How the client connects')
    expect(wrapper.find('.field').exists()).toBe(true)
  })
})
