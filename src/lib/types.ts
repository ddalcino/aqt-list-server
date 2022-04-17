export type SelectableElement = { selected: boolean };

export interface ToolVariant extends SelectableElement {
  DisplayName: string;
  Name: string;
  Description: string;
  ReleaseDate: string;
  Version: string;
  CompressedSize: string;
  UncompressedSize: string;
}

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

export interface PackageUpdates {
  [key: string]: PackageUpdate;
}

export const toPackageUpdate = (obj: {
  DisplayName?: string;
  Name?: string;
  Description?: string;
  ReleaseDate?: string;
  Version?: string;
  CompressedSize?: string;
  UncompressedSize?: string;
  DownloadableArchives?: string[];
  Dependencies?: string[];
  AutoDependOn?: string[];
}): PackageUpdate => ({
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
