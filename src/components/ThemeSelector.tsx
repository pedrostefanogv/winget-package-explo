import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme, Theme } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { Sun, Moon, Monitor } from '@phosphor-icons/react'

const themes: { value: Theme; labelKey: string; icon: typeof Sun }[] = [
  { value: 'system', labelKey: 'theme.system', icon: Monitor },
  { value: 'light', labelKey: 'theme.light', icon: Sun },
  { value: 'dark', labelKey: 'theme.dark', icon: Moon },
]

export function ThemeSelector() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { t } = useLanguage()

  const currentTheme = themes.find((th) => th.value === theme)
  const CurrentIcon = resolvedTheme === 'dark' ? Moon : Sun

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <CurrentIcon size={16} weight="duotone" />
          <span className="hidden md:inline">{t(currentTheme?.labelKey || 'theme.system')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map((th) => {
          const Icon = th.icon
          return (
            <DropdownMenuItem
              key={th.value}
              onClick={() => setTheme(th.value)}
              className="gap-2 cursor-pointer"
            >
              <Icon size={16} weight="duotone" />
              <span>{t(th.labelKey)}</span>
              {theme === th.value && <span className="ml-auto text-primary">✓</span>}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
