import { createContext, useContext, ReactNode, useEffect, useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Language, t as translate } from '@/lib/i18n'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, any>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

function detectBrowserLanguage(): Language {
  const browserLang = navigator.language || navigator.languages?.[0]
  
  if (browserLang.startsWith('pt')) {
    return 'pt-BR'
  }
  
  return 'en-US'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [language, setLanguage] = useKV<Language>('app-language', 'pt-BR')
  
  useEffect(() => {
    const initLanguage = async () => {
      const storedLang = await window.spark.kv.get<Language>('app-language')
      
      if (!storedLang) {
        const detectedLang = detectBrowserLanguage()
        setLanguage(detectedLang)
      }
      
      setIsInitialized(true)
    }
    
    initLanguage()
  }, [setLanguage])

  const currentLanguage = language || 'pt-BR'

  const t = (key: string, params?: Record<string, any>) => {
    return translate(currentLanguage, key, params)
  }

  if (!isInitialized) {
    return null
  }

  return (
    <LanguageContext.Provider value={{ language: currentLanguage, setLanguage, t }}>
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
