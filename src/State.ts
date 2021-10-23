// import _ from 'lodash';

import { Host, hosts, get_host_target_targets, Target } from "./lib/utils";
import _ from "lodash";
import { SelectableElement, ToolVariant } from "./aqt-list-qt-ts/types";

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
      .map(([name]) => name);
  }

  copy(): SelectMany {
    return new SelectMany(this.state.copy(), new Map(this.selections));
  }

  copyWithOptionSet(selectedOption: string, on: boolean): SelectMany {
    console.assert(this.selections.has(selectedOption));
    const m = new Map(this.selections);
    m.set(selectedOption, { selected: on });
    return new SelectMany(new SelectState(SelectValue.Selected), m);
  }

  copyWithAllOptions(allOn: boolean): SelectMany {
    return makeSelectMany([...this.selections.keys()], allOn);
  }
}

const makeSelectMany = (options: Array<string>, allOn: boolean): SelectMany => {
  const m = new Map(
    options.map((name: string): [string, SelectableElement] => [
      name,
      { selected: allOn },
    ])
  );
  return new SelectMany(new SelectState(SelectValue.Loaded), m);
};

export class ToolData {
  constructor(
    public name: string,
    public isLoading: boolean,
    public variants: Map<string, ToolVariant>
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
    const variants = new Map<string, ToolVariant>();
    this.variants.forEach((value: ToolVariant, variantName: string) =>
      variants.set(variantName, {
        ...value,
        selected: shouldSelect(variantName, value.selected),
      })
    );
    return new ToolData(this.name, this.isLoading, variants);
  }

  installCmd(host: string, target: string): string {
    if (
      [...this.variants.values()].every(
        (variant: ToolVariant) => variant.selected
      )
    )
      return `aqt install-tool ${host} ${target} ${this.name}`;
    return [...this.variants.values()]
      .filter((variant: ToolVariant) => variant.selected)
      .map(
        (variant: ToolVariant) =>
          `aqt install-tool ${host} ${target} ${this.name} ${variant.Name}`
      )
      .join("\n");
  }
  variantTuples(isFilterBadVersions = true): string {
    const versionOk = (version: string): boolean => {
      if (!isFilterBadVersions) return true;
      return (
        null !==
        version.match(
          /^\d+\.\d+\.\d+(?:-([0-9a-zA-Z.-]+))?(?:\+([0-9a-zA-Z.-]+))?$/
        )
      );
    };
    return [...this.variants.values()]
      .filter(
        (variant: ToolVariant) => variant.selected && versionOk(variant.Version)
      )
      .map(
        (variant: ToolVariant) =>
          `${this.name},${variant.Version},${variant.Name}`
      )
      .join(" ");
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
    public archives: SelectMany = new SelectMany()
  ) {}

  copy(): State {
    return new State(
      this.host.copy(),
      this.target.copy(),
      this.toolNames.copy(),
      new Map(this.selectedTools),
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

  values(): { host: Host; target: Target; version: string; arch: string } {
    return {
      host: this.host.selected.value as Host,
      target: this.target.selected.value as Target,
      version: this.version.selected.value,
      arch: this.arch.selected.value,
    };
  }

  toAqtInstallCmd(): string {
    if (!this.version.selected.state.hasSelection()) {
      return "Please select a version.";
    } else if (!this.arch.selected.state.hasSelection()) {
      return "Please select an architecture.";
    }
    const { host, target, version, arch } = this.values();
    const toolsLines =
      this.selectedTools.size === 0
        ? ""
        : "\n" +
          [...this.selectedTools.values()]
            .map((toolData: ToolData) => toolData.installCmd(host, target))
            .filter((tuple: string) => tuple.length > 0)
            .join("\n");
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
      .filter((tuple: string) => tuple.length > 0)
      .join(" ");
    const toolsLine =
      toolsTuples.length === 0 ? "" : `\n        tools: '${toolsTuples}'`;
    return (
      `    - name: Install Qt
      uses: jurplel/install-qt-action@v2
      with:
        version: '${this.version.selected.value}'
        host: '${this.host.selected.value}'
        target: '${this.target.selected.value}'
        arch: '${this.arch.selected.value}'` +
      modulesLine +
      toolsLine
    );
  }
}

type StateReducer = (state: State) => State;
export const StateUtils = {
  withHostLoadingVersionsTools:
    (newHost: Host) =>
    (state: State): State =>
      makeState(newHost, state.target.selected.value as Target),

  withTargetLoadingVersionsTools:
    (newTarget: Target) =>
    (state: State): State =>
      makeState(state.host.selected.value as Host, newTarget),

  withVersionsToolsLoaded: (
    versions: string[][],
    tools: string[]
  ): StateReducer => {
    const versionsState =
      versions.length > 0 ? SelectValue.Loaded : SelectValue.NotLoaded;
    const toolsState =
      tools.length > 0 ? SelectValue.Loaded : SelectValue.NotLoaded;
    return (state: State): State =>
      new State(
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
        return StateUtils.withVersionsToolsLoaded(
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
    (modules: string[], archives: string[]) =>
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

export const makeState = (host?: Host, target?: Target): State => {
  const [_host, _target, _targets] = get_host_target_targets(host, target);
  return new State(
    new SelectOne(new Selection(_host, SelectValue.Selected), hosts, false),
    new SelectOne(
      new Selection(_target, SelectValue.Selected),
      _targets,
      false
    ),
    new SelectNone(SelectValue.Loading),
    new Map(),
    new Versions(new Selection(SelectValue.Loading), [])
  );
};
