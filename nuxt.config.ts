import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

// 黑/白单色主题：primary 映射到中性色阶
// light：近黑按钮 + 白字；dark：白按钮 + 黑字

// https://nuxt.com/docs/api/configuration/nuxt-config

const Noir = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{zinc.50}',
      100: '{zinc.100}',
      200: '{zinc.200}',
      300: '{zinc.300}',
      400: '{zinc.400}',
      500: '{zinc.500}',
      600: '{zinc.600}',
      700: '{zinc.700}',
      800: '{zinc.800}',
      900: '{zinc.900}',
      950: '{zinc.950}'
    },

    colorScheme: {
      light: {
        primary: {
          color: '{zinc.950}',
          inverseColor: '#ffffff',
          hoverColor: '{zinc.900}',
          activeColor: '{zinc.800}'
        }
      },

      dark: {
        primary: {
          color: '{zinc.50}',
          inverseColor: '{zinc.950}',
          hoverColor: '{zinc.100}',
          activeColor: '{zinc.200}'
        }
      }
    }
  },

  // Aura 默认是红/蓝/绿/黄四色渐变圈，改为灰阶
  components: {
    progressspinner: {
      colorScheme: {
        light: {
          root: {
            colorOne: '{zinc.300}',
            colorTwo: '{zinc.500}',
            colorThree: '{zinc.700}',
            colorFour: '{zinc.900}'
          }
        },
        dark: {
          root: {
            colorOne: '{zinc.700}',
            colorTwo: '{zinc.500}',
            colorThree: '{zinc.300}',
            colorFour: '{zinc.100}'
          }
        }
      }
    }
  }
})

const siteUrl = (process.env.NUXT_PUBLIC_SITE_URL || 'https://drop.micropue.com.cn').replace(/\/+$/, '')

export default defineNuxtConfig({
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'DROP hosts static HTML, CSS and JS projects for free.' },
        { name: 'robots', content: 'index, follow' },
        { name: 'author', content: 'MICROPUE' },
        { name: 'application-name', content: 'DROP' },
        { name: 'theme-color', content: '#ffffff', media: '(prefers-color-scheme: light)' },
        { name: 'theme-color', content: '#18181b', media: '(prefers-color-scheme: dark)' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'DROP' },
        { property: 'og:locale', content: 'en_US' },
        { property: 'og:title', content: 'DROP — Free Static Site Hosting' },
        { property: 'og:description', content: 'DROP hosts static HTML, CSS and JS projects for free.' },
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: 'DROP — Free Static Site Hosting' },
        { name: 'twitter:description', content: 'DROP hosts static HTML, CSS and JS projects for free.' }
      ]
    }
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.scss'],
  modules: ['@primevue/nuxt-module'],
  primevue: {
    options: {
      ripple: false,
      theme: {
        preset: Noir
      }
    }
  },
  runtimeConfig: {
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://drop.micropue.com.cn'
    }
  },
  devServer: {
    port: 3678
  }
})
