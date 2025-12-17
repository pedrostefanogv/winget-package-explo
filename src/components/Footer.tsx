import { GithubLogo, Database, Globe } from '@phosphor-icons/react'
import { useLanguage } from '@/contexts/LanguageContext'

// Data do build gerada em tempo de compilação pelo Vite
declare const __BUILD_DATE__: string
const BUILD_DATE = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : new Date().toISOString()

interface FooterProps {
  dataGenerated?: string
  packageCount?: number
}

export function Footer({ dataGenerated, packageCount }: FooterProps) {
  const { t } = useLanguage()
  
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  return (
    <footer className="border-t border-border bg-muted/30 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Sobre */}
        <div className="mb-6">
          <h3 className="font-semibold text-foreground mb-2">{t('footer.about')}</h3>
          <p className="text-sm text-muted-foreground max-w-2xl">
            {t('footer.description')}
          </p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Versão dos Dados */}
          <div className="flex items-center gap-2 text-sm">
            <Database size={16} className="text-primary" />
            <span className="text-muted-foreground">{t('footer.dataVersion')}:</span>
            <span className="font-medium text-foreground">
              {dataGenerated ? formatDate(dataGenerated) : 'N/A'}
            </span>
          </div>

          {/* Versão do Site */}
          <div className="flex items-center gap-2 text-sm">
            <Globe size={16} className="text-primary" />
            <span className="text-muted-foreground">{t('footer.siteVersion')}:</span>
            <span className="font-medium text-foreground">
              {formatDate(BUILD_DATE)}
            </span>
          </div>

          {/* Total de Pacotes */}
          {packageCount !== undefined && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{t('footer.totalPackages')}:</span>
              <span className="font-medium text-foreground">
                {packageCount.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Links */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-border">
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/pedrostefanogv/winget-package-explo"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <GithubLogo size={20} />
              <span>{t('footer.viewOnGithub')}</span>
            </a>
            <a
              href="https://github.com/microsoft/winget-pkgs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('footer.wingetPkgs')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
