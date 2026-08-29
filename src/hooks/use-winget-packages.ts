import { useState, useEffect, useCallback, useRef } from 'react'
import { WingetPackage } from '@/lib/types'
import { fetchPackageDataWithMeta } from '@/lib/staticDataApi'
import { fetchWingetPackages } from '@/lib/wingetApi'
import { mockPackages } from '@/lib/mockData'
import { toast } from 'sonner'

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

  const loadPackages = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await fetchPackageDataWithMeta()
      if (!mountedRef.current) return
      setPackages(result.packages)
      setDataGenerated(result.generated)
      setDataSource('static')
      toast.success(`Loaded ${result.packages.length} packages from pre-processed data`)
    } catch (staticErr) {
      if (!mountedRef.current) return
      console.error('Failed to load static data, trying GitHub API:', staticErr)

      try {
        const data = await fetchWingetPackages(limit)
        if (!mountedRef.current) return
        setPackages(data)
        setDataGenerated(null)
        setDataSource('api')
        toast.success(`Loaded ${data.length} packages from GitHub API`)
      } catch (apiErr) {
        if (!mountedRef.current) return
        console.error('Failed to load from GitHub API, using mock data:', apiErr)
        setPackages(mockPackages)
        setDataGenerated(null)
        setDataSource('mock')
        setError('Could not load package data. Showing sample data.')
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [limit])

  const retry = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await fetchPackageDataWithMeta()
      if (!mountedRef.current) return
      setPackages(result.packages)
      setDataGenerated(result.generated)
      setDataSource('static')
      toast.success(`Loaded ${result.packages.length} packages from pre-processed data`)
    } catch (staticErr) {
      if (!mountedRef.current) return
      try {
        const data = await fetchWingetPackages(limit)
        if (!mountedRef.current) return
        setPackages(data)
        setDataGenerated(null)
        setDataSource('api')
        toast.success(`Loaded ${data.length} packages from GitHub API`)
      } catch (apiErr) {
        if (!mountedRef.current) return
        setError('Could not load package data. Please try again later.')
        toast.error('Failed to load packages')
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [limit])

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
