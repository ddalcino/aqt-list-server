import { makeState, State, StateReducer, StateUtils } from "./State";
import { hostFromStr, RawPackageUpdates, targetFromStr } from "./lib/types";
import win_620_json from "./aqt-list-qt-ts/test_data/windows-620-update.json";
import { to_archives, to_modules } from "./aqt-list-qt-ts/list-qt-impl";
import { SemVer } from "semver";

describe("makeState", () => {
  it.each`
    host         | target
    ${"windows"} | ${"desktop"}
    ${"mac"}     | ${"ios"}
    ${"linux"}   | ${"android"}
  `(
    "should make a new State with $host $target",
    ({
      host,
      target,
    }: {
      host: "windows" | "mac" | "linux";
      target: "desktop" | "android" | "ios" | "winrt";
    }) => {
      const state = makeState(hostFromStr(host), targetFromStr(target));
      expect(state.host.selected.value).toEqual(host);
      expect(state.target.selected.value).toEqual(target);
      expect(state.version.selected.state.isLoading()).toEqual(true);
    }
  );
});

const versions = [["6.1.0", "6.1.1", "6.1.2"], ["6.2.0"]];
const version = "6.2.0";
const arches = ["win64_mingw81", "win64_msvc2019_64", "win64_msvc2019_arm64"];
const arch = "win64_mingw81";
const tools = ["qtcreator", "qtifw"];

const win620JsonRaw = win_620_json as unknown as RawPackageUpdates;
const modules = to_modules(win620JsonRaw, [new SemVer(version), arch]);
const archives = to_archives(win620JsonRaw, [new SemVer(version), arch, []]);

const pipe =
  (funcs: StateReducer[]): StateReducer =>
  (state: State): State =>
    funcs.reduce((accum: State, func: StateReducer) => func(accum), state);

const apply = (state: State, funcs: StateReducer[]) => pipe(funcs)(state);

const state2modules = (state: State) =>
  Array.from(state.modules.selections.values()).map((v) => v.pkg);
const state2archives = (state: State) =>
  new Map(
    Array.from(state.archives.selections.values()).map((v) => [v.name, v.size])
  );

const makeLoadedState = () =>
  apply(makeState(hostFromStr("windows"), targetFromStr("desktop")), [
    StateUtils.withVersionsToolsLoaded(versions, tools),
    StateUtils.withVersionLoadingArches(version),
    StateUtils.withArchesLoaded(arches),
    StateUtils.withArchLoadingModulesArchives(arch),
    StateUtils.withModulesArchivesLoaded(modules, archives),
  ]);

describe("withVersionsToolsLoaded", () => {
  it("adds versions and tools to state", () => {
    const state = apply(
      makeState(hostFromStr("windows"), targetFromStr("desktop")),
      [StateUtils.withVersionsToolsLoaded(versions, tools)]
    );

    expect(state.version.versions).toEqual(versions);
    expect(state.version.selected.state.hasSelection()).toEqual(false);
    expect(state.toolNames.options).toEqual(tools);
  });
});

describe("withArchesLoaded", () => {
  it("adds architectures", () => {
    const state = apply(
      makeState(hostFromStr("windows"), targetFromStr("desktop")),
      [
        StateUtils.withVersionsToolsLoaded(versions, tools),
        StateUtils.withVersionLoadingArches(version),
        StateUtils.withArchesLoaded(arches),
      ]
    );

    expect(state.version.selected.value).toEqual(version);
    expect(state.arch.options).toEqual(arches);
    expect(state.arch.selected.state.hasSelection()).toEqual(false);
  });
});

describe("withModulesArchivesLoaded", () => {
  it("adds modules and archives", () => {
    const state = makeLoadedState();

    const actual = state2modules(state);
    expect(actual).toEqual(modules);
    expect(state.modules.hasAllOff()).toEqual(true);
    expect(state.modules.state.isNotLoaded()).toEqual(false);
    expect(state.modules.state.hasSelection()).toEqual(false);
  });
});

describe("withToggledModules", () => {
  it("selects all modules", () => {
    const state = StateUtils.withToggledModules(true)(makeLoadedState());

    const allModules = state2modules(state);
    expect(allModules).toEqual(modules);
    expect(state.modules.hasAllOff()).toEqual(false);
    expect(state.modules.hasAllOn()).toEqual(true);
  });
  it("deselects all modules", () => {
    const state = apply(makeLoadedState(), [
      StateUtils.withToggledModules(true),
      StateUtils.withToggledModules(false),
    ]);

    const allModules = state2modules(state);
    expect(allModules).toEqual(modules);
    expect(state.modules.hasAllOff()).toEqual(true);
    expect(state.modules.hasAllOn()).toEqual(false);
  });
});

describe("withToggledArchives", () => {
  it("turns off all archives", () => {
    const state = StateUtils.withToggledArchives(false)(makeLoadedState());

    const allArchives = state2archives(state);
    expect(allArchives).toEqual(archives);
    expect(state.archives.hasAllOff()).toEqual(true);
    expect(state.archives.hasAllOn()).toEqual(false);
  });
  it("reselects all archives", () => {
    const state = apply(makeLoadedState(), [
      StateUtils.withToggledArchives(false),
      StateUtils.withToggledArchives(true),
    ]);

    const allArchives = state2archives(state);
    expect(allArchives).toEqual(archives);
    expect(state.archives.hasAllOff()).toEqual(false);
    expect(state.archives.hasAllOn()).toEqual(true);
  });
});

describe("withArchiveSet", () => {
  it("deselects one archive", () => {
    const archiveName = "qtdeclarative";
    const state = StateUtils.withArchiveSet(
      archiveName,
      false
    )(makeLoadedState());

    const actual = state2archives(state);
    expect(actual).toEqual(archives);
    expect(state.archives.hasAllOff()).toEqual(false);
    expect(state.archives.hasAllOn()).toEqual(false);
    expect(state.archives.state.isNotLoaded()).toEqual(false);
    expect(state.archives.state.hasSelection()).toEqual(true);
    expect(state.archives.selections.get(archiveName)?.selected).toEqual(false);
    expect(state.archives.selections.get("qtbase")?.selected).toEqual(true);
  });
});

describe("withModuleSet", () => {
  it("selects one module", () => {
    const moduleName = "qt.qt6.620.addons.qtcharts.win64_mingw81";
    const state = StateUtils.withModuleSet(moduleName, true)(makeLoadedState());

    const actual = state2modules(state);
    expect(actual).toEqual(modules);
    expect(state.modules.hasAllOff()).toEqual(false);
    expect(state.modules.hasAllOn()).toEqual(false);
    expect(state.modules.state.isNotLoaded()).toEqual(false);
    expect(state.modules.state.hasSelection()).toEqual(true);
    expect(state.modules.selections.get(moduleName)?.selected).toEqual(true);
  });
});