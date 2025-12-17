import { WingetPackage, PackageDataResponse } from './types'

// Dados ficam no próprio site (deployados junto com o build)
const DATA_URL = import.meta.env.BASE_URL + 'data/packages.json'

export interface PackageDataWithMeta {
  packages: WingetPackage[]
  generated: string
  count: number
}

export async function fetchPackageDataWithMeta(): Promise<PackageDataWithMeta> {
  try {
    console.log('Fetching package data from:', DATA_URL)
    
    const response = await fetch(DATA_URL, {
      cache: 'no-cache',
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch package data: ${response.status}`)
    }
    
    const data: PackageDataResponse = await response.json()
    
    console.log(`Loaded ${data.count} packages (generated: ${new Date(data.generated).toLocaleString()})`)
    
    return {
      packages: data.packages,
      generated: data.generated,
      count: data.count
    }
  } catch (error) {
    console.error('Error loading static package data:', error)
    throw error
  }
}

export async function fetchStaticPackageData(): Promise<WingetPackage[]> {
  const result = await fetchPackageDataWithMeta()
  return result.packages
}
