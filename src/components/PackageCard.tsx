import { WingetPackage } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { useState } from 'react'

interface PackageCardProps {
  package: WingetPackage
  onClick: () => void
}

export function PackageCard({ package: pkg, onClick }: PackageCardProps) {
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
                  {pkg.name}
                </h3>
                <p className="text-sm font-mono text-muted-foreground truncate">
                  {pkg.id}
                </p>
              </div>
              <Badge variant="secondary" className="flex-shrink-0">
                v{pkg.version}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {pkg.description || 'No description available'}
            </p>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium">{pkg.publisher}</span>
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
