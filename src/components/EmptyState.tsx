import { MagnifyingGlass } from '@phosphor-icons/react'
import { useLanguage } from '@/contexts/LanguageContext'

interface EmptyStateProps {
  searchQuery: string
}

export function EmptyState({ searchQuery }: EmptyStateProps) {
  const { t } = useLanguage()
  
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
        <MagnifyingGlass size={40} className="text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        {t('emptyState.title')}
      </h3>
      <p className="text-muted-foreground max-w-md">
        {searchQuery
          ? t('emptyState.withSearch', { query: searchQuery })
          : t('emptyState.withoutSearch')}
      </p>
    </div>
  )
}
