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
      installerSha256?: string;
    }
  >;
  /**
   * Switches de instalação silenciosa por arquitetura.
   * Extraídos da seção InstallerSwitches do manifesto installer do winget-pkgs.
   * Ex: { x64: { Silent: "/S /PreventRebootRequired=true", SilentWithProgress: "/S" } }
   */
  installerSwitches?: Record<
    string,
    {
      Silent?: string;
      SilentWithProgress?: string;
      Interactive?: string;
      InstallLocation?: string;
      Upgrade?: string;
      Custom?: string;
      Log?: string;
      Repair?: string;
    }
  >;
}

export interface PackageDataResponse {
  generated: string;
  count: number;
  packages: WingetPackage[];
}
