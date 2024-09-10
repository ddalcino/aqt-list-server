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
  ArchiveSizes: Map<string, string>;
}

export interface SelectableElement {
  pkg: PackageUpdate | null;
  size: string | null;
  name: string;
  selected: boolean;
}

export const seToolInstallName = (se: SelectableElement): string | null =>
  se.pkg === null ? null : se.pkg.Name;

const installableModuleRegex = /^qt\.qt\d\.\d+(\.addons)?\.(.+)\.[^.]+$/;
export const packageNameToModuleName = (name: string): string =>
  name.replace(installableModuleRegex, "$2");

export const seModuleInstallName = (se: SelectableElement): string | null => {
  if (se.pkg === null) {
    return null;
  }
  return packageNameToModuleName(se.pkg.Name);
};

export interface RawPackageUpdate {
  DisplayName?: string | null | undefined;
  Name?: string | null | undefined;
  Description?: string | null | undefined;
  ReleaseDate?: string | null | undefined;
  Version?: string | null | undefined;
  CompressedSize?: string | null | undefined;
  UncompressedSize?: string | null | undefined;
  DownloadableArchives?: string | string[] | null | undefined;
  Dependencies?: string[] | null | undefined;
  AutoDependOn?: string[] | null | undefined;
  ArchiveSizes?: Record<string, string>; // { [key: string]: string } | null | undefined;
}

export interface RawPackageUpdates {
  [key: string]: RawPackageUpdate;
}
export const to_package_updates = (
  updates: RawPackageUpdates
): PackageUpdate[] => Object.values(updates).map(toPackageUpdate);

const toStringArray = (o: string | string[] | null | undefined): string[] => {
  if (typeof o === "string" || o instanceof String) {
    return o.split(",").map((s: string) => s.trim());
  } else if (Array.isArray(o)) {
    return o;
  } else {
    return [];
  }
};
const toArchiveSizes = (obj: RawPackageUpdate): Map<string, string> => {
  const trimExcess = (archive: string) => archive.split("-")[0];
  if (obj.ArchiveSizes !== null && obj.ArchiveSizes !== undefined) {
    return new Map<string, string>(
      Object.entries(obj.ArchiveSizes).map(([k, v]: [string, string]) => [
        trimExcess(k),
        v,
      ])
    );
  }
  // Otherwise, there's probably only one archive whose size is obj.CompressedSize:
  const firstArchive = Array.isArray(obj.DownloadableArchives)
    ? obj.DownloadableArchives[0]
    : obj.DownloadableArchives;
  if (
    typeof firstArchive === "string" &&
    typeof obj.CompressedSize === "string"
  ) {
    return new Map<string, string>([
      [trimExcess(firstArchive), obj.CompressedSize],
    ]);
  }
  return new Map<string, string>();
};

export const toPackageUpdate = (obj: RawPackageUpdate): PackageUpdate => ({
  DisplayName: obj.DisplayName ?? "",
  Name: obj.Name ?? "",
  Description: obj.Description ?? "",
  ReleaseDate: obj.ReleaseDate ?? "",
  Version: obj.Version ?? "",
  CompressedSize: obj.CompressedSize ?? "",
  UncompressedSize: obj.UncompressedSize ?? "",
  DownloadableArchives: toStringArray(obj.DownloadableArchives),
  Dependencies: obj.Dependencies ?? [],
  AutoDependOn: obj.AutoDependOn ?? [],
  ArchiveSizes: toArchiveSizes(obj),
});

export type Directory = { qt: string[]; tools: string[] };

export enum Host {
  windows,
  windows_arm64,
  mac,
  linux,
  linux_arm64,
  all_os,
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

export type OnlineInstallers = { "online_installers/": object };
export type UnifiedInstallers = (host: Host) => string;
