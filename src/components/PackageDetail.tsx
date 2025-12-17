import { WingetPackage } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Copy, Check, Globe, Download, X, Package } from '@phosphor-icons/react'
import { useState } from 'react'
import { toast } from 'sonner'

interface PackageDetailProps {
  package: WingetPackage
  onClose: () => void
}

export function PackageDetail({ package: pkg, onClose }: PackageDetailProps) {
  const [copied, setCopied] = useState(false)
  const [imageError, setImageError] = useState(false)
  const showIcon = pkg.icon && !imageError

  const copyCommand = () => {
    navigator.clipboard.writeText(pkg.installCommand)
    setCopied(true)
    toast.success('Install command copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="p-6 border-b border-border">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center overflow-hidden">
            {showIcon ? (
              <img 
                src={pkg.icon} 
                alt={`${pkg.name} icon`}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <Package size={32} weight="duotone" className="text-primary" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-semibold text-foreground mb-1 break-words">
              {pkg.name}
            </h2>
            <p className="text-sm font-mono text-muted-foreground break-all">
              {pkg.id}
            </p>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="flex-shrink-0"
          >
            <X size={20} />
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">v{pkg.version}</Badge>
          {pkg.category && <Badge variant="outline">{pkg.category}</Badge>}
          {pkg.license && <Badge variant="outline">{pkg.license}</Badge>}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-2">
              Publisher
            </h3>
            <p className="text-base text-foreground">{pkg.publisher}</p>
          </div>

          {pkg.description && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-2">
                  Description
                </h3>
                <p className="text-base text-foreground leading-relaxed">
                  {pkg.description}
                </p>
              </div>
            </>
          )}

          {pkg.homepage && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-2">
                  Homepage
                </h3>
                <a
                  href={pkg.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-accent hover:underline"
                >
                  <Globe size={16} />
                  <span className="break-all">{pkg.homepage}</span>
                </a>
              </div>
            </>
          )}

          {pkg.tags && pkg.tags.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-3">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {pkg.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />
          <div>
            <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-3">
              Install Command
            </h3>
            <div className="code-block flex items-center justify-between gap-3">
              <code className="flex-1 break-all">{pkg.installCommand}</code>
              <Button
                size="sm"
                variant="ghost"
                onClick={copyCommand}
                className="flex-shrink-0"
              >
                {copied ? (
                  <Check size={16} className="text-accent" />
                ) : (
                  <Copy size={16} />
                )}
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="p-6 border-t border-border">
        <Button
          className="w-full"
          size="lg"
          onClick={copyCommand}
        >
          <Download size={20} className="mr-2" />
          Copy Install Command
        </Button>
      </div>
    </div>
  )
}
