import {
  Directory,
  Host,
  OnlineInstallers,
  PackageUpdate,
  RawPackageUpdates,
  Target,
  UnifiedInstallers,
} from "../lib/types";
import { SemVer } from "semver";
import {
  to_arches,
  to_archives,
  to_directory,
  to_modules,
  to_updates_urls_by_arch,
  to_tool_variants,
  to_tools,
  to_tools_updates_json,
  to_versions,
  to_updates_urls,
  official_releases_url,
  to_unified_installers,
} from "./list-qt-impl";
import Result from "../lib/Result";

class FetchError extends Error {}
type FetchResult<T> = Result<T, FetchError>;

/**
 * Fetch a json object at `url`,
 * push it through the `json_transform` function with the arguments (json_object, json_args),
 * and catch any errors (fetch or json marshalling).
 * @param url
 * @param json_transform  Function that turns json obj into usable data
 */
const generic_fetch_data = <T, U, V>(
  url: string,
  json_transform: (obj: V, args: U) => T
): ((json_args: U) => Promise<FetchResult<T>>) => {
  return async (json_args: U) => {
    // console.log(`fetch ${url}`);
    return fetch(url, { cache: "force-cache" })
      .then((response: Response) => response.json())
      .then((obj: V) =>
        Result.Ok<T, FetchError>(json_transform(obj, json_args))
      )
      .catch((err) => {
        return Result.Err<T, FetchError>(new FetchError(err));
      });
  };
};

export const fetch_versions = async (
  host: Host,
  target: Target
): Promise<string[][]> => {
  const versions = await generic_fetch_data<string[][], void, Directory>(
    to_directory([host, target]),
    to_versions
  )().then((result) => result.unwrap());
  if (target !== Target.android) {
    return versions;
  }
  // If we have android target, we need to fetch from the all_os directory as well.
  const all_os_versions = await generic_fetch_data<string[][], void, Directory>(
    to_directory([Host.all_os, target]),
    to_versions
  )().then((result) => result.unwrap());

  // Return versions (less than 6.7.0) and all_os_versions (greater or equal to 6.7.0)
  const has_versions_gte_670 = (versions: string[]): boolean => {
    if (versions.length === 0) return false;
    return new SemVer(versions[0]).compare("6.7.0") >= 0;
  };

  return [
    ...versions.filter((row: string[]) => !has_versions_gte_670(row)),
    ...all_os_versions.filter((row: string[]) => has_versions_gte_670(row)),
  ];
};

export const fetch_arches = async (
  host: Host,
  target: Target,
  version: SemVer
): Promise<string[]> => {
  const all_arches = await Promise.all(
    to_updates_urls(host, target, version).map((url) =>
      generic_fetch_data<string[], [SemVer], RawPackageUpdates>(
        url,
        to_arches
      )([version]).then((result) =>
        result.match(
          (arches: string[]): string[] => arches,
          (_err: FetchError): string[] => []
        )
      )
    )
  );
  return all_arches.flat();
};

export const fetch_modules = (
  host: Host,
  target: Target,
  version: SemVer,
  arch: string
): Promise<PackageUpdate[]> =>
  generic_fetch_data<PackageUpdate[], [SemVer, string], RawPackageUpdates>(
    to_updates_urls_by_arch(arch)([host, target, version]),
    to_modules
  )([version, arch]).then((result) => result.unwrap());

export const fetch_archive_info = async (
  host: Host,
  target: Target,
  version: SemVer,
  arch: string,
  modules: string[]
): Promise<Map<string, string>> =>
  generic_fetch_data<
    Map<string, string>,
    [SemVer, string, string[]],
    RawPackageUpdates
  >(
    to_updates_urls_by_arch(arch)([host, target, version]),
    to_archives
  )([version, arch, modules]).then((result) => result.unwrap());
export const fetch_archives = async (
  host: Host,
  target: Target,
  version: SemVer,
  arch: string,
  modules: string[]
): Promise<string[]> => {
  const archiveInfo = await fetch_archive_info(
    host,
    target,
    version,
    arch,
    modules
  );
  return [...archiveInfo.keys()].sort();
};

export const fetch_tools = (host: Host, target: Target): Promise<string[]> =>
  generic_fetch_data<string[], void, Directory>(
    to_directory([host, target]),
    to_tools
  )().then((result) => result.unwrap());

export const fetch_tool_variants = (
  host: Host,
  target: Target,
  tool_name: string
): Promise<PackageUpdate[]> =>
  generic_fetch_data<PackageUpdate[], void, RawPackageUpdates>(
    to_tools_updates_json([host, target, tool_name]),
    to_tool_variants
  )().then((result) => result.unwrap());

export const fetch_online_installers = (): Promise<UnifiedInstallers> =>
  generic_fetch_data<UnifiedInstallers, void, OnlineInstallers>(
    official_releases_url,
    to_unified_installers
  )().then((result) => result.unwrap());
