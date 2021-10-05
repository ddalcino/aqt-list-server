import React from "react";

interface Props {
  id: string;
  label: JSX.Element;
  command: string;
  children: JSX.Element;
  isDisabled: boolean;
}

const copyToClipboard = async (text: string) => {
  await navigator.clipboard.writeText(text);
};

const CommandPanel = (props: Props) => {
  const { id, label, command, children, isDisabled } = props;
  return (
    <div>
      {label}
      <pre>
        <code id={id}>{command}</code>
      </pre>
      <input
        type="button"
        aria-label="copy command to clipboard"
        value="Copy command to clipboard"
        onClick={() => copyToClipboard(command)}
        disabled={isDisabled}
      />
      {children}
    </div>
  );
};
export default CommandPanel;
