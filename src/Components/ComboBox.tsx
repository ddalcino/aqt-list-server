import React from "react";
import { NO_SELECTION, SelectOne, SelectState, Versions } from "../State";

interface Props {
  id: string;
  isAutofocus?: boolean;
  label: string;
  selectState: SelectState;
  value: string;
  children: JSX.Element[];
  onchange: (newValue: string) => void;
}

interface OptionProps {
  value: string;
  displayName?: string;
}
const Option = (props: OptionProps): JSX.Element => {
  return (
    <option value={props.value}>{props.displayName ?? props.value}</option>
  );
};

const emptyOption = (key_id: string): JSX.Element => (
  <Option value={NO_SELECTION} key={`${key_id}-empty`} />
);

const loadingOption = (key_id: string): JSX.Element => (
  <Option
    value={NO_SELECTION}
    key={`${key_id}-loading`}
    displayName="Loading..."
  />
);

export const options = (content: SelectOne, key_id: string): JSX.Element[] => {
  const selectState = content.selected.state;
  const prefix =
    content.allowEmpty && content.options.length !== 1
      ? [emptyOption(key_id)]
      : [];

  if (selectState.isLoading()) return [loadingOption(key_id)];
  if (selectState.isNotLoaded()) return [emptyOption(key_id)];

  return prefix.concat(
    content.options.map((option, index) => (
      <Option value={option} key={`${key_id}-${index}`} />
    ))
  );
};

export const optionsQtVersions = (
  content: Versions,
  key_id: string
): JSX.Element[] => {
  const selectState = content.selected.state;
  const prefix = content.allowEmpty ? [emptyOption(key_id)] : [];

  if (selectState.isLoading()) return [loadingOption(key_id)];
  if (selectState.isNotLoaded()) return [emptyOption(key_id)];

  return prefix.concat(
    content.versions
      .filter((arr) => arr.length > 0)
      .map((minor_group, groupIndex) => {
        const major_minor = minor_group[0].split(".").slice(0, -1).join(".");
        return (
          <optgroup label={`Qt ${major_minor}`} key={`${key_id}-${groupIndex}`}>
            {minor_group.map((version, index) => (
              <Option
                value={version}
                key={`${key_id}-${groupIndex}-${index}`}
              />
            ))}
          </optgroup>
        );
      })
  );
};

const ComboBox = (props: Props): JSX.Element => {
  const { selectState, id, label, value } = props;
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <select
        name={id}
        id={id}
        className={selectState.isLoading() ? "loading" : ""}
        disabled={selectState.isNotLoaded()}
        autoFocus={props.isAutofocus ?? false}
        value={value}
        onChange={(event) => props.onchange(event.target.value)}
      >
        {props.children}
      </select>
    </div>
  );
};
export default ComboBox;
