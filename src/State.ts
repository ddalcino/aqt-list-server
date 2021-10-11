// import _ from 'lodash';

export const enum SelectValue {
  NotLoaded,
  Loading,
  Loaded,
  Selected,
}

export class SelectState {
  constructor(private state: SelectValue) { }

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
    public options: Array<string> = [],
    public allowEmpty: boolean = true
  ) { }

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
  ) { }

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
    public selections: Map<string, boolean> = new Map<string, boolean>()
  ) { }

  hasSelections(): boolean {
    return [...this.selections.values()].includes(true);
  }

  hasAllOn(): boolean {
    if (this.selections.size <= 0) {
      return false;
    }
    return [...this.selections.values()].every((value: boolean) => value);
  }

  isLoading(): boolean {
    return this.state.isLoading();
  }

  isEmpty(): boolean {
    return this.selections.size === 0;
  }

  optionsTurnedOn(): Array<string> {
    return [...this.selections.entries()]
      .filter(([, isOn]) => isOn)
      .map(([name]) => name);
  }

  copy(): SelectMany {
    return new SelectMany(this.state.copy(), new Map(this.selections));
  }

  copyWithOptionSet(selectedOption: string, on: boolean): SelectMany {
    console.assert(this.selections.has(selectedOption));
    const m = new Map(this.selections);
    m.set(selectedOption, on);
    return new SelectMany(new SelectState(SelectValue.Selected), m);
  }

  copyWithAllOptions(allOn: boolean): SelectMany {
    return makeSelectMany([...this.selections.keys()], allOn);
  }
}

const makeSelectMany = (options: Array<string>, allOn: boolean): SelectMany => {
  const m = new Map(
    options.map((name: string): [string, boolean] => [name, allOn])
  );
  return new SelectMany(new SelectState(SelectValue.Loaded), m);
};

export interface ToolVariant {
  DisplayName: string;
  Name: string;
  Description: string;
  ReleaseDate: string;
  Version: string;
  selected: boolean
  // UpdateFile: { CompressedSize: string; UncompressedSize: string };
}

export class ToolData {
  constructor(public name: string, public isLoading: boolean, public variants: Map<string, ToolVariant>) { }

  copy(): ToolData {
    return this._copy((k: string, selected: boolean) => selected);
  }
  copyWithVariantSet(variant: string, on: boolean): ToolData {
    return this._copy((k: string, selected: boolean) => k === variant ? on : selected);
  }
  copyWithToggledVariants(on: boolean): ToolData {
    return this._copy((_k: string, _selected: boolean) => on);
  }
  _copy(shouldSelect: (variantName: string, existingSelected: boolean) => boolean): ToolData {
    const variants = new Map<string, ToolVariant>();
    this.variants.forEach((value: ToolVariant, variantName: string) =>
      variants.set(variantName, { ...value, selected: shouldSelect(variantName, value.selected) }));
    return new ToolData(
      this.name,
      this.isLoading,
      variants
    );
  }

  installCmd(host: string, target: string): string {
    if ([...this.variants.values()].every((variant: ToolVariant) => variant.selected))
      return `aqt install-tool ${host} ${target} ${this.name}`
    return [...this.variants.values()]
      .filter((variant: ToolVariant) => variant.selected)
      .map((variant: ToolVariant) => `aqt install-tool ${host} ${target} ${this.name} ${variant.Name}`)
      .join("\n");
  }
  variantTuples(isFilterBadVersions: boolean = true): string {
    const versionOk = (version: string): boolean => {
      if (!isFilterBadVersions) return true;
      return null !== version.match(/^\d+\.\d+\.\d+(?:-([0-9a-zA-Z.-]+))?(?:\+([0-9a-zA-Z.-]+))?$/)
    }
    return [...this.variants.values()]
      .filter((variant: ToolVariant) => variant.selected && versionOk(variant.Version))
      .map((variant: ToolVariant) => `${this.name},${variant.Version},${variant.Name}`)
      .join(" ");
  }
}

export class ToolSelector {
  constructor(public name: string, public toolVariants: SelectMany) { }

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

export type Host = "windows" | "mac" | "linux";
export type Target = "desktop" | "android" | "ios" | "winrt";

const hosts = ["windows", "mac", "linux"];
const targetsForHost = new Map<string, Array<string>>([
  ["windows", ["desktop", "android", "winrt"]],
  ["mac", ["desktop", "android", "ios"]],
  ["linux", ["desktop", "android"]],
]);

export class State {
  public host: SelectOne;

  constructor(
    host: Host,
    public target: SelectOne,
    public toolNames: SelectNone = new SelectNone(SelectValue.NotLoaded),
    public selectedTools: Map<string, ToolData> = new Map(), // Map: supports easy removal
    public version: Versions = new Versions(
      new Selection(SelectValue.NotLoaded),
      []
    ),
    public arch: SelectOne = new SelectOne(
      new Selection(SelectValue.NotLoaded),
      []
    ),
    public modules: SelectMany = new SelectMany(),
    public archives: SelectMany = new SelectMany(),
  ) {
    this.host = new SelectOne(
      new Selection(host, SelectValue.Selected),
      hosts,
      false
    );
  }

  withHostLoadingVersionsTools(newHost: Host): State {
    const targets = makeTargets(newHost, this.target.selected.value as Target);
    return new State(
      newHost as Host,
      targets,
      new SelectNone(SelectValue.Loading),
      new Map(),
      new Versions(new Selection(SelectValue.Loading), [])
    );
  }

  withTargetLoadingVersionsTools(newTarget: Target): State {
    const targets = makeTargets(this.host.selected.value as Host, newTarget);
    return new State(
      this.host.selected.value as Host,
      targets,
      new SelectNone(SelectValue.Loading),
      new Map(),
      new Versions(new Selection(SelectValue.Loading), [])
    );
  }

  withVersionsToolsLoaded(versions: string[][], tools: string[]): State {
    const versionsState =
      versions.length > 0 ? SelectValue.Loaded : SelectValue.NotLoaded;
    const toolsState =
      tools.length > 0 ? SelectValue.Loaded : SelectValue.NotLoaded;
    return new State(
      this.host.selected.value as Host,
      this.target.copy(),
      new SelectNone(toolsState, tools),
      new Map(),
      new Versions(new Selection(versionsState), versions)
    );
  }

  withVersionLoadingArches(newVersion: string): State {
    if (newVersion === NO_SELECTION) {
      return this.withVersionsToolsLoaded(
        [...this.version.versions],
        [...this.toolNames.options]
      );
    }
    return new State(
      this.host.selected.value as Host,
      this.target.copy(),
      this.toolNames.copy(),
      new Map(this.selectedTools),
      this.version.copyWithOption(newVersion),
      new SelectOne(new Selection(SelectValue.Loading), [])
    );
  }

  withArchesLoaded(arches: Array<string>): State {
    const selectState =
      arches.length > 0 ? SelectValue.Loaded : SelectValue.NotLoaded;
    return new State(
      this.host.selected.value as Host,
      this.target.copy(),
      this.toolNames.copy(),
      new Map(this.selectedTools),
      this.version.copy(),
      new SelectOne(new Selection(selectState), arches, arches.length !== 1)
    );
  }

  withArchLoadingModulesArchives(newArch: string): State {
    if (newArch === NO_SELECTION) {
      return this.withArchesLoaded([...this.arch.options]);
    }
    return new State(
      this.host.selected.value as Host,
      this.target.copy(),
      this.toolNames.copy(),
      new Map(this.selectedTools),
      this.version.copy(),
      this.arch.copyWithOption(newArch),
      new SelectMany(new SelectState(SelectValue.Loading))
    );
  }

  withModulesArchivesLoaded(modules: Array<string>, archives: Array<string>): State {
    return new State(
      this.host.selected.value as Host,
      this.target.copy(),
      this.toolNames.copy(),
      new Map(this.selectedTools),
      this.version.copy(),
      this.arch.copy(),
      makeSelectMany(modules, false),
      makeSelectMany(archives, true)
    );
  }

  withToggledModules(on: boolean): State {
    return new State(
      this.host.selected.value as Host,
      this.target.copy(),
      this.toolNames.copy(),
      new Map(this.selectedTools),
      this.version.copy(),
      this.arch.copy(),
      this.modules.copyWithAllOptions(on),
      this.archives.copy()
    );
  }

  withModuleSet(moduleName: string, on: boolean): State {
    return new State(
      this.host.selected.value as Host,
      this.target.copy(),
      this.toolNames.copy(),
      new Map(this.selectedTools),
      this.version.copy(),
      this.arch.copy(),
      this.modules.copyWithOptionSet(moduleName, on),
      this.archives.copy()
    );
  }

  withArchiveSet(archive: string, on: boolean): State {
    return new State(
      this.host.selected.value as Host,
      this.target.copy(),
      this.toolNames.copy(),
      new Map(this.selectedTools),
      this.version.copy(),
      this.arch.copy(),
      this.modules.copy(),
      this.archives.copyWithOptionSet(archive, on)
    );
  }

  withToggledArchives(on: boolean): State {
    return new State(
      this.host.selected.value as Host,
      this.target.copy(),
      this.toolNames.copy(),
      new Map(this.selectedTools),
      this.version.copy(),
      this.arch.copy(),
      this.modules.copy(),
      this.archives.copyWithAllOptions(on)
    );

  }

  withNewTool(newToolData: ToolData): State {
    const allToolData = new Map(this.selectedTools);
    allToolData.set(newToolData.name, newToolData);
    return new State(
      this.host.selected.value as Host,
      this.target.copy(),
      this.toolNames.copy(),
      allToolData,
      this.version.copy(),
      this.arch.copy(),
      this.modules.copy(),
      this.archives.copy()
    );
  }

  withoutTool(toolName: string): State {
    const allToolData = new Map(this.selectedTools);
    allToolData.delete(toolName);
    return new State(
      this.host.selected.value as Host,
      this.target.copy(),
      this.toolNames.copy(),
      allToolData,
      this.version.copy(),
      this.arch.copy(),
      this.modules.copy(),
      this.archives.copy()
    );
  }

  withToolVariant(toolName: string, toolVariant: string, on: boolean): State {
    const toolData = this.selectedTools.get(toolName) as ToolData;
    const allToolData = new Map(this.selectedTools);
    allToolData.set(toolName, toolData.copyWithVariantSet(toolVariant, on));
    return new State(
      this.host.selected.value as Host,
      this.target.copy(),
      this.toolNames.copy(),
      allToolData,
      this.version.copy(),
      this.arch.copy(),
      this.modules.copy(),
      this.archives.copy()
    );
  }

  withToggledToolVariants(toolName: string, on: boolean): State {
    const toolData = this.selectedTools.get(toolName) as ToolData;
    const allToolData = new Map(this.selectedTools);
    allToolData.set(toolName, toolData.copyWithToggledVariants(on));
    return new State(
      this.host.selected.value as Host,
      this.target.copy(),
      this.toolNames.copy(),
      allToolData,
      this.version.copy(),
      this.arch.copy(),
      this.modules.copy(),
      this.archives.copy()
    );
  }

  hasOutputs(): boolean {
    return (
      this.version.selected.state.hasSelection() &&
      this.arch.selected.state.hasSelection()
    );
  }

  values() {
    return {
      host: this.host.selected.value,
      target: this.target.selected.value,
      version: this.version.selected.value,
      arch: this.arch.selected.value
    }
  }

  toAqtInstallCmd(): string {
    if (!this.version.selected.state.hasSelection()) {
      return "Please select a version.";
    } else if (!this.arch.selected.state.hasSelection()) {
      return "Please select an architecture.";
    }
    const {host, target, version, arch} = this.values();
    const toolsLines = this.selectedTools.size === 0 ? "" : "\n" +
      [...this.selectedTools.values()]
        .map((toolData: ToolData) => toolData.installCmd(host, target))
    const modulesFlag = this.modules.hasAllOn()
      ? " -m all"
      : this.modules.hasSelections()
        ? " -m " + this.modules.optionsTurnedOn().join(" ")
        : "";
    const archivesFlag = this.archives.hasAllOn() ? "" :
      " --archives " + this.archives.optionsTurnedOn().join(" ");
    return `aqt install-qt ${host} ${target} ${version} ${arch}${modulesFlag}${archivesFlag}${toolsLines}`;
  }

  toInstallQtAction(): string {
    if (!this.version.selected.state.hasSelection()) {
      return "Please select a version.";
    } else if (!this.arch.selected.state.hasSelection()) {
      return "Please select an architecture.";
    }
    const modulesLine = this.modules.hasSelections()
      ? `\n        modules: '${this.modules.optionsTurnedOn().join(" ")}'`
      : "";
    const toolsTuples = [...this.selectedTools.values()]
      .map((toolData: ToolData) => toolData.variantTuples())
      .join(" ");
    const toolsLine = toolsTuples.length === 0 ? "" :
      `\n        tools: '${toolsTuples}'`
    return (
      `    - name: Install Qt
      uses: jurplel/install-qt-action@v2
      with:
        version: '${this.version.selected.value}'
        host: '${this.host.selected.value}'
        target: '${this.target.selected.value}'
        arch: '${this.arch.selected.value}'` + modulesLine + toolsLine
    );
  }
}

export const makeTargets = (host: Host, newTarget: Target): SelectOne => {
  const targets = targetsForHost.get(host) as string[];
  console.assert(targets);
  return new SelectOne(
    new Selection(
      targets.includes(newTarget) ? newTarget : "desktop",
      SelectValue.Selected
    ),
    targets,
    false
  );
};
