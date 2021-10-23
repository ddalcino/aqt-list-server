import {
  to_arches,
  to_archives,
  to_modules,
  to_qt_updates_xml,
  to_tool_variants,
  to_tools,
  to_url,
  to_versions,
} from "./list-qt-impl";
import { Host, Target, ToolVariant } from "./types";
import expect_win_desktop from "./test_data/windows-desktop-expect.json";
import expect_win_620 from "./test_data/windows-620-expect.json";
import expect_vcredist from "./test_data/windows-desktop-tools_vcredist-expect.json";
import fsPromises from "fs";
import Config from "../config.json";
import { SemVer } from "semver";

const [win_desktop_html, win_620_xml, win_desktop_vcredist_xml] = [
  "windows-desktop.html",
  "windows-620-update.xml",
  "windows-desktop-tools_vcredist-update.xml",
].map((filename: string) =>
  fsPromises.readFileSync(`src/aqt-list-qt-ts/test_data/${filename}`).toString()
);

test("scrapes versions from html", () => {
  const expected = expect_win_desktop.qt.qt.map((major_minor_row: string) =>
    major_minor_row.split(" ")
  );
  const actual = to_versions(win_desktop_html);
  expect(actual).toEqual(expected);
});

test("retrieves architectures from xml", () => {
  const expected = expect_win_620.architectures;
  const actual = to_arches(win_620_xml);
  expect(actual).toEqual(expected);
});

describe("retrieves modules from xml", () => {
  it.each(Object.entries(expect_win_620.modules_by_arch))(
    `should return modules when arch is %s`,
    (arch, expected_modules) => {
      const actual = to_modules(win_620_xml, [arch]);
      expect(actual).toEqual(expected_modules);
    }
  );
});

test("retrieves archives from xml", () => {
  const expected = ["todo fill this in"];
  const arch = "todo fill this in";
  const actual = to_archives(win_620_xml, [arch, ["todo fill this in"]]);
  expect(actual).toEqual(expected);
});

test("scrapes tools from html", () => {
  const expected = expect_win_desktop.tools;
  const actual = to_tools(win_desktop_html);
  expect(actual).toEqual(expected);
});

test("retrieves tool variants from xml", () => {
  const expected = Object.entries(expect_vcredist.modules_data).map(
    ([name, variant]) => {
      const {
        DisplayName,
        Description,
        ReleaseDate,
        Version,
        UpdateFile: { CompressedSize, UncompressedSize },
      } = variant;
      return {
        Name: name,
        DisplayName,
        Description,
        ReleaseDate,
        Version,
        CompressedSize,
        UncompressedSize,
        selected: false,
      } as ToolVariant;
    }
  );
  const actual = to_tool_variants(win_desktop_vcredist_xml);
  expect(actual).toEqual(expected);
});

const BASE_URL = Config.QT_ONLINE_REPO_BASE_URL;
describe("constructs url for directory", () => {
  it.each`
    host            | target            | result
    ${Host.windows} | ${Target.desktop} | ${BASE_URL + "/windows_x86/desktop/"}
    ${Host.windows} | ${Target.android} | ${BASE_URL + "/windows_x86/android/"}
    ${Host.windows} | ${Target.winrt}   | ${BASE_URL + "/windows_x86/winrt/"}
    ${Host.linux}   | ${Target.desktop} | ${BASE_URL + "/linux_x64/desktop/"}
    ${Host.linux}   | ${Target.android} | ${BASE_URL + "/linux_x64/android/"}
    ${Host.mac}     | ${Target.desktop} | ${BASE_URL + "/mac_x64/desktop/"}
    ${Host.mac}     | ${Target.android} | ${BASE_URL + "/mac_x64/android/"}
    ${Host.mac}     | ${Target.ios}     | ${BASE_URL + "/mac_x64/ios/"}
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
      const actual = to_url([host, target]);
      expect(actual).toEqual(result);
    }
  );
});
describe("constructs url for Updates.xml", () => {
  it.each`
    version      | arch          | expected_folder
    ${"5.9.0"}   | ${"wasm_32"}  | ${"qt5_59_wasm"}
    ${"6.2.0"}   | ${"wasm_64"}  | ${"qt6_620_wasm"}
    ${"6.29.0"}  | ${"wasm_128"} | ${"qt6_6290_wasm"}
    ${"5.12.11"} | ${"wasm_16"}  | ${"qt5_51211_wasm"}
    ${"5.9.0"}   | ${"mingw"}    | ${"qt5_59"}
    ${"6.2.0"}   | ${"mingw"}    | ${"qt6_620"}
    ${"6.29.0"}  | ${"mingw"}    | ${"qt6_6290"}
    ${"5.12.11"} | ${"mingw"}    | ${"qt5_51211"}
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
      const actual = to_qt_updates_xml(arch)([
        host,
        target,
        new SemVer(version),
      ]);
      expect(actual).toEqual(
        `${BASE_URL}/windows_x86/desktop/${expected_folder}/Updates.xml`
      );
    }
  );
});
