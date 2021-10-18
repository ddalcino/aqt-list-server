import { ToolData, ToolVariant } from "../State";
import Config from "../config.json";

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

interface ToolVariants {
  tool_variants: ToolVariant[];
}

type MetaResult =
  | Versions
  | Architectures
  | Modules
  | Archives
  | Tools
  | ToolVariants;

const baseurl: string = Config[process.env.NODE_ENV].BASE_URL;

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
  host: string,
  target: string
): Promise<string[][]> => {
  return fetch_meta(`list-qt/versions/${host}/${target}/`).then(
    (meta) => (meta as Versions).versions
  );
};

const fetch_arches = (
  host: string,
  target: string,
  ver: string
): Promise<string[]> =>
  fetch_meta(`list-qt/arch/${host}/${target}/${ver}/`).then(
    (meta) => (meta as Architectures).architectures
  );

const fetch_modules = (
  host: string,
  target: string,
  ver: string,
  arch: string
): Promise<string[]> =>
  fetch_meta(`list-qt/mod/${host}/${target}/${ver}/${arch}/`).then(
    (meta) => (meta as Modules).modules
  );

const fetch_archives = (
  host: string,
  target: string,
  ver: string,
  arch: string,
  modules: string[]
): Promise<string[]> => {
  const query = modules.length > 0 ? `?modules=${modules.join(",")}` : "";
  const url = `list-qt/archives/${host}/${target}/${ver}/${arch}/${query}`;
  return fetch_meta(url).then((meta) => (meta as Archives).archives);
};

const fetch_tools = (host: string, target: string): Promise<string[]> =>
  fetch_meta(`list-tool/${host}/${target}/`).then(
    (meta) => (meta as Tools).tools
  );

const fetch_tool_variants = (
  host: string,
  target: string,
  tool_name: string
): Promise<ToolData> =>
  fetch_meta(`list-tool/${host}/${target}/${tool_name}/`).then((meta) => {
    return new ToolData(
      tool_name,
      false,
      new Map<string, ToolVariant>(
        (meta as ToolVariants).tool_variants.map((variant) => [
          variant.Name,
          variant,
        ])
      )
    );
  });

export {
  fetch_versions,
  fetch_arches,
  fetch_archives,
  fetch_modules,
  fetch_tools,
  fetch_tool_variants,
};
