import { WingetPackage } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { HighlightText } from '@/components/HighlightText'

interface PackageCardProps {
  package: WingetPackage
  searchQuery?: string
  onClick: () => void
}

export function PackageCard({ package: pkg, searchQuery = '', onClick }: PackageCardProps) {
  const { t } = useLanguage()
  const [imageError, setImageError] = useState(false)
  const showIcon = pkg.icon && !imageError

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="package-card p-5 cursor-pointer border-border hover:shadow-lg"
        onClick={onClick}
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center overflow-hidden">
            {showIcon ? (
              <img 
                src={pkg.icon} 
                alt={`${pkg.name} icon`}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <Package size={24} weight="duotone" className="text-primary" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-lg text-foreground truncate">
                  <HighlightText text={pkg.name} query={searchQuery} />
                </h3>
                <p className="text-sm font-mono text-muted-foreground truncate">
                  <HighlightText text={pkg.id} query={searchQuery} />
                </p>
              </div>
              <Badge variant="secondary" className="flex-shrink-0">
                {t('packageCard.version', { version: pkg.version })}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              <HighlightText 
                text={pkg.description || t('packageCard.noDescription')} 
                query={searchQuery} 
              />
            </p>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium">
                <HighlightText text={pkg.publisher} query={searchQuery} />
              </span>
              {pkg.category && (
                <>
                  <span>•</span>
                  <span>{pkg.category}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
