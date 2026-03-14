import {
  AqtDirectory,
  AqtEntry,
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
  aqt_updates_url,
  official_releases_url,
  to_aqt_directory,
  to_directory,
  to_tool_variants,
  to_tools,
  to_tools_updates_json,
  to_unified_installers,
  to_versions,
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
  return await generic_fetch_data<string[][], void, Directory>(
    to_aqt_directory([host, target]),
    to_versions
  )().then((result) => {
    const versions = result.unwrap();

    // TODO: remove this when aqt list-qt bug is fixed!
    // aqt list-qt says that it can list and install qt 6.7.* for android, on non-all_os hosts, but it cannont.
    if (host != Host.all_os && target == Target.android) {
      return versions.filter(([first_ver]) => !first_ver?.startsWith("6.7."));
    }

    return versions;
  });
};

export const fetch_arches = async (
  host: Host,
  target: Target,
  version: SemVer
): Promise<string[]> => {
  return await generic_fetch_data<string[], void, AqtDirectory>(
    aqt_updates_url([host, target, version]),
    (aqt_dir: AqtDirectory) => Object.keys(aqt_dir)
  )().then((result) => result.unwrap());
};

export const fetch_aqt_entry = (
  host: Host,
  target: Target,
  version: SemVer,
  arch: string
): Promise<AqtEntry> =>
  generic_fetch_data<AqtEntry, string, AqtDirectory>(
    aqt_updates_url([host, target, version]),
    (aqt_directory: AqtDirectory, arch: string): AqtEntry => aqt_directory[arch]
  )(arch).then((result) => result.unwrap());

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
