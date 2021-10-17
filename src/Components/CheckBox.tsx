import React from "react";

interface Props {
  id: string;
  name: string;
  isChecked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const CheckBox = ({ id, name, isChecked, onChange }: Props): JSX.Element => {
  return (
    <div>
      <input
        type="checkbox"
        id={id}
        checked={isChecked}
        // onClick={(event: React.MouseEvent<HTMLInputElement, MouseEvent>) => onChange(event)}//onChange}
        onChange={onChange}
      />
      <label htmlFor={id}>{name}</label>
    </div>
  );
};
export default CheckBox;
