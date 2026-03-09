export interface WingetPackage {
  id: string;
  name: string;
  publisher: string;
  version: string;
  description?: string;
  homepage?: string;
  license?: string;
  tags?: string[];
  installCommand: string;
  category?: string;
  icon?: string;
  lastUpdated?: string;
  installerUrlsByArch?: Record<string, string>;
  installerDetailsByArch?: Record<
    string,
    {
      url: string;
      installerType?: string;
    }
  >;
}

export interface PackageDataResponse {
  generated: string;
  count: number;
  packages: WingetPackage[];
}
