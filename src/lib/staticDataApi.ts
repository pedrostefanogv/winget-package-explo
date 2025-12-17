import { WingetPackage, PackageDataResponse } from './types'

// jsDelivr CDN - permite CORS e cacheia os arquivos do GitHub
const JSDELIVR_URL = 'https://cdn.jsdelivr.net/gh/pedrostefanogv/winget-package-explo@main/public/data/packages.json'

// Fallback para dados locais (desenvolvimento)
const LOCAL_DATA_URL = '/data/packages.json'

export async function fetchStaticPackageData(): Promise<WingetPackage[]> {
  try {
    // Em produção, busca do jsDelivr CDN
    // Em desenvolvimento, usa dados locais
    const isProd = window.location.hostname !== 'localhost'
    
    let response: Response
    
    if (isProd) {
      console.log('Fetching from jsDelivr CDN...')
      // Adiciona timestamp para evitar cache agressivo do jsDelivr
      response = await fetch(`${JSDELIVR_URL}?t=${Date.now()}`, {
        cache: 'no-cache',
      })
      
      // Fallback para dados locais se CDN falhar
      if (!response.ok) {
        console.log('CDN failed, falling back to local data...')
        response = await fetch(LOCAL_DATA_URL, { cache: 'no-cache' })
      }
    } else {
      response = await fetch(LOCAL_DATA_URL, { cache: 'no-cache' })
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
