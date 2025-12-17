import { useState, useEffect } from 'react'
import { WingetPackage } from '@/lib/types'
import { fetchStaticPackageData } from '@/lib/staticDataApi'
import { fetchWingetPackages } from '@/lib/wingetApi'
import { mockPackages } from '@/lib/mockData'
import { toast } from 'sonner'

interface UseWingetPackagesResult {
  packages: WingetPackage[]
  isLoading: boolean
  error: string | null
  dataSource: 'static' | 'api' | 'mock'
  retry: () => Promise<void>
}

export function useWingetPackages(limit: number = 100): UseWingetPackagesResult {
  const [packages, setPackages] = useState<WingetPackage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<'static' | 'api' | 'mock'>('mock')

  const loadPackages = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await fetchStaticPackageData()
      setPackages(data)
      setDataSource('static')
      toast.success(`Loaded ${data.length} packages from pre-processed data`)
    } catch (staticErr) {
      console.error('Failed to load static data, trying GitHub API:', staticErr)
      
      try {
        const data = await fetchWingetPackages(limit)
        setPackages(data)
        setDataSource('api')
        toast.success(`Loaded ${data.length} packages from GitHub API`)
      } catch (apiErr) {
        console.error('Failed to load from GitHub API, using mock data:', apiErr)
        setPackages(mockPackages)
        setDataSource('mock')
        setError('Could not load package data. Showing sample data.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const retry = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await fetchStaticPackageData()
      setPackages(data)
      setDataSource('static')
      toast.success(`Loaded ${data.length} packages from pre-processed data`)
    } catch (staticErr) {
      try {
        const data = await fetchWingetPackages(limit)
        setPackages(data)
        setDataSource('api')
        toast.success(`Loaded ${data.length} packages from GitHub API`)
      } catch (apiErr) {
        setError('Could not load package data. Please try again later.')
        toast.error('Failed to load packages')
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPackages()
  }, [])

  return {
    packages,
    isLoading,
    error,
    dataSource,
    retry,
  }
}
