import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Caminho do reposit�rio clonado (definido via vari�vel de ambiente ou default)
const WINGET_REPO_PATH = process.env.WINGET_REPO_PATH || path.join(process.cwd(), 'winget-pkgs')
const MANIFESTS_PATH = path.join(WINGET_REPO_PATH, 'manifests')
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'data')
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'packages.json')
const BATCH_SIZE = 100 // Processar 100 pacotes em paralelo (� local, pode ser mais r�pido)

function parseYaml(yamlText) {
  const lines = yamlText.split('\n')
  const result = {}
  let currentArray = null
  
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
      }
    }
  }
  
  return result
}

async function findAllPackageFolders() {
  console.log(`Scanning manifests in: ${MANIFESTS_PATH}`)
  const packageFolders = []
  
  try {
    // Listar letras (a, b, c, ..., 0, 1, ...)
    const letters = await fs.readdir(MANIFESTS_PATH)
    
    for (const letter of letters) {
      const letterPath = path.join(MANIFESTS_PATH, letter)
      const letterStat = await fs.stat(letterPath)
      if (!letterStat.isDirectory()) continue
      
      // Listar publishers
      const publishers = await fs.readdir(letterPath)
      
      for (const publisher of publishers) {
        const publisherPath = path.join(letterPath, publisher)
        const publisherStat = await fs.stat(publisherPath)
        if (!publisherStat.isDirectory()) continue
        
        // Listar pacotes do publisher
        const packages = await fs.readdir(publisherPath)
        
        for (const pkg of packages) {
          const pkgPath = path.join(publisherPath, pkg)
          const pkgStat = await fs.stat(pkgPath)
          if (!pkgStat.isDirectory()) continue
          
          // Verificar se � um pacote (tem vers�es) ou subpacote
          const contents = await fs.readdir(pkgPath)
          const hasYamlOrVersion = contents.some(c => c.endsWith('.yaml') || /^\d/.test(c))
          
          if (hasYamlOrVersion) {
            packageFolders.push(pkgPath)
          } else {
            // � um grupo de subpacotes (ex: Microsoft/VisualStudio/Community)
            for (const subPkg of contents) {
              const subPkgPath = path.join(pkgPath, subPkg)
              const subPkgStat = await fs.stat(subPkgPath)
              if (subPkgStat.isDirectory()) {
                packageFolders.push(subPkgPath)
              }
            }
          }
        }
      }
    }
    
    console.log(`Found ${packageFolders.length} package folders`)
    return packageFolders
  } catch (error) {
    console.error('Error scanning manifests:', error.message)
    throw error
  }
}

async function processPackage(packagePath) {
  try {
    const contents = await fs.readdir(packagePath)
    
    // Filtrar apenas diret�rios (vers�es)
    const versionDirs = []
    for (const item of contents) {
      const itemPath = path.join(packagePath, item)
      const stat = await fs.stat(itemPath)
      if (stat.isDirectory()) {
        versionDirs.push(item)
      }
    }
    
    if (versionDirs.length === 0) return null
    
    // Ordenar e pegar a vers�o mais recente
    versionDirs.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    const latestVersion = versionDirs[versionDirs.length - 1]
    const versionPath = path.join(packagePath, latestVersion)
    
    // Listar arquivos da vers�o
    const versionContents = await fs.readdir(versionPath)
    
    // Encontrar arquivos de manifesto
    // Prioridade: arquivo .locale. > arquivo principal .yaml (sem installer/locale)
    let localeFile = versionContents.find(f => 
      f.includes('.locale.') && f.endsWith('.yaml')
    )
    
    // Se não tem arquivo .locale., tentar arquivo principal (formato antigo/simples)
    if (!localeFile) {
      localeFile = versionContents.find(f => 
        f.endsWith('.yaml') && !f.includes('.installer.') && !f.includes('.locale.')
      )
    }
    
    const installerFile = versionContents.find(f => 
      f.includes('.installer.') && f.endsWith('.yaml')
    )
    
    if (!localeFile) return null
    
    // Ler arquivos
    const localeYaml = await fs.readFile(path.join(versionPath, localeFile), 'utf-8')
    const localeManifest = parseYaml(localeYaml)
    
    let installerManifest = null
    if (installerFile) {
      const installerYaml = await fs.readFile(path.join(versionPath, installerFile), 'utf-8')
      installerManifest = parseYaml(installerYaml)
    }
    
    // Extrair ID do pacote
    const packageId = localeManifest.PackageIdentifier || 
      packagePath.split(path.sep).slice(-2).join('.')
    
    // Extrair �cone
    const iconUrl = extractIconUrl({ locale: localeManifest, installer: installerManifest })
    
    // Extrair categoria
    const category = localeManifest.Tags && Array.isArray(localeManifest.Tags) && localeManifest.Tags.length > 0
      ? localeManifest.Tags[0].charAt(0).toUpperCase() + localeManifest.Tags[0].slice(1)
      : localeManifest.Tags && typeof localeManifest.Tags === 'string'
      ? localeManifest.Tags.charAt(0).toUpperCase() + localeManifest.Tags.slice(1)
      : undefined
    
    return {
      id: packageId,
      name: localeManifest.PackageName || packageId,
      publisher: localeManifest.Publisher || 'Unknown',
      version: localeManifest.PackageVersion || latestVersion,
      description: localeManifest.ShortDescription || localeManifest.Description,
      homepage: localeManifest.PackageUrl || localeManifest.PublisherUrl,
      license: localeManifest.License || 'Not specified',
      tags: Array.isArray(localeManifest.Tags) ? localeManifest.Tags : (localeManifest.Tags ? [localeManifest.Tags] : []),
      installCommand: `winget install --id ${packageId}`,
      category,
      icon: iconUrl,
      lastUpdated: new Date().toISOString()
    }
  } catch (error) {
    return null
  }
}

function extractIconUrl(manifest) {
  if (!manifest) return null
  
  const { locale, installer } = manifest
  
  // 1. Tentar buscar do Microsoft Store
  if (installer?.PackageFamilyName) {
    const pfn = installer.PackageFamilyName.split('_')[0]
    return `https://store-images.s-microsoft.com/image/apps.${pfn}.png`
  }
  
  // 2. Usar favicon do site oficial
  if (locale?.PackageUrl) {
    try {
      const url = new URL(locale.PackageUrl)
      return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`
    } catch {
      // URL inv�lida
    }
  }
  
  // 3. Usar favicon do publisher
  if (locale?.PublisherUrl) {
    try {
      const url = new URL(locale.PublisherUrl)
      return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`
    } catch {
      // URL inv�lida
    }
  }
  
  return null
}

async function processAllPackages() {
  console.log('Starting package processing...')
  const startTime = Date.now()
  
  const folders = await findAllPackageFolders()
  const packages = []
  let processed = 0
  let errors = 0
  
  // Processar em lotes paralelos
  for (let i = 0; i < folders.length; i += BATCH_SIZE) {
    const batch = folders.slice(i, i + BATCH_SIZE)
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(folders.length / BATCH_SIZE)
    
    const batchResults = await Promise.allSettled(
      batch.map(folder => processPackage(folder))
    )
    
    for (const result of batchResults) {
      processed++
      if (result.status === 'fulfilled' && result.value) {
        packages.push(result.value)
      } else {
        errors++
      }
    }
    
    // Log de progresso a cada 10 lotes
    if (batchNumber % 10 === 0 || batchNumber === totalBatches) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      console.log(`Progress: ${batchNumber}/${totalBatches} batches (${packages.length} packages, ${elapsed}s)`)
    }
  }
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`\nProcessing complete!`)
  console.log(`Total processed: ${processed}`)
  console.log(`Successful: ${packages.length}`)
  console.log(`Errors/skipped: ${errors}`)
  console.log(`Time: ${elapsed}s`)
  
  return packages
}

async function savePackages(packages) {
  await fs.mkdir(OUTPUT_DIR, { recursive: true })
  
  // Remover duplicados pelo ID (manter o primeiro encontrado)
  const seen = new Set()
  const uniquePackages = packages.filter(pkg => {
    if (seen.has(pkg.id)) {
      return false
    }
    seen.add(pkg.id)
    return true
  })
  
  const duplicatesRemoved = packages.length - uniquePackages.length
  if (duplicatesRemoved > 0) {
    console.log(`\nRemoved ${duplicatesRemoved} duplicate packages`)
  }
  
  // Ordenar: pacotes com ícone primeiro, depois alfabeticamente por nome
  const sortedPackages = uniquePackages.sort((a, b) => {
    const aHasIcon = a.icon ? 1 : 0
    const bHasIcon = b.icon ? 1 : 0
    if (bHasIcon !== aHasIcon) return bHasIcon - aHasIcon
    return a.name.localeCompare(b.name)
  })
  
  const output = {
    generated: new Date().toISOString(),
    count: sortedPackages.length,
    packagesWithIcon: sortedPackages.filter(p => p.icon).length,
    packages: sortedPackages
  }
  
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2))
  console.log(`\nSaved ${sortedPackages.length} packages to ${OUTPUT_FILE}`)
  console.log(`Packages with icons: ${output.packagesWithIcon}`)
}

async function main() {
  try {
    // Verificar se o reposit�rio existe
    try {
      await fs.access(MANIFESTS_PATH)
    } catch {
      console.error(`Error: Manifests folder not found at ${MANIFESTS_PATH}`)
      console.error('Make sure the winget-pkgs repository is cloned.')
      process.exit(1)
    }
    
    console.log('='.repeat(50))
    console.log('Winget Package Data Fetcher (Local Processing)')
    console.log('='.repeat(50))
    
    const packages = await processAllPackages()
    await savePackages(packages)
    
    console.log('\nDone!')
  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  }
}

main()
