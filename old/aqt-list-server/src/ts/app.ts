import {
  fetch_arches,
  fetch_modules,
  fetch_tool_variants,
  // fetch_tool_variants,
  fetch_tools,
  fetch_versions,
  ToolData,
} from "./api.js";

import { Host, State, Target, makeTargets, NO_SELECTION } from "./State";
import {
  rewriteCheckboxes,
  rewriteSelectElement,
  rewriteSelectElementStratified,
  updateSelectElement,
} from "./View";

const host_os = (() => {
  const app_ver = navigator.appVersion;
  if (app_ver.indexOf("Win") !== -1) return "windows";
  if (app_ver.indexOf("Mac") !== -1) return "mac";
  return "linux";
})();

const copyText = (el: HTMLElement): void => {
  navigator.clipboard.writeText(el.textContent as string);
};

let state = new State(host_os, makeTargets(host_os, "desktop"));
const [host, target, ver, arch] = ["host", "target", "qt_version", "arch"].map(
  (id) => <HTMLSelectElement>document.getElementById(id)
);
const checkAll = <HTMLInputElement>document.getElementById("check-all-modules");
const allModules = <HTMLDivElement>document.getElementById("all-modules");
const newTool = <HTMLSelectElement>document.getElementById("new-tool");

const [cmd, yml] = ["cmd", "yml"].map(
  (id) => <HTMLElement>document.getElementById(id)
);
const [copy_cmd, copy_yml] = ["copy-cmd", "copy-yml"].map(
  (id) => <HTMLButtonElement>document.getElementById(id)
);
copy_cmd.onclick = () => copyText(cmd);
copy_yml.onclick = () => copyText(yml);
const aqt_version = <HTMLSelectElement>document.getElementById("aqt_version");

const refreshView = (state: State): void => {
  updateSelectElement(host, state.host.selected.value);
  rewriteSelectElement(target, state.target);
  rewriteSelectElementStratified(ver, state.version);
  rewriteSelectElement(arch, state.arch);
  rewriteCheckboxes(
    { checkboxContainer: allModules, checkAll },
    state.modules,
    (name: string, on: boolean): void => {
      state = state.withModuleSet(name, on);
      refreshView(state);
    }
  );
  checkAll.checked = state.modules.hasAllOn();
  rewriteSelectElement(newTool, state.toolNames);
  cmd.textContent = state.toAqtInstallCmd(parseInt(aqt_version.value));
  yml.textContent = state.toInstallQtAction();
  copy_cmd.disabled = !state.hasOutputs();
  copy_yml.disabled = !state.hasOutputs();
};
aqt_version.onclick = () => refreshView(state);

const changeHost = async (newHost: string) => {
  state = state.withHostLoadingVersionsTools(newHost as Host);
  refreshView(state);

  const versions = await fetch_versions(
    state.host.selected.value,
    state.target.selected.value
  );
  const tools = await fetch_tools(
    state.host.selected.value,
    state.target.selected.value
  );
  state = state.withVersionsToolsLoaded(versions, tools);
  refreshView(state);
};
host.onchange = () => changeHost(host.value);
changeHost(host_os);

const changeTarget = async (newTarget: string) => {
  state = state.withTargetLoadingVersionsTools(newTarget as Target);
  refreshView(state);

  const versions = await fetch_versions(
    state.host.selected.value,
    state.target.selected.value
  );
  const tools = await fetch_tools(
    state.host.selected.value,
    state.target.selected.value
  );
  state = state.withVersionsToolsLoaded(versions, tools);
  refreshView(state);
};
target.onchange = () => changeTarget(target.value);

const changeVersion = async (newVersion: string) => {
  state = state.withVersionLoadingArches(newVersion);
  refreshView(state);
  if (!state.version.selected.state.hasSelection()) return;

  const arches = await fetch_arches(
    state.host.selected.value,
    state.target.selected.value,
    state.version.selected.value
  );
  state = state.withArchesLoaded(arches);
  if (arches.length === 1) {
    console.log(`Autoselect arch ${arches[0]}`);
    await changeArch(arches[0]);
    return;
  }
  refreshView(state);
};
ver.onchange = () => changeVersion(ver.value);

const changeArch = async (newArch: string) => {
  state = state.withArchLoadingModules(newArch);
  refreshView(state);
  if (!state.version.selected.state.hasSelection()) return;
  if (!state.arch.selected.state.hasSelection()) return;

  const modules = await fetch_modules(
    state.host.selected.value,
    state.target.selected.value,
    state.version.selected.value,
    state.arch.selected.value
  );
  state = state.withModulesLoaded(modules);
  refreshView(state);
};
arch.onchange = () => changeArch(arch.value);

const addTool = async (toolName: string) => {
  if (toolName == NO_SELECTION) return;
  state = state.withNewTool(new ToolData(toolName, []));
  refreshView(state);
  const toolData = await fetch_tool_variants(
    state.host.selected.value,
    state.target.selected.value,
    toolName
  );
  state = state.withNewTool(toolData);
  refreshView(state);
};
newTool.onchange = () => addTool(newTool.value);

const toggleAllModules = (on: boolean): void => {
  state = state.withToggledModules(on);
  refreshView(state);
};
checkAll.onclick = () => toggleAllModules(checkAll.checked);

// (window as any).fetch_tools = fetch_tools;
// (window as any).fetch_tool_variants = fetch_tool_variants;
