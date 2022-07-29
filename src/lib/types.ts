export interface PackageUpdate {
  DisplayName: string;
  Name: string;
  Description: string;
  ReleaseDate: string;
  Version: string;
  CompressedSize: string;
  UncompressedSize: string;
  DownloadableArchives: string[];
  Dependencies: string[];
  AutoDependOn: string[];
}

export interface SelectableElement {
  pkg: PackageUpdate | null;
  name: string;
  selected: boolean;
}

export const seToolInstallName = (se: SelectableElement): string | null =>
  se.pkg === null ? null : se.pkg.Name;

export const seModuleInstallName = (se: SelectableElement): string | null => {
  if (se.pkg === null) {
    return null;
  }
  const parts = se.pkg.Name.split(".");
  return parts[parts.length - 2];
};

export interface RawPackageUpdate {
  DisplayName?: string | null | undefined;
  Name?: string | null | undefined;
  Description?: string | null | undefined;
  ReleaseDate?: string | null | undefined;
  Version?: string | null | undefined;
  CompressedSize?: string | null | undefined;
  UncompressedSize?: string | null | undefined;
  DownloadableArchives?: string[] | null | undefined;
  Dependencies?: string[] | null | undefined;
  AutoDependOn?: string[] | null | undefined;
}

export interface RawPackageUpdates {
  [key: string]: RawPackageUpdate;
}
export const to_package_updates = (
  updates: RawPackageUpdates
): PackageUpdate[] => Object.values(updates).map(toPackageUpdate);

export const toPackageUpdate = (obj: RawPackageUpdate): PackageUpdate => ({
  DisplayName: obj.DisplayName ?? "",
  Name: obj.Name ?? "",
  Description: obj.Description ?? "",
  ReleaseDate: obj.ReleaseDate ?? "",
  Version: obj.Version ?? "",
  CompressedSize: obj.CompressedSize ?? "",
  UncompressedSize: obj.UncompressedSize ?? "",
  DownloadableArchives: obj.DownloadableArchives ?? [],
  Dependencies: obj.Dependencies ?? [],
  AutoDependOn: obj.AutoDependOn ?? [],
});

export type Directory = { qt: string[]; tools: string[] };

export enum Host {
  windows,
  mac,
  linux,
}
export type HostString = keyof typeof Host;
export const hostToStr = (h: Host): string => Host[h];
export const hostFromStr = (h: keyof typeof Host): Host => Host[h];

export enum Target {
  desktop,
  android,
  ios,
  winrt,
}
export type TargetString = keyof typeof Target;
export const targetToStr = (t: Target): string => Target[t];
export const targetFromStr = (t: keyof typeof Target): Target => Target[t];
