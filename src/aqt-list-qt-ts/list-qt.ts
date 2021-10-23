import { Host, Target, ToolVariant } from "./types";
import { SemVer } from "semver";

export const fetch_versions = async (
  host: Host,
  target: Target
): Promise<string[][]> => {
  throw new Error("Unimplemented");
};

export const fetch_arches = async (
  host: Host,
  target: Target,
  version: SemVer
): Promise<string[]> => {
  throw new Error("Unimplemented");
};

export const fetch_modules = async (
  host: Host,
  target: Target,
  version: SemVer,
  arch: string
): Promise<string[]> => {
  throw new Error("Unimplemented");
};

export const fetch_archives = async (
  host: Host,
  target: Target,
  version: SemVer,
  arch: string,
  modules: string[]
): Promise<string[]> => {
  throw new Error("Unimplemented");
};

export const fetch_tools = async (
  host: Host,
  target: Target
): Promise<string[]> => {
  throw new Error("Unimplemented");
};

export const fetch_tool_variants = async (
  host: Host,
  target: Target,
  tool_name: string
): Promise<ToolVariant[]> => {
  throw new Error("Unimplemented");
};
