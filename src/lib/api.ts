import { Host, Target, hostToStr, targetToStr, PackageUpdate } from "./types";
import Config from "../config.json";
import { SemVer } from "semver";

interface Versions {
  versions: Array<Array<string>>;
}

interface Architectures {
  architectures: Array<string>;
}

interface Modules {
  modules: Array<string>;
}

interface Archives {
  archives: Array<string>;
}

interface Tools {
  tools: Array<string>;
}

interface PackageUpdates {
  tool_variants: PackageUpdate[];
}

type MetaResult =
  | Versions
  | Architectures
  | Modules
  | Archives
  | Tools
  | PackageUpdates;

const baseurl: string = Config.BASE_URL[process.env.NODE_ENV];

const fetch_meta = async (url: string): Promise<MetaResult> => {
  console.log(`Fetch ${baseurl}/${url}`);
  return await fetch(`${baseurl}/${url}`, {
    method: "GET",
    cache: "force-cache",
  })
    .then((response) => {
      if (!response.ok) {
        console.log(response);
        throw response.statusText;
      }
      return response.json();
    })
    .catch((err) => {
      console.log("Fetch problem: " + err.message);
    });
};

const fetch_versions = async (
  host: Host,
  target: Target
): Promise<string[][]> => {
  return fetch_meta(
    `list-qt/versions/${hostToStr(host)}/${targetToStr(target)}/`
  ).then((meta) => (meta as Versions).versions);
};

const fetch_arches = (
  host: Host,
  target: Target,
  ver: SemVer
): Promise<string[]> =>
  fetch_meta(
    `list-qt/arch/${hostToStr(host)}/${targetToStr(target)}/${ver.format()}/`
  ).then((meta) => (meta as Architectures).architectures);

const fetch_modules = (
  host: Host,
  target: Target,
  ver: SemVer,
  arch: string
): Promise<string[]> =>
  fetch_meta(
    `list-qt/mod/${hostToStr(host)}/${targetToStr(
      target
    )}/${ver.format()}/${arch}/`
  ).then((meta) => (meta as Modules).modules);

const fetch_archives = (
  host: Host,
  target: Target,
  ver: SemVer,
  arch: string,
  modules: string[]
): Promise<string[]> => {
  const query = modules.length > 0 ? `?modules=${modules.join(",")}` : "";
  const url = `list-qt/archives/${hostToStr(host)}/${targetToStr(
    target
  )}/${ver.format()}/${arch}/${query}`;
  return fetch_meta(url).then((meta) => (meta as Archives).archives);
};

const fetch_tools = (host: Host, target: Target): Promise<string[]> =>
  fetch_meta(`list-tool/${hostToStr(host)}/${targetToStr(target)}/`).then(
    (meta) => (meta as Tools).tools
  );

const fetch_tool_variants = (
  host: Host,
  target: Target,
  tool_name: string
): Promise<PackageUpdate[]> =>
  fetch_meta(
    `list-tool/${hostToStr(host)}/${targetToStr(target)}/${tool_name}/`
  ).then((meta) => (meta as PackageUpdates).tool_variants);

export {
  fetch_versions,
  fetch_arches,
  fetch_archives,
  fetch_modules,
  fetch_tools,
  fetch_tool_variants,
};
