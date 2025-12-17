export const translations = {
  'pt-BR': {
    app: {
      title: 'Explorador de Pacotes Winget',
      subtitle: 'Pesquise e explore aplicativos do Gerenciador de Pacotes do Windows',
    },
    search: {
      placeholder: 'Pesquisar pacotes por nome, ID ou editor...',
      categories: 'Categorias',
      clear: 'Limpar',
      resultsCount: '{{count}} pacote encontrado',
      resultsCount_plural: '{{count}} pacotes encontrados',
      loading: 'Carregando pacotes...',
    },
    packageCard: {
      noDescription: 'Sem descrição disponível',
      version: 'v{{version}}',
    },
    packageDetail: {
      publisher: 'Editor',
      description: 'Descrição',
      homepage: 'Site',
      tags: 'Tags',
      installCommand: 'Comando de Instalação',
      copyCommand: 'Copiar Comando de Instalação',
      license: 'Licença',
    },
    emptyState: {
      title: 'Nenhum pacote encontrado',
      withSearch: 'Nenhum pacote corresponde a "{{query}}". Tente um termo diferente ou limpe seus filtros.',
      withoutSearch: 'Comece pesquisando por nome de pacote, ID ou editor.',
    },
    alerts: {
      mockData: 'Não foi possível conectar à API do GitHub. Exibindo dados de exemplo.',
      staticData: 'Exibindo dados de pacotes pré-processados - atualizados semanalmente',
      apiData: 'Conectado à API do GitHub - exibindo dados ao vivo de microsoft/winget-pkgs',
      retry: 'Tentar novamente',
      copied: 'Comando de instalação copiado para a área de transferência',
    },
    language: {
      label: 'Idioma',
      'pt-BR': 'Português (Brasil)',
      'en-US': 'English (USA)',
    },
  },
  'en-US': {
    app: {
      title: 'Winget Package Explorer',
      subtitle: 'Search and explore Windows Package Manager applications',
    },
    search: {
      placeholder: 'Search packages by name, ID, or publisher...',
      categories: 'Categories',
      clear: 'Clear',
      resultsCount: '{{count}} package found',
      resultsCount_plural: '{{count}} packages found',
      loading: 'Loading packages...',
    },
    packageCard: {
      noDescription: 'No description available',
      version: 'v{{version}}',
    },
    packageDetail: {
      publisher: 'Publisher',
      description: 'Description',
      homepage: 'Homepage',
      tags: 'Tags',
      installCommand: 'Install Command',
      copyCommand: 'Copy Install Command',
      license: 'License',
    },
    emptyState: {
      title: 'No packages found',
      withSearch: 'No packages match "{{query}}". Try a different search term or clear your filters.',
      withoutSearch: 'Start by searching for a package name, ID, or publisher.',
    },
    alerts: {
      mockData: 'Unable to connect to GitHub API. Showing sample data.',
      staticData: 'Showing pre-processed package data - updated weekly',
      apiData: 'Connected to GitHub API - showing live data from microsoft/winget-pkgs',
      retry: 'Retry',
      copied: 'Install command copied to clipboard',
    },
    language: {
      label: 'Language',
      'pt-BR': 'Português (Brasil)',
      'en-US': 'English (USA)',
    },
  },
} as const

export type Language = keyof typeof translations
export type TranslationKeys = typeof translations['pt-BR']

function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((acc, part) => acc?.[part], obj) || path
}

export function interpolate(text: string, params: Record<string, any>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => params[key]?.toString() || '')
}

export function t(language: Language, key: string, params?: Record<string, any>): string {
  const translation = getNestedValue(translations[language], key)
  
  if (params?.count !== undefined) {
    const pluralKey = params.count === 1 ? key : `${key}_plural`
    const pluralTranslation = getNestedValue(translations[language], pluralKey)
    if (pluralTranslation && pluralTranslation !== pluralKey) {
      return interpolate(pluralTranslation, params)
    }
  }
  
  return params ? interpolate(translation, params) : translation
}
