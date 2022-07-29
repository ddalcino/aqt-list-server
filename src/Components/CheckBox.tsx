import React from "react";
import { PackageUpdate } from "../lib/types";
import PackageDetailPanel from "./PackageDetailPanel";

interface Props {
  id: string;
  name: string;
  pkg: PackageUpdate | null;
  isChecked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const CheckBox = ({
  id,
  name,
  pkg,
  isChecked,
  onChange,
}: Props): JSX.Element => (
  <div>
    <input
      type="checkbox"
      id={id}
      checked={isChecked}
      // onClick={(event: React.MouseEvent<HTMLInputElement, MouseEvent>) => onChange(event)}//onChange}
      onChange={onChange}
      style={{ display: "inline-block" }}
    />
    <label htmlFor={id} style={{ display: "inline-block" }}>
      {pkg !== null ? <PackageDetailPanel pkg={pkg} /> : name}
    </label>
    {/*<label htmlFor={id}>{pkg !== null ? pkg.DisplayName : name}</label>*/}
    {/*{pkg !== null ? <PackageDetailPanel pkg={pkg} /> : ""}*/}
  </div>
);

export default CheckBox;
