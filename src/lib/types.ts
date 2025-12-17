export interface WingetPackage {
  id: string
  name: string
  publisher: string
  version: string
  description?: string
  homepage?: string
  license?: string
  tags?: string[]
  installCommand: string
  category?: string
  icon?: string
  lastUpdated?: string
}

export interface PackageDataResponse {
  generated: string
  count: number
  packages: WingetPackage[]
}
