import {
  to_arches,
  to_archives,
  to_modules,
  to_updates_urls_by_arch,
  to_tool_variants,
  to_tools,
  to_directory,
  to_versions,
  to_unified_installers,
} from "./list-qt-impl";
import { Host, PackageUpdate, RawPackageUpdates, Target } from "../lib/types";
import win_desktop_directory from "./test_data/windows-desktop-directory.json";
import expect_win_desktop from "./test_data/windows-desktop-expect.json";
import win_620_json from "./test_data/windows-620-update.json";
import expect_win_620 from "./test_data/windows-620-expect.json";
import win_59_json from "./test_data/windows-59-update.json";
import expect_win_59 from "./test_data/windows-59-expect.json";
import win_desktop_vcredist_json from "./test_data/windows-desktop-tools_vcredist-update.json";
import expect_vcredist from "./test_data/windows-desktop-tools_vcredist-expect.json";
import official_releases from "./test_data/official_releases.json";
import Config from "../config.json";
import { SemVer } from "semver";
import { toHumanReadableSize } from "../lib/utils";

test("scrapes versions from html", () => {
  const expected = expect_win_desktop.qt.qt.map((major_minor_row: string) =>
    major_minor_row.split(" ")
  );
  const actual = to_versions(win_desktop_directory);
  expect(actual).toEqual(expected);
});

describe("retrieves arches from json", () => {
  it.each`
    version    | updates_json    | expected_arches
    ${"5.9.0"} | ${win_59_json}  | ${expect_win_59.architectures}
    ${"6.2.0"} | ${win_620_json} | ${expect_win_620.architectures}
  `(
    "should retrieve arches from json for version $version",
    ({
      version,
      updates_json,
      expected_arches,
    }: {
      version: string;
      updates_json: RawPackageUpdates;
      expected_arches: string[];
    }) => {
      const actual = to_arches(updates_json, [new SemVer(version)]);
      expect(actual).toEqual(expected_arches);
    }
  );
});

describe("retrieves modules from json", () => {
  const join_ver_testdata = (
    ver: SemVer,
    arch_expected: [string, string[]][],
    updates: RawPackageUpdates
  ): [SemVer, string, string[], RawPackageUpdates][] =>
    arch_expected.map(([arch, x_modules]) => [ver, arch, x_modules, updates]);

  it.each(
    join_ver_testdata(
      new SemVer("6.2.0"),
      Object.entries(expect_win_620.modules_by_arch),
      win_620_json as unknown as RawPackageUpdates
    ).concat(
      join_ver_testdata(
        new SemVer("5.9.0"),
        Object.entries(expect_win_59.modules_by_arch),
        win_59_json as unknown as RawPackageUpdates
      )
    )
  )(
    `should return modules when version is %s and arch is %s`,
    (
      ver: SemVer,
      arch: string,
      expected_modules: string[],
      updates: RawPackageUpdates
    ) => {
      const actual = to_modules(updates, [ver, arch]).map(
        (pkg: PackageUpdate): string => {
          const parts = pkg.Name.split(".");
          return parts[parts.length - 2];
        }
      );
      expect(actual).toEqual(expected_modules);
    }
  );
});

test("retrieves archives from json", () => {
  const win_620_base_archives = [
    "qtbase-Windows-Windows_10-MSVC2019-Windows-Windows_10-X86_64.7z",
    "qtsvg-Windows-Windows_10-MSVC2019-Windows-Windows_10-X86_64.7z",
    "qtdeclarative-Windows-Windows_10-MSVC2019-Windows-Windows_10-X86_64.7z",
    "qttools-Windows-Windows_10-MSVC2019-Windows-Windows_10-X86_64.7z",
    "qttranslations-Windows-Windows_10-MSVC2019-Windows-Windows_10-X86_64.7z",
    "d3dcompiler_47-x64.7z",
    "opengl32sw-64-mesa_11_2_2-signed.7z",
  ];
  const win_620_pos_archives = [
    "qtlocation-Windows-Windows_10-MSVC2019-Windows-Windows_10-X86_64.7z",
    ...win_620_base_archives,
  ];

  const [ver, arch] = [new SemVer("6.2.0"), "win64_msvc2019_64"];
  const actual_base_arc = to_archives(
    win_620_json as unknown as RawPackageUpdates,
    [ver, arch, []]
  );
  expect([...actual_base_arc.keys()].sort()).toEqual(
    win_620_base_archives.map((s) => s.split("-")[0]).sort()
  );
  const actual_base_pos_arc = to_archives(
    win_620_json as unknown as RawPackageUpdates,
    [ver, arch, ["qtpositioning"]]
  );
  expect([...actual_base_pos_arc.keys()].sort()).toEqual(
    win_620_pos_archives.map((s) => s.split("-")[0]).sort()
  );
});

test("scrapes tools from html", () => {
  const expected = expect_win_desktop.tools;
  const actual = to_tools(win_desktop_directory);
  expect(actual.sort()).toEqual(expected.sort());
});

test.skip("retrieves tool variants from json", () => {
  const expected = Object.entries(expect_vcredist.modules_data).map(
    ([name, variant]) => {
      const {
        DisplayName,
        Description,
        ReleaseDate,
        Version,
        DownloadableArchives,
        UpdateFile: { CompressedSize, UncompressedSize },
      } = variant;
      return {
        Name: name,
        DisplayName,
        Description,
        ReleaseDate,
        Version,
        CompressedSize: toHumanReadableSize(CompressedSize),
        UncompressedSize: toHumanReadableSize(UncompressedSize),
        DownloadableArchives: DownloadableArchives.split(", "),
        Dependencies: [],
        AutoDependOn: [],
        ArchiveSizes: new Map<string, string>(),
        // selected: false,
      } as PackageUpdate;
    }
  );
  const actual = to_tool_variants(win_desktop_vcredist_json);
  expect(actual).toEqual(expected);
});

const BASE_URL = Config.QT_JSON_CACHE_BASE_URL;
describe("constructs url for directory", () => {
  it.each`
    host            | target            | result
    ${Host.windows} | ${Target.desktop} | ${BASE_URL + "/windows/desktop/directory.json"}
    ${Host.windows} | ${Target.android} | ${BASE_URL + "/windows/android/directory.json"}
    ${Host.windows} | ${Target.winrt}   | ${BASE_URL + "/windows/winrt/directory.json"}
    ${Host.linux}   | ${Target.desktop} | ${BASE_URL + "/linux/desktop/directory.json"}
    ${Host.linux}   | ${Target.android} | ${BASE_URL + "/linux/android/directory.json"}
    ${Host.mac}     | ${Target.desktop} | ${BASE_URL + "/mac/desktop/directory.json"}
    ${Host.mac}     | ${Target.android} | ${BASE_URL + "/mac/android/directory.json"}
    ${Host.mac}     | ${Target.ios}     | ${BASE_URL + "/mac/ios/directory.json"}
  `(
    `should return url when host is %s, target is %s`,
    ({
      host,
      target,
      result,
    }: {
      host: Host;
      target: Target;
      result: string;
    }) => {
      const actual = to_directory([host, target]);
      expect(actual).toEqual(result);
    }
  );
});
describe("constructs url for Updates.json", () => {
  it.each`
    version      | arch                   | expected_folder
    ${"5.9.0"}   | ${"wasm_32"}           | ${"qt5_59_wasm"}
    ${"6.2.0"}   | ${"wasm_64"}           | ${"qt6_620_wasm"}
    ${"6.6.0"}   | ${"wasm_128"}          | ${"qt6_660_wasm"}
    ${"5.12.11"} | ${"wasm_16"}           | ${"qt5_51211_wasm"}
    ${"5.9.0"}   | ${"mingw"}             | ${"qt5_59"}
    ${"6.2.0"}   | ${"mingw"}             | ${"qt6_620"}
    ${"6.7.0"}   | ${"mingw"}             | ${"qt6_670"}
    ${"6.8.0"}   | ${"mingw"}             | ${"qt6_680/qt6_680"}
    ${"5.12.11"} | ${"mingw"}             | ${"qt5_51211"}
    ${"6.7.0"}   | ${"wasm_singlethread"} | ${"qt6_670_wasm_singlethread"}
    ${"6.7.0"}   | ${"wasm_multithread"}  | ${"qt6_670_wasm_multithread"}
    ${"6.8.0"}   | ${"wasm_multithread"}  | ${"qt6_680/qt6_680_wasm_multithread"}
  `(
    `should return url when version is $version, arch is $arch`,
    ({
      version,
      arch,
      expected_folder,
    }: {
      version: string;
      arch: string;
      expected_folder: string;
    }) => {
      const [host, target] = [Host.windows, Target.desktop];
      const actual = to_updates_urls_by_arch(arch)([
        host,
        target,
        new SemVer(version),
      ]);
      expect(actual).toEqual(
        `${BASE_URL}/windows/desktop/${expected_folder}.json`
      );
    }
  );
});

describe("to_unified_installers", () => {
  it.each`
    host            | installer
    ${Host.mac}     | ${"qt-unified-mac-x64-online.dmg"}
    ${Host.linux}   | ${"qt-unified-linux-x64-online.run"}
    ${Host.windows} | ${"qt-unified-windows-x64-online.exe"}
  `(
    `should return the $installer installer`,
    ({ host, installer }: { host: Host; installer: string }) => {
      const actual = to_unified_installers(official_releases);
      expect(actual(host)).toEqual(installer);
    }
  );
});
