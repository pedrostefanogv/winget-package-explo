import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { MagnifyingGlass, X, FunnelSimple, CaretUpDown, Check, SquaresFour, List } from '@phosphor-icons/react'
import { LanguageSelector } from '@/components/LanguageSelector'
import { ThemeSelector } from '@/components/ThemeSelector'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'
import { memo } from 'react'

interface TagCount {
  name: string
  count: number
}

interface SearchHeaderProps {
  searchInput: string
  onSearchInputChange: (value: string) => void
  onClearSearch: () => void
  selectedTag: string | null
  onTagSelect: (tagName: string) => void
  onTagClear: () => void
  tagOpen: boolean
  onTagOpenChange: (open: boolean) => void
  tagsWithCount: TagCount[]
  totalTagCount: number
  viewMode: 'cards' | 'list'
  onViewModeChange: (mode: 'cards' | 'list') => void
}

export const SearchHeader = memo(function SearchHeader({
  searchInput,
  onSearchInputChange,
  onClearSearch,
  selectedTag,
  onTagSelect,
  onTagClear,
  tagOpen,
  onTagOpenChange,
  tagsWithCount,
  totalTagCount,
  viewMode,
  onViewModeChange,
}: SearchHeaderProps) {
  const { t } = useLanguage()

  return (
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
          <div className="flex items-center gap-2">
            <ThemeSelector />
            <LanguageSelector />
          </div>
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
              onChange={(e) => onSearchInputChange(e.target.value)}
              className="pl-10 pr-10 h-12 text-base"
            />
            {searchInput && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClearSearch}
                className="absolute right-1 top-1/2 -translate-y-1/2"
              >
                <X size={16} />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FunnelSimple size={16} />
              <span className="font-medium">{t('search.tags')}:</span>
            </div>

            <Popover open={tagOpen} onOpenChange={onTagOpenChange}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={tagOpen}
                  className="w-[280px] justify-between"
                >
                  {selectedTag
                    ? `${selectedTag} (${tagsWithCount.find(t => t.name === selectedTag)?.count || 0})`
                    : t('search.allTags')}
                  <CaretUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0">
                <Command>
                  <CommandInput placeholder={t('search.searchTag')} />
                  <CommandList>
                    <CommandEmpty>{t('search.noTagFound')}</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          onTagClear()
                          onTagOpenChange(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            !selectedTag ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {t('search.allTags')} ({totalTagCount.toLocaleString()})
                      </CommandItem>
                      {tagsWithCount.map((tag) => (
                        <CommandItem
                          key={tag.name}
                          value={tag.name}
                          onSelect={() => onTagSelect(tag.name)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedTag === tag.name ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {tag.name} ({tag.count})
                        </CommandItem>
                      ))}
                      {totalTagCount > tagsWithCount.length && (
                        <div className="px-2 py-2 text-xs text-muted-foreground border-t">
                          {t('search.showingTopTags', { shown: tagsWithCount.length, total: totalTagCount })}
                        </div>
                      )}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {selectedTag && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onTagClear}
                className="text-xs"
              >
                <X size={14} className="mr-1" />
                {t('search.clear')}
              </Button>
            )}

            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:inline">{t('viewMode.label')}:</span>
              <ToggleGroup
                type="single"
                value={viewMode}
                onValueChange={(value) => value && onViewModeChange(value as 'cards' | 'list')}
                className="border rounded-md"
              >
                <ToggleGroupItem value="cards" aria-label={t('viewMode.cards')} className="px-3">
                  <SquaresFour size={18} />
                </ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label={t('viewMode.list')} className="px-3">
                  <List size={18} />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})