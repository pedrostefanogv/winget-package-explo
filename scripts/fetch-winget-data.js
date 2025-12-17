const { Octokit } = require('octokit')
const fs = require('fs').promises
const path = require('path')

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const REPO_OWNER = 'microsoft'
const REPO_NAME = 'winget-pkgs'
const MAX_PACKAGES = 500
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'data')
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'packages.json')

const octokit = new Octokit({
  auth: GITHUB_TOKEN
})

function parseYaml(yamlText) {
  const lines = yamlText.split('\n')
  const result = {}
  let currentArray = null
  let currentKey = null
  
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
        result[key] = value.replace(/^["']|["']$/g, '')
      } else {
        currentArray = key
        currentKey = key
      }
    }
  }
  
  return result
}

async function getManifestFolders() {
  console.log('Fetching repository tree...')
  
  try {
    const { data } = await octokit.rest.git.getTree({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      tree_sha: 'master',
      recursive: '1'
    })
    
    const manifestFolders = data.tree
      .filter(item => 
        item.type === 'tree' && 
        item.path.startsWith('manifests/') &&
        item.path.split('/').length === 4
      )
      .slice(0, MAX_PACKAGES)
    
    console.log(`Found ${manifestFolders.length} manifest folders`)
    return manifestFolders
  } catch (error) {
    console.error('Error fetching tree:', error.message)
    throw error
  }
}

async function getPackageManifests(folderPath) {
  try {
    const { data: contents } = await octokit.rest.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: folderPath
    })
    
    if (!Array.isArray(contents)) return null
    
    const versionFolders = contents.filter(item => item.type === 'dir')
    if (versionFolders.length === 0) return null
    
    const latestVersion = versionFolders[versionFolders.length - 1]
    
    const { data: versionContents } = await octokit.rest.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: latestVersion.path
    })
    
    if (!Array.isArray(versionContents)) return null
    
    const localeFile = versionContents.find(f => 
      f.name.includes('.locale.') && f.name.endsWith('.yaml')
    )
    
    const installerFile = versionContents.find(f => 
      f.name.includes('.installer.') && f.name.endsWith('.yaml')
    )
    
    if (!localeFile) return null
    
    const localeResponse = await fetch(localeFile.download_url)
    const localeYaml = await localeResponse.text()
    const localeManifest = parseYaml(localeYaml)
    
    let installerManifest = null
    if (installerFile) {
      const installerResponse = await fetch(installerFile.download_url)
      const installerYaml = await installerResponse.text()
      installerManifest = parseYaml(installerYaml)
    }
    
    return { locale: localeManifest, installer: installerManifest, version: latestVersion.name }
  } catch (error) {
    return null
  }
}

function extractIconUrl(manifest) {
  if (!manifest || !manifest.installer) return null
  
  if (manifest.installer.PackageFamilyName) {
    return `https://store-images.s-microsoft.com/image/apps.${manifest.installer.PackageFamilyName.split('_')[0]}`
  }
  
  if (manifest.locale && manifest.locale.PackageUrl) {
    const domain = new URL(manifest.locale.PackageUrl).hostname
    return `https://logo.clearbit.com/${domain}`
  }
  
  return null
}

async function processPackages() {
  console.log('Starting package processing...')
  
  const folders = await getManifestFolders()
  const packages = []
  const errors = []
  
  for (let i = 0; i < folders.length; i++) {
    const folder = folders[i]
    
    if (i % 10 === 0) {
      console.log(`Processing ${i + 1}/${folders.length} packages...`)
    }
    
    try {
      const manifests = await getPackageManifests(folder.path)
      
      if (!manifests || !manifests.locale) {
        continue
      }
      
      const { locale, installer, version } = manifests
      const parts = folder.path.split('/')
      const packageId = locale.PackageIdentifier || `${parts[1]}.${parts[2]}`
      
      const iconUrl = extractIconUrl({ locale, installer })
      
      const category = locale.Tags && Array.isArray(locale.Tags) && locale.Tags.length > 0
        ? locale.Tags[0].charAt(0).toUpperCase() + locale.Tags[0].slice(1)
        : locale.Tags && typeof locale.Tags === 'string'
        ? locale.Tags.charAt(0).toUpperCase() + locale.Tags.slice(1)
        : undefined
      
      packages.push({
        id: packageId,
        name: locale.PackageName || packageId,
        publisher: locale.Publisher || 'Unknown',
        version: locale.PackageVersion || version,
        description: locale.ShortDescription || locale.Description,
        homepage: locale.PackageUrl || locale.PublisherUrl,
        license: locale.License || 'Not specified',
        tags: Array.isArray(locale.Tags) ? locale.Tags : (locale.Tags ? [locale.Tags] : []),
        installCommand: `winget install --id ${packageId}`,
        category,
        icon: iconUrl,
        lastUpdated: new Date().toISOString()
      })
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
    } catch (error) {
      errors.push({ folder: folder.path, error: error.message })
    }
  }
  
  console.log(`Successfully processed ${packages.length} packages`)
  console.log(`Errors: ${errors.length}`)
  
  return packages
}

async function savePackages(packages) {
  await fs.mkdir(OUTPUT_DIR, { recursive: true })
  
  const output = {
    generated: new Date().toISOString(),
    count: packages.length,
    packages
  }
  
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2))
  console.log(`Saved ${packages.length} packages to ${OUTPUT_FILE}`)
}

async function main() {
  try {
    console.log('Starting winget package data fetch...')
    const packages = await processPackages()
    await savePackages(packages)
    console.log('Done!')
  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  }
}

main()
