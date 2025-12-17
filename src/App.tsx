import { useState, useMemo, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MagnifyingGlass, X, FunnelSimple, Warning, CloudArrowDown, Package } from '@phosphor-icons/react'
import { PackageCard } from '@/components/PackageCard'
import { PackageDetail } from '@/components/PackageDetail'
import { EmptyState } from '@/components/EmptyState'
import { LanguageSelector } from '@/components/LanguageSelector'
import { Footer } from '@/components/Footer'
import { WingetPackage } from '@/lib/types'
import { useWingetPackages } from '@/hooks/use-winget-packages'
import { Toaster } from 'sonner'
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext'

const HOME_PACKAGES_LIMIT = 20
const DEBOUNCE_DELAY = 300 // ms

function AppContent() {
  const { t } = useLanguage()
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPackage, setSelectedPackage] = useState<WingetPackage | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  
  const { packages, isLoading, error, dataSource, dataGenerated, retry } = useWingetPackages(100)

  // Debounce para pesquisa
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput)
    }, DEBOUNCE_DELAY)
    
    return () => clearTimeout(timer)
  }, [searchInput])

  // Categorias com contagem de pacotes, ordenadas por quantidade
  const categoriesWithCount = useMemo(() => {
    const catMap = new Map<string, number>()
    packages.forEach(pkg => {
      if (pkg.category) {
        catMap.set(pkg.category, (catMap.get(pkg.category) || 0) + 1)
      }
    })
    return Array.from(catMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count) // Ordenar por quantidade (maior primeiro)
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

  // Pacotes a exibir (limitado na home, todos quando buscando)
  const displayedPackages = useMemo(() => {
    const isSearching = searchQuery !== '' || selectedCategory !== null
    if (isSearching) return filteredPackages
    return filteredPackages.slice(0, HOME_PACKAGES_LIMIT)
  }, [filteredPackages, searchQuery, selectedCategory])

  const isShowingLimited = searchQuery === '' && selectedCategory === null && filteredPackages.length > HOME_PACKAGES_LIMIT

  const clearSearch = () => {
    setSearchInput('')
    setSearchQuery('')
  }

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value === 'all' ? null : value)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 pr-10 h-12 text-base"
              />
              {searchInput && (
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

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FunnelSimple size={16} />
                <span className="font-medium">{t('search.categories')}:</span>
              </div>
              
              <Select value={selectedCategory || 'all'} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder={t('search.allCategories')} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">{t('search.allCategories')} ({categoriesWithCount.length})</SelectItem>
                  {categoriesWithCount.map((category) => (
                    <SelectItem key={category.name} value={category.name}>
                      {category.name} ({category.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedCategory && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                  className="text-xs"
                >
                  <X size={14} className="mr-1" />
                  {t('search.clear')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1">
        {/* Total de pacotes catalogados */}
        {!isLoading && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
            <Package size={20} className="text-primary" />
            <span className="text-sm">
              <span className="font-semibold text-foreground">{packages.length.toLocaleString()}</span>
              <span className="text-muted-foreground"> {t('search.totalCataloged')}</span>
            </span>
          </div>
        )}

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
          ) : isShowingLimited ? (
            t('search.showingLimited', { showing: HOME_PACKAGES_LIMIT, total: filteredPackages.length })
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
            {displayedPackages.map((pkg) => (
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

      <Footer 
        dataGenerated={dataGenerated || undefined} 
        packageCount={packages.length} 
      />
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