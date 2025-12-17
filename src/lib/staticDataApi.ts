import { WingetPackage, PackageDataResponse } from './types'

// Dados ficam no próprio site (deployados junto com o build)
const DATA_URL = import.meta.env.BASE_URL + 'data/packages.json'

export async function fetchStaticPackageData(): Promise<WingetPackage[]> {
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
    
    return data.packages
  } catch (error) {
    console.error('Error loading static package data:', error)
    throw error
  }
}
