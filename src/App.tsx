import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MagnifyingGlass, X, FunnelSimple, Warning, CloudArrowDown } from '@phosphor-icons/react'
import { PackageCard } from '@/components/PackageCard'
import { PackageDetail } from '@/components/PackageDetail'
import { EmptyState } from '@/components/EmptyState'
import { LanguageSelector } from '@/components/LanguageSelector'
import { WingetPackage } from '@/lib/types'
import { useWingetPackages } from '@/hooks/use-winget-packages'
import { Toaster } from 'sonner'
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext'

function AppContent() {
  const { t } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPackage, setSelectedPackage] = useState<WingetPackage | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  
  const { packages, isLoading, error, dataSource, retry } = useWingetPackages(100)

  const categories = useMemo(() => {
    const cats = new Set(packages.map(pkg => pkg.category).filter(Boolean))
    return Array.from(cats).sort()
  }, [packages])

  const filteredPackages = useMemo(() => {
    return packages.filter(pkg => {
      const matchesSearch = searchQuery === '' || 
        pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.publisher.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.description?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory = !selectedCategory || pkg.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [packages, searchQuery, selectedCategory])

  const clearSearch = () => {
    setSearchQuery('')
  }

  const toggleCategory = (category: string) => {
    setSelectedCategory(selectedCategory === category ? null : category)
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />
      
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-2" style={{ letterSpacing: '-0.02em' }}>
                {t('app.title')}
              </h1>
              <p className="text-muted-foreground">
                {t('app.subtitle')}
              </p>
            </div>
            <LanguageSelector />
          </div>

          <div className="space-y-4">
            <div className="relative">
              <MagnifyingGlass 
                size={20} 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <Input
                type="text"
                placeholder={t('search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-12 text-base"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearSearch}
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                >
                  <X size={16} />
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FunnelSimple size={16} />
                <span className="font-medium">{t('search.categories')}:</span>
              </div>
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  className="cursor-pointer transition-all hover:scale-105"
                  onClick={() => category && toggleCategory(category)}
                >
                  {category}
                </Badge>
              ))}
              {selectedCategory && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                  className="text-xs"
                >
                  {t('search.clear')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {error && dataSource === 'mock' && (
          <Alert className="mb-6 border-accent/50 bg-accent/5">
            <Warning size={20} className="text-accent" />
            <AlertDescription className="ml-2">
              {t('alerts.mockData')}
              <Button
                variant="link"
                size="sm"
                onClick={retry}
                className="ml-2 h-auto p-0 text-accent"
              >
                {t('alerts.retry')}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && dataSource === 'static' && (
          <Alert className="mb-6 border-primary/50 bg-primary/5">
            <CloudArrowDown size={20} className="text-primary" />
            <AlertDescription className="ml-2">
              {t('alerts.staticData')}
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && dataSource === 'api' && (
          <Alert className="mb-6 border-primary/50 bg-primary/5">
            <CloudArrowDown size={20} className="text-primary" />
            <AlertDescription className="ml-2">
              {t('alerts.apiData')}
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-4 text-sm text-muted-foreground">
          {isLoading ? (
            t('search.loading')
          ) : (
            t('search.resultsCount', { count: filteredPackages.length })
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-5 border border-border rounded-lg space-y-3">
                <div className="flex gap-4">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : filteredPackages.length === 0 ? (
          <EmptyState searchQuery={searchQuery} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPackages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                package={pkg}
                onClick={() => setSelectedPackage(pkg)}
              />
            ))}
          </div>
        )}
      </div>

      <Sheet open={!!selectedPackage} onOpenChange={() => setSelectedPackage(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0">
          {selectedPackage && (
            <PackageDetail
              package={selectedPackage}
              onClose={() => setSelectedPackage(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  )
}

export default App