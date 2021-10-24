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

export enum Target {
  desktop,
  android,
  ios,
  winrt,
}
