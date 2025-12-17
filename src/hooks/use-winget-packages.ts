import { useState, useEffect } from 'react'
import { WingetPackage } from '@/lib/types'
import { fetchWingetPackages } from '@/lib/wingetApi'
import { mockPackages } from '@/lib/mockData'
import { toast } from 'sonner'

interface UseWingetPackagesResult {
  packages: WingetPackage[]
  isLoading: boolean
  error: string | null
  usingMockData: boolean
  retry: () => Promise<void>
}

export function useWingetPackages(limit: number = 100): UseWingetPackagesResult {
  const [packages, setPackages] = useState<WingetPackage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingMockData, setUsingMockData] = useState(false)

  const loadPackages = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchWingetPackages(limit)
      setPackages(data)
      setUsingMockData(false)
      toast.success(`Loaded ${data.length} packages from GitHub`)
    } catch (err) {
      console.error('Failed to load from GitHub API, using mock data:', err)
      setPackages(mockPackages)
      setUsingMockData(true)
      setError('Could not connect to GitHub API. Showing sample data.')
    } finally {
      setIsLoading(false)
    }
  }

  const retry = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchWingetPackages(limit)
      setPackages(data)
      setUsingMockData(false)
      toast.success(`Loaded ${data.length} packages from GitHub`)
    } catch (err) {
      console.error('Failed to load from GitHub API:', err)
      setError('Could not connect to GitHub API. Please try again later.')
      toast.error('Failed to load packages from GitHub')
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
    usingMockData,
    retry,
  }
}
