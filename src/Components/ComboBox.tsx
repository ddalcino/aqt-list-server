import React from "react";
import { NO_SELECTION, SelectOne, Versions } from "../State";

interface Props {
  content: SelectOne | Versions;
  id: string;
  isAutofocus: boolean;
  children: React.ReactNode;
}

interface OptionProps {
  value: string;
  isSelected: boolean;
  displayName?: string;
}
const Option = (props: OptionProps): JSX.Element => {
  return (
    <option value={props.value} selected={props.isSelected}>
      {props.displayName ?? props.value}
    </option>
  );
};

const options = (content: SelectOne | Versions): JSX.Element[] => {
  const selectState = content.selected.state;
  const prefix = content.allowEmpty
    ? [<Option value={NO_SELECTION} isSelected={!selectState.hasSelection()} />]
    : [];

  if (selectState.isLoading())
    return [
      <Option
        value={NO_SELECTION}
        isSelected={true}
        displayName="Loading..."
      />,
    ];
  if (selectState.isNotLoaded())
    return [<Option value={NO_SELECTION} isSelected={true} />];

  const options = (content as SelectOne).options;
  if (options !== undefined)
    return options.map((option) => (
      <Option value={option} isSelected={option === content.selected.value} />
    ));

  return prefix.concat(
    (content as Versions).versions
      .filter((arr) => arr.length > 0)
      .map((minor_group) => {
        const major_minor = minor_group[0].split(".").slice(0, -1).join(".");
        return (
          <optgroup label={`Qt ${major_minor}`}>
            {minor_group.map((version) => (
              <Option
                value={version}
                isSelected={version === content.selected.value}
              />
            ))}
          </optgroup>
        );
      })
  );
};

const ComboBox = (props: Props): React.ReactElement => {
  const { content, id, children } = props;
  const selectState = content.selected.state;
  return (
    <div>
      <label htmlFor={id}>{children}</label>
      <select
        name={id}
        id={id}
        className={selectState.isLoading() ? "loading" : ""}
        disabled={selectState.isNotLoaded()}
        autoFocus={props.isAutofocus}
      >
        {options(content)}
      </select>
    </div>
  );
};
export default ComboBox;
