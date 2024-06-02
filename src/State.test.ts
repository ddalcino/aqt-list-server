import { makeState, State, StateReducer, StateUtils, ToolData } from "./State";
import {
  Host,
  hostFromStr,
  hostToStr,
  RawPackageUpdates,
  Target,
  targetFromStr,
} from "./lib/types";
import win_620_json from "./aqt-list-qt-ts/test_data/windows-620-update.json";
import tools_vcredist from "./aqt-list-qt-ts/test_data/windows-desktop-tools_vcredist-update.json";
import tools_vcredist_expect from "./aqt-list-qt-ts/test_data/windows-desktop-tools_vcredist-expect.json";
import official_rel from "./aqt-list-qt-ts/test_data/official_releases.json";
import {
  to_archives,
  to_modules,
  to_tool_variants,
} from "./aqt-list-qt-ts/list-qt-impl";
import { SemVer } from "semver";

const _makeState = (host: keyof typeof Host, target: keyof typeof Target) =>
  makeState(unifiedInstallers, hostFromStr(host), targetFromStr(target));

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
      const state = _makeState(host, target);
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
const tools = ["qtcreator", "qtifw", "tools_vcredist"];

const win620JsonRaw = win_620_json as unknown as RawPackageUpdates;
const modules = to_modules(win620JsonRaw, [new SemVer(version), arch]);
const archives = to_archives(win620JsonRaw, [new SemVer(version), arch, []]);
const vcredist = to_tool_variants(
  tools_vcredist as unknown as RawPackageUpdates
);

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
  apply(_makeState("windows", "desktop"), [
    StateUtils.withInstallersVersionsToolsLoaded(
      unifiedInstallers,
      versions,
      tools
    ),
    StateUtils.withVersionLoadingArches(version),
    StateUtils.withArchesLoaded(arches),
    StateUtils.withArchLoadingModulesArchives(arch),
    StateUtils.withModulesArchivesLoaded(modules, archives),
  ]);

describe("withVersionsToolsLoaded", () => {
  it("adds versions and tools to state", () => {
    const state = apply(_makeState("windows", "desktop"), [
      StateUtils.withInstallersVersionsToolsLoaded(
        unifiedInstallers,
        versions,
        tools
      ),
    ]);

    expect(state.version.versions).toEqual(versions);
    expect(state.version.selected.state.hasSelection()).toEqual(false);
    expect(state.toolNames.options).toEqual(tools);
  });
});

describe("withArchesLoaded", () => {
  it("adds architectures", () => {
    const state = apply(_makeState("windows", "desktop"), [
      StateUtils.withInstallersVersionsToolsLoaded(
        unifiedInstallers,
        versions,
        tools
      ),
      StateUtils.withVersionLoadingArches(version),
      StateUtils.withArchesLoaded(arches),
    ]);

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

// TODO: figure out how to mock out config.json with different file contents!
describe("toInstallQtAction", () => {
  describe("with no qt or tools selected", () => {
    it("should display valid yml", () => {
      const state = _makeState("windows", "desktop");
      expect(state.toInstallQtAction()).toEqual(
        "Please select a Qt version or a tool."
      );
    });
  });
  describe("with qt but no tools selected", () => {
    it("should display valid yml", () => {
      const state = makeLoadedState();
      expect(state.toInstallQtAction()).toEqual(`    - name: Install Qt
      uses: jurplel/install-qt-action@v3
      with:
        aqtversion: '==3.1.*'
        version: '6.2.0'
        host: 'windows'
        target: 'desktop'
        arch: 'win64_mingw81'`);
    });
  });
  describe("with tools but no qt selected", () => {
    it("should display valid yml", () => {
      const state = apply(_makeState("windows", "desktop"), [
        StateUtils.withInstallersVersionsToolsLoaded(
          unifiedInstallers,
          versions,
          ["tools_vcredist"]
        ),
        StateUtils.withNewTool(
          ToolData.fromPackageUpdates("tools_vcredist", vcredist)
        ),
        StateUtils.withToggledToolVariants("tools_vcredist", true),
      ]);
      expect(state.toInstallQtAction()).toEqual(`    - name: Install Qt
      uses: jurplel/install-qt-action@v3
      with:
        aqtversion: '==3.1.*'
        host: 'windows'
        target: 'desktop'
        toolsOnly: 'true'
        tools: 'tools_vcredist'`);
    });
    it("should properly select one tool", () => {
      const state = apply(_makeState("windows", "desktop"), [
        StateUtils.withInstallersVersionsToolsLoaded(
          unifiedInstallers,
          versions,
          ["tools_vcredist"]
        ),
        StateUtils.withNewTool(
          ToolData.fromPackageUpdates("tools_vcredist", vcredist)
        ),
        StateUtils.withToolVariant(
          "tools_vcredist",
          "qt.tools.vcredist_msvc2019_x86",
          true
        ),
      ]);
      expect(state.toInstallQtAction()).toEqual(`    - name: Install Qt
      uses: jurplel/install-qt-action@v3
      with:
        aqtversion: '==3.1.*'
        host: 'windows'
        target: 'desktop'
        toolsOnly: 'true'
        tools: 'tools_vcredist,qt.tools.vcredist_msvc2019_x86'`);
    });
  });
  describe("with both qt and tools selected", () => {
    it("should display valid yml", () => {
      const state = apply(makeLoadedState(), [
        StateUtils.withNewTool(
          ToolData.fromPackageUpdates("tools_vcredist", vcredist)
        ),
        StateUtils.withToggledToolVariants("tools_vcredist", true),
      ]);
      expect(state.toInstallQtAction()).toEqual(`    - name: Install Qt
      uses: jurplel/install-qt-action@v3
      with:
        aqtversion: '==3.1.*'
        version: '6.2.0'
        host: 'windows'
        target: 'desktop'
        arch: 'win64_mingw81'
        tools: 'tools_vcredist'`);
    });
  });
});

const unifiedInstallers = (host: Host) => {
  const installers = official_rel["online_installers/"];
  return (
    Object.entries(installers)
      ?.map(([key, _]) => key)
      ?.find((key) => key.includes(hostToStr(host))) || ""
  );
};

const officialQtUnifiedPreamble = (host: Host) => {
  const installer = unifiedInstallers(host);
  if (host == Host.windows) {
    return `Invoke-WebRequest \`
  -OutFile 'qt-unified-windows-x64-online.exe' \`
  'https://download.qt.io/official_releases/online_installers/qt-unified-windows-x64-online.exe'
./qt-unified-windows-x64-online.exe \`
  --accept-licenses \`
  --default-answer \`
  --confirm-command install \`
  `;
  }
  const chmod_line = `chmod u+x ${installer} && \\\n`;
  return `curl -L -O https://download.qt.io/official_releases/online_installers/${installer} && \\
  chmod u+x ${installer}
./${installer} \\
  --accept-licenses \\
  --default-answer \\
  --confirm-command install \\
  `;
};

describe("toOfficialInstallCmd", () => {
  describe("with no qt or tools selected", () => {
    it("should display valid yml", () => {
      const state = makeState(
        unifiedInstallers,
        hostFromStr("windows"),
        targetFromStr("desktop")
      );
      expect(state.toOfficialInstallCmd()).toEqual(
        "Please select a Qt version or a tool."
      );
    });
  });
  describe("with qt but no tools selected", () => {
    it("should display valid commands", () => {
      const state = makeLoadedState();
      const pre = officialQtUnifiedPreamble(Host.windows);
      expect(state.toOfficialInstallCmd()).toEqual(
        pre + "qt.qt6.620.win64_mingw81"
      );
    });
    it("should add modules", () => {
      const selected_modules = [
        "qt.qt6.620.addons.qtcharts.win64_mingw81",
        "qt.qt6.620.qtquicktimeline.win64_mingw81",
      ];
      const state = apply(
        makeLoadedState(),
        selected_modules.map((mod) => StateUtils.withModuleSet(mod, true))
      );
      expect(state.toOfficialInstallCmd()).toEqual(
        officialQtUnifiedPreamble(Host.windows) +
          `qt.qt6.620.win64_mingw81 \`
  qt.qt6.620.addons.qtcharts.win64_mingw81 \`
  qt.qt6.620.qtquicktimeline.win64_mingw81`
      );
    });
  });

  describe("with tools but no qt selected", () => {
    it("should display command that installs all tools in group", () => {
      const state = apply(_makeState("windows", "desktop"), [
        StateUtils.withInstallersVersionsToolsLoaded(
          unifiedInstallers,
          versions,
          ["tools_vcredist"]
        ),
        StateUtils.withNewTool(
          ToolData.fromPackageUpdates("tools_vcredist", vcredist)
        ),
        StateUtils.withToggledToolVariants("tools_vcredist", true),
      ]);
      expect(state.toOfficialInstallCmd()).toEqual(
        officialQtUnifiedPreamble(Host.windows) +
          tools_vcredist_expect.modules.sort().join(" `\n  ")
      );
    });
    it("should properly select one tool", () => {
      const variant = "qt.tools.vcredist_msvc2019_x86";
      const state = apply(_makeState("windows", "desktop"), [
        StateUtils.withInstallersVersionsToolsLoaded(
          unifiedInstallers,
          versions,
          ["tools_vcredist"]
        ),
        StateUtils.withNewTool(
          ToolData.fromPackageUpdates("tools_vcredist", vcredist)
        ),
        StateUtils.withToolVariant("tools_vcredist", variant, true),
      ]);
      expect(state.toOfficialInstallCmd()).toEqual(
        officialQtUnifiedPreamble(Host.windows) + variant
      );
    });
  });
  describe("with both qt and tools selected", () => {
    it("should display command that installs qt, modules, and all tools in group", () => {
      const selected_modules = [
        "qt.qt6.620.addons.qtcharts.win64_mingw81",
        "qt.qt6.620.qtquicktimeline.win64_mingw81",
      ];
      const state = apply(makeLoadedState(), [
        ...selected_modules.map((mod) => StateUtils.withModuleSet(mod, true)),
        StateUtils.withNewTool(
          ToolData.fromPackageUpdates("tools_vcredist", vcredist)
        ),
        StateUtils.withToggledToolVariants("tools_vcredist", true),
      ]);
      expect(state.toOfficialInstallCmd()).toEqual(
        officialQtUnifiedPreamble(Host.windows) +
          `qt.qt6.620.win64_mingw81 \`
  qt.qt6.620.addons.qtcharts.win64_mingw81 \`
  qt.qt6.620.qtquicktimeline.win64_mingw81 \`
  ${tools_vcredist_expect.modules.sort().join(" `\n  ")}`
      );
    });
    it("should display command that installs qt, modules, and one tool in group", () => {
      const variant = "qt.tools.vcredist_msvc2019_x86";
      const selected_modules = [
        "qt.qt6.620.addons.qtcharts.win64_mingw81",
        "qt.qt6.620.qtquicktimeline.win64_mingw81",
      ];
      const state = apply(_makeState("mac", "desktop"), [
        StateUtils.withInstallersVersionsToolsLoaded(
          unifiedInstallers,
          versions,
          ["tools_vcredist"]
        ),
        StateUtils.withVersionLoadingArches(version),
        StateUtils.withArchesLoaded(arches),
        StateUtils.withArchLoadingModulesArchives(arch),
        StateUtils.withModulesArchivesLoaded(modules, archives),
        ...selected_modules.map((mod) => StateUtils.withModuleSet(mod, true)),
        StateUtils.withNewTool(
          ToolData.fromPackageUpdates("tools_vcredist", vcredist)
        ),
        StateUtils.withToolVariant("tools_vcredist", variant, true),
      ]);
      expect(state.toOfficialInstallCmd()).toEqual(
        officialQtUnifiedPreamble(Host.mac) +
          `qt.qt6.620.win64_mingw81 \\
  qt.qt6.620.addons.qtcharts.win64_mingw81 \\
  qt.qt6.620.qtquicktimeline.win64_mingw81 \\
  ${variant}`
      );
    });
  });
});
