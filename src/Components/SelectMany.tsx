import React from "react";
import CheckBox from "./CheckBox";
import { SelectableElement } from "../lib/types";

type ToggleMany = Map<string, SelectableElement>;
interface Props {
  id: string;
  type: string;
  label: JSX.Element;
  options: ToggleMany;
  toggleAll: (on: boolean) => void;
  toggleOne: (on: boolean, name: string) => void;
}

const SelectMany = (props: Props): JSX.Element => {
  const { label, id, options, toggleAll, toggleOne, type } = props;
  const hasAllOn =
    options.size > 0 &&
    [...options.values()].every(
      (element: SelectableElement) => element.selected
    );

  return (
    <div>
      {label}
      <CheckBox
        id={`select-all-${id}`}
        name={`Check All`}
        isChecked={hasAllOn}
        onChange={(event) => toggleAll(event.target.checked)}
      />
      <br />
      {[...options.entries()].map(([name, element], index) => (
        <CheckBox
          key={`${id}-${index}`}
          id={`cb-${type}-${name}`}
          name={name}
          isChecked={element.selected ?? false}
          onChange={(event) => toggleOne(event.target.checked, name)}
        />
      ))}
    </div>
  );
};

export default SelectMany;
