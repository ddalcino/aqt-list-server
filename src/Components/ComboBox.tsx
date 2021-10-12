import React from "react";
import { NO_SELECTION, SelectValue } from "../State";

interface Props {
  selectState: SelectValue;
  values: string[];
  selected: string;
  id: string;
  isAutofocus: boolean;
  children: React.ReactNode;
}

const Option = (value: string, isSelected: boolean, displayName?: string) => {
  return (
    <option value={value} selected={isSelected}>
      {displayName ?? value}
    </option>
  );
};

const options = (props: Props): JSX.Element[] => {
  const { values, selectState, selected } = props;
  switch (selectState) {
    case SelectValue.Loading:
      return [Option(NO_SELECTION, true)];
    case SelectValue.NotLoaded:
      return [Option(NO_SELECTION, true, "Loading...")];
    default:
      return values.map((value) => Option(value, value === selected));
  }
};

const ComboBox = (props: Props): React.ReactElement => {
  const { selectState, id, children } = props;
  const className = selectState === SelectValue.Loading ? "loading" : "";
  const isDisabled =
    selectState === SelectValue.Loading ||
    selectState === SelectValue.NotLoaded;
  return (
    <div>
      <label htmlFor={id}>{children}</label>
      <select
        name={id}
        id={id}
        className={className}
        disabled={isDisabled}
        autoFocus={props.isAutofocus}
      >
        {options(props)}
      </select>
    </div>
  );
};
export default ComboBox;
