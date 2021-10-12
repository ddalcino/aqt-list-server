import React from "react";

interface Props {
  key?: number;
  id: string;
  name: string;
  isChecked: boolean;
  onChange: (name: string) => void;
}

const CheckBox = (props: Props): React.ReactElement => {
  const { key, id, name, isChecked, onChange } = props;
  return (
    <div key={key}>
      <input
        type="checkbox"
        id={id}
        checked={isChecked}
        onClick={() => onChange(name)}
      />
      <label htmlFor={id}>{name}</label>
    </div>
  );
};
export default CheckBox;
