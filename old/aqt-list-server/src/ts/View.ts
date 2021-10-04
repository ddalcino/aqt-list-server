import {
  NO_SELECTION,
  SelectMany,
  SelectOne,
  SelectState,
  ToolSelector,
  Versions,
} from "./State";
import { makeToolPanel } from "./ToolPanel";

const make_option = (value: string, selected: boolean): HTMLOptionElement => {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = value;
  option.selected = selected;
  return option;
};

export const make_checkbox = (
  name: string,
  selected: boolean,
  toggleCallback: (moduleName: string, on: boolean) => void,
  idPrefix = "checkbox-for-module",
  labelContent = name
): Array<HTMLElement> => {
  const cb = document.createElement("input") as HTMLInputElement;
  cb.type = "checkbox";
  cb.value = name;
  cb.checked = selected;
  cb.id = `${idPrefix}-${name}`;
  cb.onclick = () => toggleCallback(name, cb.checked);
  const lbl = document.createElement("label") as HTMLLabelElement;
  lbl.textContent = labelContent;
  lbl.htmlFor = `${idPrefix}-${name}`;
  return [cb, lbl, document.createElement("br")];
};

/**
 * Emulates Element.replaceChildren, documented on MDN at:
 * https://developer.mozilla.org/en-US/docs/Web/API/Element/replaceChildren
 *
 * @param parent      Node whose children will be replaced
 * @param newChildren List of children to add to parent
 */
const replaceChildren = (parent: Element, newChildren: Element[]) => {
  // parent.replaceChildren(...newChildren)
  while (parent.firstElementChild) {
    parent.removeChild(parent.firstElementChild);
  }
  newChildren.forEach((child) => parent.appendChild(child));
};

const rewriteSelectableElement = (
  parent: HTMLSelectElement,
  allowEmpty: boolean,
  selectState: SelectState,
  makeChildOptions: () => Array<HTMLElement>
): void => {
  parent.disabled = selectState.isNotLoaded();
  if (selectState.isLoading()) {
    parent.classList.add("loading");
    replaceChildren(parent, [make_option("Loading...", true)]);
    return;
  }
  parent.classList.remove("loading");
  const begin: Array<HTMLElement> = allowEmpty
    ? [make_option(NO_SELECTION, !selectState.hasSelection())]
    : [];
  replaceChildren(parent, begin.concat(makeChildOptions()));
};

/**
 * Updates the state of an HTMLSelectElement by replacing all of its children.
 *
 * @param parent    The element to update.
 * @param options   The available options, and the selected option.
 */
export const rewriteSelectElement = (
  parent: HTMLSelectElement,
  options: SelectOne
): void => {
  rewriteSelectableElement(
    parent,
    options.allowEmpty,
    options.selected.state,
    () =>
      options.options.map((value: string) =>
        make_option(value, value === options.selected.value)
      )
  );
};

export const rewriteSelectElementStratified = (
  parent: HTMLSelectElement,
  options: Versions
): void => {
  rewriteSelectableElement(
    parent,
    options.allowEmpty,
    options.selected.state,
    () =>
      options.versions
        .filter((arr) => arr.length > 0)
        .map((minor_group) => {
          const major_minor = minor_group[0].split(".").slice(0, -1).join(".");
          const optgroup = document.createElement("optgroup");
          optgroup.label = `Qt ${major_minor}`;
          minor_group.forEach((opt) =>
            optgroup.appendChild(
              make_option(opt, opt === options.selected.value)
            )
          );
          return optgroup;
        })
  );
};

/**
 * Updates the state of an HTMLSelectElement by choosing an existing item from the list.
 *
 * @param parent          The element to update.
 * @param selectedOption  The item to select.
 */
export const updateSelectElement = (
  parent: HTMLSelectElement,
  selectedOption: string
): void => {
  parent.value = selectedOption;
};

export interface Checkboxes {
  checkboxContainer: HTMLDivElement;
  checkAll: HTMLInputElement;
}

export const rewriteCheckboxes = (
  parent: Checkboxes,
  options: SelectMany,
  toggleModuleCallback: (moduleName: string, on: boolean) => void
): void => {
  if (options.isLoading()) {
    parent.checkAll.classList.add("loading");
  } else {
    parent.checkAll.classList.remove("loading");
  }
  parent.checkAll.disabled = options.isEmpty();
  replaceChildren(
    parent.checkboxContainer,
    [...options.selections.entries()].flatMap(([name, isOn]) =>
      make_checkbox(name, isOn, toggleModuleCallback)
    )
  );
};

export const make_btn = (
  text: string,
  callback: () => void
): HTMLButtonElement => {
  const btn = document.createElement("input");
  btn.type = "button";
  btn.value = text;
  btn.onclick = callback;
  return <HTMLButtonElement>btn;
};
export const makeSpan = (text: string): HTMLSpanElement => {
  const s = document.createElement("span");
  s.textContent = text;
  return s;
};
export const makeH2 = (text: string): HTMLHeadingElement => {
  const heading = document.createElement("h2");
  heading.textContent = text;
  return heading;
};

export const rewriteTools = (
  parent: HTMLDivElement,
  tools: Array<ToolSelector>,
  addToolCallback: () => void,
  removeToolCallback: (toolName: string) => void
): void => {
  const addToolBtn: Array<HTMLElement> = [
    make_btn("Add Tool", addToolCallback),
  ];
  const children: Array<HTMLElement> = tools
    .map((tool: ToolSelector) =>
      makeToolPanel(
        tool.name,
        tool.toolVariants,
        addToolCallback,
        removeToolCallback
      )
    )
    .concat(addToolBtn);

  replaceChildren(parent, children);
};
