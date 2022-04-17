import { Host, PackageUpdate, Target } from "../lib/types";
import { SemVer } from "semver";
import {
  to_arches,
  to_modules,
  to_qt_nowasm_updates_json,
  to_qt_wasm_updates_json,
  to_qt_updates_json,
  to_tool_variants,
  to_tools,
  to_tools_updates_json,
  to_directory,
  to_versions,
  to_archives,
} from "./list-qt-impl";
import Result from "../lib/Result";

class FetchError extends Error {}
type FetchResult<T> = Result<T, FetchError>;

const generic_fetch_data = <T, U, V>(
  url_func: (args: U) => string,
  xml_transform: (xml: string, args: V) => T
): ((url_args: U, xml_args: V) => Promise<FetchResult<T>>) => {
  return async (url_args: U, xml_args: V) => {
    const url = url_func(url_args);
    const response = await fetch(url, { cache: "force-cache" });
    if (response.status !== 200) {
      return Result.Err<T, FetchError>(
        new FetchError(`Bad fetch status: ${response.status}`)
      );
    }
    return Result.Ok<T, FetchError>(
      xml_transform(await response.text(), xml_args)
    );
  };
};

export const fetch_versions = (
  host: Host,
  target: Target
): Promise<string[][]> =>
  generic_fetch_data<string[][], [Host, Target], []>(to_directory, to_versions)(
    [host, target],
    []
  ).then((result) => result.unwrap());

export const fetch_arches = async (
  host: Host,
  target: Target,
  version: SemVer
): Promise<string[]> => {
  const [without_wasm, with_wasm] = await Promise.all(
    [to_qt_nowasm_updates_json, to_qt_wasm_updates_json].map((url_generator) =>
      generic_fetch_data<string[], [Host, Target, SemVer], [SemVer]>(
        url_generator,
        to_arches
      )([host, target, version], [version]).then((result) =>
        result.match(
          (arches: string[]): string[] => arches,
          (_err: FetchError): string[] => []
        )
      )
    )
  );
  return without_wasm.concat(with_wasm);
};

export const fetch_modules = (
  host: Host,
  target: Target,
  version: SemVer,
  arch: string
): Promise<string[]> =>
  generic_fetch_data<string[], [Host, Target, SemVer], [SemVer, string]>(
    to_qt_updates_json(arch),
    to_modules
  )([host, target, version], [version, arch]).then((result) => result.unwrap());

export const fetch_archives = async (
  host: Host,
  target: Target,
  version: SemVer,
  arch: string,
  modules: string[]
): Promise<string[]> =>
  generic_fetch_data<
    string[],
    [Host, Target, SemVer],
    [SemVer, string, string[]]
  >(to_qt_updates_json(arch), to_archives)(
    [host, target, version],
    [version, arch, modules]
  ).then((result) => result.unwrap());

export const fetch_tools = (host: Host, target: Target): Promise<string[]> =>
  generic_fetch_data<string[], [Host, Target], []>(to_directory, to_tools)(
    [host, target],
    []
  ).then((result) => result.unwrap());

export const fetch_tool_variants = (
  host: Host,
  target: Target,
  tool_name: string
): Promise<PackageUpdate[]> =>
  generic_fetch_data<PackageUpdate[], [Host, Target, string], []>(
    to_tools_updates_json,
    to_tool_variants
  )([host, target, tool_name], []).then((result) => result.unwrap());
