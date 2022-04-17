import { Host, PackageUpdate, PackageUpdates, Target } from "../lib/types";
import semver, { SemVer } from "semver";
import Config from "../config.json";

const BASE_URL = Config.QT_JSON_CACHE_BASE_URL;

export const to_versions = (directory_json: string): string[][] => {
  const directory: { qt: string[]; tools: string[] } =
    JSON.parse(directory_json);
  const versions = directory.qt
    .map((name: string) => name.match(/^qt\d_(\d+)$/))
    .reduce<string[]>((accum, match: RegExpMatchArray | null) => {
      if (match !== null) accum.push(match[1]);
      return accum;
    }, [])
    .map((ver: string) => {
      const chop_at = (a: number, b: number) =>
        new SemVer(`${ver.slice(0, a)}.${ver.slice(a, b)}.${ver.slice(b)}`);
      if (ver.length > 3) return chop_at(1, 3);
      if (ver.length === 3) return chop_at(1, 2);
      if (ver.length === 2) return new SemVer(`${ver[0]}.${ver[1]}.0`);
      throw new Error("Regex should make this unreachable");
    })
    .sort(semver.compare);

  // Sort and stratify
  const to_major_minor = (ver: SemVer): string => `${ver.major}.${ver.minor}`;
  const initial: { stratified: string[][]; major_minor: string } = {
    stratified: [],
    major_minor: "",
  };
  return versions.reduce(({ stratified, major_minor }, ver) => {
    const curr_mm = to_major_minor(ver);
    if (major_minor === "")
      return { stratified: [[ver.format()]], major_minor: curr_mm };
    else if (major_minor != curr_mm)
      return {
        stratified: [...stratified, [ver.format()]],
        major_minor: curr_mm,
      };
    stratified[stratified.length - 1].push(ver.format());
    return { stratified, major_minor };
  }, initial).stratified;
};

const version_nodot = (version: SemVer): string =>
  version.compare("5.9.0") === 0
    ? `${version.major}${version.minor}`
    : `${version.major}${version.minor}${version.patch}`;

export const to_arches = (
  updates: string,
  [actual_ver]: [SemVer]
): string[] => {
  const ver_nodot = version_nodot(actual_ver);
  const _updates: PackageUpdates = JSON.parse(updates);
  return Object.values(_updates)
    .filter((pkg: PackageUpdate) => pkg.DownloadableArchives.length)
    .reduce<string[]>((accum, pkg: PackageUpdate) => {
      const [ver, arch] = pkg.Name.split(".").slice(-2);
      if (ver === ver_nodot) accum.push(arch);
      return accum;
    }, Array<string>())
    .sort();
};

export const to_modules = (
  updates: string,
  [actual_ver, arch]: [SemVer, string]
): string[] => {
  const ver_nodot = version_nodot(actual_ver);
  //(r"^(preview\.)?qt\.(qt" + str(version.major) + r"\.)?" + qt_ver_str + r"\.(.+)$")
  const pattern = new RegExp(
    "^(preview.)?qt.(qt" +
      actual_ver.major +
      ".)?" +
      ver_nodot +
      ".(addons.)?(.+)$"
  );
  const _updates: PackageUpdates = JSON.parse(updates);
  return Object.values(_updates)
    .filter((pkg: PackageUpdate) => pkg.DownloadableArchives.length)
    .reduce<string[]>((accum, pkg: PackageUpdate) => {
      const mod_arch = pkg.Name.match(pattern)?.[4];
      if (mod_arch) {
        const chop_at = mod_arch.lastIndexOf(".");
        if (chop_at > 0 && arch === mod_arch.slice(chop_at + 1))
          accum.push(mod_arch.slice(0, chop_at));
      }
      return accum;
    }, Array<string>());
};

export const to_archives = (
  updates: string,
  [ver, arch, modules]: [SemVer, string, string[]]
): string[] => {
  const ver_nodot = version_nodot(ver);
  const _updates: PackageUpdates = JSON.parse(updates);
  return Object.values(_updates)
    .filter((pkg: PackageUpdate) => {
      const [mod, _arch] = pkg.Name.split(".").slice(-2);
      return (
        pkg.DownloadableArchives.length > 0 &&
        ((arch === _arch && modules.includes(mod)) ||
          pkg.Name.endsWith(`${ver_nodot}.${arch}`))
      );
    })
    .flatMap((pkg: PackageUpdate) => pkg.DownloadableArchives);
};

export const to_tools = (directory_json: string): string[] => {
  const directory: { qt: string[]; tools: string[] } =
    JSON.parse(directory_json);
  return directory.tools
    .filter((href: string) => href.startsWith("tools_"))
    .map((href: string) => (href.endsWith("/") ? href.slice(0, -1) : href));
};

export const to_tool_variants = (updates: string): PackageUpdate[] => {
  const _updates: PackageUpdates = JSON.parse(updates);
  return Object.values(_updates).filter(
    (pkg: PackageUpdate) => pkg.DownloadableArchives.length
  );
};

const to_url = ([host, target]: [Host, Target]): string =>
  `${BASE_URL}/${Host[host]}/${Target[target]}`;

export const to_directory = ([host, target]: [Host, Target]): string =>
  `${to_url([host, target])}/directory.json`;

const _to_qt_updates_json = (
  [host, target, version]: [Host, Target, SemVer],
  is_wasm = false
): string => {
  const ver_nodot = `qt${version.major}_${version_nodot(version)}`;
  const ext = is_wasm ? "_wasm" : "";
  return `${to_url([host, target])}/${ver_nodot}${ext}.json`;
};

export const to_qt_wasm_updates_json = (args: [Host, Target, SemVer]): string =>
  _to_qt_updates_json(args, true);
export const to_qt_nowasm_updates_json = (
  args: [Host, Target, SemVer]
): string => _to_qt_updates_json(args, false);
export const to_qt_updates_json =
  (arch: string) =>
  (args: [Host, Target, SemVer]): string =>
    _to_qt_updates_json(args, arch.includes("wasm"));

export const to_tools_updates_json = ([host, target, tool_name]: [
  Host,
  Target,
  string
]): string => `${to_url([host, target])}/${tool_name}.json`;
