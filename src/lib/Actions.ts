import { Host, State, Target, ToolData } from "../State";

export const enum ActionT {
  chooseHost,
  chooseTarget,
  loadedVersionsTools,
  chooseVersion,
  loadedArchitectures,
  chooseArchitecture,
  loadedModulesArchives,
  chooseModule,
  chooseArchive,
  chooseTool,
  loadedToolVariants,
  chooseToolVariant,
}

export interface Action {
  type: ActionT;
  reduce: (state: State) => State;
}

export const setHost = (host: Host): Action => ({
  type: ActionT.chooseHost,
  reduce: (state: State): State => state.withHostLoadingVersionsTools(host),
});

export const setTarget = (target: Target): Action => ({
  type: ActionT.chooseTarget,
  reduce: (state: State): State => state.withTargetLoadingVersionsTools(target),
});

export const loadedVersionsTools = (
  versions: string[][],
  tools: string[]
): Action => ({
  type: ActionT.loadedVersionsTools,
  reduce: (state: State): State =>
    state.withVersionsToolsLoaded(versions, tools),
});

export const setVersion = (version: string): Action => ({
  type: ActionT.chooseVersion,
  reduce: (state: State): State => state.withVersionLoadingArches(version),
});

export const loadedArchitectures = (arches: string[]): Action => ({
  type: ActionT.loadedArchitectures,
  reduce: (state: State): State => state.withArchesLoaded(arches),
});

export const setArchitecture = (arch: string): Action => ({
  type: ActionT.chooseArchitecture,
  reduce: (state: State): State => state.withArchLoadingModulesArchives(arch),
});

export const loadedModulesArchives = (
  modules: string[],
  archives: string[]
): Action => ({
  type: ActionT.loadedModulesArchives,
  reduce: (state: State): State =>
    state.withModulesArchivesLoaded(modules, archives),
});

export const setModule = (module: string, isAdd: boolean): Action => ({
  type: ActionT.chooseModule,
  reduce: (state: State): State => state.withModuleSet(module, isAdd),
});

export const setAllModules = (): Action => ({
  type: ActionT.chooseModule,
  reduce: (state: State): State => state.withToggledModules(true),
});

export const clearModules = (): Action => ({
  type: ActionT.chooseModule,
  reduce: (state: State): State => state.withToggledModules(false),
});

export const setArchive = (archive: string, isAdd: boolean): Action => ({
  type: ActionT.chooseArchive,
  reduce: (state: State): State => state.withArchiveSet(archive, isAdd),
});

export const setAllArchives = (): Action => ({
  type: ActionT.chooseArchive,
  reduce: (state: State): State => state.withToggledArchives(true),
});

export const addTool = (toolName: string): Action => ({
  type: ActionT.chooseTool,
  reduce: (state: State): State =>
    state.withNewTool(new ToolData(toolName, true, new Map())),
});

export const loadedToolVariants = (variants: ToolData): Action => ({
  type: ActionT.loadedToolVariants,
  reduce: (state: State): State => state.withNewTool(variants),
});

export const removeTool = (toolName: string): Action => ({
  type: ActionT.chooseTool,
  reduce: (state: State): State => state.withoutTool(toolName),
});

export const addToolVariant = (
  toolName: string,
  toolVariant: string
): Action => ({
  type: ActionT.chooseToolVariant,
  reduce: (state: State): State =>
    state.withToolVariant(toolName, toolVariant, true),
});

export const removeToolVariant = (
  toolName: string,
  toolVariant: string
): Action => ({
  type: ActionT.chooseToolVariant,
  reduce: (state: State): State =>
    state.withToolVariant(toolName, toolVariant, false),
});

export const addAllToolVariants = (toolName: string): Action => ({
  type: ActionT.chooseToolVariant,
  reduce: (state: State): State =>
    state.withToggledToolVariants(toolName, true),
});

export const clearAllToolVariants = (toolName: string): Action => ({
  type: ActionT.chooseToolVariant,
  reduce: (state: State): State =>
    state.withToggledToolVariants(toolName, false),
});
