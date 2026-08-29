import { useState, useEffect, useCallback, useRef } from 'react'
import { WingetPackage } from '@/lib/types'
import { fetchPackageDataWithMeta } from '@/lib/staticDataApi'
import { fetchWingetPackages } from '@/lib/wingetApi'
import { mockPackages } from '@/lib/mockData'
import { toast } from 'sonner'
import { useLanguage } from '@/contexts/LanguageContext'

interface UseWingetPackagesResult {
  packages: WingetPackage[]
  isLoading: boolean
  error: string | null
  dataSource: 'static' | 'api' | 'mock'
  dataGenerated: string | null
  retry: () => Promise<void>
}

export function useWingetPackages(limit: number = 100): UseWingetPackagesResult {
  const [packages, setPackages] = useState<WingetPackage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<'static' | 'api' | 'mock'>('mock')
  const [dataGenerated, setDataGenerated] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const { t } = useLanguage()

  const loadPackages = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await fetchPackageDataWithMeta()
      if (!mountedRef.current) return
      setPackages(result.packages)
      setDataGenerated(result.generated)
      setDataSource('static')
      toast.success(t('alerts.dataLoaded'))
    } catch (_staticErr) {
      if (!mountedRef.current) return
      console.error('Failed to load static data, trying GitHub API:', _staticErr)

      try {
        const data = await fetchWingetPackages(limit)
        if (!mountedRef.current) return
        setPackages(data)
        setDataGenerated(null)
        setDataSource('api')
        toast.success(t('alerts.dataLoaded'))
      } catch (_apiErr) {
        if (!mountedRef.current) return
        console.error('Failed to load from GitHub API, using mock data:', _apiErr)
        setPackages(mockPackages)
        setDataGenerated(null)
        setDataSource('mock')
        setError(t('alerts.mockData'))
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [limit, t])

  const retry = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await fetchPackageDataWithMeta()
      if (!mountedRef.current) return
      setPackages(result.packages)
      setDataGenerated(result.generated)
      setDataSource('static')
      toast.success(t('alerts.dataLoaded'))
    } catch (_staticErr) {
      if (!mountedRef.current) return
      try {
        const data = await fetchWingetPackages(limit)
        if (!mountedRef.current) return
        setPackages(data)
        setDataGenerated(null)
        setDataSource('api')
        toast.success(t('alerts.dataLoaded'))
      } catch (_apiErr) {
        if (!mountedRef.current) return
        setError(t('alerts.retry'))
        toast.error(t('alerts.retry'))
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [limit, t])

  useEffect(() => {
    mountedRef.current = true
    loadPackages()
    return () => {
      mountedRef.current = false
    }
  }, [loadPackages])

  return {
    packages,
    isLoading,
    error,
    dataSource,
    dataGenerated,
    retry,
  }
}
