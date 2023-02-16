import {
  Directory,
  Host,
  PackageUpdate,
  RawPackageUpdates,
  Target,
  to_package_updates,
} from "../lib/types";
import semver, { SemVer } from "semver";
import Config from "../config.json";

const BASE_URL = Config.QT_JSON_CACHE_BASE_URL;

export const to_versions = (directory: Directory): string[][] => {
  const should_include_folder = (name: string): boolean =>
    ["_preview", "_src_doc_examples"].reduce(
      (accum: boolean, ext: string) => accum && !name.endsWith(ext),
      true
    );
  const raw_versions = directory.qt
    .filter(should_include_folder)
    .map((name: string) => name.match(/^qt\d_(\d+)/))
    .reduce<Set<string>>((accum, match: RegExpMatchArray | null) => {
      if (match !== null) accum.add(match[1]);
      return accum;
    }, new Set());
  const versions = Array.from(raw_versions)
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
  updates: RawPackageUpdates,
  [actual_ver]: [SemVer]
): string[] => {
  const ver_nodot = version_nodot(actual_ver);
  return to_package_updates(updates)
    .filter((pkg: PackageUpdate) => pkg.DownloadableArchives.length)
    .reduce<string[]>((accum, pkg: PackageUpdate) => {
      const [ver, arch] = pkg.Name.split(".").slice(-2);
      if (ver === ver_nodot) accum.push(arch);
      return accum;
    }, Array<string>())
    .sort();
};

export const to_modules = (
  updates: RawPackageUpdates,
  [actual_ver, arch]: [SemVer, string]
): PackageUpdate[] => {
  const ver_nodot = version_nodot(actual_ver);
  //(r"^(preview\.)?qt\.(qt" + str(version.major) + r"\.)?" + qt_ver_str + r"\.(.+)$")
  const pattern = new RegExp(
    "^(preview.)?qt.(qt" +
      actual_ver.major +
      ".)?" +
      ver_nodot +
      ".(addons.)?(.+)." +
      arch +
      "$"
  );
  return to_package_updates(updates)
    .filter((pkg: PackageUpdate) => pkg.DownloadableArchives.length)
    .filter((pkg: PackageUpdate): boolean => {
      const module = pkg.Name.match(pattern)?.[4];
      return module !== undefined && (module as string).length > 0;
    });
  //   .reduce<PackageUpdate[]>((accum, pkg: PackageUpdate) => {
  //   const mod_arch = pkg.Name.match(pattern)?.[4];
  //   if (mod_arch) {
  //     const chop_at = mod_arch.lastIndexOf(".");
  //     if (chop_at > 0 && arch === mod_arch.slice(chop_at + 1))
  //       accum.push(mod_arch.slice(0, chop_at));
  //   }
  //   return accum;
  // }, Array<PackageUpdate>());
};

// const retrieve_archive_info = (pkg_update: PackageUpdate): {filename_7z: string, size: string}[] => {
//   if
//   return [];
// };

type StringMap = Map<string, string>;
const flattenMaps = (maps: StringMap[]): StringMap => {
  return maps.reduce((accum: StringMap, m: StringMap) => {
    m.forEach((value: string, key: string) => {
      accum.set(key, value);
    });
    return accum;
  }, new Map<string, string>());
};

export const to_archives = (
  updates: RawPackageUpdates,
  [ver, arch, modules]: [SemVer, string, string[]]
): Map<string, string> => {
  const ver_nodot = version_nodot(ver);
  const maps = to_package_updates(updates)
    .filter((pkg: PackageUpdate) => {
      const [mod, _arch] = pkg.Name.split(".").slice(-2);
      return (
        pkg.DownloadableArchives.length > 0 &&
        ((arch === _arch && modules.includes(mod)) ||
          pkg.Name.endsWith(`${ver_nodot}.${arch}`))
      );
    })
    .map((pkg: PackageUpdate) => pkg.ArchiveSizes);
  return flattenMaps(maps);
};

export const to_tools = (directory: Directory): string[] => {
  return directory.tools
    .filter((href: string) => href.startsWith("tools_"))
    .map((href: string) => (href.endsWith("/") ? href.slice(0, -1) : href));
};

export const to_tool_variants = (
  updates: RawPackageUpdates
): PackageUpdate[] => {
  return to_package_updates(updates).filter(
    (pkg: PackageUpdate) => pkg.DownloadableArchives.length
  );
};

const to_url = ([host, target]: [Host, Target]): string =>
  `${BASE_URL}/${Host[host]}/${Target[target]}`;

export const to_directory = ([host, target]: [Host, Target]): string =>
  `${to_url([host, target])}/directory.json`;

const updates_url = (
  [host, target, version]: [Host, Target, SemVer],
  ext?: string
): string => {
  const ver_nodot = `qt${version.major}_${version_nodot(version)}`;
  const _ext = ext ? `_${ext}` : "";
  return `${to_url([host, target])}/${ver_nodot}${_ext}.json`;
};

const choose_ext_for_arch = (args: [Host, Target, SemVer], arch: string) => {
  const [_, target, version] = args;
  if (arch.includes("wasm_singlethread")) {
    return "wasm_singlethread";
  } else if (arch.includes("wasm_multithread")) {
    return "wasm_multithread";
  } else if (arch.includes("wasm")) {
    return "wasm";
  }
  if (version.major >= 6 && target == Target.android) {
    if (!arch.startsWith("android_")) {
      return "";
    }
    const suffix = arch.substring("android_".length);
    if (!["arm64_v8a", "armv7", "x86_64", "x86"].includes(suffix)) {
      return "";
    }
    return suffix;
  }
};

export const to_updates_urls_by_arch =
  (arch: string) =>
  (args: [Host, Target, SemVer]): string =>
    updates_url(args, choose_ext_for_arch(args, arch));

export const to_updates_urls = (
  host: Host,
  target: Target,
  version: SemVer
): string[] => {
  const args: [Host, Target, SemVer] = [host, target, version];
  const extensions: string[] = ((): string[] => {
    if (target === Target.android && version.major >= 6) {
      return ["arm64_v8a", "armv7", "x86", "x86_64"];
    } else if (target === Target.desktop && version.compare("6.5.0") >= 0) {
      return ["", "wasm_singlethread", "wasm_multithread"];
    } else if (target === Target.desktop && version.compare("5.13.0") > 0) {
      return ["", "wasm"];
    } else {
      return [""];
    }
  })();

  return extensions.map((suffix) => updates_url(args, suffix));
};

export const to_tools_updates_json = ([host, target, tool_name]: [
  Host,
  Target,
  string
]): string => `${to_url([host, target])}/${tool_name}.json`;
