import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { MagnifyingGlass, X, FunnelSimple } from '@phosphor-icons/react'
import { PackageCard } from '@/components/PackageCard'
import { PackageDetail } from '@/components/PackageDetail'
import { EmptyState } from '@/components/EmptyState'
import { mockPackages } from '@/lib/mockData'
import { WingetPackage } from '@/lib/types'
import { Toaster } from 'sonner'

function App() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPackage, setSelectedPackage] = useState<WingetPackage | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isLoading] = useState(false)

  const categories = useMemo(() => {
    const cats = new Set(mockPackages.map(pkg => pkg.category).filter(Boolean))
    return Array.from(cats).sort()
  }, [])

  const filteredPackages = useMemo(() => {
    return mockPackages.filter(pkg => {
      const matchesSearch = searchQuery === '' || 
        pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.publisher.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.description?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory = !selectedCategory || pkg.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [searchQuery, selectedCategory])

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
          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-2" style={{ letterSpacing: '-0.02em' }}>
              Winget Package Explorer
            </h1>
            <p className="text-muted-foreground">
              Search and explore Windows Package Manager applications
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <MagnifyingGlass 
                size={20} 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <Input
                type="text"
                placeholder="Search packages by name, ID, or publisher..."
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
                <span className="font-medium">Categories:</span>
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
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-4 text-sm text-muted-foreground">
          {isLoading ? (
            'Loading packages...'
          ) : (
            `${filteredPackages.length} package${filteredPackages.length !== 1 ? 's' : ''} found`
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

export default App