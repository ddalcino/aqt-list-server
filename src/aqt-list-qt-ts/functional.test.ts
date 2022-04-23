import {
  fetch_arches,
  fetch_archives,
  fetch_modules,
  fetch_tool_variants,
  fetch_tools,
  fetch_versions,
} from "./list-qt";
import util from "util";
import { exec } from "child_process";
import { hosts, targetsForHost } from "../lib/utils";
import {
  Host,
  hostFromStr,
  HostString,
  hostToStr,
  Target,
  targetFromStr,
  TargetString,
  targetToStr,
} from "../lib/types";
import { SemVer } from "semver";

const exec_promise = util.promisify(exec);

const get_versions = async (
  host: Host,
  target: Target
): Promise<string[][]> => {
  const stdout: string = (
    await exec_promise(
      `python -m aqt list-qt ${hostToStr(host)} ${targetToStr(target)}`
    )
  ).stdout.trim();
  if (stdout.length === 0) return [];
  return stdout.split("\n").map((line: string) => line.split(/\s+/));
};

const get_aqt_output = async (args: string[]): Promise<string[]> => {
  const stdout: string = (
    await exec_promise(`python -m aqt ${args.join(" ")}`)
  ).stdout.trim();
  if (stdout.length === 0) return [];
  return stdout.split(" ");
};

describe("list-qt.ts", () => {
  hosts.forEach((host: Host) =>
    targetsForHost(host).forEach((target: Target) => {
      it(`lists versions for host ${hostToStr(host)} and target ${targetToStr(
        target
      )}`, async () => {
        const actual = await fetch_versions(host, target);
        const expected = await get_versions(host, target);
        expect(actual).toEqual(expected);
      });

      it(`lists tools for host ${hostToStr(host)} and target ${targetToStr(
        target
      )}`, async () => {
        const actual = await fetch_tools(host, target);
        const expected = (
          await get_aqt_output([
            "list-tool",
            hostToStr(host),
            targetToStr(target),
          ])
        )[0]
          .split("\n")
          .sort();
        expect(actual).toEqual(expected);
      });
    })
  );

  it.each`
    host         | target       | version     | hard_expect
    ${"windows"} | ${"desktop"} | ${"5.9.0"}  | ${""}
    ${"windows"} | ${"desktop"} | ${"5.13.0"} | ${""}
    ${"windows"} | ${"desktop"} | ${"5.13.1"} | ${"wasm"}
    ${"windows"} | ${"desktop"} | ${"5.15.2"} | ${"wasm"}
    ${"windows"} | ${"desktop"} | ${"6.2.4"}  | ${"wasm"}
    ${"windows"} | ${"android"} | ${"5.9.0"}  | ${""}
    ${"windows"} | ${"android"} | ${"5.13.1"} | ${""}
    ${"windows"} | ${"android"} | ${"5.15.2"} | ${""}
    ${"windows"} | ${"android"} | ${"6.2.4"}  | ${"android_arm64_v8a android_armv7 android_x86 android_x86_64"}
    ${"mac"}     | ${"ios"}     | ${"5.9.0"}  | ${""}
    ${"mac"}     | ${"ios"}     | ${"5.13.1"} | ${""}
    ${"mac"}     | ${"ios"}     | ${"5.15.2"} | ${""}
    ${"mac"}     | ${"ios"}     | ${"6.2.4"}  | ${""}
  `(
    "should retrieve arches for $host $target $version",
    async ({
      host,
      target,
      version,
      hard_expect,
    }: {
      host: HostString;
      target: TargetString;
      version: string;
      hard_expect: string;
    }) => {
      const actual = await fetch_arches(
        hostFromStr(host),
        targetFromStr(target),
        new SemVer(version)
      );
      const expected = await (async (): Promise<string[]> => {
        if (hard_expect.length > 0 && hard_expect !== "wasm") {
          return hard_expect.split(" ");
        }
        const appended = hard_expect === "wasm" ? ["wasm_32"] : [];
        return (
          await get_aqt_output(["list-qt", host, target, "--arch", version])
        ).concat(appended);
      })();

      expect(actual).toEqual(expected);
    }
  );

  it.each`
    host         | target       | version     | arch
    ${"windows"} | ${"desktop"} | ${"5.9.0"}  | ${"win32_mingw53"}
    ${"windows"} | ${"desktop"} | ${"5.13.1"} | ${"wasm_32"}
    ${"windows"} | ${"desktop"} | ${"5.15.2"} | ${"win64_mingw81"}
    ${"windows"} | ${"desktop"} | ${"6.2.4"}  | ${"win64_mingw"}
  `(
    "should retrieve modules for $host $target $version $arch",
    async ({
      host,
      target,
      version,
      arch,
    }: {
      host: HostString;
      target: TargetString;
      version: string;
      arch: string;
    }) => {
      type ArgsT = [Host, Target, SemVer, string];
      const args: ArgsT = [
        hostFromStr(host),
        targetFromStr(target),
        new SemVer(version),
        arch,
      ];
      const ext = arch === "wasm_32" ? ["--extension", "wasm"] : [];
      const actual_modules = (await fetch_modules(...args)).sort();
      const actual_archives = (await fetch_archives(...args, []))
        .map((str: string) => str.split("-")[0])
        .sort();
      const m_args = [
        "list-qt",
        host,
        target,
        "--modules",
        version,
        arch,
      ].concat(ext);
      const a_args = [
        "list-qt",
        host,
        target,
        "--archives",
        version,
        arch,
      ].concat(ext);
      const [expect_modules, expect_archives] = await Promise.all([
        get_aqt_output(m_args),
        get_aqt_output(a_args),
      ]);

      expect(actual_modules).toEqual(expect_modules);
      expect(actual_archives).toEqual(expect_archives);
    }
  );
});
