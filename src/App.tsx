import React, { useState } from "react";
import QtSelectorPanel from "./Components/QtSelectorPanel";
import CommandPanel from "./Components/CommandPanel";
import ToolSelectPanel from "./Components/ToolSelectPanel";
import SelectMany from "./Components/SelectMany";
import { makeState, NO_SELECTION, StateUtils as S, ToolData } from "./State";
import {
  Host,
  hostFromStr,
  HostString,
  Target,
  targetFromStr,
  TargetString,
} from "./lib/types";
import {
  fetch_arches,
  fetch_archives,
  fetch_modules,
  fetch_tool_variants,
  fetch_tools,
  fetch_versions,
} from "./aqt-list-qt-ts/list-qt";
import "./app.scss";
import { SemVer } from "semver";
import ComboBox, { options } from "./Components/ComboBox";

const App = (): JSX.Element => {
  const [state, setState] = useState(makeState());
  const loadVersionsTools = async (host: Host, target: Target) => {
    const [versions, tools] = await Promise.all([
      fetch_versions(host, target),
      fetch_tools(host, target),
    ]);
    setState(S.withVersionsToolsLoaded(versions, tools));
  };
  const loadModulesArchives = async (
    host: Host,
    target: Target,
    version: string,
    arch: string
  ) => {
    const [modules, archives] = await Promise.all([
      fetch_modules(host, target, new SemVer(version), arch),
      fetch_archives(host, target, new SemVer(version), arch, []),
    ]);
    setState(S.withModulesArchivesLoaded(modules, archives));
  };
  const loadArches = async (host: Host, target: Target, version: string) => {
    const arches = await fetch_arches(host, target, new SemVer(version));
    setState(S.withArchesLoaded(arches)); // will set arch automatically if only 1 arch available
    if (arches.length === 1) {
      // chain load of arches when only one option exists
      await loadModulesArchives(host, target, version, arches[0]);
    }
  };
  const loadTool = async (host: Host, target: Target, toolName: string) => {
    const variants = await fetch_tool_variants(host, target, toolName);
    setState(S.withNewTool(ToolData.fromPackageUpdates(toolName, variants)));
  };
  const isInvalid = (option: string) => option === NO_SELECTION || !option;

  // If versions is marked 'Loading...', we should load it:
  if (state.version.selected.state.isLoading())
    loadVersionsTools(
      hostFromStr(state.host.selected.value as HostString),
      targetFromStr(state.target.selected.value as TargetString)
    );

  return (
    <div className="vertical-flow">
      <h1>aqt list-qt server</h1>
      <div className="horizontal-flow">
        <QtSelectorPanel
          host={state.host}
          target={state.target}
          version={state.version}
          arch={state.arch}
          changeHost={async (host: string) =>
            setState(
              S.withHostLoadingVersionsTools(hostFromStr(host as HostString))
            )
          }
          changeTarget={async (target: string) =>
            setState(
              S.withTargetLoadingVersionsTools(
                targetFromStr(target as TargetString)
              )
            )
          }
          changeVersion={async (version: string) => {
            setState(S.withVersionLoadingArches(version));
            if (isInvalid(version)) return;
            const { host, target } = state.values();
            await loadArches(host, target, version);
          }}
          changeArch={async (arch: string) => {
            setState(S.withArchLoadingModulesArchives(arch));
            const { host, target, version } = state.values();
            if (isInvalid(arch) || isInvalid(version)) return;
            await loadModulesArchives(host, target, version, arch);
          }}
        />
        <SelectMany
          id="modules-selector"
          type="module"
          label={<span>Choose modules:</span>}
          options={state.modules.selections}
          toggleAll={(on: boolean) => setState(S.withToggledModules(on))}
          toggleOne={(on: boolean, name: string) =>
            setState(S.withModuleSet(name, on))
          }
        />
        <SelectMany
          id="archives-selector"
          type="archives"
          label={<span>Choose archives:</span>}
          options={state.archives.selections}
          toggleAll={(on: boolean) => setState(S.withToggledArchives(on))}
          toggleOne={(on: boolean, name: string) =>
            setState(S.withArchiveSet(name, on))
          }
        />
      </div>
      <ToolSelectPanel
        toolNames={state.toolNames}
        selectedTools={state.selectedTools}
        addTool={async (toolName: string) => {
          const { host, target } = state.values();
          setState(S.withNewTool(new ToolData(toolName, true, new Map())));
          await loadTool(host, target, toolName);
        }}
        removeTool={(toolName: string) => setState(S.withoutTool(toolName))}
        setToolVariant={(toolName: string, toolVariant: string, on: boolean) =>
          setState(S.withToolVariant(toolName, toolVariant, on))
        }
        toggleToolVariants={(toolName: string, on: boolean) =>
          setState(S.withToggledToolVariants(toolName, on))
        }
      />
      <CommandPanel
        id="aqt-command"
        label={
          <span>
            Your <a href="https://github.com/miurahr/aqtinstall">aqt install</a>{" "}
            command:
          </span>
        }
        command={state.toAqtInstallCmd()}
        isDisabled={!state.hasOutputs()}
      />
      <ComboBox
        id="install-action-version"
        label="Choose a version of jurplel/install-qt-action:"
        selectState={state.installActionVersion.selected.state}
        value={state.installActionVersion.selected.value}
        onchange={(version: string) =>
          setState(S.withInstallActionVersion(version))
        }
      >
        {options(state.installActionVersion, "install-action-version")}
      </ComboBox>
      <CommandPanel
        id="action-yaml"
        label={
          <span>
            Your{" "}
            <a href="https://github.com/jurplel/install-qt-action">
              jurplel/install-qt-action
            </a>{" "}
            yml:
          </span>
        }
        command={state.toInstallQtAction()}
        isDisabled={!state.hasOutputs()}
      />
    </div>
  );
};
export default App;
