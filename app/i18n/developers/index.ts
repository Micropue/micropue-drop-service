import en from './en'
import ja from './ja'
import ru from './ru'
import zh from './zh'

export const docsMessages = {
  en,
  zh,
  ru,
  ja
}

export type DocsLocale = keyof typeof docsMessages

export const docsLocaleOptions = [
  { code: 'en', label: 'English', htmlLang: 'en', ogLocale: 'en_US' },
  { code: 'zh', label: '中文', htmlLang: 'zh-CN', ogLocale: 'zh_CN' },
  { code: 'ru', label: 'Русский', htmlLang: 'ru', ogLocale: 'ru_RU' },
  { code: 'ja', label: '日本語', htmlLang: 'ja', ogLocale: 'ja_JP' }
] as const satisfies ReadonlyArray<{
  code: DocsLocale
  label: string
  htmlLang: string
  ogLocale: string
}>

export function isDocsLocale(value: unknown): value is DocsLocale {
  return typeof value === 'string' && value in docsMessages
}
