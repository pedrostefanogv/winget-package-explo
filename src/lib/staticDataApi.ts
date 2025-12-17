import { WingetPackage, PackageDataResponse } from './types'

const DATA_URL = '/data/packages.json'

export async function fetchStaticPackageData(): Promise<WingetPackage[]> {
  try {
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
