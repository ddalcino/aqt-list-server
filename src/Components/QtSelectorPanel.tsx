import React from "react";
import ComboBox, { options, optionsQtVersions } from "./ComboBox";
import { SelectOne, Versions } from "../State";

type ChangeValue = (str: string) => Promise<void>;

interface Props {
  host: SelectOne;
  target: SelectOne;
  version: Versions;
  arch: SelectOne;
  changeHost: ChangeValue;
  changeTarget: ChangeValue;
  changeVersion: ChangeValue;
  changeArch: ChangeValue;
}

const QtSelectorPanel = (props: Props): JSX.Element => {
  return (
    <div className="qt-selector-panel">
      <ComboBox
        id="host"
        label="Choose an OS:"
        isAutofocus={true}
        selectState={props.host.selected.state}
        value={props.host.selected.value}
        onchange={props.changeHost}
      >
        {options(props.host, "host")}
      </ComboBox>
      <ComboBox
        id="target"
        label="Choose a target:"
        selectState={props.target.selected.state}
        value={props.target.selected.value}
        onchange={props.changeTarget}
      >
        {options(props.target, "target")}
      </ComboBox>
      <ComboBox
        id="version"
        label="Choose a version:"
        selectState={props.version.selected.state}
        value={props.version.selected.value}
        onchange={props.changeVersion}
      >
        {optionsQtVersions(props.version, "version")}
      </ComboBox>
      <ComboBox
        id="arch"
        label="Choose an arch:"
        selectState={props.arch.selected.state}
        value={props.arch.selected.value}
        onchange={props.changeArch}
      >
        {options(props.arch, "arch")}
      </ComboBox>
    </div>
  );
};

export default QtSelectorPanel;
