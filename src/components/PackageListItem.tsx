import { WingetPackage } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Package } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { HighlightText } from '@/components/HighlightText'

interface PackageListItemProps {
  package: WingetPackage
  searchQuery?: string
  onClick: () => void
}

export function PackageListItem({ package: pkg, searchQuery = '', onClick }: PackageListItemProps) {
  const { t } = useLanguage()
  const [imageError, setImageError] = useState(false)
  const showIcon = pkg.icon && !imageError

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className="flex items-center gap-4 p-4 cursor-pointer border border-border rounded-lg hover:bg-muted/50 hover:shadow-md transition-all"
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      >
        <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center overflow-hidden">
          {showIcon ? (
            <img
              src={pkg.icon}
              alt={`${pkg.name} icon`}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <Package size={20} weight="duotone" className="text-primary" />
          )}
        </div>

        <div className="flex-1 min-w-0 flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground truncate">
                <HighlightText text={pkg.name} query={searchQuery} />
              </h3>
              <span className="text-sm font-mono text-muted-foreground truncate hidden sm:inline">
                <HighlightText text={pkg.id} query={searchQuery} />
              </span>
            </div>
            <p className="text-sm text-muted-foreground truncate">
              <HighlightText
                text={pkg.description || t('packageCard.noDescription')}
                query={searchQuery}
              />
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-xs text-muted-foreground hidden md:inline">
              <HighlightText text={pkg.publisher} query={searchQuery} />
            </span>
            <Badge variant="secondary" className="flex-shrink-0">
              {t('packageCard.version', { version: pkg.version })}
            </Badge>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
