import fetchMock from "jest-fetch-mock";
import { Host, Target } from "../lib/types";
import { SemVer } from "semver";
import { fetch_arches, fetch_versions } from "./list-qt";
import expect_win_680 from "./test_data/windows-680-expect.json";
import expect_win_620 from "./test_data/windows-620-expect.json";
import expect_win_desktop from "./test_data/windows-desktop-expect.json";
import fsPromises from "fs";

const [win_desktop_dir_json] = ["windows-desktop-directory.json"].map(
  (filename: string) =>
    fsPromises
      .readFileSync(`src/aqt-list-qt-ts/test_data/${filename}`)
      .toString()
);

beforeEach(() => {
  fetchMock.resetMocks();
  // fetch.resetMocks();
});

test.skip("fetch versions via HTTP", async () => {
  fetchMock.mockResponse(win_desktop_dir_json, { status: 200 });

  const [host, target] = [Host.windows, Target.desktop];
  const actual = await fetch_versions(host, target);
  const expected = expect_win_desktop.qt.qt.map((major_minor_row: string) =>
    major_minor_row.split(" ")
  );
  expect(actual).toEqual(expected);
});

describe("retrieves arches from HTTP", () => {
  it.skip.each`
    version    | expected_arches
    ${"6.8.0"} | ${expect_win_680.architectures}
    ${"6.2.0"} | ${[...expect_win_620.architectures, "wasm_32"]}
  `(
    "for version $version",
    async ({
      version,
      expected_arches,
    }: {
      version: string;
      expected_arches: string[];
    }) => {
      const [host, target] = [Host.windows, Target.desktop];
      const actual = await fetch_arches(host, target, new SemVer(version));
      expect(actual).toEqual(expected_arches);
    }
  );
});

test.skip("fetch arches via HTTP", async () => {
  // fetchMock.mockResponseOnce()

  const [host, target] = [Host.windows, Target.desktop];
  const version = new SemVer("6.2.0");
  const actual = await fetch_arches(host, target, version);
  const expected = [...expect_win_620.architectures, "wasm_32"];
  expect(actual).toEqual(expected);
});
