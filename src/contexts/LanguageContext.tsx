import { createContext, useContext, ReactNode, useEffect, useState, useCallback } from 'react'
import { Language, t as translate } from '@/lib/i18n'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, any>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const LANGUAGE_STORAGE_KEY = 'app-language'

function detectBrowserLanguage(): Language {
  const browserLang = navigator.language || navigator.languages?.[0]
  
  if (browserLang.startsWith('pt')) {
    return 'pt-BR'
  }
  
  if (browserLang.startsWith('es')) {
    return 'es-ES'
  }
  
  if (browserLang.startsWith('fr')) {
    return 'fr-FR'
  }
  
  if (browserLang.startsWith('de')) {
    return 'de-DE'
  }
  
  return 'en-US'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Tentar recuperar do localStorage no estado inicial
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
      if (stored && ['pt-BR', 'en-US', 'es-ES', 'fr-FR', 'de-DE'].includes(stored)) {
        return stored as Language
      }
    } catch {
      // localStorage não disponível
    }
    return detectBrowserLanguage()
  })

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
    } catch {
      // localStorage não disponível
    }
  }, [])

  const t = useCallback((key: string, params?: Record<string, any>) => {
    return translate(language, key, params)
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
