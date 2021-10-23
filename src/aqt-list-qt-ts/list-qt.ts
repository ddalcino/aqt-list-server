import { Host, Target, ToolVariant } from "./types";
import { SemVer } from "semver";
import {
  to_arches,
  to_modules,
  to_qt_nowasm_updates_xml,
  to_qt_wasm_updates_xml,
  to_qt_updates_xml,
  to_tool_variants,
  to_tools,
  to_tools_updates_xml,
  to_url,
  to_versions,
  to_archives,
} from "./list-qt-impl";

class Http404 extends Error {}

const generic_fetch_data = <T, U, V>(
  url_func: (args: U) => string,
  xml_transform: (xml: string, args: V) => T
): ((url_args: U, xml_args: V) => Promise<T>) => {
  return async (url_args: U, xml_args: V) => {
    const url = url_func(url_args);
    return fetch(url)
      .then((response: Response) => {
        if (response.status === 404) throw new Http404("Http 404!");
        if (response.status !== 200) {
          throw new Error(`Failed HTTP fetch with status ${response.status}`);
        }
        return response.text();
      })
      .then((xml: string) => xml_transform(xml, xml_args))
      .catch((ex) => {
        console.log(ex);
        throw new Error(`Failed HTTP fetch: ${ex}`);
      });
  };
};

export const fetch_versions = (
  host: Host,
  target: Target
): Promise<string[][]> =>
  generic_fetch_data<string[][], [Host, Target], []>(to_url, to_versions)(
    [host, target],
    []
  );

export const fetch_arches = async (
  host: Host,
  target: Target,
  version: SemVer
): Promise<string[]> => {
  const [without_wasm, with_wasm] = await Promise.all(
    [to_qt_nowasm_updates_xml, to_qt_wasm_updates_xml].map((url_generator) => {
      try {
        return generic_fetch_data<string[], [Host, Target, SemVer], []>(
          url_generator,
          to_arches
        )([host, target, version], []);
      } catch (ex) {
        if (ex instanceof Http404) {
          return [];
        }
        throw ex;
      }
    })
  );
  return without_wasm.concat(with_wasm);
};

export const fetch_modules = (
  host: Host,
  target: Target,
  version: SemVer,
  arch: string
): Promise<string[]> =>
  generic_fetch_data<string[], [Host, Target, SemVer], [string]>(
    to_qt_updates_xml(arch),
    to_modules
  )([host, target, version], [arch]);

export const fetch_archives = async (
  host: Host,
  target: Target,
  version: SemVer,
  arch: string,
  modules: string[]
): Promise<string[]> =>
  generic_fetch_data<string[], [Host, Target, SemVer], [string, string[]]>(
    to_qt_updates_xml(arch),
    to_archives
  )([host, target, version], [arch, modules]);

export const fetch_tools = (host: Host, target: Target): Promise<string[]> =>
  generic_fetch_data<string[], [Host, Target], []>(to_url, to_tools)(
    [host, target],
    []
  );

export const fetch_tool_variants = (
  host: Host,
  target: Target,
  tool_name: string
): Promise<ToolVariant[]> =>
  generic_fetch_data<ToolVariant[], [Host, Target, string], []>(
    to_tools_updates_xml,
    to_tool_variants
  )([host, target, tool_name], []);
