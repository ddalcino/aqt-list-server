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
