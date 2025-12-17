import { WingetPackage } from './types'

const GITHUB_API = 'https://api.github.com'
const REPO_OWNER = 'microsoft'
const REPO_NAME = 'winget-pkgs'

interface GitHubTreeItem {
  path: string
  type: string
  sha: string
}

interface GitHubContent {
  name: string
  path: string
  sha: string
  size: number
  url: string
  html_url: string
  git_url: string
  download_url: string | null
  type: string
}

interface ManifestVersion {
  PackageIdentifier: string
  PackageVersion: string
  DefaultLocale?: string
  ManifestType: string
  ManifestVersion: string
}

interface ManifestInstaller {
  PackageIdentifier: string
  PackageVersion: string
  InstallerLocale?: string
  Installers?: Array<{
    Architecture?: string
    InstallerType?: string
    InstallerUrl?: string
  }>
  ManifestType: string
  ManifestVersion: string
}

interface ManifestLocale {
  PackageIdentifier: string
  PackageVersion: string
  PackageLocale?: string
  Publisher: string
  PublisherUrl?: string
  PublisherSupportUrl?: string
  PrivacyUrl?: string
  PackageName: string
  PackageUrl?: string
  License: string
  LicenseUrl?: string
  Copyright?: string
  ShortDescription?: string
  Description?: string
  Tags?: string[]
  ManifestType: string
  ManifestVersion: string
}

async function fetchFromGitHub(url: string) {
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
    },
  })
  
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
  }
  
  return response.json()
}

function parseYamlManifest(yamlText: string): any {
  const lines = yamlText.split('\n')
  const result: any = {}
  let currentArray: string | null = null
  
  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue
    
    if (line.startsWith('- ') && currentArray) {
      const value = line.substring(2).trim()
      if (!result[currentArray]) {
        result[currentArray] = []
      }
      result[currentArray].push(value)
    } else if (line.includes(':')) {
      const colonIndex = line.indexOf(':')
      const key = line.substring(0, colonIndex).trim()
      const value = line.substring(colonIndex + 1).trim()
      
      if (value) {
        currentArray = null
        result[key] = value
      } else {
        currentArray = key
      }
    }
  }
  
  return result
}

export async function fetchWingetPackages(limit: number = 100): Promise<WingetPackage[]> {
  try {
    const manifestsPath = 'manifests'
    const treeUrl = `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/master?recursive=1`
    
    const tree = await fetchFromGitHub(treeUrl)
    
    const manifestFolders = tree.tree
      .filter((item: GitHubTreeItem) => 
        item.type === 'tree' && 
        item.path.startsWith(`${manifestsPath}/`) &&
        item.path.split('/').length === 4
      )
      .slice(0, Math.min(limit, 50))
    
    const packages: WingetPackage[] = []
    
    for (const folder of manifestFolders) {
      try {
        const parts = folder.path.split('/')
        const packageId = `${parts[1]}.${parts[2]}`
        
        const contentsUrl = `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${folder.path}`
        const contents: GitHubContent[] = await fetchFromGitHub(contentsUrl)
        
        const versionFolders = contents.filter(item => item.type === 'dir')
        if (versionFolders.length === 0) continue
        
        const latestVersionFolder = versionFolders[versionFolders.length - 1]
        const versionContentsUrl = `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${latestVersionFolder.path}`
        const versionContents: GitHubContent[] = await fetchFromGitHub(versionContentsUrl)
        
        const localeFile = versionContents.find(f => 
          f.name.includes('.locale.') && f.name.endsWith('.yaml')
        )
        
        if (!localeFile || !localeFile.download_url) continue
        
        const yamlResponse = await fetch(localeFile.download_url)
        const yamlText = await yamlResponse.text()
        const manifest = parseYamlManifest(yamlText) as ManifestLocale
        
        const category = manifest.Tags?.[0] 
          ? manifest.Tags[0].charAt(0).toUpperCase() + manifest.Tags[0].slice(1)
          : undefined
        
        packages.push({
          id: manifest.PackageIdentifier || packageId,
          name: manifest.PackageName || packageId,
          publisher: manifest.Publisher || 'Unknown',
          version: manifest.PackageVersion || latestVersionFolder.name,
          description: manifest.ShortDescription || manifest.Description,
          homepage: manifest.PackageUrl || manifest.PublisherUrl,
          license: manifest.License || 'Not specified',
          tags: manifest.Tags,
          installCommand: `winget install --id ${manifest.PackageIdentifier || packageId}`,
          category,
        })
        
        if (packages.length >= limit) break
      } catch (err) {
        console.warn(`Failed to fetch package from ${folder.path}:`, err)
        continue
      }
    }
    
    return packages
  } catch (error) {
    console.error('Error fetching winget packages:', error)
    throw error
  }
}

export async function searchWingetPackages(query: string, limit: number = 50): Promise<WingetPackage[]> {
  try {
    const searchUrl = `${GITHUB_API}/search/code?q=${encodeURIComponent(query)}+repo:${REPO_OWNER}/${REPO_NAME}+path:manifests+extension:yaml&per_page=${limit}`
    
    const searchResults = await fetchFromGitHub(searchUrl)
    
    const packages: WingetPackage[] = []
    const seenIds = new Set<string>()
    
    for (const result of searchResults.items || []) {
      try {
        if (!result.path.includes('.locale.') || !result.path.endsWith('.yaml')) continue
        
        const contentUrl = `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${result.path}`
        const fileData: GitHubContent = await fetchFromGitHub(contentUrl)
        
        if (!fileData.download_url) continue
        
        const yamlResponse = await fetch(fileData.download_url)
        const yamlText = await yamlResponse.text()
        const manifest = parseYamlManifest(yamlText) as ManifestLocale
        
        if (seenIds.has(manifest.PackageIdentifier)) continue
        seenIds.add(manifest.PackageIdentifier)
        
        const category = manifest.Tags?.[0] 
          ? manifest.Tags[0].charAt(0).toUpperCase() + manifest.Tags[0].slice(1)
          : undefined
        
        packages.push({
          id: manifest.PackageIdentifier,
          name: manifest.PackageName || manifest.PackageIdentifier,
          publisher: manifest.Publisher || 'Unknown',
          version: manifest.PackageVersion,
          description: manifest.ShortDescription || manifest.Description,
          homepage: manifest.PackageUrl || manifest.PublisherUrl,
          license: manifest.License || 'Not specified',
          tags: manifest.Tags,
          installCommand: `winget install --id ${manifest.PackageIdentifier}`,
          category,
        })
        
        if (packages.length >= limit) break
      } catch (err) {
        console.warn(`Failed to process search result:`, err)
        continue
      }
    }
    
    return packages
  } catch (error) {
    console.error('Error searching winget packages:', error)
    throw error
  }
}
