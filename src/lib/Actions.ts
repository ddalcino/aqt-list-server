import { State, ToolData, StateUtils as S } from "../State";
import { Host, Target } from "./utils";

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
  reduce: S.withHostLoadingVersionsTools(host),
});

export const setTarget = (target: Target): Action => ({
  type: ActionT.chooseTarget,
  reduce: S.withTargetLoadingVersionsTools(target),
});

export const loadedVersionsTools = (
  versions: string[][],
  tools: string[]
): Action => ({
  type: ActionT.loadedVersionsTools,
  reduce: S.withVersionsToolsLoaded(versions, tools),
});

export const setVersion = (version: string): Action => ({
  type: ActionT.chooseVersion,
  reduce: S.withVersionLoadingArches(version),
});

export const loadedArchitectures = (arches: string[]): Action => ({
  type: ActionT.loadedArchitectures,
  reduce: S.withArchesLoaded(arches),
});

export const setArchitecture = (arch: string): Action => ({
  type: ActionT.chooseArchitecture,
  reduce: S.withArchLoadingModulesArchives(arch),
});

export const loadedModulesArchives = (
  modules: string[],
  archives: string[]
): Action => ({
  type: ActionT.loadedModulesArchives,
  reduce: S.withModulesArchivesLoaded(modules, archives),
});

export const setModule = (module: string, isAdd: boolean): Action => ({
  type: ActionT.chooseModule,
  reduce: S.withModuleSet(module, isAdd),
});

export const setAllModules = (): Action => ({
  type: ActionT.chooseModule,
  reduce: S.withToggledModules(true),
});

export const clearModules = (): Action => ({
  type: ActionT.chooseModule,
  reduce: S.withToggledModules(false),
});

export const setArchive = (archive: string, isAdd: boolean): Action => ({
  type: ActionT.chooseArchive,
  reduce: S.withArchiveSet(archive, isAdd),
});

export const setAllArchives = (): Action => ({
  type: ActionT.chooseArchive,
  reduce: S.withToggledArchives(true),
});

export const addTool = (toolName: string): Action => ({
  type: ActionT.chooseTool,
  reduce: S.withNewTool(new ToolData(toolName, true, new Map())),
});

export const loadedToolVariants = (variants: ToolData): Action => ({
  type: ActionT.loadedToolVariants,
  reduce: S.withNewTool(variants),
});

export const removeTool = (toolName: string): Action => ({
  type: ActionT.chooseTool,
  reduce: S.withoutTool(toolName),
});

export const addToolVariant = (
  toolName: string,
  toolVariant: string
): Action => ({
  type: ActionT.chooseToolVariant,
  reduce: S.withToolVariant(toolName, toolVariant, true),
});

export const removeToolVariant = (
  toolName: string,
  toolVariant: string
): Action => ({
  type: ActionT.chooseToolVariant,
  reduce: S.withToolVariant(toolName, toolVariant, false),
});

export const addAllToolVariants = (toolName: string): Action => ({
  type: ActionT.chooseToolVariant,
  reduce: S.withToggledToolVariants(toolName, true),
});

export const clearAllToolVariants = (toolName: string): Action => ({
  type: ActionT.chooseToolVariant,
  reduce: S.withToggledToolVariants(toolName, false),
});
