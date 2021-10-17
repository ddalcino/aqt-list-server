import React from "react";
import { NO_SELECTION, SelectNone, ToolData } from "../State";
import ComboBox, { options } from "./ComboBox";
import SelectMany from "./SelectMany";

interface Props {
  toolNames: SelectNone;
  selectedTools: Map<string, ToolData>;
  addTool: (toolName: string) => Promise<void>;
  removeTool: (toolName: string) => void;
  setToolVariant: (toolName: string, toolVariant: string, on: boolean) => void;
  toggleToolVariants: (toolName: string, on: boolean) => void;
}

const ToolSelectPanel = (props: Props): JSX.Element => (
  <div>
    <ComboBox
      id="tool-adder"
      label="Add new tool:"
      selectState={props.toolNames.selected.state}
      value={NO_SELECTION}
      onchange={(toolName) => props.addTool(toolName)}
    >
      {options(props.toolNames, "tool-adder")}
    </ComboBox>
    {[...props.selectedTools.values()].map(
      (toolData: ToolData, index: number) => (
        <div className="horizontal-flow" key={`div-${toolData.name}-${index}`}>
          <input
            type="button"
            key={`remove-${toolData.name}-${index}`}
            aria-label={`Remove ${toolData.name}`}
            title={`Remove ${toolData.name}`}
            value="Remove"
            onClick={() => props.removeTool(toolData.name)}
          />
          <SelectMany
            id={`variants-${toolData.name}`}
            type={toolData.name}
            key={`tool-variants-${index}`}
            label={<span>{toolData.name}</span>}
            options={toolData.variants}
            toggleAll={(on: boolean) =>
              props.toggleToolVariants(toolData.name, on)
            }
            toggleOne={(on: boolean, name: string) =>
              props.setToolVariant(toolData.name, name, on)
            }
          />
        </div>
      )
    )}
  </div>
);

export default ToolSelectPanel;
