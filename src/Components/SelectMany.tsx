import React from "react";
import CheckBox from "./CheckBox";

type ToggleMany = Map<string, boolean>;
interface Props {
  id: string;
  type: string;
  label: JSX.Element;
  options: ToggleMany;
  selectAll: () => {};
}

const SelectMany = (props: Props) => {
  const { label, id, options, selectAll, type } = props;
  const hasAllOn = [...options.values()].every(
    (isChecked: boolean) => isChecked
  );

  return (
    <div>
      {label}
      <CheckBox
        id={`select-all-${id}`}
        name={`Check All`}
        isChecked={hasAllOn}
        onChange={() => selectAll()}
      />
      <br />
      {[...options.entries()].map(([name, isChecked], key) => (
        <CheckBox
          key={key}
          id={`cb-${type}-${name}`}
          name={`Check All`}
          isChecked={hasAllOn}
          onChange={() => selectAll()}
        />
      ))}
    </div>
  );
};

export default SelectMany;
