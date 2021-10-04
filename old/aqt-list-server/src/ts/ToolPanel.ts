import { SelectMany, ToolData, ToolVariant } from "./State";
import { make_btn, make_checkbox, makeH2, makeSpan } from "./View";

const toHumanReadableSize = (bytes: string): string => {
  const numBytes = parseInt(bytes);
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let [amt, dividedAmt, index] = [numBytes, numBytes / 1024.0, 0];
  while (Math.floor(dividedAmt) > 0 && index < units.length - 1) {
    [amt, dividedAmt, index] = [dividedAmt, dividedAmt / 1024.0, index + 1];
  }
  return `${amt.toPrecision(4)} ${units[index]}`;
};

const makeTable = (tools: ToolData): HTMLTableElement => {
  const tbl = document.createElement("table");
  const thead = document.createElement("thead");
  const cell = (text: string, type: string): HTMLTableCellElement => {
    const el = document.createElement(type);
    el.textContent = text;
    return el as HTMLTableCellElement;
  };
  const th = (t: string) => cell(t, "th");
  ["Name", "Version", "ReleaseDate", "Download Size", "Installed Size"].forEach(
    (name: string) => thead.appendChild(th(name))
  );
  const td = (t: string) => cell(t, "td");
  const tr = (v: ToolVariant) => {
    const row = document.createElement("tr");
    [
      td(v.DisplayName),
      td(v.Version),
      td(v.ReleaseDate),
      td(toHumanReadableSize(v.UpdateFile.CompressedSize)),
      td(toHumanReadableSize(v.UpdateFile.UncompressedSize)),
    ].forEach((cell) => row.appendChild(cell));
    return row;
  };
  const fullRowTd = (text: string): HTMLTableRowElement => {
    const row = document.createElement("tr");
    const rowTd = td(text);
    rowTd.colSpan = 5;
    row.appendChild(rowTd);
    return row;
  };
  tbl.appendChild(thead);
  tools.variants.forEach((variant: ToolVariant) => {
    tbl.appendChild(tr(variant));
    tbl.appendChild(fullRowTd(variant.Description));
  });
  return tbl;
};

export const makeToolPanel = (
  toolName: string,
  variants: SelectMany,
  toggleCallback: (variantName: string, on: boolean) => void,
  removeToolCallback: (toolName: string) => void
): HTMLElement => {
  const div = document.createElement("div");
  div.appendChild(makeH2(toolName));
  div.appendChild(makeSpan("Choose a tool variant:"));
  [...variants.selections.entries()]
    .flatMap(([name, isOn]) =>
      make_checkbox(name, isOn, toggleCallback, `checkbox-for-${toolName}`)
    )
    .forEach((checkbox: HTMLElement) => div.appendChild(checkbox));
  div.appendChild(
    make_btn(`Remove ${toolName}`, () => removeToolCallback(toolName))
  );
  return div;
};
