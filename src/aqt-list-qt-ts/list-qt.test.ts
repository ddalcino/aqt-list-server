import {
  fetch_arches,
  fetch_archives,
  fetch_modules,
  fetch_tool_variants,
  fetch_tools,
  fetch_versions,
} from "./list-qt";
import {Host, Target, ToolVariant} from "./types";
import { SemVer } from "semver";
import expect_win_desktop from "./test_data/windows-desktop-expect.json";
import expect_win_620 from "./test_data/windows-620-expect.json";
import expect_vcredist from "./test_data/windows-desktop-tools_vcredist-expect.json";

test("fetches versions", async () => {
  const expected = expect_win_desktop.qt.qt.map((major_minor_row: string) =>
    major_minor_row.split(" ")
  );
  const actual = await fetch_versions(Host.windows, Target.desktop);
  expect(actual).toEqual(expected);
});

test("fetches architectures", async () => {
  const expected = expect_win_620.architectures;
  const actual = await fetch_arches(
    Host.windows,
    Target.desktop,
    new SemVer("6.2.0")
  );
  expect(actual).toEqual(expected);
});

describe("fetch modules", async () => {
  it.each(Object.entries(expect_win_620.modules_by_arch))(
    `should return the proper list of arches when arch is %s`,
    async (arch, expected_modules) => {
      const actual = await fetch_modules(
        Host.windows,
        Target.desktop,
        new SemVer("6.2.0"),
        "clang64"
      );
      expect(actual).toEqual(expected_modules);
    }
  );
});

test("fetches archives", async () => {
  const expected = ["todo fill this in"];
  const actual = await fetch_archives(
    Host.windows,
    Target.desktop,
    new SemVer("6.2.0"),
    "clang64",
    ["todo fill this in"]
  );
  expect(actual).toEqual(expected);
});

test("fetches tools", async () => {
  const expected = expect_win_desktop.tools;
  const actual = await fetch_tools(Host.windows, Target.desktop);
  expect(actual).toEqual(expected);
});

test("fetch tool variants", async () => {
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

  const actual = await fetch_tool_variants(
    Host.windows,
    Target.desktop,
    "tools_qtcreator"
  );
  expect(actual).toEqual(expected);
});
