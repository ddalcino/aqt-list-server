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

export const enum Host {
  windows,
  mac,
  linux,
}

export const enum Target {
  desktop,
  android,
  ios,
  winrt,
}
