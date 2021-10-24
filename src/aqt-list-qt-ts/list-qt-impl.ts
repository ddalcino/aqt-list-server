import {
  Host,
  PackageUpdate,
  Target,
  ToolVariant,
  toPackageUpdate,
} from "./types";
import semver, { SemVer } from "semver";
import Config from "../config.json";
import * as cheerio from "cheerio";
import { toHumanReadableSize } from "../lib/utils";

const BASE_URL = Config.QT_ONLINE_REPO_BASE_URL;

const scrape_table_hrefs = (html: string): string[] => {
  const hrefs: string[] = [];
  const $ = cheerio.load(html);
  $("tbody > tr > td > a").each((_, el) => {
    hrefs.push(el.attribs["href"]);
  });
  return hrefs;
};

const scrape_package_updates = (xml: string): PackageUpdate[] => {
  const getHumanReadableSize = (tag: Element, attr: string): string =>
    toHumanReadableSize(tag.attributes.getNamedItem(attr)?.value ?? "");
  const toArray = (tag: Element): string[] =>
    tag.textContent?.split(", ").filter((s) => s.length) ?? [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  const updates: PackageUpdate[] = [];
  for (const el of doc.querySelectorAll("PackageUpdate").values()) {
    let pkgUpdate = {};
    for (const tag of el.children) {
      pkgUpdate = (() => {
        switch (tag.tagName) {
          case "DisplayName":
            return { ...pkgUpdate, DisplayName: tag.textContent };
          case "Name":
            return { ...pkgUpdate, Name: tag.textContent };
          case "Description":
            return { ...pkgUpdate, Description: tag.textContent };
          case "ReleaseDate":
            return { ...pkgUpdate, ReleaseDate: tag.textContent };
          case "Version":
            return { ...pkgUpdate, Version: tag.textContent };
          case "UpdateFile":
            return {
              ...pkgUpdate,
              UncompressedSize: getHumanReadableSize(tag, "UncompressedSize"),
              CompressedSize: getHumanReadableSize(tag, "CompressedSize"),
            };
          case "DownloadableArchives":
            return {
              ...pkgUpdate,
              DownloadableArchives: toArray(tag),
            };
          default:
            return pkgUpdate;
        }
      })();
    }
    updates.push(toPackageUpdate(pkgUpdate));
  }
  return updates;
};

export const to_versions = (html: string): string[][] => {
  const versions = scrape_table_hrefs(html)
    .filter((href: string) => href.startsWith("qt"))
    .map((href: string) => href.match(/^qt\d_(\d+)\/$/))
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
      throw new Error("Regex should makes this unreachable");
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

export const to_arches = (xml: string, [actual_ver]: [SemVer]): string[] => {
  const ver_nodot = version_nodot(actual_ver);
  return scrape_package_updates(xml)
    .filter((pkg: PackageUpdate) => pkg.DownloadableArchives.length)
    .reduce<string[]>((accum, pkg: PackageUpdate) => {
      const [ver, arch] = pkg.Name.split(".").slice(-2);
      if (ver === ver_nodot) accum.push(arch);
      return accum;
    }, Array<string>())
    .sort();
};

export const to_modules = (
  xml: string,
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
  return scrape_package_updates(xml)
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
  xml: string,
  [ver, arch, modules]: [SemVer, string, string[]]
): string[] => {
  const ver_nodot = version_nodot(ver);
  return scrape_package_updates(xml)
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

export const to_tools = (html: string): string[] => {
  return scrape_table_hrefs(html)
    .filter((href: string) => href.startsWith("tools_"))
    .map((href: string) => (href.endsWith("/") ? href.slice(0, -1) : href));
};

export const to_tool_variants = (xml: string): ToolVariant[] =>
  scrape_package_updates(xml)
    .filter((pkg: PackageUpdate) => pkg.DownloadableArchives.length)
    .map(
      (pkg: PackageUpdate): ToolVariant => ({
        DisplayName: pkg.DisplayName,
        Name: pkg.Name,
        Description: pkg.Description,
        ReleaseDate: pkg.ReleaseDate,
        Version: pkg.Version,
        CompressedSize: pkg.CompressedSize,
        UncompressedSize: pkg.UncompressedSize,
        selected: false,
      })
    );

export const to_url = ([host, target]: [Host, Target]): string => {
  const arch = host === Host.windows ? "x86" : "x64";
  return `${BASE_URL}/${Host[host]}_${arch}/${Target[target]}/`;
};

const _to_qt_updates_xml = (
  [host, target, version]: [Host, Target, SemVer],
  is_wasm = false
): string => {
  const ver_nodot = `qt${version.major}_${version_nodot(version)}`;
  const ext = is_wasm ? "_wasm" : "";
  return `${to_url([host, target])}${ver_nodot}${ext}/Updates.xml`;
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
