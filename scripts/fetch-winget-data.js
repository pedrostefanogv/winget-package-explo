import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho do reposit�rio clonado (definido via vari�vel de ambiente ou default)
const WINGET_REPO_PATH =
  process.env.WINGET_REPO_PATH || path.join(process.cwd(), "winget-pkgs");
const MANIFESTS_PATH = path.join(WINGET_REPO_PATH, "manifests");
const OUTPUT_DIR = path.join(process.cwd(), "public", "data");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "packages.json");
const BATCH_SIZE = 500; // Processar 500 pacotes em paralelo (mais rápido no CI)

function parseYaml(yamlText) {
  const lines = yamlText.split("\n");
  const result = {};
  let currentArray = null;

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith("#")) continue;

    if (line.startsWith("- ") && currentArray) {
      const value = line.substring(2).trim();
      if (!result[currentArray]) {
        result[currentArray] = [];
      }
      result[currentArray].push(value);
    } else if (line.includes(":")) {
      const colonIndex = line.indexOf(":");
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();

      if (value) {
        currentArray = null;
        result[key] = value.replace(/^["']|["']$/g, "");
      } else {
        currentArray = key;
      }
    }
  }

  return result;
}

function cleanYamlScalar(value) {
  if (!value) return "";
  const withoutComment = value.split(" #")[0].trim();
  // Só remove aspas de abertura/fechamento se forem um par envolvente
  // (não remover aspas internas de valores como /TASKS="startmenufolder")
  if (
    (withoutComment.startsWith('"') && withoutComment.endsWith('"') && withoutComment.length >= 2) ||
    (withoutComment.startsWith("'") && withoutComment.endsWith("'") && withoutComment.length >= 2)
  ) {
    return withoutComment.slice(1, -1);
  }
  return withoutComment;
}

// Extrai os InstallerSwitches (Silent, SilentWithProgress, etc.) do manifesto installer.
// Suporta switches globais (nível do pacote) e switches específicos por arquitetura
// (definidos dentro de cada item de installer, ex: Silent: /S em um bloco x64).
function extractInstallerSwitches(installerYamlText) {
  const lines = installerYamlText.split("\n");
  const globalSwitches = {};
  const switchesByArch = {};
  let currentArch = "neutral";
  let currentSwitchKey = null;
  let insideInstallers = false;
  let insideSwitches = false;
  let insideArchSwitches = false;
  let switchesIndent = 0; // indentação da linha "InstallerSwitches:" (0 = global, maior = por arch)

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const indent = rawLine.length - rawLine.trimStart().length;

    if (line.startsWith("Installers:")) {
      insideInstallers = true;
      insideSwitches = false;
      insideArchSwitches = false;
      currentSwitchKey = null;
      currentArch = "neutral";
      continue;
    }

    if (line.startsWith("InstallerSwitches:")) {
      insideSwitches = true;
      insideArchSwitches = false;
      currentSwitchKey = null;
      switchesIndent = indent;
      continue;
    }

    if (insideSwitches) {
      // Novo bloco de nível igual ou superior encerra a seção de switches
      if (indent <= switchesIndent && !line.startsWith("- ")) {
        insideSwitches = false;
        insideArchSwitches = false;
        currentSwitchKey = null;
      } else {
        // Dentro de InstallerSwitches, um bloco "Architecture:" contém switches por arch
        const archBlockMatch = line.match(/^Architecture:\s*(.+)$/i);
        if (archBlockMatch && indent === switchesIndent + 2) {
          insideArchSwitches = true;
          currentArch =
            cleanYamlScalar(archBlockMatch[1]).toLowerCase() || "neutral";
          currentSwitchKey = null;
        } else {
          const switchMatch = line.match(/^(Silent|SilentWithProgress|Interactive|InstallLocation|Upgrade|Custom|Log|Repair):\s*(.+)$/i);
          if (switchMatch) {
            const key = switchMatch[1];
            const value = cleanYamlScalar(switchMatch[2]);
            if (value) {
              // Switches aninhados dentro de um item de installer (indent > 0)
              // pertencem à arquitetura daquele item; no nível raiz são globais
              const isPerArch =
                switchesIndent > 0 || insideArchSwitches;
              if (isPerArch) {
                if (!switchesByArch[currentArch])
                  switchesByArch[currentArch] = {};
                switchesByArch[currentArch][key] = value;
              } else {
                globalSwitches[key] = value;
              }
            }
            currentSwitchKey = key;
          } else if (currentSwitchKey && line.startsWith("- ") && indent > switchesIndent + 2) {
            // Continuação de valor multilinha (ex: listas YAML com "- ")
            // Só se a indentação for maior que a dos switches (não é novo item de installer)
            const extra = cleanYamlScalar(line.substring(2));
            if (extra) {
              const isPerArch = switchesIndent > 0 || insideArchSwitches;
              const target = isPerArch
                ? switchesByArch[currentArch] ||
                  (switchesByArch[currentArch] = {})
                : globalSwitches;
              target[currentSwitchKey] =
                `${target[currentSwitchKey]} ${extra}`.trim();
            }
          }
        }
      }
    }

    // Rastrear a arquitetura atual dentro da seção Installers
    // (linhas "Architecture:" no nível do item de installer, fora do bloco de switches)
    if (
      insideInstallers &&
      (!insideSwitches || indent <= switchesIndent)
    ) {
      // Item de lista: "- Architecture: x64" (arch na mesma linha do traço)
      const itemArchMatch = line.match(/^-\s*Architecture:\s*(.+)$/i);
      const archMatch = itemArchMatch || line.match(/^Architecture:\s*(.+)$/i);
      if (archMatch) {
        currentArch = cleanYamlScalar(archMatch[1]).toLowerCase() || "neutral";
      }
    }
  }

  return { globalSwitches, switchesByArch };
}

function extractInstallerDetailsByArch(installerYamlText) {
  const detailsByArch = {};
  const lines = installerYamlText.split("\n");
  let currentArch = "neutral";
  let currentType;
  let currentSha256;
  let insideInstallers = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    if (line.startsWith("Installers:")) {
      insideInstallers = true;
      currentArch = "neutral";
      currentType = undefined;
      currentSha256 = undefined;
      continue;
    }

    if (!insideInstallers) continue;

    if (line.startsWith("- ")) {
      currentArch = "neutral";
      currentType = undefined;
      currentSha256 = undefined;

      const archOnSameLine = line.match(/Architecture:\s*([^,]+)$/i);
      if (archOnSameLine?.[1]) {
        currentArch = cleanYamlScalar(archOnSameLine[1]).toLowerCase();
      }

      const typeOnSameLine = line.match(/InstallerType:\s*([^,]+)$/i);
      if (typeOnSameLine?.[1]) {
        currentType = cleanYamlScalar(typeOnSameLine[1]).toLowerCase();
      }

      const shaOnSameLine = line.match(/InstallerSha256:\s*([^,]+)$/i);
      if (shaOnSameLine?.[1]) {
        currentSha256 = cleanYamlScalar(shaOnSameLine[1]);
      }

      const urlOnSameLine = line.match(/InstallerUrl:\s*(.+)$/i);
      if (urlOnSameLine?.[1]) {
        const url = cleanYamlScalar(urlOnSameLine[1]);
        if (url && !detailsByArch[currentArch]) {
          detailsByArch[currentArch] = {
            url,
            ...(currentType ? { installerType: currentType } : {}),
            ...(currentSha256 ? { installerSha256: currentSha256 } : {}),
          };
        }
      }

      continue;
    }

    if (line.startsWith("Architecture:")) {
      currentArch =
        cleanYamlScalar(line.replace("Architecture:", "")).toLowerCase() ||
        "neutral";
      continue;
    }

    if (line.startsWith("InstallerType:")) {
      currentType =
        cleanYamlScalar(line.replace("InstallerType:", "")).toLowerCase() ||
        undefined;
      continue;
    }

    if (line.startsWith("InstallerSha256:")) {
      currentSha256 =
        cleanYamlScalar(line.replace("InstallerSha256:", "")) || undefined;
      continue;
    }

    if (line.startsWith("InstallerUrl:")) {
      const url = cleanYamlScalar(line.replace("InstallerUrl:", ""));
      if (url && !detailsByArch[currentArch]) {
        detailsByArch[currentArch] = {
          url,
          ...(currentType ? { installerType: currentType } : {}),
          ...(currentSha256 ? { installerSha256: currentSha256 } : {}),
        };
      }
      continue;
    }
  }

  return Object.keys(detailsByArch).length > 0 ? detailsByArch : undefined;
}

// Função recursiva para encontrar pastas que contêm versões
async function findPackagesRecursively(dirPath, depth = 0, maxDepth = 6) {
  if (depth > maxDepth) return [];

  const results = [];

  try {
    const contents = await fs.readdir(dirPath, { withFileTypes: true });

    // Verificar se esta pasta contém diretórios de versão (começam com número)
    const hasVersionDirs = contents.some(
      (item) => item.isDirectory() && /^\d/.test(item.name),
    );

    if (hasVersionDirs) {
      // Esta pasta é um pacote - tem versões diretas
      results.push(dirPath);

      // MAS também pode ter subpacotes (como Firefox tem pt-BR, ESR, etc)
      // Então verificar subpastas que NÃO são versões
      for (const item of contents) {
        if (!item.isDirectory()) continue;
        if (/^\d/.test(item.name)) continue; // Pular versões

        const itemPath = path.join(dirPath, item.name);
        const subPackages = await findPackagesRecursively(
          itemPath,
          depth + 1,
          maxDepth,
        );
        results.push(...subPackages);
      }
    } else {
      // Não tem versões diretas - verificar subpastas
      for (const item of contents) {
        if (!item.isDirectory()) continue;

        const itemPath = path.join(dirPath, item.name);
        const subPackages = await findPackagesRecursively(
          itemPath,
          depth + 1,
          maxDepth,
        );
        results.push(...subPackages);
      }
    }
  } catch (error) {
    // Ignorar erros de leitura em pastas específicas
  }

  return results;
}

async function findAllPackageFolders() {
  console.log(`Scanning manifests in: ${MANIFESTS_PATH}`);
  const packageFolders = [];

  try {
    // Listar letras (a, b, c, ..., 0, 1, ...)
    const letters = await fs.readdir(MANIFESTS_PATH, { withFileTypes: true });

    for (const letter of letters) {
      if (!letter.isDirectory()) continue;
      const letterPath = path.join(MANIFESTS_PATH, letter.name);

      // Listar publishers
      const publishers = await fs.readdir(letterPath, { withFileTypes: true });

      for (const publisher of publishers) {
        if (!publisher.isDirectory()) continue;
        const publisherPath = path.join(letterPath, publisher.name);

        // Listar pacotes do publisher
        const packages = await fs.readdir(publisherPath, { withFileTypes: true });

        for (const pkg of packages) {
          if (!pkg.isDirectory()) continue;
          const pkgPath = path.join(publisherPath, pkg.name);

          // Usar busca recursiva para encontrar todos os pacotes
          const foundPackages = await findPackagesRecursively(pkgPath, 0, 4);
          packageFolders.push(...foundPackages);
        }
      }
    }

    console.log(`Found ${packageFolders.length} package folders`);
    return packageFolders;
  } catch (error) {
    console.error("Error scanning manifests:", error.message);
    throw error;
  }
}

async function processPackage(packagePath) {
  try {
    const contents = await fs.readdir(packagePath, { withFileTypes: true });

    // Filtrar apenas diretórios que são versões (começam com número)
    const versionDirs = [];
    for (const item of contents) {
      if (!item.isDirectory()) continue;
      // Versões começam com número (ex: 146.0, 1.0.0, 2024.1)
      if (!/^\d/.test(item.name)) continue;
      versionDirs.push(item.name);
    }

    if (versionDirs.length === 0) return null;

    // Ordenar e pegar a versão mais recente
    versionDirs.sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true }),
    );
    const latestVersion = versionDirs[versionDirs.length - 1];
    const versionPath = path.join(packagePath, latestVersion);

    // Listar arquivos da versão
    const versionContents = await fs.readdir(versionPath);

    // Encontrar o version manifest (arquivo base) - PRIORIDADE para obter o PackageIdentifier correto
    const versionManifestFile = versionContents.find(
      (f) =>
        f.endsWith(".yaml") &&
        !f.includes(".installer.") &&
        !f.includes(".locale."),
    );

    // Ler version manifest PRIMEIRO para obter o PackageIdentifier correto
    let versionManifest = {};
    if (versionManifestFile) {
      const versionYaml = await fs.readFile(
        path.join(versionPath, versionManifestFile),
        "utf-8",
      );
      versionManifest = parseYaml(versionYaml);
    }

    // O PackageIdentifier do version manifest é a fonte de verdade
    let packageId = versionManifest.PackageIdentifier;

    // Fallback: extrair do nome do arquivo do version manifest
    if (!packageId && versionManifestFile) {
      // O arquivo tem o formato "Publisher.PackageName.yaml"
      packageId = versionManifestFile.replace(".yaml", "");
    }

    // Fallback final: deduzir do caminho da pasta
    if (!packageId) {
      const pathParts = packagePath.split(path.sep);
      const manifestsIndex = pathParts.indexOf("manifests");
      if (manifestsIndex !== -1 && manifestsIndex + 2 < pathParts.length) {
        packageId = pathParts.slice(manifestsIndex + 2).join(".");
      }
    }

    // Encontrar arquivos de manifesto locale
    // Prioridade para locale:
    // 1. .locale.en-US.yaml (padrão em inglês)
    // 2. Locale que corresponde ao defaultLocale do version manifest
    // 3. Qualquer outro .locale.*.yaml
    // 4. Arquivo principal sem .installer. ou .locale. (formato antigo)
    let localeFile = versionContents.find(
      (f) => f.includes(".locale.en-US.") && f.endsWith(".yaml"),
    );

    // Se não tem en-US, tentar locale baseado no defaultLocale do version manifest
    if (!localeFile && versionManifest.DefaultLocale) {
      const defaultLocale = versionManifest.DefaultLocale;
      localeFile = versionContents.find(
        (f) => f.includes(`.locale.${defaultLocale}.`) && f.endsWith(".yaml"),
      );
    }

    // Se ainda não tem, tentar qualquer locale
    if (!localeFile) {
      localeFile = versionContents.find(
        (f) => f.includes(".locale.") && f.endsWith(".yaml"),
      );
    }

    // Se não tem arquivo .locale., tentar arquivo principal (formato antigo/simples)
    if (!localeFile) {
      // Primeiro tentar arquivos que NÃO são apenas o version manifest
      const yamlFiles = versionContents.filter(
        (f) =>
          f.endsWith(".yaml") &&
          !f.includes(".installer.") &&
          !f.includes(".locale."),
      );

      // Preferir arquivos com mais conteúdo (não apenas version manifest)
      for (const file of yamlFiles) {
        const content = await fs.readFile(
          path.join(versionPath, file),
          "utf-8",
        );
        // Se tem PackageName ou ShortDescription, é um arquivo útil
        if (
          content.includes("PackageName:") ||
          content.includes("ShortDescription:")
        ) {
          localeFile = file;
          break;
        }
      }

      // Se nenhum arquivo útil, pegar qualquer yaml que não seja installer
      if (!localeFile && yamlFiles.length > 0) {
        localeFile = yamlFiles[0];
      }
    }

    const installerFile = versionContents.find(
      (f) => f.includes(".installer.") && f.endsWith(".yaml"),
    );

    // Se não temos locale file mas temos version manifest, ainda podemos processar
    // usando informações do version manifest + installer
    if (!localeFile && !versionManifestFile) return null;

    // Ler locale manifest
    let localeManifest = {};
    if (localeFile) {
      const localeYaml = await fs.readFile(
        path.join(versionPath, localeFile),
        "utf-8",
      );
      localeManifest = parseYaml(localeYaml);
    }

    // Atualizar packageId se o locale tem um diferente (não deveria acontecer, mas por segurança)
    if (!packageId && localeManifest.PackageIdentifier) {
      packageId = localeManifest.PackageIdentifier;
    }

    let installerManifest = null;
    let installerDetailsByArch;
    let installerUrlsByArch;
    let installerSwitches;
    if (installerFile) {
      const installerYaml = await fs.readFile(
        path.join(versionPath, installerFile),
        "utf-8",
      );
      installerManifest = parseYaml(installerYaml);
      installerDetailsByArch = extractInstallerDetailsByArch(installerYaml);
      if (installerDetailsByArch) {
        installerUrlsByArch = Object.fromEntries(
          Object.entries(installerDetailsByArch).map(([arch, info]) => [
            arch,
            info.url,
          ]),
        );
      }
      // Extrair switches silenciosos (Silent / SilentWithProgress) por arquitetura
      const { globalSwitches, switchesByArch } =
        extractInstallerSwitches(installerYaml);

      // Mesclar switches globais com os específicos por arch (específicos têm prioridade)
      const mergedSwitches = {};
      const archs = new Set([
        ...Object.keys(globalSwitches.length ? { global: 1 } : {}),
        ...Object.keys(installerDetailsByArch || {}),
        ...Object.keys(switchesByArch),
      ]);
      for (const arch of archs) {
        const merged = {
          ...globalSwitches,
          ...(switchesByArch[arch] || {}),
        };
        if (Object.keys(merged).length > 0) {
          mergedSwitches[arch] = merged;
        }
      }
      if (Object.keys(mergedSwitches).length > 0) {
        installerSwitches = mergedSwitches;
      }
    }

    // Garantir que temos um packageId válido
    const finalPackageId =
      packageId || packagePath.split(path.sep).slice(-2).join(".");

    // Extrair ícone
    const iconUrl = extractIconUrl({
      locale: localeManifest,
      installer: installerManifest,
    });

    // Extrair categoria
    const category =
      localeManifest.Tags &&
      Array.isArray(localeManifest.Tags) &&
      localeManifest.Tags.length > 0
        ? localeManifest.Tags[0].charAt(0).toUpperCase() +
          localeManifest.Tags[0].slice(1)
        : localeManifest.Tags && typeof localeManifest.Tags === "string"
          ? localeManifest.Tags.charAt(0).toUpperCase() +
            localeManifest.Tags.slice(1)
          : undefined;

    // Se não temos nome do pacote no locale, tentar usar o ID como nome
    const packageName =
      localeManifest.PackageName ||
      finalPackageId.split(".").pop() ||
      finalPackageId;

    return {
      id: finalPackageId,
      name: packageName,
      publisher:
        localeManifest.Publisher ||
        versionManifest.Publisher ||
        finalPackageId.split(".")[0] ||
        "Unknown",
      version:
        localeManifest.PackageVersion ||
        versionManifest.PackageVersion ||
        latestVersion,
      description:
        localeManifest.ShortDescription || localeManifest.Description,
      homepage: localeManifest.PackageUrl || localeManifest.PublisherUrl,
      license: localeManifest.License || "Not specified",
      tags: Array.isArray(localeManifest.Tags)
        ? localeManifest.Tags
        : localeManifest.Tags
          ? [localeManifest.Tags]
          : [],
      installCommand: `winget install --id ${finalPackageId}`,
      category,
      icon: iconUrl,
      lastUpdated: new Date().toISOString(),
      ...(installerUrlsByArch ? { installerUrlsByArch } : {}),
      ...(installerDetailsByArch ? { installerDetailsByArch } : {}),
      ...(installerSwitches ? { installerSwitches } : {}),
    };
  } catch (error) {
    return null;
  }
}

function extractIconUrl(manifest) {
  if (!manifest) return null;

  const { locale, installer } = manifest;

  // 1. Tentar buscar do Microsoft Store
  if (installer?.PackageFamilyName) {
    const pfn = installer.PackageFamilyName.split("_")[0];
    return `https://store-images.s-microsoft.com/image/apps.${pfn}.png`;
  }

  // 2. Usar favicon do site oficial
  if (locale?.PackageUrl) {
    try {
      const url = new URL(locale.PackageUrl);
      return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`;
    } catch {
      // URL inv�lida
    }
  }

  // 3. Usar favicon do publisher
  if (locale?.PublisherUrl) {
    try {
      const url = new URL(locale.PublisherUrl);
      return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`;
    } catch {
      // URL inv�lida
    }
  }

  return null;
}

async function processAllPackages() {
  console.log("Starting package processing...");
  const startTime = Date.now();

  const folders = await findAllPackageFolders();
  const packages = [];
  let processed = 0;
  let errors = 0;

  // Processar em lotes paralelos
  for (let i = 0; i < folders.length; i += BATCH_SIZE) {
    const batch = folders.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(folders.length / BATCH_SIZE);

    const batchResults = await Promise.allSettled(
      batch.map((folder) => processPackage(folder)),
    );

    for (const result of batchResults) {
      processed++;
      if (result.status === "fulfilled" && result.value) {
        packages.push(result.value);
      } else {
        errors++;
      }
    }

    // Log de progresso a cada 10 lotes
    if (batchNumber % 10 === 0 || batchNumber === totalBatches) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(
        `Progress: ${batchNumber}/${totalBatches} batches (${packages.length} packages, ${elapsed}s)`,
      );
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nProcessing complete!`);
  console.log(`Total processed: ${processed}`);
  console.log(`Successful: ${packages.length}`);
  console.log(`Errors/skipped: ${errors}`);
  console.log(`Time: ${elapsed}s`);

  return packages;
}

async function savePackages(packages) {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  // Remover duplicados pelo ID (manter o primeiro encontrado)
  const seen = new Set();
  const uniquePackages = packages.filter((pkg) => {
    if (seen.has(pkg.id)) {
      return false;
    }
    seen.add(pkg.id);
    return true;
  });

  const duplicatesRemoved = packages.length - uniquePackages.length;
  if (duplicatesRemoved > 0) {
    console.log(`\nRemoved ${duplicatesRemoved} duplicate packages`);
  }

  // Ordenar: pacotes com ícone primeiro, depois alfabeticamente por nome
  const sortedPackages = uniquePackages.sort((a, b) => {
    const aHasIcon = a.icon ? 1 : 0;
    const bHasIcon = b.icon ? 1 : 0;
    if (bHasIcon !== aHasIcon) return bHasIcon - aHasIcon;
    return a.name.localeCompare(b.name);
  });

  const output = {
    generated: new Date().toISOString(),
    count: sortedPackages.length,
    packagesWithIcon: sortedPackages.filter((p) => p.icon).length,
    packages: sortedPackages,
  };

  await fs.writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`\nSaved ${sortedPackages.length} packages to ${OUTPUT_FILE}`);
  console.log(`Packages with icons: ${output.packagesWithIcon}`);
}

async function main() {
  try {
    // Verificar se o reposit�rio existe
    try {
      await fs.access(MANIFESTS_PATH);
    } catch {
      console.error(`Error: Manifests folder not found at ${MANIFESTS_PATH}`);
      console.error("Make sure the winget-pkgs repository is cloned.");
      process.exit(1);
    }

    console.log("=".repeat(50));
    console.log("Winget Package Data Fetcher (Local Processing)");
    console.log("=".repeat(50));

    const packages = await processAllPackages();
    await savePackages(packages);

    console.log("\nDone!");
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main();
