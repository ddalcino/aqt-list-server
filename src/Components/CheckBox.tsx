import React from "react";
import { PackageUpdate } from "../lib/types";
import PackageDetailPanel from "./PackageDetailPanel";

interface Props {
  id: string;
  name: string;
  pkg: PackageUpdate | null;
  size: string | null;
  isChecked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const CheckBox = ({
  id,
  name,
  pkg,
  size,
  isChecked,
  onChange,
}: Props): JSX.Element => (
  <div style={{ display: "flex" }}>
    <input
      type="checkbox"
      id={id}
      checked={isChecked}
      // onClick={(event: React.MouseEvent<HTMLInputElement, MouseEvent>) => onChange(event)}//onChange}
      onChange={onChange}
      style={{ display: "inline-block" }}
    />
    <label htmlFor={id} style={{ display: "inline-block" }}>
      {pkg !== null ? (
        <PackageDetailPanel pkg={pkg} />
      ) : size !== null ? (
        `${name} (${size})`
      ) : (
        name
      )}
    </label>
    {/*<label htmlFor={id}>{pkg !== null ? pkg.DisplayName : name}</label>*/}
    {/*{pkg !== null ? <PackageDetailPanel pkg={pkg} /> : ""}*/}
  </div>
);

export default CheckBox;
