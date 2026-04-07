import { create } from 'zustand'
import en from '@/locales/en'
import ko from '@/locales/ko'

const translations = { en, ko }

const useLanguage = create((set, get) => ({
  lang: 'ko',
  t: ko,
  setLang: (lang) => set({ lang, t: translations[lang] }),
  toggle: () => {
    const next = get().lang === 'ko' ? 'en' : 'ko'
    set({ lang: next, t: translations[next] })
  },
}))

export default useLanguage
