import { WingetPackage, PackageDataResponse } from './types'

// URL do release mais recente no GitHub
const GITHUB_RELEASE_URL = 'https://github.com/pedrostefanogv/winget-package-explo/releases/latest/download/packages.json'
// Fallback para dados locais (desenvolvimento)
const LOCAL_DATA_URL = '/data/packages.json'

export async function fetchStaticPackageData(): Promise<WingetPackage[]> {
  try {
    // Tenta buscar da release do GitHub primeiro
    let response = await fetch(GITHUB_RELEASE_URL, {
      cache: 'no-cache',
    })
    
    // Fallback para dados locais se a release não existir
    if (!response.ok) {
      console.log('Release not found, falling back to local data...')
      response = await fetch(LOCAL_DATA_URL, {
        cache: 'no-cache',
      })
    }
    
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
