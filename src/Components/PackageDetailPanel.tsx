import React from "react";
import { PackageUpdate } from "../lib/types";

interface Props {
  pkg: PackageUpdate;
}

const nickname = (fullname: string): string =>
  fullname.split(".").at(-2) || fullname;

const PackageDetailPanel = ({ pkg }: Props): JSX.Element => (
  <details>
    <summary>
      <strong>{nickname(pkg.Name)}:</strong> {pkg.DisplayName}
    </summary>
    {pkg.Description ? (
      <div>
        <strong>Description:</strong> {pkg.Description}
      </div>
    ) : null}
    <div>
      <strong>Fully Qualified Name</strong> {pkg.Name}
    </div>
    <div>
      <strong>Release Date:</strong> {pkg.ReleaseDate}
    </div>
    <div>
      <strong>Version:</strong> {pkg.Version}
    </div>
    <div>
      <strong>Download Size:</strong> {pkg.CompressedSize}
    </div>
    <div>
      <strong>Installed Size:</strong> {pkg.UncompressedSize}
    </div>
  </details>
);

export default PackageDetailPanel;
