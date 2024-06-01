// import _ from 'lodash';

import { get_host_target_targets, hosts } from "./lib/utils";
import _ from "lodash";
import {
  Host,
  hostFromStr,
  HostString,
  hostToStr,
  PackageUpdate,
  SelectableElement,
  seModuleInstallName,
  seToolInstallName,
  Target,
  targetFromStr,
  TargetString,
  targetToStr,
  UnifiedInstallers,
} from "./lib/types";
import Config from "./config.json";
import { version_nodot } from "./aqt-list-qt-ts/list-qt-impl";
import { SemVer } from "semver";

export const enum SelectValue {
  NotLoaded,
  Loading,
  Loaded,
  Selected,
}

export class SelectState {
  constructor(private state: SelectValue) {}

  hasSelection(): boolean {
    return this.state === SelectValue.Selected;
  }

  isLoading(): boolean {
    return this.state === SelectValue.Loading;
  }

  isNotLoaded(): boolean {
    return this.isLoading() || this.state === SelectValue.NotLoaded;
  }

  copy(): SelectState {
    return new SelectState(this.state);
  }
}

export const NO_SELECTION = "---";

class Selection {
  public state: SelectState; // = SelectState.NotLoaded;
  public value: string; // = NO_SELECTION;

  constructor(valueOrState: string | SelectValue, state?: SelectValue) {
    if (typeof valueOrState === "string") {
      this.value = valueOrState;
      this.state = new SelectState(
        state !== undefined
          ? state
          : valueOrState === NO_SELECTION
          ? SelectValue.Loaded
          : SelectValue.Selected
      );
    } else {
      // it's a SelectState
      if (valueOrState === undefined)
        throw new Error("Misuse of Selection constructor");
      this.state = new SelectState(valueOrState as SelectValue);
      this.value = NO_SELECTION;
    }
  }
}

export class SelectOne {
  constructor(
    public selected: Selection,
    public options: Readonly<string[]> = [],
    public allowEmpty: boolean = true
  ) {}

  copy(): SelectOne {
    return this.copyWithOption(this.selected.value);
  }

  copyWithOption(option: string): SelectOne {
    console.assert(
      this.options.length > 0,
      "There's no need to copy a SelectOne that contains no selections"
    );
    const selected = new Selection(
      option,
      this.options.includes(option) ? SelectValue.Selected : SelectValue.Loaded
    );
    return new SelectOne(selected, [...this.options], this.allowEmpty);
  }
}

export class SelectNone extends SelectOne {
  constructor(value: SelectValue, options: string[] = []) {
    const state = value === SelectValue.Selected ? SelectValue.Loaded : value;
    super(new Selection(state), options);
  }
}

export const contains = <T>(haystack: Array<Array<T>>, needle: T): boolean =>
  haystack.reduce(
    (accum: boolean, row: Array<T>) => accum || row.includes(needle),
    false
  );

export class Versions {
  public allowEmpty = true;

  constructor(
    public selected: Selection,
    public versions: Array<Array<string>>
  ) {}

  copy(): Versions {
    return this.copyWithOption(this.selected.value);
  }

  copyWithOption(option: string): Versions {
    console.assert(
      this.versions.length > 0,
      "There's no need to copy a Versions that contains no selections"
    );
    const selected = new Selection(
      option,
      contains(this.versions, option)
        ? SelectValue.Selected
        : SelectValue.Loaded
    );
    return new Versions(
      selected,
      this.versions.map((row: Array<string>) => [...row])
    );
  }
}

export class SelectMany {
  constructor(
    public state: SelectState = new SelectState(SelectValue.NotLoaded),
    public selections: Map<string, SelectableElement> = new Map()
  ) {}

  hasSelections(): boolean {
    return (
      [...this.selections.values()].findIndex(
        (el: SelectableElement) => el.selected
      ) >= 0
    );
  }

  hasAllOn(): boolean {
    return (
      !this.isEmpty() &&
      [...this.selections.values()].every(
        (el: SelectableElement) => el.selected
      )
    );
  }

  hasAllOff(): boolean {
    return (
      !this.isEmpty() &&
      [...this.selections.values()].every(
        (el: SelectableElement) => !el.selected
      )
    );
  }

  isLoading(): boolean {
    return this.state.isLoading();
  }

  isEmpty(): boolean {
    return this.selections.size === 0;
  }

  optionsTurnedOn(): Array<string> {
    return [...this.selections.entries()]
      .filter(([, el]) => el.selected)
      .map(([name, el]) => seModuleInstallName(el) || name);
  }

  optionKeysTurnedOn(): Array<string> {
    return [...this.selections.entries()]
      .filter(([, el]) => el.selected)
      .map(([key, _]) => key);
  }

  copy(): SelectMany {
    return new SelectMany(this.state.copy(), new Map(this.selections));
  }

  copyWithOptionSet(selectedOption: string, on: boolean): SelectMany {
    console.assert(this.selections.has(selectedOption));
    const m = new Map(this.selections);
    const { pkg, name, size } = this.selections.get(
      selectedOption
    ) as SelectableElement;
    m.set(selectedOption, { pkg: pkg, size: size, name: name, selected: on });
    return new SelectMany(new SelectState(SelectValue.Selected), m);
  }

  copyWithAllOptions(allOn: boolean): SelectMany {
    const packages = Array.from(this.selections.values())
      .map((v) => v.pkg)
      .filter((pkg) => pkg !== null) as PackageUpdate[];
    const archives = new Map(
      Array.from(this.selections, ([key, value]) => [key, value.size || "???"])
    );

    return makeSelectMany(packages.length > 0 ? packages : archives, allOn);
  }
}

const makeSelectMany = (
  options: string[] | PackageUpdate[] | Map<string, string>,
  allOn: boolean
): SelectMany => {
  if (options instanceof Map) {
    const m = [...options.entries()].map(
      ([option, size]): [string, SelectableElement] => [
        option,
        {
          pkg: null,
          size,
          name: option,
          selected: allOn,
        },
      ]
    );
    return new SelectMany(new SelectState(SelectValue.Loaded), new Map(m));
  } else {
    const m = options.map(
      (
        option: string | PackageUpdate | Map<string, string>
      ): [string, SelectableElement] => {
        const name =
          typeof option === "string" ? option : (option as PackageUpdate).Name;
        const pkg =
          typeof option === "string" ? null : (option as PackageUpdate);
        return [
          name,
          {
            pkg,
            size: null,
            name,
            selected: allOn,
          },
        ];
      }
    );
    return new SelectMany(new SelectState(SelectValue.Loaded), new Map(m));
  }
};

export class ToolData {
  constructor(
    public name: string,
    public isLoading: boolean,
    public variants: Map<string, SelectableElement>
  ) {}

  copy(): ToolData {
    return this._copy((k: string, selected: boolean) => selected);
  }
  copyWithVariantSet(variant: string, on: boolean): ToolData {
    return this._copy((k: string, selected: boolean) =>
      k === variant ? on : selected
    );
  }
  copyWithToggledVariants(on: boolean): ToolData {
    return this._copy((_k: string, _selected: boolean) => on);
  }
  _copy(
    shouldSelect: (variantName: string, existingSelected: boolean) => boolean
  ): ToolData {
    const variants = new Map<string, SelectableElement>();
    this.variants.forEach((value: SelectableElement, variantName: string) =>
      variants.set(variantName, {
        ...value,
        selected: shouldSelect(variantName, value.selected),
      })
    );
    return new ToolData(this.name, this.isLoading, variants);
  }
  hasSelectedVariants(): boolean {
    return (
      [...this.variants.values()].findIndex(
        (variant: SelectableElement) => variant.selected
      ) >= 0
    );
  }

  selectedVariants(): string[] {
    return [...this.variants.entries()]
      .filter(([_, variant]) => variant.selected)
      .map(([key, _]) => key);
  }

  installCmd(host: string, target: string): string {
    if (
      [...this.variants.values()].every(
        (variant: SelectableElement) => variant.selected
      )
    )
      return `aqt install-tool ${host} ${target} ${this.name}`;
    return [...this.variants.values()]
      .filter((variant: SelectableElement) => variant.selected)
      .map(
        (variant: SelectableElement) =>
          `aqt install-tool ${host} ${target} ${this.name} ${seToolInstallName(
            variant
          )}`
      )
      .join("\n");
  }
  variantTuples(actionVersion: number): string {
    // For aqt < 2; jurplel/install-qt-action < 3
    const action2ToolsTuple = (variant: PackageUpdate): string =>
      `${this.name},${variant.Version},${variant.Name}`;
    // For aqt >= 2; jurplel/install-qt-action >= 3
    const action3ToolsTuple = (variant: PackageUpdate): string =>
      `${this.name},${variant.Name}`;

    if (
      [...this.variants.values()].every(
        (variant: SelectableElement) => variant.selected
      ) &&
      actionVersion >= 3
    )
      return this.name;

    return [...this.variants.values()]
      .filter(
        (variant: SelectableElement) =>
          variant.selected && variant?.pkg !== null
      )
      .map((variant: SelectableElement) =>
        actionVersion >= 3
          ? action3ToolsTuple(variant.pkg as PackageUpdate)
          : action2ToolsTuple(variant.pkg as PackageUpdate)
      )
      .join(" ");
  }
  public static fromPackageUpdates(
    tool_name: string,
    pkgUpdates: PackageUpdate[]
  ): ToolData {
    return new ToolData(
      tool_name,
      false,
      new Map<string, SelectableElement>(
        pkgUpdates.map((pkgUpdate) => [
          pkgUpdate.Name,
          {
            pkg: pkgUpdate,
            name: pkgUpdate.Name,
            selected: false,
          } as SelectableElement,
        ])
      )
    );
  }
}

export class ToolSelector {
  constructor(public name: string, public toolVariants: SelectMany) {}

  copy(): ToolSelector {
    return new ToolSelector(this.name, this.toolVariants.copy());
  }

  copyWithVariantSet(selectedVariant: string, on: boolean): ToolSelector {
    return new ToolSelector(
      this.name,
      this.toolVariants.copyWithOptionSet(selectedVariant, on)
    );
  }
}

export class State {
  constructor(
    public unifiedInstallers: UnifiedInstallers,
    public host: SelectOne,
    public target: SelectOne,
    public toolNames: SelectNone, // = new SelectNone(SelectValue.NotLoaded),
    public selectedTools: Map<string, ToolData>, // = new Map(), // Map: supports easy removal
    public version: Versions, // = new Versions(new Selection(SelectValue.NotLoaded), []),
    public arch: SelectOne = new SelectOne(
      new Selection(SelectValue.NotLoaded),
      []
    ),
    public modules: SelectMany = new SelectMany(),
    public archives: SelectMany = new SelectMany(),
    public installActionVersion: SelectOne = new SelectOne(
      new Selection("3"),
      ["2", "3"],
      false
    )
  ) {}

  copy(): State {
    return new State(
      this.unifiedInstallers,
      this.host.copy(),
      this.target.copy(),
      this.toolNames.copy(),
      new Map(this.selectedTools),
      this.version.copy(),
      this.arch.copy(),
      this.modules.copy(),
      this.archives.copy(),
      this.installActionVersion.copy()
    );
  }
  hasSelectedTools(): boolean {
    return (
      [...this.selectedTools.values()].findIndex((toolData: ToolData) =>
        toolData.hasSelectedVariants()
      ) >= 0
    );
  }
  hasOutputs(): boolean {
    return (
      this.hasSelectedTools() ||
      (this.version.selected.state.hasSelection() &&
        this.arch.selected.state.hasSelection())
    );
  }

  values(): { host: Host; target: Target; version: string; arch: string } {
    return {
      host: hostFromStr(this.host.selected.value as HostString),
      target: targetFromStr(this.target.selected.value as TargetString),
      version: this.version.selected.value,
      arch: this.arch.selected.value,
    };
  }

  toAqtInstallCmd(): string {
    const { host, target, version, arch } = this.values();
    const toolsLines =
      this.selectedTools.size === 0
        ? ""
        : "\n" +
          [...this.selectedTools.values()]
            .map((toolData: ToolData) =>
              toolData.installCmd(hostToStr(host), targetToStr(target))
            )
            .filter((tuple: string) => tuple.length > 0)
            .join("\n");
    if (
      toolsLines.trim().length > 0 &&
      !this.arch.selected.state.hasSelection()
    ) {
      return toolsLines.trim();
    } else if (!this.version.selected.state.hasSelection()) {
      return "Please select a Qt version or a tool.";
    } else if (!this.arch.selected.state.hasSelection()) {
      return "Please select a Qt architecture or a tool.";
    }
    if (this.modules.hasAllOff() && this.archives.hasAllOff())
      return "Cannot run `aqt` with no archives and no modules selected.";
    const modulesFlag = this.modules.hasAllOn()
      ? " -m all"
      : this.modules.hasSelections()
      ? " -m " + this.modules.optionsTurnedOn().join(" ")
      : "";
    const archivesFlag =
      this.archives.hasAllOn() || this.archives.isEmpty()
        ? ""
        : this.archives.hasAllOff()
        ? " --noarchives"
        : " --archives " + this.archives.optionsTurnedOn().join(" ");
    return `aqt install-qt ${hostToStr(host)} ${targetToStr(
      target
    )} ${version} ${arch}${modulesFlag}${archivesFlag}${toolsLines}`;
  }

  toOfficialInstallCmd(): string {
    const { host, version, arch } = this.values();
    const between_lines = " \\\n  ";
    const installer_bin = this.unifiedInstallers(host);
    const curl_cmd = `curl -L -J -O https://download.qt.io/official_releases/online_installers/${installer_bin}`;
    const tools = [...this.selectedTools.values()].flatMap(
      (toolData: ToolData) => toolData.selectedVariants()
    );
    if (tools.length === 0) {
      if (!this.version.selected.state.hasSelection()) {
        return "Please select a Qt version or a tool.";
      } else if (!this.arch.selected.state.hasSelection()) {
        return "Please select a Qt architecture or a tool.";
      }
    }
    const arch_modules = ((): string[] => {
      if (!this.version.selected.state.hasSelection()) {
        return [];
      }
      const ver = new SemVer(version);
      return [`qt.qt${ver.major}.${version_nodot(ver)}.${arch}`];
    })();
    const modules = [
      ...arch_modules,
      ...this.modules.optionKeysTurnedOn(),
      ...tools,
    ];
    return `${curl_cmd}
./${installer_bin} \\
  --accept-licenses \\
  --default-answer \\
  --confirm-command install \\
  ${modules.join(between_lines)}`;
  }

  toInstallQtAction(): string {
    const installQtActionVersion = parseInt(
      this.installActionVersion.selected.value
    );
    const toolsTuples = [...this.selectedTools.values()]
      .map((toolData: ToolData) =>
        toolData.variantTuples(installQtActionVersion)
      )
      .filter((tuple: string) => tuple.length > 0)
      .join(" ");
    const toolsLine =
      toolsTuples.length === 0 ? "" : `\n        tools: '${toolsTuples}'`;
    const py7zr = Config.REQUIRED_PY7ZR
      ? `\n        py7zrversion: '${Config.REQUIRED_PY7ZR}'`
      : "";
    const postscript = Config.POSTSCRIPT
      ? "\n        " + Config.POSTSCRIPT
      : "";
    if (
      toolsLine.trim().length > 0 &&
      !this.arch.selected.state.hasSelection()
    ) {
      return (
        `    - name: Install Qt
      uses: jurplel/install-qt-action@v${installQtActionVersion}
      with:
        aqtversion: '==${Config.RECOMMEND_AQT_VERSION}'${py7zr}
        host: '${this.host.selected.value}'
        target: '${this.target.selected.value}'
        toolsOnly: 'true'` +
        toolsLine +
        postscript
      );
    } else if (!this.version.selected.state.hasSelection()) {
      return "Please select a Qt version or a tool.";
    } else if (!this.arch.selected.state.hasSelection()) {
      return "Please select a Qt architecture or a tool.";
    }
    const modulesLine = this.modules.hasSelections()
      ? `\n        modules: '${this.modules.optionsTurnedOn().join(" ")}'`
      : "";
    const archivesLine =
      !this.archives.hasAllOn() && this.archives.hasSelections()
        ? `\n        archives: '${this.archives.optionsTurnedOn().join(" ")}'`
        : "";
    return (
      `    - name: Install Qt
      uses: jurplel/install-qt-action@v${installQtActionVersion}
      with:
        aqtversion: '==${Config.RECOMMEND_AQT_VERSION}'${py7zr}
        version: '${this.version.selected.value}'
        host: '${this.host.selected.value}'
        target: '${this.target.selected.value}'
        arch: '${this.arch.selected.value}'` +
      modulesLine +
      toolsLine +
      archivesLine +
      postscript
    );
  }
}

export type StateReducer = (state: State) => State;
export const StateUtils = {
  withHostLoadingVersionsTools:
    (newHost: Host) =>
    (state: State): State =>
      makeState(
        state.unifiedInstallers,
        newHost,
        targetFromStr(state.target.selected.value as TargetString)
      ),

  withTargetLoadingVersionsTools:
    (newTarget: Target) =>
    (state: State): State =>
      makeState(
        state.unifiedInstallers,
        hostFromStr(state.host.selected.value as HostString),
        newTarget
      ),

  withInstallersVersionsToolsLoaded: (
    unifiedInstallers: UnifiedInstallers,
    versions: string[][],
    tools: string[]
  ): StateReducer => {
    const versionsState =
      versions.length > 0 ? SelectValue.Loaded : SelectValue.NotLoaded;
    const toolsState =
      tools.length > 0 ? SelectValue.Loaded : SelectValue.NotLoaded;
    return (state: State): State =>
      new State(
        unifiedInstallers,
        state.host.copy(),
        state.target.copy(),
        new SelectNone(toolsState, tools),
        new Map(),
        new Versions(new Selection(versionsState), versions)
      );
  },

  withVersionLoadingArches:
    (newVersion: string) =>
    (state: State): State => {
      if (newVersion === NO_SELECTION) {
        return StateUtils.withInstallersVersionsToolsLoaded(
          state.unifiedInstallers,
          [...state.version.versions],
          [...state.toolNames.options]
        )(state);
      }
      const newState = _.cloneDeep(state);
      newState.version.selected = new Selection(
        newVersion,
        SelectValue.Selected
      );
      newState.arch = new SelectOne(new Selection(SelectValue.Loading), []);
      newState.modules = new SelectMany();
      newState.archives = new SelectMany();
      return newState;
    },

  withArchesLoaded:
    (arches: string[]) =>
    (state: State): State => {
      const selection = (() => {
        if (arches.length === 1) return new Selection(arches[0]);
        if (arches.length > 1) return new Selection(SelectValue.Loaded);
        return new Selection(SelectValue.NotLoaded);
      })();
      const newState = _.cloneDeep(state);
      newState.arch = new SelectOne(selection, arches);
      return newState;
    },

  withArchLoadingModulesArchives:
    (newArch: string) =>
    (state: State): State => {
      if (newArch === NO_SELECTION) {
        return StateUtils.withArchesLoaded([...state.arch.options])(state);
      }
      const newState = _.cloneDeep(state);
      newState.arch.selected = new Selection(newArch, SelectValue.Selected);
      newState.modules = new SelectMany(new SelectState(SelectValue.Loading));
      newState.archives = new SelectMany(new SelectState(SelectValue.Loading));
      return newState;
    },

  withModulesArchivesLoaded:
    (modules: PackageUpdate[], archives: Map<string, string>) =>
    (state: State): State => {
      const newState = _.cloneDeep(state);
      newState.modules = makeSelectMany(modules, false);
      newState.archives = makeSelectMany(archives, true);
      return newState;
    },

  withToggledModules:
    (on: boolean) =>
    (state: State): State => {
      const newState = _.cloneDeep(state);
      newState.modules = state.modules.copyWithAllOptions(on);
      // TODO update archives
      return newState;
    },

  withModuleSet:
    (moduleName: string, on: boolean) =>
    (state: State): State => {
      const newState = _.cloneDeep(state);
      newState.modules = state.modules.copyWithOptionSet(moduleName, on);
      // TODO update archives
      return newState;
    },

  withArchiveSet:
    (archive: string, on: boolean) =>
    (state: State): State => {
      const newState = _.cloneDeep(state);
      newState.archives = state.archives.copyWithOptionSet(archive, on);
      return newState;
    },

  withToggledArchives:
    (on: boolean) =>
    (state: State): State => {
      const newState = _.cloneDeep(state);
      newState.archives = state.archives.copyWithAllOptions(on);
      return newState;
    },

  withNewTool:
    (newToolData: ToolData) =>
    (state: State): State => {
      const newState = _.cloneDeep(state);
      newState.selectedTools.set(newToolData.name, newToolData);
      return newState;
    },

  withInstallActionVersion:
    (newInstallActionVersion: string) =>
    (state: State): State => {
      const newState = _.cloneDeep(state);
      newState.installActionVersion.selected.value = newInstallActionVersion;
      return newState;
    },

  withoutTool:
    (toolName: string) =>
    (state: State): State => {
      const newState = _.cloneDeep(state);
      newState.selectedTools.delete(toolName);
      return newState;
    },

  withToolVariant:
    (toolName: string, toolVariant: string, on: boolean) =>
    (state: State): State => {
      const newState = _.cloneDeep(state);
      const toolData = state.selectedTools.get(toolName) as ToolData;
      newState.selectedTools.set(
        toolName,
        toolData.copyWithVariantSet(toolVariant, on)
      );
      return newState;
    },

  withToggledToolVariants:
    (toolName: string, on: boolean) =>
    (state: State): State => {
      const newState = _.cloneDeep(state);
      const toolData = state.selectedTools.get(toolName) as ToolData;
      newState.selectedTools.set(
        toolName,
        toolData.copyWithToggledVariants(on)
      );
      return newState;
    },
};

export const makeState = (
  installers: UnifiedInstallers,
  host?: Host,
  target?: Target
): State => {
  const [_host, _target, _targets] = get_host_target_targets(host, target);
  return new State(
    installers,
    new SelectOne(
      new Selection(hostToStr(_host), SelectValue.Selected),
      hosts.map(hostToStr),
      false
    ),
    new SelectOne(
      new Selection(targetToStr(_target), SelectValue.Selected),
      _targets.map(targetToStr),
      false
    ),
    new SelectNone(SelectValue.Loading),
    new Map(),
    new Versions(new Selection(SelectValue.Loading), [])
  );
};
