import { Host, Target, ToolVariant } from "./types";
import { SemVer } from "semver";
import Config from "../config.json";

const BASE_URL = Config.QT_ONLINE_REPO_BASE_URL;

export const to_versions = (html: string): string[][] => {
  throw new Error("Unimplemented");
};

export const to_arches = (xml: string): string[] => {
  throw new Error("Unimplemented");
};

export const to_modules = (xml: string, [arch]: [string]): string[] => {
  throw new Error("Unimplemented");
};

export const to_archives = (
  xml: string,
  [arch, modules]: [string, string[]]
): string[] => {
  throw new Error("Unimplemented");
};

export const to_tools = (html: string): string[] => {
  throw new Error("Unimplemented");
};

export const to_tool_variants = (xml: string): ToolVariant[] => {
  throw new Error("Unimplemented");
};

export const to_url = ([host, target]: [Host, Target]): string => {
  const arch = host === Host.windows ? "x86" : "x64";
  return `${BASE_URL}/${Host[host]}_${arch}/${Target[target]}/`;
};

const _to_qt_updates_xml = (
  [host, target, version]: [Host, Target, SemVer],
  is_wasm = false
): string => {
  const ver =
    version.compare("5.9.0") === 0
      ? "qt5_59"
      : `qt${version.major}_${version.major}${version.minor}${version.patch}`;
  const ext = is_wasm ? "_wasm" : "";
  return `${to_url([host, target])}${ver}${ext}/Updates.xml`;
};

export const to_qt_wasm_updates_xml = (args: [Host, Target, SemVer]): string =>
  _to_qt_updates_xml(args, true);
export const to_qt_nowasm_updates_xml = (
  args: [Host, Target, SemVer]
): string => _to_qt_updates_xml(args, false);
export const to_qt_updates_xml =
  (arch: string) =>
  (args: [Host, Target, SemVer]): string =>
    _to_qt_updates_xml(args, arch.includes("wasm"));

export const to_tools_updates_xml = ([host, target, tool_name]: [
  Host,
  Target,
  string
]) => `${to_url([host, target])}${tool_name}/Updates.xml`;
